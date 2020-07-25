export * from '../shared/index';

export * from './debug';
export * from './error';
export * from './next-tick';

/**
 * Remove an item from an array
 */
export function remove(arr, item) {
  if (arr.length) {
    var index = arr.indexOf(item);
    if (index > -1) {
      return arr.splice(index, 1);
    }
  }
}

/**
 * Define a property.
 */
export const def = (obj: object, key: string, val: any, enumerable = false) => {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  });
};

/**
 * Parse simple path.
 * （准备删除）
 */
const bailRE = /[^\w.$]/;
export function parsePath(path) {
  if (bailRE.test(path)) {
    return;
  }
  const segments = path.split('.');
  return function(obj) {
    for (let i = 0; i < segments.length; i++) {
      if (!obj) return;
      obj = obj[segments[i]];
    }
    return obj;
  };
}
