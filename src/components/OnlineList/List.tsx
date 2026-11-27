import { useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { FlatList, type FlatListProps, Pressable, RefreshControl, View } from 'react-native'

// import { useMusicList } from '@/store/list/hook'
import ListItem, { ITEM_HEIGHT } from './ListItem'
import { createStyle, getRowInfo, type RowInfoType } from '@/utils/tools'
import type { Position } from './ListMenu'
import type { SelectMode } from './MultipleModeBar'
import { useTheme } from '@/store/theme/hook'
import settingState from '@/store/setting/state'
import { MULTI_SELECT_BAR_HEIGHT } from './MultipleModeBar'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import Loading from '@/components/common/Loading'
import { Icon } from '@/components/common/Icon'
import { handlePlay } from './listAction'
import { useSettingValue } from '@/store/setting/hook'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { SPOTIFY_COLORS, SPOTIFY_RADIUS } from '@/theme/spotify'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'

type FlatListType = FlatListProps<LX.Music.MusicInfoOnline>

export type {
  RowInfoType,
}

export interface ListProps {
  onShowMenu: (musicInfo: LX.Music.MusicInfoOnline, index: number, position: Position) => void
  onMuiltSelectMode: () => void
  onSelectAll: (isAll: boolean) => void
  onRefresh: () => void
  onLoadMore: () => void
  onPlayList?: (index: number) => void
  progressViewOffset?: number
  ListHeaderComponent?: FlatListType['ListEmptyComponent']
  checkHomePagerIdle: boolean
  rowType?: RowInfoType
}
export interface ListType {
  setList: (list: LX.Music.MusicInfoOnline[], isAppend: boolean, showSource: boolean) => void
  setIsMultiSelectMode: (isMultiSelectMode: boolean) => void
  setSelectMode: (mode: SelectMode) => void
  selectAll: (isAll: boolean) => void
  getSelectedList: () => LX.Music.MusicInfoOnline[]
  getList: () => LX.Music.MusicInfoOnline[]
  setStatus: (val: Status) => void
}
export type Status = 'loading' | 'refreshing' | 'end' | 'error' | 'idle'


const List = forwardRef<ListType, ListProps>(({
  onShowMenu,
  onMuiltSelectMode,
  onSelectAll,
  onRefresh,
  onLoadMore,
  onPlayList,
  progressViewOffset,
  ListHeaderComponent,
  checkHomePagerIdle,
  rowType,
}, ref) => {
  const flatListRef = useRef<FlatList>(null)
  const [currentList, setList] = useState<LX.Music.MusicInfoOnline[]>([])
  const [showSource, setShowSource] = useState(false)
  const isMultiSelectModeRef = useRef(false)
  const selectModeRef = useRef<SelectMode>('single')
  const prevSelectIndexRef = useRef(-1)
  const [selectedList, setSelectedList] = useState<LX.Music.MusicInfoOnline[]>([])
  const selectedListRef = useRef<LX.Music.MusicInfoOnline[]>([])
  const [visibleMultiSelect, setVisibleMultiSelect] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const rowInfo = useRef(getRowInfo(rowType))
  const isShowAlbumName = useSettingValue('list.isShowAlbumName')
  const isShowInterval = useSettingValue('list.isShowInterval')
  const playerMusicInfo = usePlayerMusicInfo()
  const playingId = playerMusicInfo.id ?? ''
  const t = useI18n()
  // const currentListIdRef = useRef('')
  // console.log('render music list')

  useImperativeHandle(ref, () => ({
    setList(list, isAppend, showSource) {
      setList(list)
      setShowSource(showSource)
      if (!isAppend && selectedListRef.current.length) setSelectedList(selectedListRef.current = [])
    },
    setIsMultiSelectMode(isMultiSelectMode) {
      isMultiSelectModeRef.current = isMultiSelectMode
      if (!isMultiSelectMode) {
        prevSelectIndexRef.current = -1
        handleUpdateSelectedList([])
      }
      setVisibleMultiSelect(isMultiSelectMode)
    },
    setSelectMode(mode) {
      selectModeRef.current = mode
    },
    selectAll(isAll) {
      let list: LX.Music.MusicInfoOnline[]
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
    getList() {
      return currentList
    },
    setStatus(val) {
      setStatus(val)
    },
  }))


  const handleUpdateSelectedList = (newList: LX.Music.MusicInfoOnline[]) => {
    if (selectedListRef.current.length && newList.length == currentList.length) onSelectAll(true)
    else if (selectedListRef.current.length == currentList.length) onSelectAll(false)
    selectedListRef.current = newList
    setSelectedList(newList)
  }
  const handleSelect = (item: LX.Music.MusicInfoOnline, pressIndex: number) => {
    let newList: LX.Music.MusicInfoOnline[]
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

  const handlePress = (item: LX.Music.MusicInfoOnline, index: number) => {
    requestAnimationFrame(() => {
      if (checkHomePagerIdle && !global.lx.homePagerIdle) return
      if (isMultiSelectModeRef.current) {
        handleSelect(item, index)
      } else {
        if (settingState.setting['list.isClickPlayList'] && onPlayList != null) {
          onPlayList(index)
        } else {
          // console.log(currentList[index])
          handlePlay(currentList[index])
        }
      }
    })
  }

  const handleLongPress = (item: LX.Music.MusicInfoOnline, index: number) => {
    if (isMultiSelectModeRef.current) return
    prevSelectIndexRef.current = index
    handleUpdateSelectedList([item])
    onMuiltSelectMode()
  }

  const handleLoadMore = () => {
    if (status != 'idle') return
    onLoadMore()
  }


  const renderItem: FlatListType['renderItem'] = ({ item, index }) => (
    <ListItem
      item={item}
      index={index}
      isPlaying={playingId !== '' && playingId === item.id}
      showSource={showSource}
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
    return { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
  }
  const refreshControl = useMemo(() => (
    <RefreshControl
      colors={[SPOTIFY_COLORS.TINT]}
      refreshing={status == 'refreshing'}
      onRefresh={onRefresh} />
  ), [status, onRefresh])
  const emptyComponent = useMemo(() => {
    if (status === 'loading' || status === 'refreshing') {
      return (
        <View style={styles.emptyBox}>
          <Loading color={SPOTIFY_COLORS.TINT} />
          <Text style={styles.emptyTitle} color={SPOTIFY_COLORS.LIGHT_GREY} size={13}>
            {t('spotify_search_loading')}
          </Text>
        </View>
      )
    }
    if (status === 'error') {
      return (
        <Pressable
          style={({ pressed }) => [styles.emptyBox, pressed && { opacity: 0.75 }]}
          onPress={onRefresh}
        >
          <Icon name="available_updates" size={28} color={SPOTIFY_COLORS.TINT} />
          <Text style={styles.emptyTitle} color={SPOTIFY_COLORS.WHITE} size={14}>
            {t('spotify_search_error')}
          </Text>
        </Pressable>
      )
    }
    return (
      <View style={styles.emptyBox}>
        <View style={styles.emptyIconCircle}>
          <Icon name="search-2" size={24} color={SPOTIFY_COLORS.LIGHT_GREY} />
        </View>
        <Text style={styles.emptyTitle} color={SPOTIFY_COLORS.WHITE} size={15}>
          {t('spotify_search_empty_title')}
        </Text>
        <Text style={styles.emptyDesc} color={SPOTIFY_COLORS.LIGHT_GREY} size={12}>
          {t('spotify_search_empty_desc')}
        </Text>
      </View>
    )
  }, [onRefresh, status, t])
  const footerComponent = useMemo(() => {
    let label: FooterLabel
    switch (status) {
      case 'refreshing': return null
      case 'loading':
        label = currentList.length ? 'list_loading' : null
        break
      case 'end':
        label = currentList.length ? 'list_end' : null
        break
      case 'error':
        label = currentList.length ? 'list_error' : null
        break
      case 'idle':
        label = null
        break
    }
    return (
      <View style={{ width: '100%', paddingBottom: visibleMultiSelect ? MULTI_SELECT_BAR_HEIGHT : scaleSizeH(80) }} >
        <Footer label={label} onLoadMore={onLoadMore} />
      </View>
    )
  }, [currentList.length, onLoadMore, status, visibleMultiSelect])

  return (
    <FlatList
      ref={flatListRef}
      style={styles.list}
      data={currentList}
      extraData={`${playingId}_${selectedList.length}`}
      numColumns={rowInfo.current.rowNum}
      horizontal={false}
      maxToRenderPerBatch={6}
      windowSize={8}
      removeClippedSubviews={true}
      initialNumToRender={12}
      renderItem={renderItem}
      keyExtractor={getkey}
      getItemLayout={getItemLayout}
      onEndReachedThreshold={0.5}
      onEndReached={handleLoadMore}
      progressViewOffset={progressViewOffset}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={emptyComponent}
      refreshControl={refreshControl}
      ListFooterComponent={footerComponent}
    />
  )
})

type FooterLabel = 'list_loading' | 'list_end' | 'list_error' | null
const Footer = ({ label, onLoadMore }: {
  label: FooterLabel
  onLoadMore: () => void
}) => {
  const theme = useTheme()
  const t = useI18n()
  const handlePress = () => {
    if (label != 'list_error') return
    onLoadMore()
  }
  return (
    label
      ? (
          <View>
            <Text onPress={handlePress} style={styles.footer} color={theme['c-font-label']}>{t(label)}</Text>
          </View>
        )
      : null
  )
}

const styles = createStyle({
  container: {
    flex: 1,
  },
  list: {
    flexGrow: 1,
    flexShrink: 1,
  },
  footer: {
    textAlign: 'center',
    padding: 10,
  },
  emptyBox: {
    paddingTop: scaleSizeH(56),
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
    marginTop: scaleSizeH(10),
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
