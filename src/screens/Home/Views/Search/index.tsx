import { useRef, useEffect, useCallback } from 'react'
import { type LayoutChangeEvent, View } from 'react-native'

import HeaderBar, { type HeaderBarProps, type HeaderBarType } from './HeaderBar'
import searchState, { type SearchType } from '@/store/search/state'
import searchMusicState from '@/store/search/music/state'
import searchSonglistState from '@/store/search/songlist/state'
import { getSearchSetting, saveSearchSetting } from '@/utils/data'
import { createStyle } from '@/utils/tools'
import TipList, { type TipListType } from './TipList'
import List, { type ListType } from './List'
import { addHistoryWord, setSearchText } from '@/core/search/search'
import { SPOTIFY_COLORS } from '@/theme/spotify'


interface SearchInfo {
  temp_source: LX.OnlineSource
  source: LX.OnlineSource | 'all'
  searchType: 'music' | 'songlist'
}

export default () => {
  const headerBarRef = useRef<HeaderBarType>(null)
  const searchTipListRef = useRef<TipListType>(null)
  const listRef = useRef<ListType>(null)
  const layoutHeightRef = useRef<number>(0)
  const searchInfo = useRef<SearchInfo>({ temp_source: 'kw', source: 'kw', searchType: 'music' })
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const tipSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const clearTipTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (tipSearchTimeoutRef.current) {
      clearTimeout(tipSearchTimeoutRef.current)
      tipSearchTimeoutRef.current = null
    }
  }, [])

  const handleHideTipList = useCallback(() => {
    clearTipTimers()
    searchTipListRef.current?.hide()
  }, [clearTipTimers])

  const handleSearch = useCallback<HeaderBarProps['onSearch']>((rawText) => {
    const text = rawText.trim()
    handleHideTipList()
    setSearchText(text)
    headerBarRef.current?.setText(text)
    headerBarRef.current?.blur()
    if (text) void addHistoryWord(text)
    listRef.current?.loadList(text, searchInfo.current.source, searchInfo.current.searchType)
  }, [handleHideTipList])

  useEffect(() => {
    void getSearchSetting().then(info => {
      searchInfo.current.temp_source = info.temp_source
      searchInfo.current.source = info.source
      searchInfo.current.searchType = info.type
      switch (info.type) {
        case 'music':
          headerBarRef.current?.setSourceList(searchMusicState.sources, info.source)
          break
        case 'songlist':
          headerBarRef.current?.setSourceList(searchSonglistState.sources, info.source)
          break
      }
      headerBarRef.current?.setText(searchState.searchText)
      listRef.current?.loadList(searchState.searchText, searchInfo.current.source, searchInfo.current.searchType)
    })

    const handleTypeChange = (type: SearchType) => {
      searchInfo.current.searchType = type
      void saveSearchSetting({ type })
      const validSources = type === 'music' ? searchMusicState.sources : searchSonglistState.sources
      if (!validSources.some(s => s === searchInfo.current.source)) {
        searchInfo.current.source = validSources[0] ?? 'kw'
        void saveSearchSetting({ source: searchInfo.current.source })
      }
      headerBarRef.current?.setSourceList(validSources, searchInfo.current.source)
      listRef.current?.loadList(searchState.searchText, searchInfo.current.source, type)
    }

    const handleSearchKeyword = (keyword: string) => {
      handleSearch(keyword)
    }

    global.app_event.on('searchTypeChanged', handleTypeChange)
    global.app_event.on('searchKeyword', handleSearchKeyword)

    return () => {
      clearTipTimers()
      global.app_event.off('searchTypeChanged', handleTypeChange)
      global.app_event.off('searchKeyword', handleSearchKeyword)
    }
  }, [clearTipTimers, handleSearch])

  const handleLayout = (e: LayoutChangeEvent) => {
    layoutHeightRef.current = e.nativeEvent.layout.height
  }

  const handleSourceChange: HeaderBarProps['onSourceChange'] = (source) => {
    searchInfo.current.source = source
    void saveSearchSetting({ source })
    listRef.current?.loadList(searchState.searchText, source, searchInfo.current.searchType)
  }

  const handleTipSearch: HeaderBarProps['onTipSearch'] = (text) => {
    if (tipSearchTimeoutRef.current) {
      clearTimeout(tipSearchTimeoutRef.current)
      tipSearchTimeoutRef.current = null
    }
    if (!text) {
      setSearchText('')
      handleHideTipList()
      return
    }
    tipSearchTimeoutRef.current = setTimeout(() => {
      tipSearchTimeoutRef.current = null
      searchTipListRef.current?.search(text, layoutHeightRef.current)
    }, 300)
  }

  const handleShowTipList: HeaderBarProps['onShowTipList'] = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null
      searchTipListRef.current?.show(layoutHeightRef.current)
    }, 200)
  }

  return (
    <View style={styles.container}>
      <HeaderBar
        ref={headerBarRef}
        onSourceChange={handleSourceChange}
        onTipSearch={handleTipSearch}
        onSearch={handleSearch}
        onHideTipList={handleHideTipList}
        onShowTipList={handleShowTipList}
      />
      <View style={styles.content} onLayout={handleLayout}>
        <TipList ref={searchTipListRef} onSearch={handleSearch} />
        <List ref={listRef} onSearch={handleSearch} />
      </View>
    </View>
  )
}

const styles = createStyle({
  container: {
    width: '100%',
    flex: 1,
    backgroundColor: SPOTIFY_COLORS.PRIMARY,
  },
  content: {
    flex: 1,
    overflow: 'hidden',
    zIndex: 1,
  },
})
