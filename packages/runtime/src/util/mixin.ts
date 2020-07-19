// import { WEAPP_LIFECYCLE } from '../shared/constants';
//import { WepyApp } from '../../types/wepy';

// import WechatMiniprogram from 'miniprogram-api-typings/types/wx/lib.wx.app';

import 'miniprogram-api-typings/types/wx';

export interface Mixin extends Partial<
  // App() 中的生命周期
  WechatMiniprogram.App.Option &

  // Page() 中的生命周期
  WechatMiniprogram.Page.ILifetime &

  // Component() 中的生命周期与 lifetimes 中的生命周期
  WechatMiniprogram.Component.Lifetimes &

  // Page() 中的 data（实际上等价于 Component 中的 data，但这个描述更详细）
  WechatMiniprogram.Page.Data<WechatMiniprogram.Page.DataOption> &

  // Component() 中的 methods（实际上 wepy 会将 page 参数 options 对象的 methods 属性下的方法放到 options 下，因此可以合并）
  WechatMiniprogram.Component.Method<WechatMiniprogram.Component.MethodOption> // methods
> {
  computed?: {
    [key: string]: Function,
  },
}

const globalMixins: Mixin[] = [];

/**
 * 将被赋值给 `wepy.mixin()`，用于全局添加 mixin
 * @param mixin
 */
export const addGlobalMixin = (mixin: Mixin) => {
  globalMixins.push(mixin);
};

/**
 * 用于合并全局 mixins 和 `wepy.app()` / `wepy.page()` / `wepy.component()` 中传入的 mixins
 * @param mixins
 */
export const composeGlobalMixins = (mixins: Mixin[]) => [...globalMixins, ...mixins];
