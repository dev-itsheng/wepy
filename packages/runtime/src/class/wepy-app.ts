import Base from './base';

interface WepyAppOptions {
  methods?: {
    [key: string]: Function
  }
}

export default class WepyApp extends Base {
  private $options: any;

  constructor(options: WepyAppOptions) {
    super();
    this.$options = options;

    const { methods } = options;

    if (methods) {
      Object.assign(this, methods);
    }
  }
}
