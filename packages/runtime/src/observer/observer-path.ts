/**
 * @desc ObserverPath 类以及相关处理函数
 * Observer 所在位置对应在整棵 data tree 的路径集合
 * @createDate 2019-07-21
 */
import { isNumber, isArray } from 'lodash-es';
import { Observer, ObservedValue } from './observer';

/**
 * 生成完整路径
 * @param key  {String|Number} 当为字符串时，说明是属性名，当为数字时，说明是索引
 * @param parentPath {String} 父路径
 * @return {string}
 */
const composePath = (parentPath: string, key: string | number) => {
  return isNumber(key) ? `${parentPath}[${key}]` : `${parentPath}.${key}`;
};

interface PathObj {
  key: string | number;
  root: string;
  path: string;
}

export interface PathMap {
  [key: string]: PathObj
}

export default class ObserverPath {
  private readonly ob: Observer;
  readonly pathMap: PathMap | null;

  constructor(ob: Observer)
  constructor(ob: Observer, key: string | number, parentOp: ObserverPath)
  constructor(ob: Observer, key?: string | number, parentOp?: ObserverPath) {
    this.ob = ob;

    if (key && parentOp) {
      this.pathMap = combinePathMapWithKey(parentOp.pathMap, key);
    } else {
      this.pathMap = null;
    }
  }

  private traverseOp(
    key: string | number,
    pathMap: PathMap,
    handler: (pathObj: PathObj, op: ObserverPath) => PathObj | null
  ) {
    let hasChange = false;
    const handlePathMap: PathMap = {};

    for (const pathValue of Object.values(combinePathMapWithKey(pathMap, key))) {
      const pathObj = handler(pathValue, this);
      if (pathObj) {
        hasChange = true;
        handlePathMap[pathObj.path] = pathObj;
      }
    }

    if (hasChange) {
      const { value } = this.ob;

      if (isArray(value)) {
        value.forEach((item: ObservedValue, index) => {
          item.__ob__.op.traverseOp(index, handlePathMap, handler);
        });
      } else {
        for (const [key, item] of Object.entries(value)) {

          // TODO: 在这里 item 被判断为 Observer，而实际上应该是 ObservedValue
          // @ts-ignore
          item.__ob__.op.traverseOp(key, handlePathMap, handler);
        }
      }
    }
  }

  private addPath(pathObj: PathObj) {
    (<PathMap>this.pathMap)[pathObj.path] = pathObj;
  }

  private delPath(path: string) {
    delete (<PathMap>this.pathMap)[path];
  }

  addPaths(newKey: string | number, parentOp: ObserverPath) {
    this.traverseOp(newKey, <PathMap>parentOp.pathMap, (pathObj, op) => {
      if (!(pathObj.path in <PathMap>op.pathMap)) {
        this.addPath(pathObj);
        return pathObj;
      }

      return null;
    });
  }

  cleanPaths(oldKey: string | number, parentOp: ObserverPath) {
    this.traverseOp(oldKey, <PathMap>parentOp.pathMap, (pathObj, op) => {
      op.delPath(pathObj.path);
      return pathObj;
    });
  }
}

/**
 * 得到 pathMap 与 key 组合后的路径集合
 */
export const combinePathMapWithKey = (pathMap: PathMap | null, key: string | number) => {
  if (pathMap) {
    const combinedPathMap: PathMap = {};

    for (const pathObj of Object.values(pathMap)) {
      const path = composePath(pathObj.path, key);
      combinedPathMap[path] = { key, root: pathObj.root, path };
    }

    return combinedPathMap;
  }

  return <PathMap>{ [key]: { key, root: key, path: key } };
}
