import { getListMusics } from '@/core/list'
import { getPicPath } from '@/core/music'
import musicSdk from '@/utils/musicSdk'

const MAX_CONCURRENT_REQUESTS = 3
const MAX_CACHE_SIZE = 300

const picUrlCache = new Map<string, string>()
const artistAvatarCache = new Map<string, string>()
const failedUrlCache = new Set<string>()
const inFlightPicMap = new Map<string, Promise<string>>()
const inFlightArtistMap = new Map<string, Promise<string>>()

let activeRequestCount = 0
const pendingQueue: Array<() => void> = []

const runWithLimit = async<T>(task: () => Promise<T>): Promise<T> => {
  if (activeRequestCount >= MAX_CONCURRENT_REQUESTS) {
    await new Promise<void>((resolve) => {
      pendingQueue.push(resolve)
    })
  }
  activeRequestCount++
  try {
    return await task()
  } finally {
    activeRequestCount--
    const next = pendingQueue.shift()
    if (next) next()
  }
}

const setBoundedCache = (cache: Map<string, string>, key: string, value: string) => {
  if (!value) return
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value
    if (firstKey !== undefined) cache.delete(firstKey)
  }
  cache.set(key, value)
}

const unwrapMusicInfo = (musicInfo: LX.Music.MusicInfo | LX.Download.ListItem): LX.Music.MusicInfo => {
  return 'progress' in musicInfo ? musicInfo.metadata.musicInfo : musicInfo
}

export const getMusicArtworkKey = (musicInfo: LX.Music.MusicInfo | LX.Download.ListItem): string => {
  const info = unwrapMusicInfo(musicInfo)
  return `${info.source}_${info.id}`
}

export const isFailedArtworkUrl = (url?: string | null): boolean => {
  if (!url) return false
  return failedUrlCache.has(url)
}

export const markArtworkUrlFailed = (url: string) => {
  if (!url) return
  if (failedUrlCache.size >= MAX_CACHE_SIZE) failedUrlCache.clear()
  failedUrlCache.add(url)
}

export const getCachedMusicPicUrl = (musicInfo?: LX.Music.MusicInfo | LX.Download.ListItem | null): string | null => {
  if (!musicInfo) return null
  const info = unwrapMusicInfo(musicInfo)
  const rawUrl = info.meta?.picUrl
  if (rawUrl && !failedUrlCache.has(rawUrl)) return rawUrl
  const cached = picUrlCache.get(getMusicArtworkKey(info))
  if (cached && !failedUrlCache.has(cached)) return cached
  return null
}

/**
 * 解析并缓存单曲专辑封面（优先复用内嵌字段与内置 getPicPath 能力）
 */
export const resolveMusicPicUrl = async(
  musicInfo: LX.Music.MusicInfo | LX.Download.ListItem,
  listId?: string | null,
): Promise<string> => {
  const existing = getCachedMusicPicUrl(musicInfo)
  if (existing) return existing

  const key = getMusicArtworkKey(musicInfo)
  const pending = inFlightPicMap.get(key)
  if (pending) return pending

  const task = runWithLimit(async() => {
    try {
      const url = await getPicPath({
        musicInfo,
        listId: listId ?? undefined,
      })
      if (url && !failedUrlCache.has(url)) {
        setBoundedCache(picUrlCache, key, url)
        return url
      }
      return ''
    } catch {
      return ''
    } finally {
      inFlightPicMap.delete(key)
    }
  })

  inFlightPicMap.set(key, task)
  return task
}

/**
 * 解析并缓存歌手头像（复用 tx/wy 内置搜索结果中的歌手头像与封面字段）
 */
export const resolveArtistAvatarUrl = async(artistName: string): Promise<string> => {
  const name = artistName.trim()
  if (!name) return ''

  const cached = artistAvatarCache.get(name)
  if (cached && !failedUrlCache.has(cached)) return cached

  const pending = inFlightArtistMap.get(name)
  if (pending) return pending

  const task: Promise<string> = runWithLimit<string>(async() => {
    try {
      // 1. 优先通过 tx 搜索接口读取 singer[0].mid 生成官方歌手头像 URL
      const txSearch = musicSdk.tx?.musicSearch
      if (txSearch?.musicSearch) {
        try {
          const data = await txSearch.musicSearch(name, 1, 3)
          const rawSongs = data?.body?.song?.list
          if (Array.isArray(rawSongs)) {
            for (const song of rawSongs) {
              const singers = song?.singer
              if (!Array.isArray(singers) || !singers.length) continue
              const matched = singers.find((s: { name?: string, mid?: string }) =>
                s?.mid && s?.name && (s.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(s.name.toLowerCase())),
              ) ?? singers[0]
              if (matched?.mid) {
                const avatarUrl = `https://y.gtimg.cn/music/photo_new/T001R500x500M000${matched.mid}.jpg`
                if (!failedUrlCache.has(avatarUrl)) {
                  setBoundedCache(artistAvatarCache, name, avatarUrl)
                  return avatarUrl
                }
              }
            }
          }
        } catch {
          // 回退到其他内置源
        }
      }

      // 2. 回退通过 wy 搜索接口获取代表曲目封面
      const wySearch = musicSdk.wy?.musicSearch
      if (wySearch?.search) {
        try {
          const res = await (wySearch.search(name, 1, 1) as Promise<{ list?: Array<{ img?: string | null }> }>)
          const firstImg = res?.list?.[0]?.img
          if (typeof firstImg === 'string' && firstImg && !failedUrlCache.has(firstImg)) {
            setBoundedCache(artistAvatarCache, name, firstImg)
            return firstImg
          }
        } catch {
          // 忽略并走兜底
        }
      }

      return ''
    } finally {
      inFlightArtistMap.delete(name)
    }
  })

  inFlightArtistMap.set(name, task)
  return task
}

/**
 * 获取本地歌单/试听/收藏列表的第一首歌及其封面
 */
export const getFirstSongCoverFromList = async(listId: string): Promise<{
  firstSong: LX.Music.MusicInfo | null
  picUrl: string | null
  totalCount: number
}> => {
  try {
    const list = await getListMusics(listId)
    if (!list.length) return { firstSong: null, picUrl: null, totalCount: 0 }
    const firstSong = list[0]
    const cached = getCachedMusicPicUrl(firstSong)
    if (cached) return { firstSong, picUrl: cached, totalCount: list.length }
    const resolved = await resolveMusicPicUrl(firstSong, listId)
    return {
      firstSong,
      picUrl: resolved || null,
      totalCount: list.length,
    }
  } catch {
    return { firstSong: null, picUrl: null, totalCount: 0 }
  }
}
