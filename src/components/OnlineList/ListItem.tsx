import { memo, useRef } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Text from '@/components/common/Text'
import Badge, { type BadgeType } from '@/components/common/Badge'
import Image from '@/components/common/Image'
import { Icon } from '@/components/common/Icon'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { SPOTIFY_COLORS, SPOTIFY_RADIUS } from '@/theme/spotify'
import { type RowInfo } from '@/utils/tools'

export const ITEM_HEIGHT = scaleSizeH(64)

const useQualityTag = (musicInfo: LX.Music.MusicInfoOnline) => {
  const t = useI18n()
  let info: { type: BadgeType | null, text: string } = { type: null, text: '' }
  if (musicInfo.meta._qualitys.flac24bit) {
    info.type = 'secondary'
    info.text = t('quality_lossless_24bit')
  } else if (musicInfo.meta._qualitys.flac ?? musicInfo.meta._qualitys.ape) {
    info.type = 'secondary'
    info.text = t('quality_lossless')
  } else if (musicInfo.meta._qualitys['320k']) {
    info.type = 'tertiary'
    info.text = t('quality_high_quality')
  }

  return info
}

export default memo(({ item, index, isPlaying, showSource, onPress, onLongPress, onShowMenu, selectedList, rowInfo, isShowAlbumName, isShowInterval }: {
  item: LX.Music.MusicInfoOnline
  index: number
  isPlaying?: boolean
  showSource?: boolean
  onPress: (item: LX.Music.MusicInfoOnline, index: number) => void
  onLongPress: (item: LX.Music.MusicInfoOnline, index: number) => void
  onShowMenu: (item: LX.Music.MusicInfoOnline, index: number, position: { x: number, y: number, w: number, h: number }) => void
  selectedList: LX.Music.MusicInfoOnline[]
  rowInfo: RowInfo
  isShowAlbumName: boolean
  isShowInterval: boolean
}) => {
  const theme = useTheme()
  const isSelected = selectedList.includes(item)
  const moreButtonRef = useRef<View>(null)

  const handleShowMenu = () => {
    if (moreButtonRef.current?.measure) {
      moreButtonRef.current.measure((fx, fy, width, height, px, py) => {
        onShowMenu(item, index, { x: Math.ceil(px), y: Math.ceil(py), w: Math.ceil(width), h: Math.ceil(height) })
      })
    }
  }
  const tagInfo = useQualityTag(item)
  const singer = `${item.singer}${isShowAlbumName && item.meta.albumName ? ` · ${item.meta.albumName}` : ''}`

  return (
    <View
      style={[
        styles.listItem,
        { width: rowInfo.rowWidth, height: ITEM_HEIGHT },
        isPlaying && styles.listItemPlaying,
        isSelected && styles.listItemSelected,
      ]}
    >
      {isPlaying ? <View style={styles.activeStrip} /> : null}
      <Pressable
        style={({ pressed }) => [
          styles.listItemLeft,
          pressed && styles.rowPressed,
        ]}
        onPress={() => { onPress(item, index) }}
        onLongPress={() => { onLongPress(item, index) }}
      >
        <View style={styles.snWrap}>
          {isPlaying
            ? <Icon name="play" size={12} color={SPOTIFY_COLORS.TINT} />
            : <Text style={styles.sn} size={12} color={SPOTIFY_COLORS.LIGHT_GREY}>{index + 1}</Text>}
        </View>

        <Image
          url={item.meta.picUrl}
          musicInfo={item}
          placeholderType="album"
          style={styles.coverThumb}
        />

        <View style={styles.itemInfo}>
          <Text
            style={styles.songTitle}
            color={isPlaying ? SPOTIFY_COLORS.TINT : SPOTIFY_COLORS.WHITE}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <View style={styles.listItemSingle}>
            {tagInfo.type ? <Badge type={tagInfo.type}>{tagInfo.text}</Badge> : null}
            {showSource ? <Badge type="tertiary">{item.source}</Badge> : null}
            <Text
              style={styles.listItemSingleText}
              size={12}
              color={isPlaying ? theme['c-primary-light-200'] : SPOTIFY_COLORS.LIGHT_GREY}
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
            color={isPlaying ? SPOTIFY_COLORS.TINT : SPOTIFY_COLORS.LIGHT_GREY}
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
    prevProps.isPlaying === nextProps.isPlaying &&
    prevProps.showSource === nextProps.showSource &&
    prevProps.isShowAlbumName === nextProps.isShowAlbumName &&
    prevProps.isShowInterval === nextProps.isShowInterval &&
    prevProps.item.meta?.picUrl === nextProps.item.meta?.picUrl &&
    nextProps.selectedList.includes(nextProps.item) === prevProps.selectedList.includes(nextProps.item)
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
