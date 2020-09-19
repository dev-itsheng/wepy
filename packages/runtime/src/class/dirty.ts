import ObserverPath, { combinePathMapWithKey, PathMap } from '../observer/observer-path';

interface Path {
  [key: string]: any
}

export default class Dirty {
  private _path: Path = {};

  private push(key: string, value: any) {
    this._path[key] = value;
  }

  getAndReset() {
    const data = this._path;
    this._path = {};
    return data;
  }

  replace(op: ObserverPath, value: any) {
    const { path } = Object.values(<PathMap>op.pathMap)[0];
    this.push(path, value);
  }

  set(op: ObserverPath, key: string | number, value: any) {
    const { path } = Object.values(combinePathMapWithKey(op.pathMap, key))[0];
    this.push(path, value);
  }
}
