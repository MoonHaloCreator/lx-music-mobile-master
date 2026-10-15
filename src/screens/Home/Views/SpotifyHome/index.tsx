import { memo, useMemo } from 'react'
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
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
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { LIST_IDS } from '@/config/constant'
import { useI18n } from '@/lang'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default memo(() => {
  const statusBarHeight = useStatusbarHeight()
  const myLists = useMyList()
  const t = useI18n()

  // 动态计算问候语
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return t('spotify_greeting_morning')
    if (hour >= 12 && hour < 18) return t('spotify_greeting_afternoon')
    return t('spotify_greeting_evening')
  }, [t])

  // 打开设置
  const handleOpenSetting = () => {
    setNavActiveId('nav_setting')
  }

  // 点击 2x3 胶囊歌单
  const handleOpenList = (list: LX.List.MyListInfo) => {
    navigations.pushSonglistDetailScreen(
      commonState.componentIds.home ?? 'home',
      {
        id: list.id,
        name: list.name,
        source: 'local',
        play_count: '',
        img: '',
        desc: '',
        author: '',
      } as any
    )
  }

  // 2x3 常用胶囊数据
  const quickCapsules = useMemo(() => {
    const defaultLove = myLists.slice(0, 6)
    return defaultLove
  }, [myLists])

  // 精选歌单示例与本地歌单流
  const featuredPlaylists = useMemo(() => {
    return [
      {
        id: LIST_IDS.LOVE,
        title: t('spotify_liked_songs'),
        subtitle: t('spotify_liked_songs_desc'),
        image: '',
        type: 'playlist',
      },
      {
        id: LIST_IDS.DEFAULT,
        title: t('spotify_daily_mix_1'),
        subtitle: t('spotify_daily_mix_1_desc'),
        image: '',
        type: 'playlist',
      },
      {
        id: 'top_hits',
        title: t('spotify_top_hits'),
        subtitle: t('spotify_top_hits_desc'),
        image: '',
        type: 'playlist',
      },
      {
        id: 'chill_vibes',
        title: t('spotify_chill_vibes'),
        subtitle: t('spotify_chill_vibes_desc'),
        image: '',
        type: 'playlist',
      },
    ]
  }, [t])

  // 热门歌手示例
  const popularArtists = useMemo(() => {
    return [
      { id: '1', name: 'Jay Chou', followers: t('spotify_artist_role') },
      { id: '2', name: 'Taylor Swift', followers: t('spotify_artist_role') },
      { id: '3', name: 'Ed Sheeran', followers: t('spotify_artist_role') },
      { id: '4', name: 'Adele', followers: t('spotify_artist_role') },
      { id: '5', name: 'Billie Eilish', followers: t('spotify_artist_role') },
    ]
  }, [t])

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: statusBarHeight + scaleSizeH(16) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 顶部问候栏 + 设置图标 */}
        <View style={styles.headerRow}>
          <Text style={styles.greetingText}>{greeting}</Text>
          <TouchableOpacity
            style={styles.settingButton}
            activeOpacity={0.7}
            onPress={handleOpenSetting}
          >
            <Icon name="setting" size={22} color={SPOTIFY_COLORS.WHITE} />
          </TouchableOpacity>
        </View>

        {/* 2x3 常用入口胶囊网格 */}
        <View style={styles.gridContainer}>
          {quickCapsules.map((item, index) => (
            <TouchableOpacity
              key={item.id || index}
              style={styles.gridItem}
              activeOpacity={0.8}
              onPress={() => handleOpenList(item)}
            >
              <View style={styles.gridIconBox}>
                <Icon
                  name={item.id === LIST_IDS.LOVE ? 'love' : 'album'}
                  size={20}
                  color={
                    item.id === LIST_IDS.LOVE
                      ? SPOTIFY_COLORS.TINT
                      : SPOTIFY_COLORS.WHITE
                  }
                />
              </View>
              <Text style={styles.gridTitle} numberOfLines={2}>
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 为你推荐 / 精选歌单横向滑动流 */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('spotify_featured_playlists')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {featuredPlaylists.map((item, index) => (
              <TouchableOpacity
                key={item.id + index}
                style={styles.playlistCard}
                activeOpacity={0.8}
              >
                <View style={styles.playlistCover}>
                  <Icon
                    name="album"
                    size={36}
                    color={SPOTIFY_COLORS.LIGHT_GREY}
                  />
                </View>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.cardSubtitle} numberOfLines={2}>
                  {item.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 热门歌手正圆形头像轮播流 */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('spotify_popular_artists')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {popularArtists.map((artist) => (
              <TouchableOpacity
                key={artist.id}
                style={styles.artistCard}
                activeOpacity={0.8}
              >
                <View style={styles.artistAvatar}>
                  <Icon
                    name="logo"
                    size={32}
                    color={SPOTIFY_COLORS.LIGHT_GREY}
                  />
                </View>
                <Text style={styles.artistName} numberOfLines={1}>
                  {artist.name}
                </Text>
                <Text style={styles.artistRole}>{artist.followers}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 底部留白，防止被悬浮 Mini Player 遮挡 */}
        <View style={{ height: scaleSizeH(70) }} />
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
    marginBottom: scaleSizeH(18),
  },
  greetingText: {
    color: SPOTIFY_COLORS.WHITE,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  settingButton: {
    width: scaleSizeW(36),
    height: scaleSizeH(36),
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: scaleSizeH(24),
  },
  gridItem: {
    width: (SCREEN_WIDTH - scaleSizeW(32) - scaleSizeW(8)) / 2,
    height: scaleSizeH(52),
    backgroundColor: SPOTIFY_COLORS.CARD,
    borderRadius: SPOTIFY_RADIUS.XS,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleSizeH(8),
    overflow: 'hidden',
  },
  gridIconBox: {
    width: scaleSizeH(52),
    height: scaleSizeH(52),
    backgroundColor: SPOTIFY_COLORS.SECONDARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleSizeW(8),
  },
  gridTitle: {
    flex: 1,
    color: SPOTIFY_COLORS.WHITE,
    fontSize: 13,
    fontWeight: '700',
    paddingRight: scaleSizeW(6),
  },
  sectionContainer: {
    marginBottom: scaleSizeH(28),
  },
  sectionTitle: {
    color: SPOTIFY_COLORS.WHITE,
    fontSize: 19,
    fontWeight: '800',
    marginBottom: scaleSizeH(14),
  },
  horizontalScroll: {
    paddingRight: scaleSizeW(16),
  },
  playlistCard: {
    width: scaleSizeW(140),
    marginRight: scaleSizeW(14),
  },
  playlistCover: {
    width: scaleSizeW(140),
    height: scaleSizeW(140),
    backgroundColor: SPOTIFY_COLORS.SECONDARY,
    borderRadius: SPOTIFY_RADIUS.M,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleSizeH(8),
  },
  cardTitle: {
    color: SPOTIFY_COLORS.WHITE,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardSubtitle: {
    color: SPOTIFY_COLORS.LIGHT_GREY,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  artistCard: {
    width: scaleSizeW(110),
    alignItems: 'center',
    marginRight: scaleSizeW(16),
  },
  artistAvatar: {
    width: scaleSizeW(104),
    height: scaleSizeW(104),
    borderRadius: scaleSizeW(52),
    backgroundColor: SPOTIFY_COLORS.SECONDARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleSizeH(8),
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
})
