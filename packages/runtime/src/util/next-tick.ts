type Callback = () => void;

const nextTickCallbacks: Callback[] = [];

/**
 * 此函数将会被框架在更新数据时传入 setData()。
 * 即在界面更新渲染完毕后执行队列中的全部回调函数并清空队列。
 */
export const executeAndClearNextTickCallbacks = () => {
  nextTickCallbacks.forEach(callback => void callback());
  nextTickCallbacks.length = 0;
};

/**
 * 将被赋值为 wepy.nextTick 及组件中的 this.$nextTick。
 * 将一个函数（传入的参数或 Promise 中的 resolve）送入队列，用于异步 DOM（wxml）更新后触发回调。
 * 与 Vue 中类似，有两种用法，若传入一个函数，则择机调用之，否则返回一个择机 resolve 的 Promise。
 */
export function addNextTickCallback(callback: Callback): void;
export function addNextTickCallback(): Promise<void>;
export function addNextTickCallback(callback?: Callback) {
  if (callback) {
    nextTickCallbacks.push(callback);
  } else {
    return new Promise<void>(resolve => void nextTickCallbacks.push(resolve));
  }
}
