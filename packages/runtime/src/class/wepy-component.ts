import Base from './base';
import Watcher from '../observer/watcher';

import { addNextTickCallback } from '../util';

import { isArray, isPlainObject, isString } from 'lodash-es';

import Dirty from '../class/dirty';

import {
  initMethods,
  initWatch,
  initComputed,
  initData
} from '../init-vm';

import { del, set, ObservedValue } from '../observer';

let id = 0;

interface WepyComponentOptions {
  methods?: {
    [key: string]: Function
  },
  data?: object,
  computed?: {
    [key: string]: Function
  },
  watch?: {
    [key: string]: Function
  }
}

interface WatchOptions {
  user?: boolean;
  handler?: string | Function;
  immediate?: boolean;
}

export default class WepyComponent extends Base {
  $dirty = new Dirty();
  private $children: any;
  private $refs: {};
  $id = id++;

  /**
   * 在 created 生命周期中，获得 Component 中的 this，赋给它
   */
  $wx: any;

  /**
   * 在 created 生命周期中，被赋值为 vm.$wx.is
   */
  $is?: string;

  /**
   * 传入的 options
   */
  $options: any;

  /**
   * 传入的 rel
   */
  $rel: any;

  private $root: this;
  private $app: any;
  private $parent: any;

  /**
   * 在构造函数中，将传入的 options 中的 data 克隆后赋值
   */
  _data: any;

  /**
   * 在 Component() 的 attached 生命周期函数中，获取组件的 properties 属性转化成 prop 并观察
   * 直到 attached 时，组件定义时声明的 prop 才可以获取到值
   */
  _props: any;

  _watcher: Watcher | undefined;
  _watchers: Watcher[];

  $nextTick = addNextTickCallback;

  _computedWatchers: { [key: string]: Watcher } = Object.create(null);
  _isBeingDestroyed: Boolean = false;
  

  constructor(options: WepyComponentOptions, rel: any) {
    super();

    const app = getApp().$wepy;

    this.$children = [];
    this.$refs = {};
    this.$options = options;
    this.$rel = rel;
    this._watchers = [];
    this.$root = this;
    this.$app = app;
    this.$parent = app;

    const { methods, data, computed, watch } = options;

    if (methods) {
      initMethods(this, methods);
    }

    if (data) {
      initData(this, data);
    }

    if (computed) {
      initComputed(this, computed);
    }

    if (watch) {
      initWatch(this, watch);
    }
  }

  $set(target: ObservedValue, key: string | number, val: any) {
    return set(this, target, key, val);
  }

  $delete(target: ObservedValue, key: string | number) {
    return del(target, key);
  }

  $watch(expOrFn: string | Function, cb: WatchOptions): () => void
  $watch(expOrFn: string | Function, cb: Function | Function[], options: WatchOptions | undefined): () => void
  $watch(expOrFn: string | Function, cb: Function | Function[] | WatchOptions, options: WatchOptions = {}) {
    let vm = this;

    if (isArray(cb)) {
      for (const handler of cb) {
        this.$watch(expOrFn, handler, options);
      }
    }

    if (isPlainObject(cb)) {
      options = <WatchOptions>cb;

      const { handler } = options;

      if (handler) {
        if (isString && (<Function>this[handler])) {

        }
        return this.$watch(
          expOrFn,
          isString(handler) ? <Function>this[handler] : handler,
          options
        );
      }

    }

    options.user = true;

    const watcher = new Watcher(vm, expOrFn, <Function>cb, options);

    if (options.immediate) {
      (<Function>cb).call(vm, watcher.value);
    }

    return function unwatchFn() {
      watcher.teardown();
    };
  }

  $forceUpdate() {
    if (this._watcher) {
      this._watcher.update();
    }
  }

  $emit(event: string, ...args: any[]) {
    super.$emit(event, ...args);
    this.$wx.triggerEvent(event, { arguments: args });

    return this;
  }

  $trigger(event: string, data: any, option: object) {
    this.$wx.triggerEvent(event, { arguments: [data] }, option);
  }
}
