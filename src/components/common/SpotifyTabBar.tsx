import { memo } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { useNavActiveId } from '@/store/common/hook'
import { setNavActiveId } from '@/core/common'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { SPOTIFY_COLORS } from '@/theme/spotify'
import { scaleSizeH } from '@/utils/pixelRatio'

export type SpotifyTabType = 'home' | 'search' | 'library'

export default memo(() => {
  const activeNavId = useNavActiveId()

  const isHome = activeNavId === 'nav_songlist' || activeNavId === 'nav_top'
  const isSearch = activeNavId === 'nav_search'
  const isLibrary = activeNavId === 'nav_love' || activeNavId === 'nav_mylist'

  const handleTabPress = (type: SpotifyTabType) => {
    switch (type) {
      case 'home':
        setNavActiveId('nav_songlist')
        break
      case 'search':
        setNavActiveId('nav_search')
        break
      case 'library':
        setNavActiveId('nav_love')
        break
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.tabItem}
        activeOpacity={0.7}
        onPress={() => handleTabPress('home')}
      >
        <Icon
          name={isHome ? 'home' : 'home'}
          size={22}
          color={isHome ? SPOTIFY_COLORS.WHITE : SPOTIFY_COLORS.LIGHT_GREY}
        />
        <Text
          size={10}
          style={[styles.tabLabel, { color: isHome ? SPOTIFY_COLORS.WHITE : SPOTIFY_COLORS.LIGHT_GREY }]}
        >
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        activeOpacity={0.7}
        onPress={() => handleTabPress('search')}
      >
        <Icon
          name="search"
          size={22}
          color={isSearch ? SPOTIFY_COLORS.WHITE : SPOTIFY_COLORS.LIGHT_GREY}
        />
        <Text
          size={10}
          style={[styles.tabLabel, { color: isSearch ? SPOTIFY_COLORS.WHITE : SPOTIFY_COLORS.LIGHT_GREY }]}
        >
          Search
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        activeOpacity={0.7}
        onPress={() => handleTabPress('library')}
      >
        <Icon
          name="my-list"
          size={22}
          color={isLibrary ? SPOTIFY_COLORS.WHITE : SPOTIFY_COLORS.LIGHT_GREY}
        />
        <Text
          size={10}
          style={[styles.tabLabel, { color: isLibrary ? SPOTIFY_COLORS.WHITE : SPOTIFY_COLORS.LIGHT_GREY }]}
        >
          Your Library
        </Text>
      </TouchableOpacity>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: scaleSizeH(52),
    backgroundColor: SPOTIFY_COLORS.NAV,
    borderTopWidth: 1,
    borderTopColor: SPOTIFY_COLORS.DIVIDER,
    paddingBottom: 2,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabLabel: {
    marginTop: 2,
    fontWeight: '600',
  },
})
