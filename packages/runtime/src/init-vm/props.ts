import { proxy } from '../util';
import { observe } from './../observer/index';
import { isArray, pick } from 'lodash-es';

export default (vm, props) => {
  const propsNames = isArray(props) ? props : Object.keys(props)

  vm._props = pick(vm.$wx.data, propsNames);

  for (const propsName of propsNames) {
    proxy(vm, '_props', propsName);
  }

  observe({
    vm,
    key: '',
    value: vm._props,
    root: true
  });
}
