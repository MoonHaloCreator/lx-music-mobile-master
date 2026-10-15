import { memo, useCallback } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { useKeyboard } from '@/utils/hooks'
import { usePlayerMusicInfo, useIsPlay, useProgress } from '@/store/player/hook'
import { useIsLoveMusic } from '@/store/list/hook'
import { useSettingValue } from '@/store/setting/hook'
import { togglePlay, playNext, collectMusic, uncollectMusic } from '@/core/player/player'
import { navigations } from '@/navigation'
import commonState from '@/store/common/state'
import Image from '@/components/common/Image'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { SPOTIFY_COLORS, SPOTIFY_RADIUS } from '@/theme/spotify'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { setLoadErrorPicUrl, setMusicInfo } from '@/core/player/playInfo'
import { useI18n } from '@/lang'

const PIC_SIZE = scaleSizeH(40)

export default memo(({ isHome = false }: { isHome?: boolean }) => {
  const t = useI18n()
  const { keyboardShown } = useKeyboard()
  const autoHidePlayBar = useSettingValue('common.autoHidePlayBar')
  const musicInfo = usePlayerMusicInfo()
  const isPlay = useIsPlay()
  const isLove = useIsLoveMusic(musicInfo.id ?? undefined)
  const { progress } = useProgress(true)

  const handleOpenPlayDetail = () => {
    if (!musicInfo.id) return
    navigations.pushPlayDetailScreen(commonState.componentIds.home ?? 'home')
  }

  const handleToggleLove = () => {
    if (!musicInfo.id) return
    if (isLove) {
      uncollectMusic()
    } else {
      collectMusic()
    }
  }

  const handlePicError = useCallback((url: string | number) => {
    setLoadErrorPicUrl(url as string)
    setMusicInfo({ pic: null })
  }, [])

  if (autoHidePlayBar && keyboardShown) return null

  const title = musicInfo.id ? musicInfo.name : 'MeloRiver'
  const singer = musicInfo.id ? (musicInfo.singer || t('spotify_unknown_artist')) : t('spotify_no_track_playing')
  const progressPercent = Math.max(0, Math.min(100, (progress || 0) * 100))

  return (
    <View style={styles.outerContainer}>
      <TouchableOpacity
        style={styles.pillContainer}
        activeOpacity={0.92}
        onPress={handleOpenPlayDetail}
      >
        {/* 左侧圆角专辑封面 */}
        <View style={styles.coverWrapper}>
          <Image
            url={musicInfo.pic}
            style={styles.coverImage}
            onError={handlePicError}
          />
        </View>

        {/* 中间歌曲名与歌手 */}
        <View style={styles.infoWrapper}>
          <Text style={styles.titleText} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.singerText} numberOfLines={1}>
            {singer}
          </Text>
        </View>

        {/* 右侧控制按钮组 */}
        <View style={styles.controlsWrapper}>
          {/* 绿心收藏按钮 */}
          {musicInfo.id ? (
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.6}
              onPress={handleToggleLove}
            >
              <Icon
                name="love"
                size={20}
                color={isLove ? SPOTIFY_COLORS.TINT : SPOTIFY_COLORS.LIGHT_GREY}
              />
            </TouchableOpacity>
          ) : null}

          {/* 播放 / 暂停按钮 */}
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.6}
            onPress={togglePlay}
          >
            <Icon
              name={isPlay ? 'pause' : 'play'}
              size={22}
              color={SPOTIFY_COLORS.WHITE}
            />
          </TouchableOpacity>

          {/* 下一首按钮 */}
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.6}
            onPress={() => void playNext()}
          >
            <Icon
              name="nextMusic"
              size={18}
              color={SPOTIFY_COLORS.LIGHT_GREY}
            />
          </TouchableOpacity>
        </View>

        {/* 底部细微进度条 */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
        </View>
      </TouchableOpacity>
    </View>
  )
})

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    paddingHorizontal: scaleSizeW(8),
    paddingBottom: scaleSizeH(4),
    backgroundColor: 'transparent',
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: scaleSizeH(54),
    backgroundColor: SPOTIFY_COLORS.CARD,
    borderRadius: SPOTIFY_RADIUS.M,
    overflow: 'hidden',
    paddingHorizontal: scaleSizeW(8),
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    position: 'relative',
  },
  coverWrapper: {
    width: PIC_SIZE,
    height: PIC_SIZE,
    borderRadius: SPOTIFY_RADIUS.XS,
    overflow: 'hidden',
    backgroundColor: SPOTIFY_COLORS.SECONDARY,
    marginRight: scaleSizeW(10),
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  infoWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: scaleSizeW(6),
  },
  titleText: {
    color: SPOTIFY_COLORS.WHITE,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  singerText: {
    color: SPOTIFY_COLORS.LIGHT_GREY,
    fontSize: 11,
    fontWeight: '500',
  },
  controlsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: scaleSizeW(36),
    height: scaleSizeH(36),
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: scaleSizeW(8),
    right: scaleSizeW(8),
    height: 2,
    backgroundColor: SPOTIFY_COLORS.PROGRESS_BG,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: SPOTIFY_COLORS.WHITE,
    borderRadius: 1,
  },
})
