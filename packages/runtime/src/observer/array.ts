/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */

import { def } from '../util';
import { isObject } from 'lodash-es';
import { isObservedValue, ObservedArray } from './observer';


const arrayProto = Array.prototype;
const observedArrayPrototypeObject = Object.create(arrayProto);

type MethodsToPatch = 'push' | 'pop' | 'shift' | 'unshift' | 'splice' | 'sort' | 'reverse';

const methodsToPatch: MethodsToPatch[] = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];

for (const method of methodsToPatch) {
  // cache original method
  const original = arrayProto[method];

  def(observedArrayPrototypeObject, method, function(...args: any[]) {
    const { length } = <ObservedArray>this;

    // 清除已经失效的 paths
    if (length > 0) {
      switch (method) {
        case 'pop':
          delInvalidPaths(this, length - 1);
          break;
        case 'shift':
          delInvalidPaths(this, 0);
          break;
        case 'splice':
        case 'sort':
        case 'reverse':
          for (let i = 0; i < length; i++) {
            delInvalidPaths(this, i);
          }
      }
    }

    // @ts-ignore
    const result = original.apply(this, args);
    const ob = (<ObservedArray>this).__ob__;
    const { vm, op, value } = ob;

    // push parent key to dirty, wait to setData
    if (method === 'push') {
      const lastIndex = (<ObservedArray>value).length - 1;

      vm.$dirty.set(op, lastIndex, (<ObservedArray>value)[lastIndex]);
    } else {
      vm.$dirty.replace(op, value);
    }

    // 这里和 vue 不一样，所有变异方法都需要更新 path
    ob.observeArray(<ObservedArray>value);

    // notify change
    ob.dep.notify();

    return result;
  });
}

export default observedArrayPrototypeObject;

function delInvalidPaths(parent: ObservedArray, key: number) {
  const value = parent[key];

  if (isObject(value) && isObservedValue(value)) {
    // delete invalid paths
    value.__ob__.op.cleanPaths(key, parent.__ob__.op);
  }
}
