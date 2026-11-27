import { playList } from '@/core/player/player'
import { useMemo, useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { FlatList, type NativeScrollEvent, type NativeSyntheticEvent, type FlatListProps, Pressable, StyleSheet, View } from 'react-native'

import listState from '@/store/list/state'
import playerState from '@/store/player/state'
import { getListPosition, getListPrevSelectId, saveListPosition } from '@/utils/data'
import { getListMusics, setActiveList } from '@/core/list'
import ListItem, { ITEM_HEIGHT } from './ListItem'
import { getRowInfo } from '@/utils/tools'
import { usePlayInfo, usePlayMusicInfo } from '@/store/player/hook'
import type { Position } from './ListMenu'
import type { SelectMode } from './MultipleModeBar'
import { useActiveListId, useMyList } from '@/store/list/hook'
import { useSettingValue } from '@/store/setting/hook'
import Image from '@/components/common/Image'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { LIST_IDS } from '@/config/constant'
import { SPOTIFY_COLORS, SPOTIFY_RADIUS } from '@/theme/spotify'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { useI18n } from '@/lang'

type FlatListType = FlatListProps<LX.Music.MusicInfo>

const HERO_HEIGHT = scaleSizeH(184)

export interface ListProps {
  onShowMenu: (musicInfo: LX.Music.MusicInfo, index: number, position: Position) => void
  onMuiltSelectMode: () => void
  onSelectAll: (isAll: boolean) => void
}
export interface ListType {
  setIsMultiSelectMode: (isMultiSelectMode: boolean) => void
  setSelectMode: (mode: SelectMode) => void
  selectAll: (isAll: boolean) => void
  getSelectedList: () => LX.List.ListMusics
  scrollToInfo: (info: LX.Music.MusicInfo) => void
  scrollToTop: () => void
}

const usePlayIndex = () => {
  const activeListId = useActiveListId()
  const playMusicInfo = usePlayMusicInfo()
  const playInfo = usePlayInfo()

  const playIndex = useMemo(() => {
    return playMusicInfo.listId == activeListId ? playInfo.playIndex : -1
  }, [activeListId, playInfo.playIndex, playMusicInfo.listId])

  return playIndex
}


const List = forwardRef<ListType, ListProps>(({ onShowMenu, onMuiltSelectMode, onSelectAll }, ref) => {
  const t = useI18n()
  const myLists = useMyList()
  const activeListId = useActiveListId()
  const flatListRef = useRef<FlatList>(null)
  const [currentList, setList] = useState<LX.List.ListMusics>([])
  const listFirstScrollRef = useRef(false)
  const isMultiSelectModeRef = useRef(false)
  const selectModeRef = useRef<SelectMode>('single')
  const prevSelectIndexRef = useRef(-1)
  const [selectedList, setSelectedList] = useState<LX.List.ListMusics>([])
  const selectedListRef = useRef<LX.List.ListMusics>([])
  const currentListIdRef = useRef('')
  const waitJumpListPositionRef = useRef(false)
  const rowInfo = useRef(getRowInfo())
  const isShowAlbumName = useSettingValue('list.isShowAlbumName')
  const isShowInterval = useSettingValue('list.isShowInterval')

  useImperativeHandle(ref, () => ({
    setIsMultiSelectMode(isMultiSelectMode) {
      isMultiSelectModeRef.current = isMultiSelectMode
      if (!isMultiSelectMode) {
        prevSelectIndexRef.current = -1
        handleUpdateSelectedList([])
      }
    },
    setSelectMode(mode) {
      selectModeRef.current = mode
    },
    selectAll(isAll) {
      let list: LX.List.ListMusics
      if (isAll) {
        list = [...currentList]
      } else {
        list = []
      }
      selectedListRef.current = list
      setSelectedList(list)
    },
    getSelectedList() {
      return selectedListRef.current
    },
    scrollToInfo(info) {
      void getListMusics(listState.activeListId).then((list) => {
        const index = list.findIndex(m => m.id == info.id)
        if (index < 0) return
        flatListRef.current?.scrollToIndex({ index: Math.floor(index / (rowInfo.current.rowNum ?? 1)), viewPosition: 0.3, animated: true })
      })
    },
    scrollToTop() {
      flatListRef.current?.scrollToOffset({
        offset: 0,
        animated: true,
      })
    },
  }))

  useEffect(() => {
    let isUpdateingList = true
    const updateList = (id: string) => {
      if (currentListIdRef.current == id) return
      isUpdateingList = true
      setList([])
      currentListIdRef.current = id
      void Promise.all([getListMusics(id), getListPosition(id)]).then(([list, position]) => {
        requestAnimationFrame(() => {
          if (currentListIdRef.current != id) return
          selectedListRef.current = []
          setSelectedList([])
          setList([...list])
          requestAnimationFrame(() => {
            isUpdateingList = false
            listFirstScrollRef.current = true
            if (waitJumpListPositionRef.current) {
              waitJumpListPositionRef.current = false
              if (playerState.playMusicInfo.listId == id && playerState.playInfo.playIndex > -1) {
                try {
                  flatListRef.current?.scrollToIndex({ index: Math.floor(playerState.playInfo.playIndex / (rowInfo.current.rowNum ?? 1)), viewPosition: 0.3, animated: false })
                  return
                } catch {}
              }
            }
            flatListRef.current?.scrollToOffset({ offset: position, animated: false })
          })
        })
      })
    }
    const handleChange = (ids: string[]) => {
      if (!ids.includes(listState.activeListId)) return
      const id = listState.activeListId
      void getListMusics(id).then((list) => {
        if (currentListIdRef.current != id) return
        selectedListRef.current = []
        setSelectedList([])
        setList([...list])
      })
    }

    const handleJumpPosition = () => {
      requestAnimationFrame(() => {
        const listId = playerState.playMusicInfo.listId
        if (!listId) return
        if (listId != listState.activeListId) {
          setActiveList(listId)
          if (currentListIdRef.current != listId) waitJumpListPositionRef.current = true
        } else if (playerState.playInfo.playIndex > -1) {
          if (isUpdateingList) waitJumpListPositionRef.current = true
          else {
            try {
              flatListRef.current?.scrollToIndex({ index: Math.floor(playerState.playInfo.playIndex / (rowInfo.current.rowNum ?? 1)), viewPosition: 0.3, animated: true })
            } catch {}
          }
        }
      })
    }
    if (global.lx.jumpMyListPosition) {
      global.lx.jumpMyListPosition = false
      if (playerState.playMusicInfo.listId) {
        waitJumpListPositionRef.current = true
        updateList(playerState.playMusicInfo.listId)
      } else if (listState.activeListId) {
        updateList(listState.activeListId)
      } else void getListPrevSelectId().then(updateList)
    } else if (listState.activeListId) {
      updateList(listState.activeListId)
    } else void getListPrevSelectId().then(updateList)

    global.state_event.on('mylistToggled', updateList)
    global.app_event.on('myListMusicUpdate', handleChange)
    global.app_event.on('jumpListPosition', handleJumpPosition)

    return () => {
      global.state_event.off('mylistToggled', updateList)
      global.app_event.off('myListMusicUpdate', handleChange)
      global.app_event.off('jumpListPosition', handleJumpPosition)
    }
  }, [])

  const activeIndex = usePlayIndex()
  const handlePlay = useCallback((index: number) => {
    void playList(listState.activeListId, index)
  }, [])

  const handleUpdateSelectedList = (newList: LX.List.ListMusics) => {
    if (selectedListRef.current.length && newList.length == currentList.length) onSelectAll(true)
    else if (selectedListRef.current.length == currentList.length) onSelectAll(false)
    selectedListRef.current = newList
    setSelectedList(newList)
  }
  const handleSelect = (item: LX.Music.MusicInfo, pressIndex: number) => {
    let newList: LX.List.ListMusics
    if (selectModeRef.current == 'single') {
      prevSelectIndexRef.current = pressIndex
      const index = selectedListRef.current.indexOf(item)
      if (index < 0) {
        newList = [...selectedListRef.current, item]
      } else {
        newList = [...selectedListRef.current]
        newList.splice(index, 1)
      }
    } else {
      if (selectedListRef.current.length) {
        const prevIndex = prevSelectIndexRef.current
        const currentIndex = pressIndex
        if (prevIndex == currentIndex) {
          newList = []
        } else if (currentIndex > prevIndex) {
          newList = currentList.slice(prevIndex, currentIndex + 1)
        } else {
          newList = currentList.slice(currentIndex, prevIndex + 1)
          newList.reverse()
        }
      } else {
        newList = [item]
        prevSelectIndexRef.current = pressIndex
      }
    }

    handleUpdateSelectedList(newList)
  }

  const handlePress = (item: LX.Music.MusicInfo, index: number) => {
    requestAnimationFrame(() => {
      if (!global.lx.homePagerIdle) return
      if (isMultiSelectModeRef.current) {
        handleSelect(item, index)
      } else {
        handlePlay(index)
      }
    })
  }

  const handleLongPress = (item: LX.Music.MusicInfo, index: number) => {
    if (isMultiSelectModeRef.current) return
    prevSelectIndexRef.current = index
    handleUpdateSelectedList([item])
    onMuiltSelectMode()
  }

  const handleScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (listFirstScrollRef.current) {
      listFirstScrollRef.current = false
      return
    }
    void saveListPosition(listState.activeListId, nativeEvent.contentOffset.y)
  }

  const firstSong = currentList[0] ?? null
  const currentListName = useMemo(() => {
    switch (activeListId) {
      case LIST_IDS.TEMP:
        return t('list_name_temp')
      case LIST_IDS.DEFAULT:
        return t('list_name_default')
      case LIST_IDS.LOVE:
        return t('list_name_love')
      default:
        return myLists.find(l => l.id === activeListId)?.name ?? ''
    }
  }, [activeListId, myLists, t])

  const heroHeader = useMemo(() => {
    const isLoveList = activeListId === LIST_IDS.LOVE
    const isDefaultList = activeListId === LIST_IDS.DEFAULT
    const listTag = isLoveList
      ? t('spotify_liked_list')
      : isDefaultList
        ? t('spotify_trial_list')
        : t('spotify_library_playlist')

    return (
      <View style={styles.heroContainer}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroCoverWrap}>
            <Image
              url={firstSong?.meta?.picUrl}
              musicInfo={firstSong}
              listId={activeListId}
              placeholderType={isLoveList ? 'love' : 'playlist'}
              style={styles.heroCover}
            />
          </View>
          <View style={styles.heroMeta}>
            <View style={[styles.badgeChip, isLoveList && styles.badgeChipLove]}>
              <Text style={styles.badgeText} numberOfLines={1}>
                {listTag}
              </Text>
            </View>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {currentListName || listTag}
            </Text>
            <Text style={styles.heroFirstTrack} numberOfLines={1}>
              {firstSong
                ? `${t('spotify_first_track')}: ${firstSong.name} - ${firstSong.singer}`
                : t('spotify_no_tracks_in_list')}
            </Text>
            <Text style={styles.heroCount}>
              {t('spotify_songs_count', { count: currentList.length })}
            </Text>
          </View>
        </View>

        <View style={styles.heroActionRow}>
          <View style={styles.quickSwitchRow}>
            <Pressable
              onPress={() => { setActiveList(LIST_IDS.DEFAULT) }}
              style={({ pressed }) => [
                styles.switchPill,
                isDefaultList && styles.switchPillActive,
                pressed && styles.pillPressed,
              ]}
            >
              <Text style={[styles.switchPillText, isDefaultList && styles.switchPillTextActive]}>
                {t('spotify_trial_list')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => { setActiveList(LIST_IDS.LOVE) }}
              style={({ pressed }) => [
                styles.switchPill,
                isLoveList && styles.switchPillActive,
                pressed && styles.pillPressed,
              ]}
            >
              <Text style={[styles.switchPillText, isLoveList && styles.switchPillTextActive]}>
                {t('spotify_liked_list')}
              </Text>
            </Pressable>
          </View>

          <Pressable
            disabled={!currentList.length}
            onPress={() => { if (currentList.length) handlePlay(0) }}
            style={({ pressed }) => [
              styles.playAllBtn,
              !currentList.length && styles.playAllBtnDisabled,
              pressed && styles.playAllBtnPressed,
            ]}
          >
            <Icon name="play" size={18} color={SPOTIFY_COLORS.BLACK} />
          </Pressable>
        </View>
      </View>
    )
  }, [activeListId, currentList.length, currentListName, firstSong, handlePlay, t])

  const emptyComponent = useMemo(() => (
    <View style={styles.emptyBox}>
      <View style={styles.emptyIconCircle}>
        <Icon
          name={activeListId === LIST_IDS.LOVE ? 'love' : 'album'}
          size={24}
          color={SPOTIFY_COLORS.TINT}
        />
      </View>
      <Text style={styles.emptyTitle} color={SPOTIFY_COLORS.WHITE} size={15}>
        {currentListName || t('spotify_library_playlist')}
      </Text>
      <Text style={styles.emptyDesc} color={SPOTIFY_COLORS.LIGHT_GREY} size={12}>
        {t('spotify_no_tracks_in_list')}
      </Text>
    </View>
  ), [activeListId, currentListName, t])

  const renderItem: FlatListType['renderItem'] = ({ item, index }) => (
    <ListItem
      item={item}
      index={index}
      activeIndex={activeIndex}
      activeListId={activeListId}
      onPress={handlePress}
      onLongPress={handleLongPress}
      onShowMenu={onShowMenu}
      selectedList={selectedList}
      rowInfo={rowInfo.current}
      isShowAlbumName={isShowAlbumName}
      isShowInterval={isShowInterval}
    />
  )
  const getkey: FlatListType['keyExtractor'] = item => item.id
  const getItemLayout: FlatListType['getItemLayout'] = (data, index) => {
    return { length: ITEM_HEIGHT, offset: HERO_HEIGHT + ITEM_HEIGHT * index, index }
  }

  return (
    <FlatList
      ref={flatListRef}
      onScroll={handleScroll}
      style={styles.list}
      data={currentList}
      maxToRenderPerBatch={6}
      numColumns={rowInfo.current.rowNum}
      horizontal={false}
      windowSize={8}
      removeClippedSubviews={true}
      initialNumToRender={12}
      renderItem={renderItem}
      keyExtractor={getkey}
      extraData={`${activeIndex}_${activeListId}_${selectedList.length}`}
      getItemLayout={getItemLayout}
      ListHeaderComponent={heroHeader}
      ListEmptyComponent={emptyComponent}
      ListFooterComponent={<View style={{ height: scaleSizeH(84) }} />}
    />
  )
})

const styles = StyleSheet.create({
  list: {
    flexGrow: 1,
    flexShrink: 1,
  },
  heroContainer: {
    height: HERO_HEIGHT,
    paddingHorizontal: scaleSizeW(16),
    paddingTop: scaleSizeH(12),
    paddingBottom: scaleSizeH(10),
    justifyContent: 'space-between',
    backgroundColor: SPOTIFY_COLORS.SECONDARY,
    borderBottomWidth: 1,
    borderBottomColor: SPOTIFY_COLORS.DIVIDER,
    marginBottom: scaleSizeH(6),
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroCoverWrap: {
    width: scaleSizeW(100),
    height: scaleSizeW(100),
    borderRadius: SPOTIFY_RADIUS.M,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    marginRight: scaleSizeW(14),
  },
  heroCover: {
    width: '100%',
    height: '100%',
    borderRadius: SPOTIFY_RADIUS.M,
  },
  heroMeta: {
    flex: 1,
    justifyContent: 'center',
  },
  badgeChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: scaleSizeW(8),
    paddingVertical: scaleSizeH(2),
    borderRadius: SPOTIFY_RADIUS.ROUND,
    backgroundColor: SPOTIFY_COLORS.GREEN_ALPHA_15,
    marginBottom: scaleSizeH(5),
  },
  badgeChipLove: {
    backgroundColor: 'rgba(130, 80, 223, 0.25)',
  },
  badgeText: {
    color: SPOTIFY_COLORS.TINT,
    fontSize: 10,
    fontWeight: '700',
  },
  heroTitle: {
    color: SPOTIFY_COLORS.WHITE,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroFirstTrack: {
    color: SPOTIFY_COLORS.LIGHTER_GREY,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 3,
  },
  heroCount: {
    color: SPOTIFY_COLORS.LIGHT_GREY,
    fontSize: 11,
    fontWeight: '600',
  },
  heroActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: scaleSizeH(8),
  },
  quickSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchPill: {
    paddingHorizontal: scaleSizeW(12),
    paddingVertical: scaleSizeH(6),
    borderRadius: SPOTIFY_RADIUS.ROUND,
    backgroundColor: SPOTIFY_COLORS.CARD,
    marginRight: scaleSizeW(8),
  },
  switchPillActive: {
    backgroundColor: SPOTIFY_COLORS.GREEN_ALPHA_15,
    borderWidth: 1,
    borderColor: SPOTIFY_COLORS.TINT,
  },
  pillPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.96 }],
  },
  switchPillText: {
    color: SPOTIFY_COLORS.LIGHT_GREY,
    fontSize: 12,
    fontWeight: '600',
  },
  switchPillTextActive: {
    color: SPOTIFY_COLORS.TINT,
    fontWeight: '700',
  },
  playAllBtn: {
    width: scaleSizeW(44),
    height: scaleSizeW(44),
    borderRadius: scaleSizeW(22),
    backgroundColor: SPOTIFY_COLORS.TINT,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  playAllBtnDisabled: {
    opacity: 0.35,
  },
  playAllBtnPressed: {
    transform: [{ scale: 0.93 }],
    backgroundColor: SPOTIFY_COLORS.GREEN_DARK,
  },
  emptyBox: {
    paddingTop: scaleSizeH(48),
    paddingHorizontal: scaleSizeW(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: scaleSizeW(56),
    height: scaleSizeW(56),
    borderRadius: SPOTIFY_RADIUS.ROUND,
    backgroundColor: SPOTIFY_COLORS.CARD,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleSizeH(12),
  },
  emptyTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyDesc: {
    marginTop: scaleSizeH(6),
    textAlign: 'center',
    lineHeight: 18,
  },
})

export default List
