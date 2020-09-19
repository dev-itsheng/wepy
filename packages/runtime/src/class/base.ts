import { handleError } from '../util';
import { isArray } from 'lodash-es';

interface Event {
  [eventName: string]: Function[];
}

export default class Base {
  _events: Event = {};

  $on(event: string | string[], fn: Function) {
    if (isArray(event)) {
      for (const item of event) {
        this.$on(item, fn);
      }
    } else {
      if (!this._events[event]) {
        this._events[event] = [];
      }

      this._events[event].push(fn);
    }

    return this;
  }

  $once(event: string | string[], fn: Function) {
    const handler = (...args: any[]) => {
      this.$off(event, handler);
      fn.apply(this, args)
    };

    this.$on(event, handler);

    return this;
  }

  $off(event?: string | string[], fn?: Function) {
    if (!event && !fn) {
      this._events = Object.create(null);
    } else if (isArray(event)) {
      for (const item of event) {
        this.$off(item, fn);
      }
    } else {
      const fns = this._events[event as string];

      if (fns) {
        if (!fn) {
          this._events[event as string] = [];
        } else {
          this._events[event as string] = fns.filter(fnn => fnn !== fn);
        }
      }
    }

    return this;
  }

  $emit(event: string, ...args: any[]) {
    let vm = this;
    let lowerCaseEvent = event.toLowerCase();

    if (lowerCaseEvent !== event && vm._events[lowerCaseEvent]) {
      // TODO: handler warn
    }

    let fns = this._events[event] || [];

    for (const fn of fns) {
      try {
        fn.apply(this, args);
      } catch (e) {
        handleError(e, vm, `event handler for "${event}"`);
      }
    }

    return this;
  }
}
