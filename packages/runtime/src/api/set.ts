import { set } from '../observer/index';

export default function(target, key: string, val: any) {
  set.apply(this, [undefined, target, key, val]);
}
