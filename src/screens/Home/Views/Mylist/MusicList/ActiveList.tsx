import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'

import { Icon } from '@/components/common/Icon'
import { useActiveListId, useListFetching } from '@/store/list/hook'
import listState from '@/store/list/state'
import { createStyle } from '@/utils/tools'
import { getListPrevSelectId } from '@/utils/data'
import { setActiveList } from '@/core/list'
import Text from '@/components/common/Text'
import { LIST_IDS } from '@/config/constant'
import Loading from '@/components/common/Loading'
import { useSettingValue } from '@/store/setting/hook'
import { SPOTIFY_COLORS, SPOTIFY_RADIUS } from '@/theme/spotify'

export interface ActiveListProps {
  onShowSearchBar: () => void
  onScrollToTop: () => void
}
export interface ActiveListType {
  setVisibleBar: (visible: boolean) => void
}

export default forwardRef<ActiveListType, ActiveListProps>(({ onShowSearchBar, onScrollToTop }, ref) => {
  const currentListId = useActiveListId()
  const fetching = useListFetching(currentListId)
  const langId = useSettingValue('common.langId')
  const currentListName = useMemo(() => {
    switch (currentListId) {
      case LIST_IDS.TEMP:
        return global.i18n.t('list_name_temp')
      case LIST_IDS.DEFAULT:
        return global.i18n.t('list_name_default')
      case LIST_IDS.LOVE:
        return global.i18n.t('list_name_love')
      default:
        return listState.allList.find(l => l.id === currentListId)?.name ?? ''
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentListId, langId])
  const [visibleBar, setVisibleBar] = useState(true)

  useImperativeHandle(ref, () => ({
    setVisibleBar(visible) {
      setVisibleBar(visible)
    },
  }))

  const showList = () => {
    global.app_event.changeLoveListVisible(true)
  }

  useEffect(() => {
    if (listState.activeListId) return
    void getListPrevSelectId().then((id) => {
      if (!listState.activeListId) setActiveList(id)
    })
  }, [])

  return (
    <View style={[styles.currentList, { opacity: visibleBar ? 1 : 0 }]}>
      <Pressable
        onPress={showList}
        onLongPress={onScrollToTop}
        style={({ pressed }) => [styles.currentListLeft, pressed && styles.pressed]}
      >
        <Icon style={styles.currentListIcon} color={SPOTIFY_COLORS.TINT} name="album" size={14} />
        {fetching ? <Loading color={SPOTIFY_COLORS.TINT} style={styles.loading} /> : null}
        <Text style={styles.currentListText} numberOfLines={1} color={SPOTIFY_COLORS.WHITE}>{currentListName}</Text>
        <Icon color={SPOTIFY_COLORS.LIGHT_GREY} name="chevron-right" size={11} />
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.currentListBtns, pressed && styles.pressed]}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        onPress={onShowSearchBar}
      >
        <Icon color={SPOTIFY_COLORS.WHITE} name="search-2" size={16} />
      </Pressable>
    </View>
  )
})


const styles = createStyle({
  currentList: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    height: 40,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SPOTIFY_COLORS.PRIMARY,
    borderBottomWidth: 1,
    borderBottomColor: SPOTIFY_COLORS.DIVIDER,
  },
  currentListLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    paddingHorizontal: 8,
    borderRadius: SPOTIFY_RADIUS.S,
  },
  pressed: {
    backgroundColor: SPOTIFY_COLORS.CARD,
  },
  currentListIcon: {
    marginRight: 8,
  },
  currentListText: {
    flex: 1,
    paddingRight: 8,
    fontWeight: '700',
    fontSize: 13,
  },
  loading: {
    marginRight: 5,
  },
  currentListBtns: {
    width: 38,
    height: 32,
    borderRadius: SPOTIFY_RADIUS.ROUND,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
})
