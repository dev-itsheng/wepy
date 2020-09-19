import { remove } from '../util';
import Watcher from './watcher';
import { last } from 'lodash-es';

let uid = 0;

/**
 * Dep 是收集依赖的容器，负责记录哪些 Watcher 依赖自己的变化。
 * 或者说，哪些 Watcher 订阅了自己的变化。
 *
 * 1. 它的实例什么时候创建？
 *    初始化的给 data 的属性进行数据劫持（给 data 的属性进行响应式）时创建的。
 *
 * 2. 创建个数？
 *    与 data 中的属性一一对应。
 *
 * 3. Dep 的结构？
 *    由 id / subs / static target 构成。
 */
export default class Dep {

  /**
   * 每个 Dep 都有唯一的 ID
   */
  readonly id = uid++;

  /**
   * subs 是一个存放相关 Watcher 的容器
   */
  private readonly subs: Watcher[] = [];

  /**
   * 当前是哪个 Watcher 在进行依赖的收集
   */
  static target: Watcher | undefined;

  private static readonly targetStack: Watcher[] = [];

  /**
   * 添加一个观察者对象
   */
  addSub(sub: Watcher) {
    this.subs.push(sub);
  }

  /**
   * 移除一个观察者对象
   */
  removeSub(sub: Watcher) {
    remove(this.subs, sub);
  }

  /**
   * 依赖收集，当存在 Dep.target 的时候把自己添加 Watcher 的依赖中
   */
  depend() {
    if (Dep.target) {
      Dep.target.addDep(this);
    }
  }

  /**
   * 当所绑定的数据有变更时, 通知所有的绑定 Watcher，调用它们的 update()
   */
  notify() {
    for (const sub of this.subs) {
      sub.update();
    }
  }

  /**
   * 将 Dep.target 添加到 targetStack，同时 Dep.target 赋值为当前 Watcher 对象
   */
  static pushTarget(target: Watcher) {
    this.targetStack.push(target);
    this.target = target;
  }

  static popTarget() {
    this.targetStack.pop();
    this.target = last(this.targetStack);
  }
}
