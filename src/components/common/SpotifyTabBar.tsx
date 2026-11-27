import { memo } from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { useNavActiveId } from '@/store/common/hook'
import { setNavActiveId } from '@/core/common'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { SPOTIFY_COLORS, SPOTIFY_RADIUS } from '@/theme/spotify'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { useI18n } from '@/lang'

export type SpotifyTabType = 'home' | 'search' | 'library'

export default memo(() => {
  const activeNavId = useNavActiveId()
  const t = useI18n()

  const isHome = activeNavId === 'nav_songlist' || activeNavId === 'nav_top'
  const isSearch = activeNavId === 'nav_search'
  const isLibrary = activeNavId === 'nav_love'

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

  const tabs: Array<{ key: SpotifyTabType, active: boolean, icon: string, label: string }> = [
    { key: 'home', active: isHome, icon: 'home', label: t('spotify_tab_home') },
    { key: 'search', active: isSearch, icon: 'search-2', label: t('spotify_tab_search') },
    { key: 'library', active: isLibrary, icon: 'album', label: t('spotify_tab_library') },
  ]

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <Pressable
          key={tab.key}
          style={({ pressed }) => [
            styles.tabItem,
            pressed && styles.tabItemPressed,
          ]}
          onPress={() => { handleTabPress(tab.key) }}
        >
          <View style={[styles.activeIndicator, tab.active && styles.activeIndicatorVisible]} />
          <Icon
            name={tab.icon}
            size={21}
            color={tab.active ? SPOTIFY_COLORS.TINT : SPOTIFY_COLORS.LIGHT_GREY}
          />
          <Text
            size={10}
            style={[
              styles.tabLabel,
              { color: tab.active ? SPOTIFY_COLORS.TINT : SPOTIFY_COLORS.LIGHT_GREY },
            ]}
          >
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: scaleSizeH(54),
    backgroundColor: SPOTIFY_COLORS.NAV_BAR,
    borderTopWidth: 1,
    borderTopColor: SPOTIFY_COLORS.DIVIDER,
    paddingBottom: 2,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
  },
  tabItemPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: scaleSizeW(24),
    height: 2.5,
    borderRadius: SPOTIFY_RADIUS.ROUND,
    backgroundColor: 'transparent',
  },
  activeIndicatorVisible: {
    backgroundColor: SPOTIFY_COLORS.TINT,
  },
  tabLabel: {
    marginTop: 3,
    fontWeight: '700',
  },
})
