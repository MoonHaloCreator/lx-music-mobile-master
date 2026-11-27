import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import {
  Dimensions,
  Image as RNImage,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import Text from '@/components/common/Text'
import Image from '@/components/common/Image'
import { Icon } from '@/components/common/Icon'
import { SPOTIFY_COLORS, SPOTIFY_RADIUS } from '@/theme/spotify'
import { useMyList } from '@/store/list/hook'
import { useStatusbarHeight } from '@/store/common/hook'
import { navigations } from '@/navigation'
import commonState from '@/store/common/state'
import { setNavActiveId } from '@/core/common'
import { addListMusics, getListMusics, requestOpenListDetail } from '@/core/list'
import { setSearchText } from '@/core/search/search'
import { getList as getOnlineSongList } from '@/core/songlist'
import { getListDetail as getLeaderboardDetail } from '@/core/leaderboard'
import { playList } from '@/core/player/player'
import settingState from '@/store/setting/state'
import { getListMusicSync } from '@/utils/listManage'
import { type ListInfoItem } from '@/store/songlist/state'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { LIST_IDS } from '@/config/constant'
import { useI18n } from '@/lang'
import { useWindowSize } from '@/utils/hooks'
import {
  getFirstSongCoverFromList,
  resolveArtistAvatarUrl,
} from '@/utils/artworkCache'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const GREEN_LOGO = require('@/resources/spotify-assets/images/logo.png')

type HomeFilter = 'all' | 'music' | 'playlists'

interface ListCoverState {
  firstSong: LX.Music.MusicInfo | null
  picUrl: string | null
  totalCount: number
}

const POPULAR_ARTISTS = [
  { id: 'artist_jay', name: '周杰伦' },
  { id: 'artist_taylor', name: 'Taylor Swift' },
  { id: 'artist_jj', name: '林俊杰' },
  { id: 'artist_gem', name: '邓紫棋' },
  { id: 'artist_eason', name: '陈奕迅' },
  { id: 'artist_ed', name: 'Ed Sheeran' },
  { id: 'artist_adele', name: 'Adele' },
  { id: 'artist_billie', name: 'Billie Eilish' },
]

export default memo(() => {
  const statusBarHeight = useStatusbarHeight()
  const windowSize = useWindowSize()
  const myLists = useMyList()
  const t = useI18n()

  const [homeFilter, setHomeFilter] = useState<HomeFilter>('all')
  const [listCovers, setListCovers] = useState<Record<string, ListCoverState>>({})
  const [onlinePlaylists, setOnlinePlaylists] = useState<ListInfoItem[]>([])
  const [recommendedTracks, setRecommendedTracks] = useState<LX.Music.MusicInfo[]>([])
  const [loadingTracks, setLoadingTracks] = useState(true)
  const [artistAvatars, setArtistAvatars] = useState<Record<string, string>>({})

  const screenWidth = windowSize.width || Dimensions.get('window').width
  const isWideLayout = screenWidth >= 600
  const horizontalPadding = scaleSizeW(16)
  const gridGap = scaleSizeW(10)
  const gridCols = isWideLayout ? 3 : 2
  const capsuleWidth = Math.floor((screenWidth - horizontalPadding * 2 - gridGap * (gridCols - 1)) / gridCols)
  const cardWidth = isWideLayout ? scaleSizeW(156) : scaleSizeW(140)
  const artistSize = isWideLayout ? scaleSizeW(112) : scaleSizeW(100)

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return t('spotify_greeting_morning')
    if (hour >= 12 && hour < 18) return t('spotify_greeting_afternoon')
    return t('spotify_greeting_evening')
  }, [t])

  const loadLocalListCovers = useCallback(async() => {
    const targetIds = myLists.slice(0, 6).map(item => item.id)
    const entries = await Promise.all(
      targetIds.map(async(id) => {
        const info = await getFirstSongCoverFromList(id)
        return [id, info] as const
      }),
    )
    const nextMap: Record<string, ListCoverState> = {}
    for (const [id, info] of entries) {
      nextMap[id] = info
    }
    setListCovers(nextMap)
  }, [myLists])

  useEffect(() => {
    let cancelled = false
    const refresh = () => {
      if (cancelled) return
      void loadLocalListCovers()
    }
    refresh()
    global.app_event.on('myListMusicUpdate', refresh)
    global.state_event.on('mylistUpdated', refresh)
    return () => {
      cancelled = true
      global.app_event.off('myListMusicUpdate', refresh)
      global.state_event.off('mylistUpdated', refresh)
    }
  }, [loadLocalListCovers])

  useEffect(() => {
    let cancelled = false

    const loadOnlinePlaylists = async() => {
      try {
        const res = await getOnlineSongList('tx', '', '-1', 1)
        if (!cancelled && res?.list?.length) {
          setOnlinePlaylists(res.list.slice(0, 10))
          return
        }
      } catch {}
      try {
        const fallback = await getOnlineSongList('wy', '', 'hot', 1)
        if (!cancelled && fallback?.list?.length) {
          setOnlinePlaylists(fallback.list.slice(0, 10))
        }
      } catch {}
    }

    const loadRecommendedTracks = async() => {
      try {
        const board = await getLeaderboardDetail('tx__26', 1)
        if (!cancelled && board?.list?.length) {
          setRecommendedTracks(board.list.slice(0, 12))
          setLoadingTracks(false)
          return
        }
      } catch {}
      try {
        const fallbackBoard = await getLeaderboardDetail('wy__3778678', 1)
        if (!cancelled && fallbackBoard?.list?.length) {
          setRecommendedTracks(fallbackBoard.list.slice(0, 12))
          setLoadingTracks(false)
          return
        }
      } catch {}
      try {
        const [loveSongs, defaultSongs] = await Promise.all([
          getListMusics(LIST_IDS.LOVE),
          getListMusics(LIST_IDS.DEFAULT),
        ])
        if (!cancelled) {
          setRecommendedTracks([...loveSongs, ...defaultSongs].slice(0, 12))
        }
      } catch {}
      if (!cancelled) setLoadingTracks(false)
    }

    const loadArtistAvatars = async() => {
      await Promise.all(
        POPULAR_ARTISTS.map(async(artist) => {
          const avatar = await resolveArtistAvatarUrl(artist.name)
          if (!cancelled && avatar) {
            setArtistAvatars(prev => ({ ...prev, [artist.name]: avatar }))
          }
        }),
      )
    }

    void loadOnlinePlaylists()
    void loadRecommendedTracks()
    void loadArtistAvatars()

    return () => {
      cancelled = true
    }
  }, [])

  const handleOpenSetting = useCallback(() => {
    setNavActiveId('nav_setting')
  }, [])

  const handleOpenLocalList = useCallback((listId: string) => {
    requestOpenListDetail(listId)
    setNavActiveId('nav_love')
  }, [])

  const handleOpenOnlinePlaylist = useCallback((item: ListInfoItem) => {
    navigations.pushSonglistDetailScreen(
      commonState.componentIds.home ?? 'home',
      item,
    )
  }, [])

  const handlePlayAlbumTrack = useCallback((musicInfo: LX.Music.MusicInfo) => {
    if (musicInfo.source === 'local') {
      const idx = getListMusicSync(LIST_IDS.DEFAULT).findIndex(m => m.id == musicInfo.id)
      if (idx >= 0) {
        void playList(LIST_IDS.DEFAULT, idx)
      } else {
        const loveIdx = getListMusicSync(LIST_IDS.LOVE).findIndex(m => m.id == musicInfo.id)
        if (loveIdx >= 0) void playList(LIST_IDS.LOVE, loveIdx)
      }
      return
    }
    void addListMusics(LIST_IDS.DEFAULT, [musicInfo], settingState.setting['list.addMusicLocationType']).then(() => {
      const index = getListMusicSync(LIST_IDS.DEFAULT).findIndex(m => m.id == musicInfo.id)
      if (index < 0) return
      void playList(LIST_IDS.DEFAULT, index)
    })
  }, [])

  const handleSearchArtist = useCallback((artistName: string) => {
    setSearchText(artistName)
    setNavActiveId('nav_search')
    requestAnimationFrame(() => {
      global.app_event.searchKeyword(artistName)
    })
  }, [])

  const quickCapsules = useMemo(() => {
    return myLists.slice(0, 6)
  }, [myLists])

  const localPinnedPlaylists = useMemo(() => {
    const loveCover = listCovers[LIST_IDS.LOVE]
    const defaultCover = listCovers[LIST_IDS.DEFAULT]
    return [
      {
        id: LIST_IDS.LOVE,
        title: t('spotify_liked_songs'),
        subtitle: loveCover?.totalCount
          ? `${t('spotify_songs_count', { count: loveCover.totalCount })} • ${t('spotify_liked_songs_desc')}`
          : t('spotify_liked_songs_desc'),
        coverUrl: loveCover?.picUrl ?? null,
        firstSong: loveCover?.firstSong ?? null,
        placeholderType: 'love' as const,
      },
      {
        id: LIST_IDS.DEFAULT,
        title: t('spotify_trial_list'),
        subtitle: defaultCover?.totalCount
          ? `${t('spotify_songs_count', { count: defaultCover.totalCount })} • ${t('spotify_daily_mix_1_desc')}`
          : t('spotify_daily_mix_1_desc'),
        coverUrl: defaultCover?.picUrl ?? null,
        firstSong: defaultCover?.firstSong ?? null,
        placeholderType: 'playlist' as const,
      },
    ]
  }, [listCovers, t])

  const showPlaylistsSection = homeFilter === 'all' || homeFilter === 'playlists'
  const showMusicSection = homeFilter === 'all' || homeFilter === 'music'

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: statusBarHeight + scaleSizeH(12) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 顶部绿色品牌 Logo + 动态问候 + 设置入口 */}
        <View style={styles.headerRow}>
          <View style={styles.brandGreetingRow}>
            <View style={styles.logoBadge}>
              <RNImage source={GREEN_LOGO} style={styles.logoImage} resizeMode="contain" />
            </View>
            <View style={styles.greetingTextWrap}>
              <Text style={styles.brandTag}>{t('spotify_brand_name')}</Text>
              <Text style={styles.greetingText} numberOfLines={1}>{greeting}</Text>
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.settingButton,
              pressed && styles.iconButtonPressed,
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={handleOpenSetting}
          >
            <Icon name="setting" size={20} color={SPOTIFY_COLORS.WHITE} />
          </Pressable>
        </View>

        {/* 顶部分类过滤胶囊 */}
        <View style={styles.filterPillsRow}>
          {(
            [
              { id: 'all', label: t('spotify_home_all') },
              { id: 'music', label: t('spotify_home_music') },
              { id: 'playlists', label: t('spotify_home_playlists') },
            ] as const
          ).map((pill) => {
            const active = homeFilter === pill.id
            return (
              <Pressable
                key={pill.id}
                onPress={() => { setHomeFilter(pill.id) }}
                style={({ pressed }) => [
                  styles.filterPill,
                  active && styles.filterPillActive,
                  pressed && styles.pillPressed,
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    active && styles.filterPillTextActive,
                  ]}
                >
                  {pill.label}
                </Text>
              </Pressable>
            )
          })}
        </View>

        {/* 2x3 常用列表胶囊网格（首曲封面） */}
        <View style={styles.gridContainer}>
          {quickCapsules.map((item, index) => {
            const cover = listCovers[item.id]
            const isLove = item.id === LIST_IDS.LOVE
            return (
              <Pressable
                key={item.id || index}
                style={({ pressed }) => [
                  styles.gridItem,
                  { width: capsuleWidth },
                  pressed && styles.gridItemPressed,
                ]}
                onPress={() => { handleOpenLocalList(item.id) }}
              >
                <Image
                  url={cover?.picUrl}
                  musicInfo={cover?.firstSong}
                  listId={item.id}
                  placeholderType={isLove ? 'love' : 'playlist'}
                  style={styles.gridCoverImage}
                />
                <View style={styles.gridTextWrap}>
                  <Text style={styles.gridTitle} numberOfLines={2}>
                    {item.name}
                  </Text>
                </View>
              </Pressable>
            )
          })}
        </View>

        {/* 精选歌单 / 为你推荐 */}
        {showPlaylistsSection && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{t('spotify_featured_playlists')}</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {localPinnedPlaylists.map((item) => (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.playlistCard,
                    { width: cardWidth },
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() => { handleOpenLocalList(item.id) }}
                >
                  <View style={[styles.coverBox, { width: cardWidth, height: cardWidth }]}>
                    <Image
                      url={item.coverUrl}
                      musicInfo={item.firstSong}
                      listId={item.id}
                      placeholderType={item.placeholderType}
                      style={styles.fillImage}
                    />
                    <View style={styles.playOverlayBadge}>
                      <Icon name="play" size={14} color={SPOTIFY_COLORS.BLACK} />
                    </View>
                  </View>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardSubtitle} numberOfLines={2}>
                    {item.subtitle}
                  </Text>
                </Pressable>
              ))}

              {onlinePlaylists.map((playlist) => (
                <Pressable
                  key={`${playlist.source}_${playlist.id}`}
                  style={({ pressed }) => [
                    styles.playlistCard,
                    { width: cardWidth },
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() => { handleOpenOnlinePlaylist(playlist) }}
                >
                  <View style={[styles.coverBox, { width: cardWidth, height: cardWidth }]}>
                    <Image
                      url={playlist.img}
                      placeholderType="playlist"
                      style={styles.fillImage}
                    />
                    <View style={styles.playOverlayBadge}>
                      <Icon name="play" size={14} color={SPOTIFY_COLORS.BLACK} />
                    </View>
                  </View>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {playlist.name}
                  </Text>
                  <Text style={styles.cardSubtitle} numberOfLines={2}>
                    {playlist.author ? playlist.author : (playlist.desc ? playlist.desc : t('spotify_library_playlist'))}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 热门专辑与单曲横向卡片流（内置榜单专辑封面） */}
        {showMusicSection && (recommendedTracks.length > 0 || loadingTracks) && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{t('spotify_recommended_albums')}</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {recommendedTracks.length > 0
                ? (
                    recommendedTracks.map((track) => (
                      <Pressable
                        key={`${track.source}_${track.id}`}
                        style={({ pressed }) => [
                          styles.playlistCard,
                          { width: cardWidth },
                          pressed && styles.cardPressed,
                        ]}
                        onPress={() => { handlePlayAlbumTrack(track) }}
                      >
                        <View style={[styles.coverBox, { width: cardWidth, height: cardWidth }]}>
                          <Image
                            url={track.meta.picUrl}
                            musicInfo={track}
                            placeholderType="album"
                            style={styles.fillImage}
                          />
                          <View style={styles.playOverlayBadge}>
                            <Icon name="play" size={14} color={SPOTIFY_COLORS.BLACK} />
                          </View>
                        </View>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {track.meta.albumName || track.name}
                        </Text>
                        <Text style={styles.cardSubtitle} numberOfLines={2}>
                          {`${track.name} • ${track.singer}`}
                        </Text>
                      </Pressable>
                    ))
                  )
                : (
                    [0, 1, 2, 3].map((idx) => (
                      <View key={idx} style={[styles.playlistCard, { width: cardWidth }]}>
                        <View style={[styles.skeletonCover, { width: cardWidth, height: cardWidth }]} />
                        <View style={styles.skeletonTitle} />
                        <View style={styles.skeletonSub} />
                      </View>
                    ))
                  )}
            </ScrollView>
          </View>
        )}

        {/* 热门歌手圆形头像轮播流 */}
        {showMusicSection && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{t('spotify_popular_artists')}</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {POPULAR_ARTISTS.map((artist) => (
                <Pressable
                  key={artist.id}
                  style={({ pressed }) => [
                    styles.artistCard,
                    { width: artistSize + scaleSizeW(8) },
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() => { handleSearchArtist(artist.name) }}
                >
                  <Image
                    url={artistAvatars[artist.name]}
                    placeholderType="artist"
                    style={[
                      styles.artistAvatarImage,
                      {
                        width: artistSize,
                        height: artistSize,
                        borderRadius: artistSize / 2,
                      },
                    ]}
                  />
                  <Text style={styles.artistName} numberOfLines={1}>
                    {artist.name}
                  </Text>
                  <Text style={styles.artistRole}>{t('spotify_artist_role')}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 底部留白，防止被悬浮 Mini Player 遮挡 */}
        <View style={{ height: scaleSizeH(80) }} />
      </ScrollView>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SPOTIFY_COLORS.PRIMARY,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scaleSizeW(16),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scaleSizeH(14),
  },
  brandGreetingRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: scaleSizeW(10),
  },
  logoBadge: {
    width: scaleSizeW(36),
    height: scaleSizeW(36),
    borderRadius: scaleSizeW(18),
    backgroundColor: SPOTIFY_COLORS.GREEN_ALPHA_15,
    borderWidth: 1,
    borderColor: SPOTIFY_COLORS.GREEN_ALPHA_30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleSizeW(10),
  },
  logoImage: {
    width: scaleSizeW(26),
    height: scaleSizeW(26),
    borderRadius: scaleSizeW(13),
  },
  greetingTextWrap: {
    flex: 1,
  },
  brandTag: {
    color: SPOTIFY_COLORS.TINT,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  greetingText: {
    color: SPOTIFY_COLORS.WHITE,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  settingButton: {
    width: scaleSizeW(40),
    height: scaleSizeH(40),
    borderRadius: SPOTIFY_RADIUS.ROUND,
    backgroundColor: SPOTIFY_COLORS.SECONDARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonPressed: {
    backgroundColor: SPOTIFY_COLORS.CARD_PRESS,
    transform: [{ scale: 0.94 }],
  },
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleSizeH(16),
  },
  filterPill: {
    paddingHorizontal: scaleSizeW(14),
    paddingVertical: scaleSizeH(7),
    borderRadius: SPOTIFY_RADIUS.ROUND,
    backgroundColor: SPOTIFY_COLORS.CARD,
    marginRight: scaleSizeW(8),
  },
  filterPillActive: {
    backgroundColor: SPOTIFY_COLORS.TINT,
  },
  pillPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  filterPillText: {
    color: SPOTIFY_COLORS.WHITE,
    fontSize: 12,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: SPOTIFY_COLORS.BLACK,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: scaleSizeH(20),
  },
  gridItem: {
    height: scaleSizeH(54),
    backgroundColor: SPOTIFY_COLORS.SURFACE_ELEVATED,
    borderRadius: SPOTIFY_RADIUS.S,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleSizeH(8),
    overflow: 'hidden',
  },
  gridItemPressed: {
    backgroundColor: SPOTIFY_COLORS.CARD_PRESS,
    transform: [{ scale: 0.985 }],
  },
  gridCoverImage: {
    width: scaleSizeH(54),
    height: scaleSizeH(54),
    borderRadius: 0,
  },
  gridTextWrap: {
    flex: 1,
    paddingHorizontal: scaleSizeW(10),
    justifyContent: 'center',
  },
  gridTitle: {
    color: SPOTIFY_COLORS.WHITE,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
  },
  sectionContainer: {
    marginBottom: scaleSizeH(26),
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scaleSizeH(12),
  },
  sectionTitle: {
    color: SPOTIFY_COLORS.WHITE,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  horizontalScroll: {
    paddingRight: scaleSizeW(12),
  },
  playlistCard: {
    marginRight: scaleSizeW(14),
  },
  cardPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.97 }],
  },
  coverBox: {
    borderRadius: SPOTIFY_RADIUS.M,
    overflow: 'hidden',
    backgroundColor: SPOTIFY_COLORS.SECONDARY,
    marginBottom: scaleSizeH(8),
    position: 'relative',
  },
  fillImage: {
    width: '100%',
    height: '100%',
    borderRadius: SPOTIFY_RADIUS.M,
  },
  playOverlayBadge: {
    position: 'absolute',
    right: scaleSizeW(8),
    bottom: scaleSizeH(8),
    width: scaleSizeW(30),
    height: scaleSizeW(30),
    borderRadius: scaleSizeW(15),
    backgroundColor: SPOTIFY_COLORS.TINT,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  cardTitle: {
    color: SPOTIFY_COLORS.WHITE,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  cardSubtitle: {
    color: SPOTIFY_COLORS.LIGHT_GREY,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  artistCard: {
    alignItems: 'center',
    marginRight: scaleSizeW(14),
  },
  artistAvatarImage: {
    backgroundColor: SPOTIFY_COLORS.SECONDARY,
    marginBottom: scaleSizeH(8),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  artistName: {
    color: SPOTIFY_COLORS.WHITE,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  artistRole: {
    color: SPOTIFY_COLORS.LIGHT_GREY,
    fontSize: 11,
    fontWeight: '500',
  },
  skeletonCover: {
    borderRadius: SPOTIFY_RADIUS.M,
    backgroundColor: SPOTIFY_COLORS.CARD,
    marginBottom: scaleSizeH(8),
  },
  skeletonTitle: {
    width: '78%',
    height: 14,
    borderRadius: 4,
    backgroundColor: SPOTIFY_COLORS.CARD,
    marginBottom: 6,
  },
  skeletonSub: {
    width: '55%',
    height: 11,
    borderRadius: 4,
    backgroundColor: SPOTIFY_COLORS.SECONDARY,
  },
})
