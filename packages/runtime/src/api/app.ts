import 'miniprogram-api-typings/types/wx';
import { mergeMixins } from '../init/mixins';
import { patchAppLifecycle } from '../init/lifecycle';


import WepyApp from '../class/wepy-app';

type AppConfig = WechatMiniprogram.App.Option;

interface Rel {
  info: {
    components: {
      [component: string]: {
        path: string
      }
    },
    on: object
  },
  handlers: {
    [eventId: string]: {
      [eventName: string]: Function
    }
  },
  models: {
    [modelId: number]: {
      type: string,
      expr: string,
      handler: Function
    }
  },
  refs: object | void
}

const transformOptionsToVM = (options: object) => {
  return new WepyApp(options);
}

const buildNativeAppOptions = (vm: WepyApp) => {
  return patchAppLifecycle(vm);
}

// @ts-ignore
export default (options: object) => {

  options
    |> mergeMixins
    |> transformOptionsToVM
    |> buildNativeAppOptions
    |> App;
};
