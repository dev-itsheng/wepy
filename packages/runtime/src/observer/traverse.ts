import { isObject, isArray } from 'lodash-es';
import { isObservedValue } from './observer';

const seenObjects = new Set<number>();

/**
 * Recursively traverse an object to evoke all converted
 * getters, so that every nested property inside the object
 * is collected as a "deep" dependency.
 */
export const traverse = (val: object | any[]) => {
  _traverse(val, seenObjects);
  seenObjects.clear();
}

const _traverse = (val: object | any[] | any, seen: typeof seenObjects) => {
  if (!isObject(val)) {
    return;
  }

  if (isObservedValue(val)) {
    const depId = val.__ob__.dep.id;

    if (seen.has(depId)) {
      return;
    }

    seen.add(depId);
  }

  if (isArray(val)) {
    for (const item of val) {
      _traverse(item, seen);
    }
  } else {
    for (const item of Object.values(val)) {
      _traverse(item, seen);
    }
  }
};
