/**
 * 应用生命周期
 */
export const WEAPP_APP_LIFECYCLE = [
  'onLaunch',
  'onShow',
  'onHide',
  'onError',
  'onPageNotFound',
  'onUnhandledRejection',
  'onThemeChange'
];

/**
 * 页面生命周期
 */
export const WEAPP_PAGE_LIFECYCLE = [
  'onLoad',
  'onShow',
  'onReady',
  'onHide',
  'onUnload',
  'onPullDownRefresh',
  'onReachBottom',
  'onShareAppMessage',
  'onAddToFavorites',
  'onPageScroll',
  'onResize',
  'onTabItemTap'
];

/**
 * 组件生命周期
 */
export const WEAPP_COMPONENT_LIFECYCLE = [
  'beforeCreate',   // 自定义的组件生命周期，用于插件初始化
  'created',
  'attached',
  'ready',
  'moved',
  'detached',
  'error'
];

/**
 * 组件所在页面的生命周期
 */
export const WEAPP_COMPONENT_PAGE_LIFECYCLE = [
  'show',
  'hide',
  'resize'
];

/**
 * 所有生命周期
 */
export const WEAPP_LIFECYCLE = [
  ...WEAPP_APP_LIFECYCLE,
  ...WEAPP_PAGE_LIFECYCLE,
  ...WEAPP_COMPONENT_LIFECYCLE,
  ...WEAPP_COMPONENT_PAGE_LIFECYCLE
];
