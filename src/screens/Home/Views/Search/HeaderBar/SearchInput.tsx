import { useCallback, useRef, forwardRef, useImperativeHandle, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { SPOTIFY_COLORS, SPOTIFY_RADIUS } from '@/theme/spotify'
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/pixelRatio'
import { useI18n } from '@/lang'

export interface SearchInputProps {
  onChangeText: (text: string) => void
  onSubmit: (text: string) => void
  onBlur: () => void
  onTouchStart: () => void
}

export interface SearchInputType {
  setText: (text: string) => void
  focus: () => void
  blur: () => void
}

export default forwardRef<SearchInputType, SearchInputProps>(({ onChangeText, onSubmit, onBlur, onTouchStart }, ref) => {
  const t = useI18n()
  const [text, setText] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<TextInput>(null)

  useImperativeHandle(ref, () => ({
    setText(nextText) {
      setText(nextText)
    },
    focus() {
      inputRef.current?.focus()
    },
    blur() {
      inputRef.current?.blur()
    },
  }))

  const handleChangeText = (value: string) => {
    setText(value)
    onChangeText(value.trim())
  }

  const handleClearText = useCallback(() => {
    setText('')
    inputRef.current?.clear()
    onChangeText('')
    onSubmit('')
  }, [onChangeText, onSubmit])

  const handleSubmit = useCallback<NonNullable<TextInputProps['onSubmitEditing']>>(({ nativeEvent: { text: submitted } }) => {
    onSubmit(submitted)
  }, [onSubmit])

  const handleFocus = useCallback(() => {
    setIsFocused(true)
    onTouchStart()
  }, [onTouchStart])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    onBlur()
  }, [onBlur])

  const focusInput = useCallback(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <View
      style={[
        styles.container,
        isFocused && styles.containerFocused,
      ]}
    >
      <Pressable
        style={styles.searchIconBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 6 }}
        onPress={focusInput}
      >
        <Icon
          name="search-2"
          size={17}
          color={isFocused ? SPOTIFY_COLORS.TINT : SPOTIFY_COLORS.LIGHT_GREY}
        />
      </Pressable>

      <TextInput
        ref={inputRef}
        value={text}
        placeholder={t('spotify_search_placeholder')}
        placeholderTextColor={SPOTIFY_COLORS.LIGHT_GREY}
        selectionColor={SPOTIFY_COLORS.TINT}
        autoCapitalize="none"
        autoComplete="off"
        returnKeyType="search"
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSubmitEditing={handleSubmit}
        style={styles.input}
      />

      {text.length > 0 && (
        <Pressable
          style={({ pressed }) => [
            styles.clearBtn,
            pressed && styles.clearBtnPressed,
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={handleClearText}
        >
          <View style={styles.clearIconCircle}>
            <Icon name="remove" size={10} color={SPOTIFY_COLORS.WHITE} />
          </View>
        </Pressable>
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: scaleSizeH(44),
    backgroundColor: SPOTIFY_COLORS.INPUT_BG,
    borderRadius: SPOTIFY_RADIUS.M,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: scaleSizeW(10),
  },
  containerFocused: {
    backgroundColor: SPOTIFY_COLORS.INPUT_FOCUS_BG,
    borderColor: SPOTIFY_COLORS.TINT,
  },
  searchIconBtn: {
    width: scaleSizeW(28),
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleSizeW(4),
  },
  input: {
    flex: 1,
    height: '100%',
    color: SPOTIFY_COLORS.WHITE,
    fontSize: setSpText(14),
    paddingVertical: 0,
    paddingHorizontal: scaleSizeW(4),
  },
  clearBtn: {
    width: scaleSizeW(34),
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scaleSizeW(4),
  },
  clearBtnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.92 }],
  },
  clearIconCircle: {
    width: scaleSizeW(22),
    height: scaleSizeW(22),
    borderRadius: scaleSizeW(11),
    backgroundColor: SPOTIFY_COLORS.CARD_PRESS,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
