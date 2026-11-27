import { memo, useCallback, useState } from 'react'
import { View } from 'react-native'

import SubTitle from '../../components/SubTitle'
import Slider, { type SliderProps } from '../../components/Slider'
import Button from '../../components/Button'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { setDesktopLyricPosition } from '@/core/desktopLyric'
import { updateSetting } from '@/core/common'

export default memo(() => {
  const t = useI18n()
  const theme = useTheme()
  const width = useSettingValue('desktopLyric.width')
  const posX = useSettingValue('desktopLyric.position.x')
  const posY = useSettingValue('desktopLyric.position.y')

  const maxX = Math.max(0, 100 - width)
  const clampedX = Math.min(Math.max(0, posX), maxX)
  const clampedY = Math.min(Math.max(0, posY), 100)

  const [sliderX, setSliderX] = useState(clampedX)
  const [isSlidingX, setSlidingX] = useState(false)
  const [sliderY, setSliderY] = useState(clampedY)
  const [isSlidingY, setSlidingY] = useState(false)

  const applyPosition = useCallback((x: number, y: number) => {
    void setDesktopLyricPosition(x, y).then(pos => {
      updateSetting({
        'desktopLyric.position.x': pos?.x ?? x,
        'desktopLyric.position.y': pos?.y ?? y,
      })
    })
  }, [])

  const handleSlidingStartX = useCallback<NonNullable<SliderProps['onSlidingStart']>>(() => {
    setSlidingX(true)
  }, [])
  const handleValueChangeX = useCallback<NonNullable<SliderProps['onValueChange']>>(value => {
    setSliderX(value)
  }, [])
  const handleSlidingCompleteX = useCallback<NonNullable<SliderProps['onSlidingComplete']>>(value => {
    setSlidingX(false)
    if (clampedX == value) return
    applyPosition(value, clampedY)
  }, [applyPosition, clampedX, clampedY])

  const handleSlidingStartY = useCallback<NonNullable<SliderProps['onSlidingStart']>>(() => {
    setSlidingY(true)
  }, [])
  const handleValueChangeY = useCallback<NonNullable<SliderProps['onValueChange']>>(value => {
    setSliderY(value)
  }, [])
  const handleSlidingCompleteY = useCallback<NonNullable<SliderProps['onSlidingComplete']>>(value => {
    setSlidingY(false)
    if (clampedY == value) return
    applyPosition(clampedX, value)
  }, [applyPosition, clampedX, clampedY])

  const centerX = (100 - width) / 2

  return (
    <SubTitle title={t('setting_lyric_desktop_position')}>
      <View style={styles.sliderRow}>
        <Text size={13} style={styles.label}>{t('setting_lyric_desktop_position_x')}</Text>
        <Text size={13} color={theme['c-primary-font']} style={styles.value}>
          {`${Math.round(isSlidingX ? sliderX : clampedX)}%`}
        </Text>
        <Slider
          minimumValue={0}
          maximumValue={maxX}
          step={1}
          disabled={width >= 100}
          value={clampedX}
          onSlidingStart={handleSlidingStartX}
          onValueChange={handleValueChangeX}
          onSlidingComplete={handleSlidingCompleteX}
        />
      </View>
      <View style={styles.sliderRow}>
        <Text size={13} style={styles.label}>{t('setting_lyric_desktop_position_y')}</Text>
        <Text size={13} color={theme['c-primary-font']} style={styles.value}>
          {`${Math.round(isSlidingY ? sliderY : clampedY)}%`}
        </Text>
        <Slider
          minimumValue={0}
          maximumValue={100}
          step={1}
          value={clampedY}
          onSlidingStart={handleSlidingStartY}
          onValueChange={handleValueChangeY}
          onSlidingComplete={handleSlidingCompleteY}
        />
      </View>
      <View style={styles.presets}>
        <Button onPress={() => { applyPosition(centerX, 8) }}>{t('setting_lyric_desktop_position_top')}</Button>
        <Button onPress={() => { applyPosition(centerX, 40) }}>{t('setting_lyric_desktop_position_center')}</Button>
        <Button onPress={() => { applyPosition(centerX, 85) }}>{t('setting_lyric_desktop_position_bottom')}</Button>
        <Button onPress={() => { applyPosition(centerX, 25) }}>{t('setting_lyric_desktop_position_reset')}</Button>
      </View>
      <Text size={12} color={theme['c-font-label']} style={styles.tip}>
        {t('setting_lyric_desktop_position_tip')}
      </Text>
    </SubTitle>
  )
})

const styles = createStyle({
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    minWidth: 58,
    marginRight: 6,
  },
  value: {
    minWidth: 38,
    marginRight: 4,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  tip: {
    marginTop: 4,
    lineHeight: 18,
  },
})
