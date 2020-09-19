import { composeGlobalMixins, Mixin } from '../util/mixin';
import config from '../api/config';

const { optionMergeStrategies } = config;

const mergeOptionsFromMixin = (options, mixin: Mixin) => {
  const mergedOption = {};

  for (const [key, value] of Object.entries(mixin)) {
    mergedOption[key] = (

      // 先去检查合并策略（默认或用户自定义）中是否有对应键名的处理方法
      optionMergeStrategies.hasOwnProperty(key) ?

        // 如果有，则使用
        optionMergeStrategies[key](options[key], value) :

        // 如果没有，则执行简单的合并策略
        // 如果组件选项对象中没有该键名，则使用 mixin 中的值
        // 多个 mixin 有相同值时，根据函数调用顺序，优先级高的值将覆盖优先级低的
        options.hasOwnProperty(key) ?
          options[key] :
          value
    );
  }

  return mergedOption;
}

/**
 * 将去掉 mixins 属性的 option 作为初始元素，与所有（包含全局）的 mixins 进行合并
 */
export const mergeMixins = (options: any) => {
  const { mixins = [], ...restOptionsWithoutMixins } = options;

  return composeGlobalMixins(mixins).reduce(mergeOptionsFromMixin, restOptionsWithoutMixins);
};
