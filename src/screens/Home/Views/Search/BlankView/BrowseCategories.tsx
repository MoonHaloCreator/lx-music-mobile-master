import { memo } from 'react'
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { SPOTIFY_COLORS, SPOTIFY_RADIUS, BROWSE_CATEGORIES_COLORS } from '@/theme/spotify'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface BrowseCategoriesProps {
  onSearch: (keyword: string) => void
}

const CATEGORIES = [
  { id: 'pop', title: 'Pop', color: BROWSE_CATEGORIES_COLORS[0], icon: 'music' },
  { id: 'rock', title: 'Rock', color: BROWSE_CATEGORIES_COLORS[10], icon: 'music' },
  { id: 'hiphop', title: 'Hip-Hop', color: BROWSE_CATEGORIES_COLORS[1], icon: 'music' },
  { id: 'indie', title: 'Indie', color: BROWSE_CATEGORIES_COLORS[3], icon: 'music' },
  { id: 'dance', title: 'Dance & EDM', color: BROWSE_CATEGORIES_COLORS[5], icon: 'music' },
  { id: 'chill', title: 'Chill & Relax', color: BROWSE_CATEGORIES_COLORS[14], icon: 'music' },
  { id: 'focus', title: 'Focus & Study', color: BROWSE_CATEGORIES_COLORS[13], icon: 'music' },
  { id: 'gaming', title: 'Gaming', color: BROWSE_CATEGORIES_COLORS[12], icon: 'music' },
  { id: 'anime', title: 'Anime & ACG', color: BROWSE_CATEGORIES_COLORS[15], icon: 'music' },
  { id: 'rnb', title: 'R&B & Soul', color: BROWSE_CATEGORIES_COLORS[8], icon: 'music' },
  { id: 'jazz', title: 'Jazz & Blues', color: BROWSE_CATEGORIES_COLORS[2], icon: 'music' },
  { id: 'classical', title: 'Classical', color: BROWSE_CATEGORIES_COLORS[4], icon: 'music' },
]

export default memo<BrowseCategoriesProps>(({ onSearch }) => {
  const itemWidth = (SCREEN_WIDTH - scaleSizeW(32) - scaleSizeW(12)) / 2

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Browse All</Text>
      <View style={styles.grid}>
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.tile,
              { width: itemWidth, backgroundColor: category.color },
            ]}
            activeOpacity={0.85}
            onPress={() => onSearch(category.title)}
          >
            <Text style={styles.tileText}>{category.title}</Text>
            <View style={styles.iconContainer}>
              <Icon name={category.icon as any} size={28} color="rgba(255,255,255,0.85)" />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    marginTop: scaleSizeH(20),
    marginBottom: scaleSizeH(24),
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
    height: scaleSizeH(84),
    borderRadius: SPOTIFY_RADIUS.M,
    padding: scaleSizeW(12),
    marginBottom: scaleSizeH(12),
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  tileText: {
    color: SPOTIFY_COLORS.WHITE,
    fontSize: 15,
    fontWeight: '800',
    zIndex: 2,
    maxWidth: '75%',
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
