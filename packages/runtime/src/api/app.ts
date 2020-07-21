import 'miniprogram-api-typings/types/wx';

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

import { patchMixins } from '../init/mixins';
import {patchAppLifecycle} from '../init/lifecycle';


// @ts-ignore
// @ts-ignore
export default (option, rel: Rel) => (
  option
    |> patchMixins
    |> patchAppLifecycle
    |> App
);

