import { BorderRadius } from '@/theme'
import { SPOTIFY_COLORS } from '@/theme/spotify'
import { createStyle } from '@/utils/tools'
import { type ComponentProps, memo, useCallback, useEffect, useMemo, useState } from 'react'
import { View, type ViewProps, StyleSheet, Image as FastImage } from 'react-native'
import { Icon } from './Icon'
import { useLayout } from '@/utils/hooks'
import {
  getCachedMusicPicUrl,
  isFailedArtworkUrl,
  markArtworkUrlFailed,
  resolveMusicPicUrl,
} from '@/utils/artworkCache'

export type PlaceholderType = 'album' | 'artist' | 'playlist' | 'love'

export interface ImageProps extends ViewProps {
  style: ComponentProps<typeof FastImage>['style']
  url?: string | number | null
  musicInfo?: LX.Music.MusicInfo | LX.Download.ListItem | null
  listId?: string | null
  placeholderType?: PlaceholderType
  cache?: boolean
  resizeMode?: ComponentProps<typeof FastImage>['resizeMode']
  onError?: (url: string | number) => void
}


export const defaultHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
}

const EmptyPic = memo(({
  style,
  nativeID,
  placeholderType = 'album',
}: {
  style: ImageProps['style']
  nativeID: ImageProps['nativeID']
  placeholderType?: PlaceholderType
}) => {
  const { onLayout, width } = useLayout()
  const iconSize = Math.max(14, Math.min(44, Math.round((width || 48) * 0.44)))

  let iconName = 'album'
  let iconColor: string = SPOTIFY_COLORS.LIGHT_GREY
  let bgColor: string = SPOTIFY_COLORS.INPUT_BG

  switch (placeholderType) {
    case 'love':
      iconName = 'love'
      iconColor = SPOTIFY_COLORS.TINT
      bgColor = '#341963'
      break
    case 'artist':
      iconName = 'logo'
      iconColor = SPOTIFY_COLORS.LIGHT_GREY
      bgColor = SPOTIFY_COLORS.CARD
      break
    case 'playlist':
      iconName = 'album'
      iconColor = SPOTIFY_COLORS.TINT
      bgColor = SPOTIFY_COLORS.SURFACE_ELEVATED
      break
    case 'album':
    default:
      iconName = 'album'
      iconColor = SPOTIFY_COLORS.LIGHT_GREY
      bgColor = SPOTIFY_COLORS.INPUT_BG
      break
  }

  return (
    <View
      style={StyleSheet.compose({ ...styles.emptyPic, backgroundColor: bgColor }, style)}
      onLayout={onLayout}
      nativeID={nativeID}
    >
      <Icon name={iconName} rawSize={iconSize} color={iconColor} />
    </View>
  )
})

const Image = memo(({
  url,
  musicInfo,
  listId,
  placeholderType = 'album',
  cache,
  resizeMode = 'cover',
  style,
  onError,
  nativeID,
}: ImageProps) => {
  const [isError, setError] = useState(false)
  const [isLoaded, setLoaded] = useState(false)
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(() => {
    if (typeof url === 'string' && url && !isFailedArtworkUrl(url)) return url
    return getCachedMusicPicUrl(musicInfo)
  })

  const musicKey = useMemo(() => {
    if (!musicInfo) return ''
    const info = 'progress' in musicInfo ? musicInfo.metadata.musicInfo : musicInfo
    return `${info.source}_${info.id}_${info.meta?.picUrl ?? ''}`
  }, [musicInfo])

  useEffect(() => {
    setError(false)
    setLoaded(false)

    if (typeof url === 'string' && url) {
      if (isFailedArtworkUrl(url)) {
        setError(true)
        setResolvedUrl(null)
      } else {
        setResolvedUrl(url)
      }
      return
    }
    if (typeof url === 'number') {
      setResolvedUrl(null)
      return
    }

    const cached = getCachedMusicPicUrl(musicInfo)
    if (cached) {
      setResolvedUrl(cached)
      return
    }

    if (!musicInfo) {
      setResolvedUrl(null)
      return
    }

    let cancelled = false
    setResolvedUrl(null)
    void resolveMusicPicUrl(musicInfo, listId).then((fetchedUrl) => {
      if (cancelled || !fetchedUrl || isFailedArtworkUrl(fetchedUrl)) return
      setResolvedUrl(fetchedUrl)
    })

    return () => {
      cancelled = true
    }
  }, [url, musicKey, listId, musicInfo])

  const effectiveSource = url ?? resolvedUrl
  const uri = typeof effectiveSource === 'number'
    ? FastImage.resolveAssetSource(effectiveSource).uri
    : effectiveSource?.startsWith('/')
      ? 'file://' + effectiveSource
      : effectiveSource

  const handleError = useCallback(() => {
    if (typeof uri === 'string' && uri) markArtworkUrlFailed(uri)
    setError(true)
    onError?.(url ?? uri ?? '')
  }, [onError, uri, url])

  const handleLoad = useCallback(() => {
    setLoaded(true)
  }, [])

  const showDefault = useMemo(() => !uri || isError || (typeof uri === 'string' && isFailedArtworkUrl(uri)), [isError, uri])

  if (showDefault) {
    return <EmptyPic style={style} nativeID={nativeID} placeholderType={placeholderType} />
  }

  return (
    <View style={StyleSheet.compose(styles.imageWrap, style)} nativeID={nativeID}>
      {!isLoaded && (
        <View style={StyleSheet.absoluteFill}>
          <EmptyPic style={styles.fillPic} nativeID={undefined} placeholderType={placeholderType} />
        </View>
      )}
      <FastImage
        style={styles.fillPic}
        source={{
          uri: uri!,
          headers: defaultHeaders,
          cache: cache === false ? 'reload' : 'force-cache',
        }}
        onLoad={handleLoad}
        onError={handleError}
        resizeMode={resizeMode}
      />
    </View>
  )
}, (prevProps, nextProps) => {
  const prevId = prevProps.musicInfo && ('progress' in prevProps.musicInfo ? prevProps.musicInfo.metadata.musicInfo.id : prevProps.musicInfo.id)
  const nextId = nextProps.musicInfo && ('progress' in nextProps.musicInfo ? nextProps.musicInfo.metadata.musicInfo.id : nextProps.musicInfo.id)
  const prevPic = prevProps.musicInfo && ('progress' in prevProps.musicInfo ? prevProps.musicInfo.metadata.musicInfo.meta?.picUrl : prevProps.musicInfo.meta?.picUrl)
  const nextPic = nextProps.musicInfo && ('progress' in nextProps.musicInfo ? nextProps.musicInfo.metadata.musicInfo.meta?.picUrl : nextProps.musicInfo.meta?.picUrl)

  return prevProps.url == nextProps.url &&
    prevId == nextId &&
    prevPic == nextPic &&
    prevProps.listId == nextProps.listId &&
    prevProps.placeholderType == nextProps.placeholderType &&
    prevProps.style == nextProps.style &&
    prevProps.nativeID == nextProps.nativeID
})

export const getSize = (uri: string, success: (width: number, height: number) => void, failure?: (error: any) => void) => {
  FastImage.getSize(uri, success, failure)
}
export const clearMemoryCache = async() => {
  // return Promise.all([FastImage.clearMemoryCache(), FastImage.clearDiskCache()])
}
export default Image

const styles = createStyle({
  imageWrap: {
    overflow: 'hidden',
    backgroundColor: SPOTIFY_COLORS.INPUT_BG,
  },
  fillPic: {
    width: '100%',
    height: '100%',
  },
  emptyPic: {
    borderRadius: BorderRadius.normal,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
  },
})
