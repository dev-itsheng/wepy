import { patchData, patchLifecycle, patchMethods, patchProps, patchRelations } from '../init/index';

import 'miniprogram-api-typings/types/wx/lib.wx.component';
import { mergeMixins } from '../init/mixins';
import WepyComponent from '../class/wepy-component';
import { isArray, isFunction } from 'lodash-es';
import { initProps } from '../init-vm';

interface PropsObject {
  [prop: string]: PropDefinition
}

interface PropDefinition {
  type: any;
  default: any;
}

const transformPropsToProperties = (props: string[] | PropsObject) => {
  const properties = {};

  if (isArray(props)) {
    for (const propName of props as string[]) {
      properties[propName] = null;
    }
  } else {
    for (const [propName, propDefinition] of Object.entries(props as PropsObject)) {
      const propertiesDefinition = {};

      // default 为关键字，无法解构赋值
      const { type = null } = propDefinition as PropDefinition;

      if (isArray(type)) {
        propertiesDefinition.type = type[0];
        propertiesDefinition.optionalTypes = type;
      } else {
        propertiesDefinition.type = type;
      }

      if (props.hasOwnProperty('default')) {
        const d = propDefinition.default;

        propertiesDefinition.value = isFunction(d) ? d() : d;
      }

      properties[propName] = propertiesDefinition;
    }
  }

  return properties;
};

const transformPropertiesToObservers = (vm, properties) => {
  const observers = {};

  for (const key of Object.keys(properties)) {
    observers[key] = function(value) {
      vm[key] = value;
    }
  }

  return observers;
}

const buildComponentNativeOptions = (vm: WepyComponent) => {
  const patchedOptions = {
    methods: {
      __initComponent(e) {

      },
      __dispatcher() {

      },
    },
    lifetimes: {
      created() {
        vm.$wx = this;
        this.$wepy = vm;
        vm.$is = this.is;
      },
    }
  };

  const { data, externalClasses, options, props } = vm.$options;

  if (data) {
    patchedOptions.data = data;
  }

  if (externalClasses) {
    patchedOptions.externalClasses = externalClasses;
  }

  if (options) {
    patchedOptions.options = options;
  }

  if (props) {
    const properties = transformPropsToProperties(props);

    patchedOptions.properties = properties;
    patchedOptions.observers = transformPropertiesToObservers(vm, properties);
    patchedOptions.lifetimes.attached = function() {
      initProps(vm, props);
    }
  }

  return patchedOptions;
};

const transformOptionsToVM = (options, rel) => {
  return new WepyComponent(options, rel);
}

export default (options, rel) => {
  options
    |> mergeMixins
    |> (_ => transformOptionsToVM(_, rel))
    |> buildComponentNativeOptions
    |> Component;
}


// --------------
// 分割线
const old = (opt = {}, rel) => {
  let compConfig = {
    externalClasses: opt.externalClasses || [],
    // support component options property
    // example: options: {addGlobalClass:true}
    options: opt.options || {}
  };

  patchMixins(compConfig, opt, opt.mixins);

  if (opt.properties) {
    compConfig.properties = opt.properties;
    if (opt.props) {
      // eslint-disable-next-line no-console
      console.warn(`props will be ignore, if properties is set`);
    }
  } else if (opt.props) {
    patchProps(compConfig, opt.props);
  }

  patchMethods(compConfig, opt.methods, true);

  patchData(compConfig, opt.data, true);

  patchRelations(compConfig, opt.relations);

  patchLifecycle(compConfig, opt, rel, true);

  return Component(compConfig);
}
