import { useRef } from 'react'
import { ScrollView, View } from 'react-native'
import NavList from './NavList'
import Main, { type MainType } from '../Main'
import { createStyle } from '@/utils/tools'
import { BorderWidths } from '@/theme'
import { useTheme } from '@/store/theme/hook'

const styles = createStyle({
  container: {
    flex: 1,
    flexDirection: 'row',
    borderTopWidth: BorderWidths.normal,
  },
  nav: {
    height: '100%',
    width: '24%',
    borderRightWidth: BorderWidths.normal,
  },
  main: {
    padding: 20,
    paddingBottom: 40,
    flex: 0,
  },
})

export default () => {
  const theme = useTheme()
  const mainRef = useRef<MainType>(null)

  return (
    <View style={{ ...styles.container, borderTopColor: theme['c-border-background'] }}>
      <View style={{ ...styles.nav, borderRightColor: theme['c-border-background'] }}>
        <NavList onChangeId={(id) => mainRef.current?.setActiveId(id)} />
      </View>
      <ScrollView keyboardShouldPersistTaps={'always'}>
        <View style={styles.main}>
          <Main ref={mainRef} />
        </View>
      </ScrollView>
    </View>
  )
}
