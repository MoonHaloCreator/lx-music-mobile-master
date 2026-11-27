import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Image as RNImage, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import SourceSelector, {
  type SourceSelectorType as _SourceSelectorType,
  type SourceSelectorProps as _SourceSelectorProps,
} from '@/components/SourceSelector'
import SearchInput, { type SearchInputType, type SearchInputProps } from './SearchInput'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { useStatusbarHeight } from '@/store/common/hook'
import { useSettingValue } from '@/store/setting/hook'
import { setNavActiveId } from '@/core/common'
import { getSearchSetting } from '@/utils/data'
import { type SearchType } from '@/store/search/state'
import { type Source as MusicSource } from '@/store/search/music/state'
import { type Source as SonglistSource } from '@/store/search/songlist/state'
import { SPOTIFY_COLORS, SPOTIFY_RADIUS } from '@/theme/spotify'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const GREEN_LOGO = require('@/resources/spotify-assets/images/logo.png')

type Sources = Readonly<Array<MusicSource | SonglistSource>>
type SourceSelectorProps = _SourceSelectorProps<Sources>
type SourceSelectorType = _SourceSelectorType<Sources>

const SEARCH_TYPE_LIST = ['music', 'songlist'] as const

export interface HeaderBarProps {
  onSourceChange: SourceSelectorProps['onSourceChange']
  onTipSearch: SearchInputProps['onChangeText']
  onSearch: SearchInputProps['onSubmit']
  onHideTipList: SearchInputProps['onBlur']
  onShowTipList: SearchInputProps['onTouchStart']
}

export interface HeaderBarType {
  setSourceList: SourceSelectorType['setSourceList']
  setText: SearchInputType['setText']
  blur: SearchInputType['blur']
}

export default forwardRef<HeaderBarType, HeaderBarProps>(({ onSourceChange, onTipSearch, onSearch, onHideTipList, onShowTipList }, ref) => {
  const t = useI18n()
  const statusBarHeight = useStatusbarHeight()
  const sourceNameType = useSettingValue('common.sourceNameType')
  const sourceSelectorRef = useRef<SourceSelectorType>(null)
  const searchInputRef = useRef<SearchInputType>(null)

  const [searchType, setSearchType] = useState<SearchType>('music')
  const [sourceList, setSourceListState] = useState<Sources>([])
  const [activeSource, setActiveSource] = useState<Sources[number]>('kw')

  useEffect(() => {
    void getSearchSetting().then((info) => {
      setSearchType(info.type)
      setActiveSource(info.source)
    })
  }, [])

  useImperativeHandle(ref, () => ({
    setSourceList(list, source) {
      setSourceListState(list)
      setActiveSource(source)
      sourceSelectorRef.current?.setSourceList(list, source)
    },
    setText(text) {
      searchInputRef.current?.setText(text)
    },
    blur() {
      searchInputRef.current?.blur()
    },
  }), [])

  const handleOpenSetting = useCallback(() => {
    searchInputRef.current?.blur()
    setNavActiveId('nav_setting')
  }, [])

  const handleTypeChange = useCallback((nextType: SearchType) => {
    setSearchType(nextType)
    global.app_event.searchTypeChanged(nextType)
  }, [])

  const handleSelectSource = useCallback((source: Sources[number]) => {
    setActiveSource(source)
    sourceSelectorRef.current?.setSourceList(sourceList, source)
    onSourceChange(source)
  }, [onSourceChange, sourceList])

  const handleDropdownSourceChange = useCallback((source: Sources[number]) => {
    setActiveSource(source)
    onSourceChange(source)
  }, [onSourceChange])

  const typeTabs = useMemo(() => {
    return SEARCH_TYPE_LIST.map(id => ({ id, label: t(`search_type_${id}`) }))
  }, [t])

  return (
    <View style={[styles.headerContainer, { paddingTop: statusBarHeight + scaleSizeH(10) }]}>
      {/* Row 1: 绿色 Logo + 页面标题 + 设置按钮 */}
      <View style={styles.topTitleRow}>
        <View style={styles.brandTitleWrap}>
          <View style={styles.logoBadge}>
            <RNImage source={GREEN_LOGO} style={styles.logoImage} resizeMode="contain" />
          </View>
          <Text style={styles.pageTitle}>{t('nav_search')}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.settingButton,
            pressed && styles.settingButtonPressed,
          ]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={handleOpenSetting}
        >
          <Icon name="setting" size={20} color={SPOTIFY_COLORS.WHITE} />
        </Pressable>
      </View>

      {/* Row 2: 独立 Spotify 风格搜索框（不会被其他层遮挡） */}
      <View style={styles.inputRow}>
        <SearchInput
          ref={searchInputRef}
          onChangeText={onTipSearch}
          onSubmit={onSearch}
          onBlur={onHideTipList}
          onTouchStart={onShowTipList}
        />
      </View>

      {/* Row 3: 结果分区切换 + 来源切换（横向胶囊条 + 下拉菜单入口） */}
      <View style={styles.controlsRow}>
        <View style={styles.typeGroup}>
          {typeTabs.map((tab) => {
            const active = searchType === tab.id
            return (
              <Pressable
                key={tab.id}
                onPress={() => { handleTypeChange(tab.id) }}
                style={({ pressed }) => [
                  styles.typePill,
                  active && styles.typePillActive,
                  pressed && styles.pillPressed,
                ]}
              >
                <Text
                  style={[
                    styles.typePillText,
                    active && styles.typePillTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </Pressable>
            )
          })}
        </View>

        <View style={styles.controlsDivider} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          contentContainerStyle={styles.sourceScrollContent}
          style={styles.sourceScroll}
        >
          {sourceList.map((src) => {
            const active = activeSource === src
            return (
              <Pressable
                key={src}
                onPress={() => { handleSelectSource(src) }}
                style={({ pressed }) => [
                  styles.sourcePill,
                  active && styles.sourcePillActive,
                  pressed && styles.pillPressed,
                ]}
              >
                <Text
                  style={[
                    styles.sourcePillText,
                    active && styles.sourcePillTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {t(`source_${sourceNameType}_${src}`)}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>

        <View style={styles.dropdownWrap}>
          <SourceSelector
            ref={sourceSelectorRef}
            onSourceChange={handleDropdownSourceChange}
            fontSize={11}
            compact
            center
          />
        </View>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: SPOTIFY_COLORS.PRIMARY,
    paddingHorizontal: scaleSizeW(16),
    paddingBottom: scaleSizeH(10),
    borderBottomWidth: 1,
    borderBottomColor: SPOTIFY_COLORS.DIVIDER,
    zIndex: 5,
  },
  topTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scaleSizeH(12),
  },
  brandTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: scaleSizeW(30),
    height: scaleSizeW(30),
    borderRadius: scaleSizeW(15),
    backgroundColor: SPOTIFY_COLORS.GREEN_ALPHA_15,
    borderWidth: 1,
    borderColor: SPOTIFY_COLORS.GREEN_ALPHA_30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleSizeW(10),
  },
  logoImage: {
    width: scaleSizeW(22),
    height: scaleSizeW(22),
    borderRadius: scaleSizeW(11),
  },
  pageTitle: {
    color: SPOTIFY_COLORS.WHITE,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  settingButton: {
    width: scaleSizeW(40),
    height: scaleSizeH(40),
    borderRadius: SPOTIFY_RADIUS.ROUND,
    backgroundColor: SPOTIFY_COLORS.SECONDARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingButtonPressed: {
    backgroundColor: SPOTIFY_COLORS.CARD_PRESS,
    transform: [{ scale: 0.94 }],
  },
  inputRow: {
    marginBottom: scaleSizeH(10),
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: scaleSizeH(34),
  },
  typeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typePill: {
    paddingHorizontal: scaleSizeW(12),
    paddingVertical: scaleSizeH(6),
    borderRadius: SPOTIFY_RADIUS.ROUND,
    backgroundColor: SPOTIFY_COLORS.INPUT_BG,
    marginRight: scaleSizeW(6),
  },
  typePillActive: {
    backgroundColor: SPOTIFY_COLORS.TINT,
  },
  typePillText: {
    color: SPOTIFY_COLORS.LIGHT_GREY,
    fontSize: 12,
    fontWeight: '700',
  },
  typePillTextActive: {
    color: SPOTIFY_COLORS.BLACK,
  },
  controlsDivider: {
    width: 1,
    height: scaleSizeH(18),
    backgroundColor: SPOTIFY_COLORS.CARD_LIGHT,
    marginHorizontal: scaleSizeW(6),
  },
  sourceScroll: {
    flex: 1,
  },
  sourceScrollContent: {
    alignItems: 'center',
    paddingRight: scaleSizeW(6),
  },
  sourcePill: {
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(5),
    borderRadius: SPOTIFY_RADIUS.ROUND,
    backgroundColor: SPOTIFY_COLORS.SECONDARY,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginRight: scaleSizeW(6),
  },
  sourcePillActive: {
    backgroundColor: SPOTIFY_COLORS.GREEN_ALPHA_15,
    borderColor: SPOTIFY_COLORS.TINT,
  },
  sourcePillText: {
    color: SPOTIFY_COLORS.LIGHT_GREY,
    fontSize: 11,
    fontWeight: '600',
  },
  sourcePillTextActive: {
    color: SPOTIFY_COLORS.TINT,
    fontWeight: '700',
  },
  pillPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.95 }],
  },
  dropdownWrap: {
    height: scaleSizeH(30),
    justifyContent: 'center',
    borderRadius: SPOTIFY_RADIUS.ROUND,
    backgroundColor: SPOTIFY_COLORS.CARD,
    marginLeft: scaleSizeW(4),
    overflow: 'hidden',
  },
})
