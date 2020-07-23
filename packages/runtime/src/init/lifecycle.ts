import {
  WEAPP_APP_LIFECYCLE,
  WEAPP_COMPONENT_LIFECYCLE,
  WEAPP_COMPONENT_PAGE_LIFECYCLE,
  WEAPP_PAGE_LIFECYCLE
} from '../constant/lifecycle';

import { isArray } from 'lodash-es';

/**
 * 在合并 mixin 到 option 之后，有多个方法的生命周期属性被合并成了数组，这里将其重新展开成依次执行的函数。
 *
 * @param option mixin 后的选项对象
 * @param lifecycleList 生命周期名称数组
 */
const transformLifecyclePropertyFromArrayToFunction = (option, lifecycleList) => {
  const patchedOption = {};

  for (const [key, value] of Object.entries(option)) {
    patchedOption[key] = (
      lifecycleList.includes(key) && isArray(value) ?
        () => (value as Function[]).forEach(func => void func()) :
        value
    );
  }

  return patchedOption;
}


export const patchAppLifecycle = option => {
  return transformLifecyclePropertyFromArrayToFunction(option, WEAPP_APP_LIFECYCLE);
};

export const patchComponentLifecycle = option => {
  return transformLifecyclePropertyFromArrayToFunction(option, [...WEAPP_COMPONENT_LIFECYCLE, ...WEAPP_COMPONENT_PAGE_LIFECYCLE]);
}

export const patchPageLifecycle = option => {
  return transformLifecyclePropertyFromArrayToFunction(option, [...WEAPP_COMPONENT_LIFECYCLE, ...WEAPP_PAGE_LIFECYCLE]);
}
