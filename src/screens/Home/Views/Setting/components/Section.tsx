import { View } from 'react-native'

import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'

const CARD_BG = 'rgba(128,128,128,0.10)'

interface Props {
  title: string
  children: React.ReactNode | React.ReactNode[]
}

export default ({ title, children }: Props) => {
  const theme = useTheme()

  return (
    <View style={styles.container}>
      <Text style={styles.title} color={theme['c-font']} size={18}>{title}</Text>
      <View style={styles.card}>
        {children}
      </View>
    </View>
  )
}


const styles = createStyle({
  container: {
    marginBottom: 24,
  },
  title: {
    fontWeight: 'bold',
    paddingLeft: 4,
    marginBottom: 10,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
})
