import { useRef, useState, useCallback, useMemo, forwardRef, useImperativeHandle, useEffect, type Ref } from 'react'
import { StyleSheet, View, Animated, Pressable } from 'react-native'
// import PropTypes from 'prop-types'
// import { AppColors } from '@/theme'
import { SPOTIFY_COLORS, SPOTIFY_RADIUS } from '@/theme/spotify'
import List, { type ItemT, type ListProps, type ListType } from './List'
// import InsetShadow from 'react-native-inset-shadow'

export interface SearchTipListProps<T> extends ListProps<T> {
  onPressBg?: () => void
}
export interface SearchTipListType<T> {
  setList: (list: T[]) => void
  setHeight: (height: number) => void
}

const noop = () => {}

const Component = <T extends ItemT<T>>({ onPressBg = noop, ...props }: SearchTipListProps<T>, ref: Ref<SearchTipListType<T>>) => {
  const translateY = useRef(new Animated.Value(0)).current
  const scaleY = useRef(new Animated.Value(0)).current
  const [visible, setVisible] = useState(false)
  const [animatePlayed, setAnimatPlayed] = useState(true)
  const listRef = useRef<ListType<T>>(null)
  const prevListRef = useRef<T[]>([])
  const heightRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const isShowingRef = useRef(false)

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [])

  const handleShow = useCallback(() => {
    if (!heightRef.current) return
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    isShowingRef.current = true
    setVisible(true)
    setAnimatPlayed(false)
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      if (!isShowingRef.current) return
      translateY.setValue(-heightRef.current / 2)
      scaleY.setValue(0)

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(scaleY, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setAnimatPlayed(true)
      })
    })
  }, [translateY, scaleY])

  const handleHide = useCallback(() => {
    isShowingRef.current = false
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    setAnimatPlayed(false)
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -heightRef.current / 2,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(scaleY, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false)
      setAnimatPlayed(true)
    })
  }, [translateY, scaleY])

  useImperativeHandle(ref, () => ({
    setList(list) {
      if (prevListRef.current.length) {
        if (!list.length) handleHide()
      } else if (list.length) {
        handleShow()
      } else {
        isShowingRef.current = false
        setVisible(false)
        setAnimatPlayed(true)
      }
      prevListRef.current = list
      requestAnimationFrame(() => {
        listRef.current?.setList(list)
      })
    },
    setHeight(height) {
      heightRef.current = height
    },
  }), [handleHide, handleShow])

  const component = useMemo(() => (
    <Animated.View
      pointerEvents={visible ? 'box-none' : 'none'}
      style={{
        ...styles.anima,
        transform: [
          { translateY },
          { scaleY },
        ],
      }}>
      <View style={styles.container}>
        <List ref={listRef} {...props} />
      </View>
      <Pressable style={styles.blank} onPress={onPressBg} />
    </Animated.View>
  ), [onPressBg, props, scaleY, translateY, visible])

  return !visible && animatePlayed ? null : component
}

export default forwardRef(Component) as
  <T,>(p: SearchTipListProps<T> & { ref?: Ref<SearchTipListType<T>> }) => JSX.Element | null

const styles = StyleSheet.create({
  anima: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    width: '100%',
    zIndex: 10,
  },
  container: {
    flex: 0,
    backgroundColor: SPOTIFY_COLORS.SURFACE_ELEVATED,
    borderBottomLeftRadius: SPOTIFY_RADIUS.L,
    borderBottomRightRadius: SPOTIFY_RADIUS.L,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    elevation: 6,
    maxHeight: '75%',
    overflow: 'hidden',
  },
  blank: {
    flex: 1,
    flexGrow: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
})
