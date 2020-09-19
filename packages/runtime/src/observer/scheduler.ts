//import { callHook, activateChildComponent } from '../instance/lifecycle';

import { warn, addNextTickCallback } from '../util';
import Watcher from './watcher';

export const MAX_UPDATE_COUNT = 100;

/**
 * 存放 Watcher 的队列
 */
const watcherQueue: Watcher[] = [];

/**
 * 存放 Watcher id 的 Map
 * 为 true 表示已添加，为 null 表示更新时已经处理，为 undefined 表示还不存在
 */
let has: { [id: number]: true | null } = {};

/**
 * 在开发环境中，检查是否有循环 watch 的行为
 */
let circular: { [id: number]: number } = {};

/**
 * 是否在等待刷新状态
 * 在 queueWatcher 执行时会检查此值，如果为 false，置为 true 并将刷新任务推至回调任务队列
 */
let waiting = false;

/**
 * 是否进入刷新状态
 */
let flushing = false;

/**
 * 用于在 flush 时递增元素下标，并在 flush 结束后保持值为其长度不变
 */
let index = 0;

/**
 * Reset the scheduler's state.
 */
function resetSchedulerState() {
  index = watcherQueue.length = 0;
  has = {};
  if (process.env.NODE_ENV !== 'production') {
    circular = {};
  }
  waiting = flushing = false;
}

/**
 * 执行异步回调更新
 * 主要就是调用循环执行队列里的 watcher.run 方法。
 */
function flushSchedulerQueue() {
  flushing = true;

  // 在循环队列之前对队列进行了一次排序
  // 1. 组件更新的顺序是从父组件到子组件的顺序，因为父组件总是比子组件先创建。
  // 2. 一个组件的 user watchers（侦听器 watcher）比 render watcher 先运行，因为 user watchers 往往比 render watcher 更早创建
  // 3. 如果一个组件在父组件 watcher 运行期间被销毁，它的 watcher 执行将被跳过
  watcherQueue.sort((a, b) => a.id - b.id);

  // do not cache length because more watchers might be pushed
  // as we run existing watchers
  for (index = 0; index < watcherQueue.length; index++) {
    const watcher = watcherQueue[index];
    const { id } = watcher;

    has[id] = null;
    watcher.run();

    // in dev build, check and stop circular updates.
    if (process.env.NODE_ENV !== 'production' && has[id] != null) {
      circular[id] = (circular[id] || 0) + 1;
      if (circular[id] > MAX_UPDATE_COUNT) {
        warn(
          'You may have an infinite update loop ' + (
            watcher.user
              ? `in watcher with expression "${watcher.expression}"`
              : `in a component render function.`
          ),
          watcher.vm
        );
        break;
      }
    }
  }

  resetSchedulerState();
}

/**
 * 将 Watcher 加入队列
 * Push a watcher into the watcher watcherQueue.
 * Jobs with duplicate IDs will be skipped unless it's
 * pushed when the watcherQueue is being flushed.
 */
export function queueWatcher(watcher: Watcher) {
  const { id } = watcher;

  // 检查是否当前 watcher 的 id 是否存在
  // 若已存在则跳过
  // 不存在则就 push 到 watcherQueue，队列中并标记哈希表 has，用于下次检验，防止重复添加
  // 因为执行更新队列时，是每个 watcher 都被执行 run，如果是相同的 watcher 没必要重复执行
  // 这样就算同步修改了多次视图中用到的 data，异步更新计算的时候也只会更新最后一次修改
  if (has[id] == null) {
    has[id] = true;
    if (!flushing) {
      watcherQueue.push(watcher);
    } else {
      // if already flushing, splice the watcher based on its id
      // if already past its id, it will be run next immediately.
      let i = watcherQueue.length - 1;
      while (i > index && watcherQueue[i].id > watcher.id) {
        i--;
      }
      watcherQueue.splice(i + 1, 0, watcher);
    }
    // queue the flush
    if (!waiting) {
      waiting = true;
      addNextTickCallback(flushSchedulerQueue);
    }
  }
}
