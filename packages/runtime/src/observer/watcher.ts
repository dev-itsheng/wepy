// @ts-ignore
import { warn, remove, parsePath, handleError } from '../util';

import { traverse } from './traverse';
import { queueWatcher } from './scheduler';
import Dep from './dep';
import { isObject, isFunction } from 'lodash-es';
import WepyComponent from '../class/wepy-component';

let uid = 0;

interface WatcherOptions {
  deep?: boolean;
  user?: boolean;
  computed?: boolean;
  sync?: boolean;
}

/**
 * A watcher parses an expression, collects dependencies,
 * and fires callback when the expression value changes.
 * This is used for both the $watch() api and directives.
 */
export default class Watcher {
  readonly id = uid++;
  private deps: Dep[] = [];
  private newDeps: Dep[] = [];
  private depIds = new Set<typeof Dep.prototype.id>();
  private newDepIds = new Set<typeof Dep.prototype.id>();
  private active = true;

  /**
   * 用于更新界面的回调。
   * 在 vm.$watch 中，由用户指定。
   * 在 computed 中，为空函数。
   * 在 initRender 中，为 setData 相关。
   */
  private cb: Function;

  /**
   * vm 实例
   */
  readonly vm: WepyComponent;

  /**
   * 如果 getter 返回了一个对象，是否对这个对象每个属性都进行观察
   */
  private readonly deep: boolean;

  /**
   * 是否为用户定义
   */
  readonly user: boolean;

  /**
   * 是否为 computed 转化过来
   */
  private readonly computed: boolean;
  private readonly sync: boolean;

  /**
   * 数据是否为最新的
   * 如果不是（即值为 false），使用时需要重新计算
   */
  dirty: boolean;


  private readonly isRenderWatcher: boolean;

  /**
   * 观察的表达式，为路径名称或者函数字符串
   */
  readonly expression: string;

  /**
   * 如果 watch 一个路径，则将其转成求路径的函数，否则为 watch 的函数
   */
  private readonly getter: Function;

  /**
   * getter 的返回值
   * 如果是 computed，则初始值是 undefined，在第一次 evaluate 之后计算 getter
   */
  value: any;

  /**
   * 如果是 computed，则是 computed 的 key
   */
  key: string | undefined;


  constructor(
    vm: WepyComponent,
    expOrFn: Function | string,
    cb: Function,
    options: WatcherOptions = {},
    isRenderWatcher = false
  ) {
    // vm
    this.vm = vm;
    if (isRenderWatcher) {
      vm._watcher = this;
    }
    vm._watchers.push(this);

    // exp, parse expression for getter
    this.expression = process.env.NODE_ENV !== 'production' ? expOrFn.toString() : '';
    this.getter = isFunction(expOrFn) ? expOrFn : parsePath(expOrFn as string);

    // cb
    this.cb = cb;

    // options
    const { deep = false, user = false, computed = false, sync = false } = options;
    this.deep = deep;
    this.user = user;
    this.computed = computed;
    this.sync = sync;
    this.dirty = this.computed; // for computed watchers
    this.value = this.computed ? undefined : this.get();

    // isRenderWatcher
    this.isRenderWatcher = isRenderWatcher;
  }

  /**
   * 执行 this.getter，同时重新进行依赖收集
   */
  get() {
    Dep.pushTarget(this);
    let value;
    const { vm } = this;
    try {
      value = this.getter.call(vm, vm);
    } catch (e) {
      if (this.user) {
        handleError(e, vm, `getter for watcher "${this.expression}"`);
      } else {
        throw e;
      }
    } finally {
      // "touch" every property so they are all tracked as
      // dependencies for deep watching
      if (this.deep) {
        traverse(value);
      }
      Dep.popTarget();
      if (!this.isRenderWatcher) this.cleanupDeps();
    }
    return value;
  }

  /**
   * 不重复的把当前 watcher 添加进依赖的观察者列表里
   */
  addDep(dep: Dep) {
    const { id } = dep;

    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id);
      this.newDeps.push(dep);
      if (!this.depIds.has(id)) {
        dep.addSub(this);
      }
    }
  }

  /**
   * 清理依赖列表
   * 将当前的依赖列表和新的依赖列表比对，如果存在于 this.deps 却不存在于 this.newDeps，说明这个 watcher 已经不再观察这个依赖了
   * 所以要让这个依赖从他的观察者列表里删除自己，以免造成不必要的 watcher 更新。然后
   * 把 this.newDeps 的值赋给 this.deps，再把 this.newDeps 清空
   */
  cleanupDeps() {
    for (const dep of this.deps) {
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this);
      }
    }

    [this.depIds, this.newDepIds] = [this.newDepIds, this.depIds];
    [this.deps, this.newDeps] = [this.newDeps, this.deps];

    this.newDeps.length = 0;
  }

  /**
   * 当一个依赖改变的时候，通知它 update
   */
  update() {
    // 对于 computed 时，不需要立即执行计算方法
    if (this.computed) {
      this.dirty = true;
    } else if (this.sync) {
      this.run();
    } else {
      queueWatcher(this);
    }
  }

  /**
   * Scheduler job interface.
   * Will be called by the scheduler.
   */
  run() {
    if (this.active) {
      const value = this.get();
      if (
        value !== this.value ||
        // Deep watchers and watchers on Object/Arrays should fire even
        // when the value is the same, because the value may
        // have mutated.
        isObject(value) ||
        this.deep
      ) {
        // set new value
        const oldValue = this.value;
        this.value = value;
        if (this.user) {
          try {
            this.cb.call(this.vm, value, oldValue);
          } catch (e) {
            handleError(e, this.vm, `callback for watcher "${this.expression}"`);
          }
        } else {
          this.cb.call(this.vm, value, oldValue);
        }
      }
    }
  }

  /**
   * 对于 computed，当取值时（，发现计算属性的 watcher 的 dirty 是 true
   * 说明数据不是最新的了，需要重新计算，这里就是重新计算计算属性的值
   */
  evaluate() {
    this.value = this.get();
    if (this.vm.$dirty) {
      let keyVal =
        this.vm._computedWatchers && this.vm._computedWatchers[<string>this.key]
          ? this.vm._computedWatchers[<string>this.key].value
          : this.value;
      this.vm.$dirty.push(<string>this.key, keyVal);
    }
    this.dirty = false;
  }

  /**
   * 把这个 watcher 所观察的所有依赖都传给 Dep.target，即给 Dep.target 收集这些依赖。
   * 举个例子：具体可以 createComputedGetter 这个方法
   * 当 template 里依赖了 computed a，当执行 render 时就会去读取 a，而 a 会去重新计算，计算完了渲染 watcher 出栈，赋值给 Dep.target
   * 然后执行 watcher.depend，就是把这个 computed watcher 的所有依赖也加入给 template watcher
   * 这样，即使 data.b 没有被直接用在 template 上，也通过计算属性 a 被间接的使用了
   * 当 data.b 发生改变时，也就可以触发渲染更新了
   */
  depend() {
    if (Dep.target) {
      for (const dep of this.deps) {
        dep.depend();
      }
    }
  }

  /**
   * Remove self from all dependencies' subscriber list.
   */
  teardown() {
    if (this.active) {
      // remove self from vm's watcher list
      // this is a somewhat expensive operation so we skip it
      // if the vm is being destroyed.
      if (!this.vm._isBeingDestroyed) {
        remove(this.vm._watchers, this);
      }
      let i = this.deps.length;
      while (i--) {
        this.deps[i].removeSub(this);
      }
      this.active = false;
    }
  }
}
