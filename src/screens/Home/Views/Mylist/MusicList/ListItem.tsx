import { memo, useRef } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Icon } from '@/components/common/Icon'
import Image from '@/components/common/Image'
import { type RowInfo } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useAssertApiSupport } from '@/store/common/hook'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import Text from '@/components/common/Text'
import Badge from '@/components/common/Badge'
import { LIST_IDS } from '@/config/constant'
import { SPOTIFY_COLORS, SPOTIFY_RADIUS } from '@/theme/spotify'

export const ITEM_HEIGHT = scaleSizeH(64)

export default memo(({ item, index, activeIndex, activeListId, onPress, onShowMenu, onLongPress, selectedList, rowInfo, isShowAlbumName, isShowInterval }: {
  item: LX.Music.MusicInfo
  index: number
  activeIndex: number
  activeListId: string
  onPress: (item: LX.Music.MusicInfo, index: number) => void
  onLongPress: (item: LX.Music.MusicInfo, index: number) => void
  onShowMenu: (item: LX.Music.MusicInfo, index: number, position: { x: number, y: number, w: number, h: number }) => void
  selectedList: LX.Music.MusicInfo[]
  rowInfo: RowInfo
  isShowAlbumName: boolean
  isShowInterval: boolean
}) => {
  const theme = useTheme()
  const isSelected = selectedList.includes(item)
  const isSupported = useAssertApiSupport(item.source)
  const moreButtonRef = useRef<View>(null)

  const handleShowMenu = () => {
    if (moreButtonRef.current?.measure) {
      moreButtonRef.current.measure((fx, fy, width, height, px, py) => {
        onShowMenu(item, index, { x: Math.ceil(px), y: Math.ceil(py), w: Math.ceil(width), h: Math.ceil(height) })
      })
    }
  }
  const active = activeIndex == index
  const singer = `${item.singer}${isShowAlbumName && item.meta.albumName ? ` · ${item.meta.albumName}` : ''}`
  const isLove = activeListId === LIST_IDS.LOVE

  return (
    <View
      style={[
        styles.listItem,
        { width: rowInfo.rowWidth, height: ITEM_HEIGHT, opacity: isSupported ? 1 : 0.5 },
        active && styles.listItemPlaying,
        isSelected && styles.listItemSelected,
      ]}
    >
      {active ? <View style={styles.activeStrip} /> : null}
      <Pressable
        style={({ pressed }) => [
          styles.listItemLeft,
          pressed && styles.rowPressed,
        ]}
        onPress={() => { onPress(item, index) }}
        onLongPress={() => { onLongPress(item, index) }}
      >
        <View style={styles.snWrap}>
          {active
            ? <Icon name="play" size={12} color={SPOTIFY_COLORS.TINT} />
            : <Text style={styles.sn} size={12} color={SPOTIFY_COLORS.LIGHT_GREY}>{index + 1}</Text>}
        </View>

        <Image
          url={item.meta.picUrl}
          musicInfo={item}
          listId={activeListId}
          placeholderType={isLove ? 'love' : 'album'}
          style={styles.coverThumb}
        />

        <View style={styles.itemInfo}>
          <Text
            style={styles.songTitle}
            color={active ? SPOTIFY_COLORS.TINT : SPOTIFY_COLORS.WHITE}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <View style={styles.listItemSingle}>
            <Badge type="tertiary">{item.source.toUpperCase()}</Badge>
            <Text
              style={styles.listItemSingleText}
              size={12}
              color={active ? theme['c-primary-light-200'] : SPOTIFY_COLORS.LIGHT_GREY}
              numberOfLines={1}
            >
              {singer}
            </Text>
          </View>
        </View>

        {isShowInterval ? (
          <Text
            style={styles.intervalText}
            size={12}
            color={active ? SPOTIFY_COLORS.TINT : SPOTIFY_COLORS.LIGHT_GREY}
            numberOfLines={1}
          >
            {item.interval ? item.interval : '--:--'}
          </Text>
        ) : null}
      </Pressable>

      <Pressable
        ref={moreButtonRef}
        onPress={handleShowMenu}
        hitSlop={{ top: 8, bottom: 8, left: 6, right: 8 }}
        style={({ pressed }) => [
          styles.moreButton,
          pressed && styles.morePressed,
        ]}
      >
        <Icon name="dots-vertical" color={SPOTIFY_COLORS.LIGHT_GREY} size={14} />
      </Pressable>
    </View>
  )
}, (prevProps, nextProps) => {
  return !!(prevProps.item === nextProps.item &&
    prevProps.index === nextProps.index &&
    prevProps.activeListId === nextProps.activeListId &&
    prevProps.isShowAlbumName === nextProps.isShowAlbumName &&
    prevProps.isShowInterval === nextProps.isShowInterval &&
    prevProps.item.meta?.picUrl === nextProps.item.meta?.picUrl &&
    prevProps.activeIndex != nextProps.index &&
    nextProps.activeIndex != nextProps.index &&
    nextProps.selectedList.includes(nextProps.item) == prevProps.selectedList.includes(nextProps.item)
  )
})

const styles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    paddingLeft: scaleSizeW(4),
    paddingRight: scaleSizeW(4),
    position: 'relative',
  },
  listItemPlaying: {
    backgroundColor: 'rgba(30, 215, 96, 0.10)',
  },
  listItemSelected: {
    backgroundColor: 'rgba(30, 215, 96, 0.18)',
  },
  activeStrip: {
    position: 'absolute',
    left: 0,
    top: scaleSizeH(10),
    bottom: scaleSizeH(10),
    width: 3,
    borderRadius: 2,
    backgroundColor: SPOTIFY_COLORS.TINT,
  },
  listItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    borderRadius: SPOTIFY_RADIUS.S,
    paddingHorizontal: scaleSizeW(4),
  },
  rowPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  snWrap: {
    width: scaleSizeW(28),
    alignItems: 'center',
    justifyContent: 'center',
  },
  sn: {
    textAlign: 'center',
    fontWeight: '600',
  },
  coverThumb: {
    width: scaleSizeW(44),
    height: scaleSizeW(44),
    borderRadius: SPOTIFY_RADIUS.XS,
    marginRight: scaleSizeW(12),
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: scaleSizeW(8),
  },
  songTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  listItemSingle: {
    paddingTop: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemSingleText: {
    flexShrink: 1,
    fontWeight: '400',
  },
  intervalText: {
    minWidth: scaleSizeW(38),
    textAlign: 'right',
    fontWeight: '500',
    marginRight: scaleSizeW(2),
  },
  moreButton: {
    width: scaleSizeW(38),
    height: scaleSizeH(44),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: SPOTIFY_RADIUS.ROUND,
  },
  morePressed: {
    backgroundColor: SPOTIFY_COLORS.CARD_PRESS,
  },
})
