import wepy from '../index';

type wepyType = typeof wepy;

interface pluginType {
  install: (wepy: wepyType, ...args: any[]) => void;
}

const installedPlugins: pluginType[] = [];

export default function(plugin: pluginType, ...args: any[]) {
  if (installedPlugins.includes(plugin)) {
    return;
  }

  plugin.install(this, ...args);

  installedPlugins.push(plugin);
}