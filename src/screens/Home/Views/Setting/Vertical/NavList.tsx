import { forwardRef, memo, useCallback, useImperativeHandle, useState } from 'react'
import { TouchableOpacity, ScrollView } from 'react-native'

import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { SETTING_SCREENS, type SettingScreenIds } from '../Main'
import { useI18n } from '@/lang'

export interface NavListType {
  setActiveId: (id: SettingScreenIds) => void
}

const ListItem = memo(({ id, activeId, onPress }: {
  onPress: (item: SettingScreenIds) => void
  activeId: string
  id: SettingScreenIds
}) => {
  const theme = useTheme()
  const t = useI18n()

  const active = activeId == id

  const handlePress = () => {
    onPress(id)
  }

  return (
    <TouchableOpacity
      style={{
        ...styles.listItem,
        backgroundColor: active ? theme['c-primary-background-active'] : 'rgba(128,128,128,0.14)',
      }}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text size={14} numberOfLines={1} color={active ? theme['c-primary-font'] : theme['c-font']}>{t(`setting_${id}`)}</Text>
    </TouchableOpacity>
  )
}, (prevProps, nextProps) => {
  return !!(prevProps.id === nextProps.id &&
    prevProps.activeId != nextProps.id &&
    nextProps.activeId != nextProps.id
  )
})


export default forwardRef<NavListType, {
  onChangeId: (id: SettingScreenIds) => void
}>(({ onChangeId }, ref) => {
      const [activeId, setActiveId] = useState(global.lx.settingActiveId)

      useImperativeHandle(ref, () => ({
        setActiveId(id) {
          setActiveId(id)
          global.lx.settingActiveId = id
        },
      }))

      const handleChangeId = useCallback((id: SettingScreenIds) => {
        onChangeId(id)
        setActiveId(id)
        global.lx.settingActiveId = id
      }, [onChangeId])

      return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps={'always'}
    >
      {
        SETTING_SCREENS.map(id => <ListItem key={id} id={id} activeId={activeId} onPress={handleChangeId} />)
      }
    </ScrollView>
      )
    })


const styles = createStyle({
  container: {
    height: 52,
    flexGrow: 0,
    flexShrink: 0,
  },
  contentContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  listItem: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    marginRight: 8,
    marginVertical: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
