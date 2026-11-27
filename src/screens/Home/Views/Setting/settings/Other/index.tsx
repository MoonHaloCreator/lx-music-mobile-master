import { memo } from 'react'
import { StyleSheet, View } from 'react-native'

import Section from '../../components/Section'
import ResourceCache from './ResourceCache'
import MetaCache from './MetaCache'
import DislikeList from './DislikeList'
import Log from './Log'
// import MaxCache from './MaxCache'
import { useI18n } from '@/lang'

export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_other')}>
      <ResourceCache />
      <View style={styles.divider} />
      <MetaCache />
      <View style={styles.divider} />
      <DislikeList />
      <View style={styles.divider} />
      <Log />
      {/* <MaxCache /> */}
    </Section>
  )
})

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(128,128,128,0.18)',
    marginVertical: 4,
  },
})
