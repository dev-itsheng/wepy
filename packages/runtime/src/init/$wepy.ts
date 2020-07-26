import WepyApp from '../class/WepyApp';

export const patchApp$wepy = (option, rel) => 1 && {
  ...option,
  $wepy: {
    ...new WepyApp(),
    $route: null,
    $rel: rel,
    hooks: option.hooks
  }
}
