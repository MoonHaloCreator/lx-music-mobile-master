import { memo } from 'react'
import {
  Dimensions,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { SPOTIFY_COLORS, SPOTIFY_RADIUS, BROWSE_CATEGORIES_COLORS } from '@/theme/spotify'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { useI18n } from '@/lang'
import { useWindowSize } from '@/utils/hooks'

interface BrowseCategoriesProps {
  onSearch: (keyword: string) => void
}

const CATEGORIES = [
  { id: 'pop', title: 'Pop', color: BROWSE_CATEGORIES_COLORS[0], icon: 'album' },
  { id: 'rock', title: 'Rock', color: BROWSE_CATEGORIES_COLORS[10], icon: 'album' },
  { id: 'hiphop', title: 'Hip-Hop', color: BROWSE_CATEGORIES_COLORS[1], icon: 'album' },
  { id: 'indie', title: 'Indie', color: BROWSE_CATEGORIES_COLORS[3], icon: 'album' },
  { id: 'dance', title: 'Dance & EDM', color: BROWSE_CATEGORIES_COLORS[5], icon: 'album' },
  { id: 'chill', title: 'Chill & Relax', color: BROWSE_CATEGORIES_COLORS[14], icon: 'album' },
  { id: 'focus', title: 'Focus & Study', color: BROWSE_CATEGORIES_COLORS[13], icon: 'album' },
  { id: 'gaming', title: 'Gaming', color: BROWSE_CATEGORIES_COLORS[12], icon: 'album' },
  { id: 'anime', title: 'Anime & ACG', color: BROWSE_CATEGORIES_COLORS[15], icon: 'album' },
  { id: 'rnb', title: 'R&B & Soul', color: BROWSE_CATEGORIES_COLORS[8], icon: 'album' },
  { id: 'jazz', title: 'Jazz & Blues', color: BROWSE_CATEGORIES_COLORS[2], icon: 'album' },
  { id: 'classical', title: 'Classical', color: BROWSE_CATEGORIES_COLORS[4], icon: 'album' },
]

export default memo<BrowseCategoriesProps>(({ onSearch }) => {
  const t = useI18n()
  const windowSize = useWindowSize()
  const screenWidth = windowSize.width || Dimensions.get('window').width
  const cols = screenWidth >= 900 ? 4 : screenWidth >= 600 ? 3 : 2
  const horizontalPad = scaleSizeW(30)
  const gap = scaleSizeW(12)
  const itemWidth = Math.floor((screenWidth - horizontalPad - gap * (cols - 1)) / cols)

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('spotify_browse_all')}</Text>
      <View style={styles.grid}>
        {CATEGORIES.map((category) => (
          <Pressable
            key={category.id}
            style={({ pressed }) => [
              styles.tile,
              { width: itemWidth, backgroundColor: category.color },
              pressed && styles.tilePressed,
            ]}
            onPress={() => { onSearch(category.title) }}
          >
            <Text style={styles.tileText} numberOfLines={2}>{category.title}</Text>
            <View style={styles.iconContainer}>
              <Icon name={category.icon} size={30} color="rgba(255,255,255,0.85)" />
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    marginTop: scaleSizeH(18),
    marginBottom: scaleSizeH(76),
  },
  sectionTitle: {
    color: SPOTIFY_COLORS.WHITE,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: scaleSizeH(14),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tile: {
    height: scaleSizeH(88),
    borderRadius: SPOTIFY_RADIUS.M,
    padding: scaleSizeW(12),
    marginBottom: scaleSizeH(12),
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  tilePressed: {
    opacity: 0.84,
    transform: [{ scale: 0.97 }],
  },
  tileText: {
    color: SPOTIFY_COLORS.WHITE,
    fontSize: 15,
    fontWeight: '800',
    zIndex: 2,
    maxWidth: '78%',
  },
  iconContainer: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    transform: [{ rotate: '25deg' }],
    zIndex: 1,
    opacity: 0.9,
  },
})
