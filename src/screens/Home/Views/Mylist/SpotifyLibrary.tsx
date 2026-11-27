import { memo, useCallback, useEffect, useRef, useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import Text from '@/components/common/Text'
import Image from '@/components/common/Image'
import { Icon } from '@/components/common/Icon'
import { SPOTIFY_COLORS, SPOTIFY_RADIUS } from '@/theme/spotify'
import { useMyList, useActiveListId } from '@/store/list/hook'
import { useStatusbarHeight } from '@/store/common/hook'
import { consumePendingOpenListId, setActiveList } from '@/core/list'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { LIST_IDS } from '@/config/constant'
import { useI18n } from '@/lang'
import { getFirstSongCoverFromList } from '@/utils/artworkCache'
import ListNameEdit, { type ListNameEditType } from './MyList/ListNameEdit'
import MusicList from './MusicList'

type FilterType = 'all' | 'playlists' | 'trial'

interface ListCoverMeta {
  firstSong: LX.Music.MusicInfo | null
  picUrl: string | null
  totalCount: number
}

export default memo(() => {
  const statusBarHeight = useStatusbarHeight()
  const myLists = useMyList()
  const activeListId = useActiveListId()
  const t = useI18n()
  const [filter, setFilter] = useState<FilterType>('all')
  const [showDetail, setShowDetail] = useState(() => {
    const pendingId = consumePendingOpenListId()
    if (pendingId) {
      setActiveList(pendingId)
      return true
    }
    if (global.lx.jumpMyListPosition) return true
    return false
  })
  const [coverMap, setCoverMap] = useState<Record<string, ListCoverMeta>>({})
  const listNameEditRef = useRef<ListNameEditType>(null)

  const refreshCovers = useCallback(async() => {
    const entries = await Promise.all(
      myLists.map(async(item) => {
        const info = await getFirstSongCoverFromList(item.id)
        return [item.id, info] as const
      }),
    )
    const nextMap: Record<string, ListCoverMeta> = {}
    for (const [id, info] of entries) {
      nextMap[id] = info
    }
    setCoverMap(nextMap)
  }, [myLists])

  useEffect(() => {
    let cancelled = false
    const handleRefresh = () => {
      if (cancelled) return
      void refreshCovers()
    }
    handleRefresh()
    global.app_event.on('myListMusicUpdate', handleRefresh)
    global.state_event.on('mylistUpdated', handleRefresh)
    return () => {
      cancelled = true
      global.app_event.off('myListMusicUpdate', handleRefresh)
      global.state_event.off('mylistUpdated', handleRefresh)
    }
  }, [refreshCovers])

  useEffect(() => {
    const handleOpenDetail = (listId: string) => {
      setActiveList(listId)
      setShowDetail(true)
    }
    const handleToggleListOverview = (visible: boolean) => {
      if (visible) setShowDetail(false)
    }
    const handleJumpPosition = () => {
      setShowDetail(true)
    }

    global.app_event.on('openMyListDetail', handleOpenDetail)
    global.app_event.on('changeLoveListVisible', handleToggleListOverview)
    global.app_event.on('jumpListPosition', handleJumpPosition)

    return () => {
      global.app_event.off('openMyListDetail', handleOpenDetail)
      global.app_event.off('changeLoveListVisible', handleToggleListOverview)
      global.app_event.off('jumpListPosition', handleJumpPosition)
    }
  }, [])

  const handleSelectList = (listId: string) => {
    setActiveList(listId)
    setShowDetail(true)
  }

  const filteredLists = myLists.filter((list) => {
    if (filter === 'trial') return list.id === LIST_IDS.DEFAULT || list.id === LIST_IDS.LOVE
    if (filter === 'playlists') return list.id !== LIST_IDS.DEFAULT
    return true
  })

  if (showDetail) {
    const currentListName = myLists.find(l => l.id === activeListId)?.name ?? t('spotify_library_playlist')
    return (
      <View style={[styles.detailContainer, { paddingTop: statusBarHeight }]}>
        <View style={styles.detailHeader}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.iconBtnPressed,
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => { setShowDetail(false) }}
          >
            <Icon name="chevron-left" size={22} color={SPOTIFY_COLORS.WHITE} />
          </Pressable>
          <Text style={styles.detailTitle} numberOfLines={1}>
            {currentListName}
          </Text>
        </View>
        <MusicList />
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: statusBarHeight + scaleSizeH(14) }]}>
      {/* 顶部标题与新建歌单按钮 */}
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>{t('spotify_library_title')}</Text>
        <Pressable
          style={({ pressed }) => [
            styles.addBtn,
            pressed && styles.iconBtnPressed,
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => {
            listNameEditRef.current?.showCreate(-1)
          }}
        >
          <Icon name="add-music" size={22} color={SPOTIFY_COLORS.WHITE} />
        </Pressable>
      </View>

      {/* 顶部筛选胶囊 Pills */}
      <View style={styles.pillsRow}>
        {(
          [
            { id: 'all', label: t('spotify_library_all') },
            { id: 'trial', label: `${t('spotify_trial_list')} / ${t('spotify_liked_list')}` },
            { id: 'playlists', label: t('spotify_library_playlists') },
          ] as const
        ).map((tab) => {
          const isActive = filter === tab.id
          return (
            <Pressable
              key={tab.id}
              style={({ pressed }) => [
                styles.pill,
                isActive && styles.pillActive,
                pressed && styles.pillPressed,
              ]}
              onPress={() => { setFilter(tab.id) }}
            >
              <Text
                style={[
                  styles.pillText,
                  isActive && styles.pillTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          )
        })}
      </View>

      {/* 歌单列表（含首曲封面缩略图） */}
      <ScrollView
        style={styles.listScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: scaleSizeH(88) }}
      >
        {filteredLists.map((item) => {
          const isLove = item.id === LIST_IDS.LOVE
          const isDefault = item.id === LIST_IDS.DEFAULT
          const cover = coverMap[item.id]
          const isCurrentActive = activeListId === item.id

          return (
            <Pressable
              key={item.id}
              style={({ pressed }) => [
                styles.listItem,
                isCurrentActive && styles.listItemActive,
                pressed && styles.listItemPressed,
              ]}
              onPress={() => { handleSelectList(item.id) }}
            >
              <Image
                url={cover?.picUrl}
                musicInfo={cover?.firstSong}
                listId={item.id}
                placeholderType={isLove ? 'love' : 'playlist'}
                style={styles.coverBox}
              />

              <View style={styles.itemInfo}>
                <Text
                  style={[styles.itemTitle, isCurrentActive && styles.itemTitleActive]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Text style={styles.itemSubtitle} numberOfLines={1}>
                  {isLove
                    ? `${t('spotify_library_pinned')} • ${t('spotify_songs_count', { count: cover?.totalCount ?? 0 })}`
                    : isDefault
                      ? `${t('spotify_trial_list')} • ${t('spotify_songs_count', { count: cover?.totalCount ?? 0 })}`
                      : `${t('spotify_library_playlist')} • ${t('spotify_songs_count', { count: cover?.totalCount ?? 0 })}`}
                </Text>
              </View>

              <Icon name="chevron-right" size={14} color={SPOTIFY_COLORS.LIGHT_GREY} />
            </Pressable>
          )
        })}
      </ScrollView>

      <ListNameEdit ref={listNameEditRef} />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SPOTIFY_COLORS.PRIMARY,
    paddingHorizontal: scaleSizeW(16),
  },
  detailContainer: {
    flex: 1,
    backgroundColor: SPOTIFY_COLORS.PRIMARY,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scaleSizeH(14),
  },
  pageTitle: {
    color: SPOTIFY_COLORS.WHITE,
    fontSize: 24,
    fontWeight: '800',
  },
  addBtn: {
    width: scaleSizeW(38),
    height: scaleSizeH(38),
    borderRadius: SPOTIFY_RADIUS.ROUND,
    backgroundColor: SPOTIFY_COLORS.SECONDARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnPressed: {
    backgroundColor: SPOTIFY_COLORS.CARD_PRESS,
    transform: [{ scale: 0.94 }],
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: scaleSizeH(16),
  },
  pill: {
    paddingHorizontal: scaleSizeW(14),
    paddingVertical: scaleSizeH(7),
    borderRadius: SPOTIFY_RADIUS.ROUND,
    backgroundColor: SPOTIFY_COLORS.CARD,
    marginRight: scaleSizeW(8),
    marginBottom: scaleSizeH(6),
  },
  pillActive: {
    backgroundColor: SPOTIFY_COLORS.TINT,
  },
  pillPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.96 }],
  },
  pillText: {
    color: SPOTIFY_COLORS.WHITE,
    fontSize: 12,
    fontWeight: '700',
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
    paddingVertical: scaleSizeH(8),
    paddingHorizontal: scaleSizeW(8),
    borderRadius: SPOTIFY_RADIUS.M,
    marginBottom: scaleSizeH(6),
  },
  listItemActive: {
    backgroundColor: SPOTIFY_COLORS.SECONDARY,
  },
  listItemPressed: {
    backgroundColor: SPOTIFY_COLORS.CARD,
  },
  coverBox: {
    width: scaleSizeW(58),
    height: scaleSizeW(58),
    borderRadius: SPOTIFY_RADIUS.S,
    marginRight: scaleSizeW(12),
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: scaleSizeW(8),
  },
  itemTitle: {
    color: SPOTIFY_COLORS.WHITE,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  itemTitleActive: {
    color: SPOTIFY_COLORS.TINT,
  },
  itemSubtitle: {
    color: SPOTIFY_COLORS.LIGHT_GREY,
    fontSize: 12,
    fontWeight: '500',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    height: scaleSizeH(44),
    paddingHorizontal: scaleSizeW(10),
    borderBottomWidth: 1,
    borderBottomColor: SPOTIFY_COLORS.DIVIDER,
  },
  backButton: {
    width: scaleSizeW(38),
    height: scaleSizeH(38),
    borderRadius: SPOTIFY_RADIUS.ROUND,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleSizeW(4),
  },
  detailTitle: {
    color: SPOTIFY_COLORS.WHITE,
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
})
