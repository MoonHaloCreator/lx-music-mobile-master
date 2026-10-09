/**
 * Spotify Design Tokens & Colors
 * 标准化 Spotify 调色板、字阶与圆角规范
 */

export const SPOTIFY_COLORS = {
  WHITE: '#ffffff',
  BLACK: '#000000',
  PRIMARY: '#121212', // 纯正炭黑主背景
  SECONDARY: '#181818', // 次级暗黑卡片底色
  CARD: '#282828', // 卡片/胶囊背景色
  CARD_LIGHT: '#333333', // 浅级卡片
  CARD_PRESS: '#3E3E3E', // 点击按压反馈色
  TINT: '#1ed760', // 品牌绿高亮 (Spotify Green)
  GREEN_DARK: '#1db954', // 深品牌绿
  LIGHT_GREY: '#b3b3b3', // 次级文字与未激活图标色
  LIGHTER_GREY: '#d5d5d5',
  GREY: '#777777', // 占位符与微弱文字色
  NAV: '#121212', // 导航栏底色 (带轻微磨砂透明)
  NAV_BAR: 'rgba(18, 18, 18, 0.95)',
  DIVIDER: '#242424', // 分割线
  PROGRESS_BG: '#4d4d4d', // 进度条未播放底色
  ALBUM_FALLBACK_GRADIENT: '#2e335a',
} as const

// 探索/搜索页 21 种大磁贴分类主题色板
export const BROWSE_CATEGORIES_COLORS = [
  '#248fcf',
  '#7811b3',
  '#a1727e',
  '#6eaf78',
  '#58428b',
  '#5df27a',
  '#b2c69c',
  '#60bf84',
  '#c6125f',
  '#b47ff2',
  '#761813',
  '#21b47a',
  '#8158e6',
  '#1181c9',
  '#7e9dd2',
  '#a265a7',
  '#db6953',
  '#362660',
  '#393fbb',
  '#20c187',
  '#6d5a97',
] as const

// 形状与圆角规范
export const SPOTIFY_RADIUS = {
  XS: 4,
  S: 6,
  M: 8, // 常用封面、胶囊
  L: 12, // 大卡片
  XL: 16,
  ROUND: 9999, // 胶囊按钮、圆形头像
} as const

// 字阶规范
export const SPOTIFY_TYPOGRAPHY = {
  TITLE_LARGE: 24,
  TITLE_MEDIUM: 18,
  TITLE_SMALL: 15,
  BODY: 14,
  CAPTION: 12,
  SUB_CAPTION: 11,
} as const
