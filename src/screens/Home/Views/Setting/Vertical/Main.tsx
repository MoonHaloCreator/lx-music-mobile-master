import { memo, useCallback, useRef } from 'react'
import { FlatList, View, type FlatListProps } from 'react-native'

import Basic from '../settings/Basic'
import Player from '../settings/Player'
import LyricDesktop from '../settings/LyricDesktop'
import Search from '../settings/Search'
import List from '../settings/List'
import Backup from '../settings/Backup'
import Other from '../settings/Other'
import Version from '../settings/Version'
import About from '../settings/About'
import { createStyle } from '@/utils/tools'
import { SETTING_SCREENS, type SettingScreenIds } from '../Main'
import NavList, { type NavListType } from './NavList'

type FlatListType = FlatListProps<SettingScreenIds>


const styles = createStyle({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    flex: 0,
  },
})

const ListItem = memo(({
  id,
}: { id: SettingScreenIds }) => {
  switch (id) {
    case 'player': return <Player />
    case 'lyric_desktop': return <LyricDesktop />
    case 'search': return <Search />
    case 'list': return <List />
    case 'backup': return <Backup />
    case 'other': return <Other />
    case 'version': return <Version />
    case 'about': return <About />
    case 'basic': return <Basic />
  }
}, () => true)

export default () => {
  const listRef = useRef<FlatList<SettingScreenIds>>(null)
  const navRef = useRef<NavListType>(null)
  const retryCountRef = useRef(0)

  const handleChangeId = useCallback((id: SettingScreenIds) => {
    retryCountRef.current = 0
    const index = SETTING_SCREENS.indexOf(id)
    if (index >= 0) {
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0 })
    }
  }, [])

  const handleScrollToIndexFailed = useCallback<NonNullable<FlatListType['onScrollToIndexFailed']>>(info => {
    retryCountRef.current += 1
    if (retryCountRef.current > 3) return
    listRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false })
    setTimeout(() => {
      listRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0 })
    }, 120)
  }, [])

  const onViewableItemsChangedRef = useRef<NonNullable<FlatListType['onViewableItemsChanged']>>(({ viewableItems }) => {
    if (viewableItems.length > 0 && viewableItems[0].item) {
      navRef.current?.setActiveId(viewableItems[0].item as SettingScreenIds)
    }
  })

  const viewabilityConfigRef = useRef({ itemVisiblePercentThreshold: 10 })

  const renderItem: FlatListType['renderItem'] = ({ item }) => <ListItem id={item} />
  const getkey: FlatListType['keyExtractor'] = item => item

  return (
    <View style={styles.container}>
      <NavList ref={navRef} onChangeId={handleChangeId} />
      <FlatList
        ref={listRef}
        data={SETTING_SCREENS}
        keyboardShouldPersistTaps={'always'}
        renderItem={renderItem}
        keyExtractor={getkey}
        contentContainerStyle={styles.content}
        maxToRenderPerBatch={2}
        windowSize={5}
        initialNumToRender={2}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        onViewableItemsChanged={onViewableItemsChangedRef.current}
        viewabilityConfig={viewabilityConfigRef.current}
      />
    </View>
  )
}
