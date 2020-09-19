import { cloneDeep } from 'lodash-es';
import { proxy } from '../util';
import WepyComponent from '../class/wepy-component';

export default (vm: WepyComponent, data) => {
  const _data = cloneDeep(data);

  vm._data = _data;

  for (const key of Object.keys(_data)) {
    proxy(vm, '_data', key);
  }
};
