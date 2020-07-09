import 'miniprogram-api-typings/types/wx/lib.wx.app';

import { patchMixins, patchAppLifecycle } from '../init/index';

export default (option, rel) => {
  let appConfig = {};

  patchMixins(appConfig, option, option.mixins);
  patchAppLifecycle(appConfig, option, rel);

  return App(appConfig);
}
