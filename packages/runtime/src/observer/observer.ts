import Dep from './dep';
import ObserverPath from './observer-path';
import observedArrayPrototypeObject from './array';
import { def } from '../util';
import { isArray, isObject, isPlainObject, eq, has } from 'lodash-es';
import WepyComponent from '../class/wepy-component';

/**
 * By default, when a reactive property is set, the new value is
 * also converted to become reactive. However when passing down props,
 * we don't want to force conversion because the value may be a nested value
 * under a frozen data structure. Converting it would defeat the optimization.
 */

type NotObservedValue = object | any[];
export type ObservedValue<T = NotObservedValue> = T & { __ob__: Observer };
export type ObservedObject = ObservedValue<object>;
export type ObservedArray = ObservedValue<any[]>;

export const isObservedValue = (value: any): value is ObservedValue => has(value, '__ob__');

export class Observer {
  readonly value: ObservedValue;
  readonly dep = new Dep();
  readonly vm: WepyComponent;
  readonly op: ObserverPath;

  constructor(vm: WepyComponent, value: NotObservedValue)
  /**
   * 将对象中每一个属性都转换成 getter / setter，用于依赖收集和派发更新
   *
   * @param vm          该值来自于哪个组件，最终会落到 this.setData() 的 this
   * @param value       需要建立观察者的值
   * @param parent      该值作为属性所属的对象
   * @param keyOfParent 该值所属对象的属性名
   */
  constructor(vm: WepyComponent, value: NotObservedValue, parent: ObservedValue, keyOfParent: string | number)
  constructor(vm: WepyComponent, value: NotObservedValue, parent?: ObservedValue, keyOfParent?: string | number) {
    def(value, '__ob__', this);

    this.value = <ObservedValue>value;
    this.vm = vm;

    if (parent && keyOfParent) {
      this.op = new ObserverPath(this, keyOfParent, parent.__ob__.op);
    } else {
      this.op = new ObserverPath(this);
    }

    if (isArray(value)) {
      Object.setPrototypeOf(value, observedArrayPrototypeObject);
      this.observeArray(<ObservedArray>value);
    } else {
      this.walk(<ObservedObject>value);
    }
  }

  /**
   * 遍历参数对象中的每个属性，并将它们转换成 getter / setter
   */
  private walk(obj: ObservedObject) {
    for (const [key, value] of Object.entries(obj)) {
      defineReactive(this.vm, obj, key, value);
    }
  }

  /**
   * 观察数组中的每一项
   */
  observeArray(items: ObservedArray) {
    items.forEach((item, i) => {
      observe(this.vm, item, items, i);
    });
  }
}

/**
 * 为复杂值创建观察者实例
 * 如果已经包含了观察者，则返回它，否则返回一个新的观察者
 * @param vm          该值来自于哪个组件，最终会落到 this.setData() 的 this
 * @param value       需要建立观察者的值
 */
export function observe(vm: WepyComponent, value: any): undefined | Observer;
/**
 * 为复杂值创建观察者实例
 * 如果已经包含了观察者，则返回它，否则返回一个新的观察者
 * 如果该值是一个对象的属性，则还需要记录所属对象及键名
 * @param vm          该值来自于哪个组件，最终会落到 this.setData() 的 this
 * @param value       需要建立观察者的值
 * @param parent      该值作为属性所属的对象
 * @param keyOfParent 该值所属对象的属性名
 */
export function observe(vm: WepyComponent, value: any, parent: ObservedValue, keyOfParent: string | number): undefined | Observer;
export function observe(vm: WepyComponent, value: any, parent?: ObservedValue, keyOfParent?: string | number) {
  if (!(isArray(value) || isPlainObject(value))) {
    return;
  }

  if (isObservedValue(value) && parent && keyOfParent) {
    const ob = value.__ob__;
    ob.op.addPaths(keyOfParent, parent.__ob__.op);
    return ob;
  } else {
    if (parent && keyOfParent) {
      return new Observer(vm, value, parent, keyOfParent);
    } else {
      return new Observer(vm, value);
    }
  }
}

/**
 * 给对象的某个属性转换成响应式
 * @param vm 组件
 * @param obj 需要转换的对象
 * @param key 需要转换的当前键名
 * @param value 键值
 */
const defineReactive = (
  vm: WepyComponent,
  obj: ObservedObject,
  key: string,
  value: any,
) => {
  const dep = new Dep();
  const property = <PropertyDescriptor>Object.getOwnPropertyDescriptor(obj, key);

  if (property.configurable === false) {
    return;
  }

  const { get: getter, set: setter } = property;

  let childOb = observe(vm, value, obj, key);

  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter() {
      const val = getter ? getter.call(obj) : value;

      if (Dep.target) {
        dep.depend();
        if (childOb) {
          childOb.dep.depend();
          if (isArray(val)) {
            dependArray(val);
          }
        }
      }

      return val;
    },

    set: function reactiveSetter(newVal) {
      const val = getter ? getter.call(obj) : value;

      // 这里使用 eq 而不是 === 是为了将两个 NaN 视为相同的值
      // Vue 原生使用 newVal === val || (newVal !== newVal && val !== val) 来判断，等同于 SameValueZero
      // _.eq() 也使用 SameValueZero 比较，具体区别如下：
      //
      // 方法         NaN 和 NaN 比较   +0 和 -0 比较
      // ---------------------------------------------
      // ===          false             true
      // Object.is()  true              false
      // _.eq()       true              true
      if (eq(newVal, val)) {
        return;
      }

      if (isObject(value) && isObservedValue(value)) {
        // 删掉无效的 paths
        // 注意：即使 path 只有一个也要删掉，因为其子节点可能有多个 path
        value.__ob__.op.cleanPaths(key, obj.__ob__.op);
      }

      if (setter) {
        setter.call(obj, newVal);
      } else {
        value = newVal;
      }

      // 赋值之后，需要设置一下 dirty
      vm.$dirty.set(obj.__ob__.op, key, newVal);

      childOb = observe(vm, key, obj, newVal);
      dep.notify();
    }
  });
};

/**
 * 为响应式对象添加一个属性，然后将新属性也转换为响应式的。
 * TODO: 在开发模式中，检查对象是否为响应式
 */
// export function set(vm: WepyComponent, target: ObservedArray, key: number, val: any): any;
// export function set(vm: WepyComponent, target: ObservedObject, key: string, val: any): any;
export function set(vm: WepyComponent, target: ObservedValue, key: string | number, val: any) {
  // 如果 target 是数组，或者 target 为对象，且 key 为原有的属性
  // 直接赋值就可以了
  if (isArray(target) || has(target, key)) {
    // @ts-ignore
    target[key] = val;
    return val;
  }

  // 否则就需要 Observer 了
  const ob = target.__ob__;
  // @ts-ignore
  target[<string>key].__ob__.op.cleanPaths(key, ob.op);
  defineReactive(vm, ob.value, <string>key, val);
  vm.$dirty.set(ob.op, <string>key, val);
  ob.dep.notify();

  return val;
}

/**
 * 为响应式对象删除一个属性。
 * TODO: 在开发模式中，检查对象是否为响应式
 */
// export function del(target: ObservedArray, key: number): void;
// export function del(target: ObservedObject, key: string): void;
export function del(target: ObservedValue, key: string | number) {
  if (isArray(target)) {
    target.splice(<number>key, 1);
    return;
  }

  if (!has(target, key)) {
    return;
  }

  const ob = target.__ob__;

  // set $dirty
  // TODO：测一下这个到底有没有用
  // @ts-ignore
  target[key] = null;

  // @ts-ignore
  delete target[key];
  ob.dep.notify();
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 */
function dependArray(arr: any[]) {
  for (const item of arr) {
    item?.__ob__?.dep.depend();

    if (isArray(item)) {
      dependArray(item);
    }
  }
}
