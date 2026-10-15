import { memo, useState } from 'react'
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { SPOTIFY_COLORS, SPOTIFY_RADIUS } from '@/theme/spotify'
import { useMyList, useActiveListId } from '@/store/list/hook'
import { useStatusbarHeight } from '@/store/common/hook'
import { setActiveList } from '@/core/list'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { LIST_IDS } from '@/config/constant'
import { useI18n } from '@/lang'
import MusicList from './MusicList'

type FilterType = 'all' | 'playlists' | 'downloaded'

export default memo(() => {
  const statusBarHeight = useStatusbarHeight()
  const myLists = useMyList()
  const activeListId = useActiveListId()
  const t = useI18n()
  const [filter, setFilter] = useState<FilterType>('all')
  const [showDetail, setShowDetail] = useState(false)

  // 点击歌单切换进入歌曲详情列表
  const handleSelectList = (listId: string) => {
    setActiveList(listId)
    setShowDetail(true)
  }

  // 筛选过滤
  const filteredLists = myLists.filter((list) => {
    if (filter === 'downloaded') return list.id === LIST_IDS.DOWNLOAD
    return true
  })

  // 如果处于歌曲列表详情态，展示 MusicList 并提供顶部返回
  if (showDetail) {
    return (
      <View style={[styles.container, { paddingTop: statusBarHeight }]}>
        <View style={styles.detailHeader}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => setShowDetail(false)}
          >
            <Icon name="chevron-left" size={24} color={SPOTIFY_COLORS.WHITE} />
          </TouchableOpacity>
          <Text style={styles.detailTitle} numberOfLines={1}>
            {myLists.find(l => l.id === activeListId)?.name || 'Playlist'}
          </Text>
        </View>
        <MusicList />
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: statusBarHeight + scaleSizeH(16) }]}>
      {/* 顶部标题与新建按钮 */}
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>{t('spotify_library_title')}</Text>
        <TouchableOpacity
          style={styles.addBtn}
          activeOpacity={0.7}
          onPress={() => {
            // 打开侧边栏管理
            global.app_event.changeLoveListVisible(true)
          }}
        >
          <Icon name="add-music" size={24} color={SPOTIFY_COLORS.WHITE} />
        </TouchableOpacity>
      </View>

      {/* 顶部筛选胶囊 Pills */}
      <View style={styles.pillsRow}>
        {(['all', 'playlists', 'downloaded'] as FilterType[]).map((tab) => {
          const isActive = filter === tab
          const label = tab === 'all' ? t('spotify_library_all') : tab === 'playlists' ? t('spotify_library_playlists') : t('spotify_library_downloaded')
          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.pill,
                isActive && styles.pillActive,
              ]}
              activeOpacity={0.75}
              onPress={() => setFilter(tab)}
            >
              <Text
                style={[
                  styles.pillText,
                  isActive && styles.pillTextActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* 歌单列表 */}
      <ScrollView
        style={styles.listScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: scaleSizeH(80) }}
      >
        {filteredLists.map((item) => {
          const isLove = item.id === LIST_IDS.LOVE
          const isDownload = item.id === LIST_IDS.DOWNLOAD

          return (
            <TouchableOpacity
              key={item.id}
              style={styles.listItem}
              activeOpacity={0.75}
              onPress={() => handleSelectList(item.id)}
            >
              {/* 封面图标盒子 */}
              <View
                style={[
                  styles.coverBox,
                  isLove && { backgroundColor: '#431980' },
                  isDownload && { backgroundColor: '#006450' },
                ]}
              >
                <Icon
                  name={isLove ? 'love' : isDownload ? 'download-2' : 'album'}
                  size={24}
                  color={isLove ? SPOTIFY_COLORS.TINT : SPOTIFY_COLORS.WHITE}
                />
              </View>

              {/* 歌单信息 */}
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.itemSubtitle}>
                  {isLove ? `${t('spotify_library_pinned')}` : t('spotify_library_playlist')}
                </Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SPOTIFY_COLORS.PRIMARY,
    paddingHorizontal: scaleSizeW(16),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scaleSizeH(16),
  },
  pageTitle: {
    color: SPOTIFY_COLORS.WHITE,
    fontSize: 24,
    fontWeight: '800',
  },
  addBtn: {
    width: scaleSizeW(36),
    height: scaleSizeH(36),
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillsRow: {
    flexDirection: 'row',
    marginBottom: scaleSizeH(18),
  },
  pill: {
    paddingHorizontal: scaleSizeW(14),
    paddingVertical: scaleSizeH(6),
    borderRadius: SPOTIFY_RADIUS.ROUND,
    backgroundColor: SPOTIFY_COLORS.CARD,
    marginRight: scaleSizeW(8),
  },
  pillActive: {
    backgroundColor: SPOTIFY_COLORS.WHITE,
  },
  pillText: {
    color: SPOTIFY_COLORS.WHITE,
    fontSize: 12,
    fontWeight: '600',
  },
  pillTextActive: {
    color: SPOTIFY_COLORS.BLACK,
  },
  listScroll: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleSizeH(14),
  },
  coverBox: {
    width: scaleSizeW(56),
    height: scaleSizeW(56),
    borderRadius: SPOTIFY_RADIUS.XS,
    backgroundColor: SPOTIFY_COLORS.SECONDARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleSizeW(12),
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemTitle: {
    color: SPOTIFY_COLORS.WHITE,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemSubtitle: {
    color: SPOTIFY_COLORS.LIGHT_GREY,
    fontSize: 12,
    fontWeight: '500',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    height: scaleSizeH(48),
    marginBottom: scaleSizeH(8),
  },
  backButton: {
    width: scaleSizeW(40),
    height: scaleSizeH(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailTitle: {
    color: SPOTIFY_COLORS.WHITE,
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
})
