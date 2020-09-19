export * from '../shared/index';

export * from './debug';
export * from './error';
export * from './next-tick';

import { noop } from 'lodash-es';



/**
 * Remove an item from an array
 */
export function remove(arr, item) {
  if (arr.length) {
    const index = arr.indexOf(item);
    if (index > -1) {
      return arr.splice(index, 1);
    }
  }
}

export const proxy = (target, sourceKey, key) => {
  Object.defineProperty(target, key, {
    enumerable: true,
    configurable: true,
    get() {
      return this[sourceKey][key];
    },
    set(val) {
      this[sourceKey][key] = val;
    }
  });
}

/**
 * Define a property.
 */
export const def = (obj: object, key: string, val: any, enumerable = false) => {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: enumerable,
    writable: true,
    configurable: true
  });
};

/**
 * Parse simple path.
 * （准备删除）
 */
const bailRE = /[^\w.$]/;
export function parsePath(path: string) {
  if (bailRE.test(path)) {
    console.warn(
      `Failed watching path: "${path}" ` +
      'Watcher only accepts simple dot-delimited paths. ' +
      'For full control, use a function instead.',
    )
    return noop;
  }
  const segments = path.split('.');
  return function(obj /* : vm */) {
    for (let i = 0; i < segments.length; i++) {
      if (!obj) return;
      obj = obj[segments[i]];
    }
    return obj;
  };
}
