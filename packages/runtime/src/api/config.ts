import { WEAPP_LIFECYCLE } from '../constant/lifecycle';
import { isArray } from 'lodash-es';

/**
 * 定义 mixin 的合并策略。
 *
 * 当 mixin 对象和组件自身的对象键名相同时，根据键名的类型，选取合适的合并（merge）策略。
 *
 * 优先级：全局 mixin（声明顺序由低到高）< 组件 mixin（声明顺序由低到高）< 组件选项对象。
 *
 * 对 data / props / methods / computed / watch / hooks 对象进行浅合并（单个属性深合并），在冲突情况下，以高优先级为准。
 *
 * 对生命周期函数，将合并到一个数组中，按照优先级从低到高的顺序调用。
 *
 * 对 behavior，将两个数组进行合并
 */
const optionMergeStrategies = {};

const mergeObject = (optionObject: object = {}, mixinObject: object) => 1 && { ...mixinObject, ...optionObject };

const mergeLifecycle = (optionLifecycle: Function[] | Function = [], mixinLifecycle: Function) => {
  if (!isArray(optionLifecycle)) {
    optionLifecycle = [optionLifecycle as Function];
  }

  return [mixinLifecycle, ...optionLifecycle as Function[]];
};

for (const strategy of ['data', 'props', 'methods', 'computed', 'watch', 'hooks']) {
  optionMergeStrategies[strategy] = mergeObject;
}

for (const strategy of WEAPP_LIFECYCLE) {
  optionMergeStrategies[strategy] = mergeLifecycle;
}

// @ts-ignore
optionMergeStrategies.behaviors = (optionBehaviors = [], mixinBehaviors: any[]) => [...optionBehaviors, ...mixinBehaviors];

export default {
  optionMergeStrategies
}
