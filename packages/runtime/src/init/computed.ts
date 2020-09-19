import Watcher from './../observer/watcher';
import Dep from './../observer/dep';
import { isObject, isFunction, noop } from 'lodash-es';

const createComputedGetter = key => {
  return function computedGetter() {
    const watcher = this._computedWatchers?.[key] as Watcher;

    if (watcher) {
      watcher.key = key;

      if (watcher.dirty) {
        watcher.evaluate();
      }

      if (Dep.target) {
        watcher.depend();
      }

      return watcher.value;
    }
  };
}

interface ComputedDefinitionObject {
  get: Function
  set?: Function
  cache?: boolean
}

interface Computed {
  [key: string]: Function | ComputedDefinitionObject
}

export const initComputed = (vm, computed: Computed) => {
  const watchers = [];

  for (const [key, def] of Object.entries(computed)) {
    const getter = isObject(def) ? (def as ComputedDefinitionObject).get : (def as Function);

    watchers[key] = new Watcher(
      vm,
      getter,
      noop,
      { computed: true }
    );

    Object.defineProperty(vm, key, {
      enumerable: true,
      configurable: true,
      get: (isFunction(def) || (def as ComputedDefinitionObject).cache) ? createComputedGetter(key) : (def as ComputedDefinitionObject).get,
      set: (def as ComputedDefinitionObject).set || noop
    });
  }
};
