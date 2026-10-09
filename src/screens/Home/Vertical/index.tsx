import { View, StyleSheet } from 'react-native'
import Content from './Content'
import PlayerBar from '@/components/player/PlayerBar'
import SpotifyTabBar from '@/components/common/SpotifyTabBar'
import { SPOTIFY_COLORS } from '@/theme/spotify'

export default () => {
  return (
    <View style={styles.container}>
      <Content />
      <PlayerBar isHome />
      <SpotifyTabBar />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SPOTIFY_COLORS.PRIMARY,
  },
})
