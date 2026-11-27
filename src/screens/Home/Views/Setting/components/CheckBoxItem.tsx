import { memo, useCallback } from 'react'
import { Switch, TouchableOpacity, View } from 'react-native'

import { type CheckBoxProps } from '@/components/common/CheckBox'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { createStyle, tipDialog } from '@/utils/tools'


export default memo(({
  check,
  label,
  children,
  onChange,
  disabled = false,
  need = false,
  helpTitle,
  helpDesc,
}: CheckBoxProps) => {
  const theme = useTheme()
  const isLocked = disabled || (need && check)

  const handlePress = useCallback(() => {
    if (isLocked) return
    onChange(!check)
  }, [isLocked, onChange, check])

  const handleShowHelp = useCallback(() => {
    void tipDialog({
      title: helpTitle ?? '',
      message: helpDesc,
      btnText: global.i18n.t('understand'),
    })
  }, [helpTitle, helpDesc])

  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={isLocked ? 1 : 0.7}
      disabled={isLocked}
      onPress={handlePress}
    >
      <View style={styles.labelContainer}>
        {
          label
            ? <Text style={styles.label} color={disabled ? theme['c-500'] : theme['c-font']} size={15}>{label}</Text>
            : children
        }
        {
          (helpTitle ?? helpDesc)
            ? (
                <TouchableOpacity style={styles.helpBtn} onPress={handleShowHelp}>
                  <Icon size={15} name="help" color={theme['c-font-label']} />
                </TouchableOpacity>
              )
            : null
        }
      </View>
      <Switch
        value={check}
        disabled={isLocked}
        trackColor={{ false: 'rgba(128,128,128,0.35)', true: theme['c-primary-alpha-300'] }}
        thumbColor={check ? theme['c-primary'] : '#f4f3f4'}
        onValueChange={value => { onChange(value) }}
      />
    </TouchableOpacity>
  )
})

const styles = createStyle({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingVertical: 6,
  },
  labelContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  label: {
    flexShrink: 1,
  },
  helpBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
})

