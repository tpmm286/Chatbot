/**
 * Polyfills and fallbacks for legacy browsers:
 * - Android 7 (Chrome 53 - 70 WebView)
 * - Windows 7 (Legacy Chrome / Edge / Firefox)
 */

// 1. globalThis polyfill
if (typeof (window as any).globalThis === 'undefined') {
  (window as any).globalThis = window;
}

// 2. Object.fromEntries polyfill (Chrome 73+)
if (!(Object as any).fromEntries) {
  (Object as any).fromEntries = function (entries: any) {
    if (!entries || !entries[Symbol.iterator]) {
      throw new TypeError('Object.fromEntries() requires an iterable');
    }
    const obj: any = {};
    for (const pair of entries) {
      if (Object(pair) !== pair) {
        throw new TypeError('iterable for fromEntries should yield objects');
      }
      obj[pair[0]] = pair[1];
    }
    return obj;
  };
}

// 3. Array.prototype.flat & flatMap polyfills (Chrome 69+)
if (!(Array.prototype as any).flat) {
  (Array.prototype as any).flat = function (depth?: number) {
    const d = depth === undefined ? 1 : Math.floor(depth);
    if (d < 1) return Array.prototype.slice.call(this);
    return (function flatten(arr: any[], curDepth: number): any[] {
      return arr.reduce(function (acc: any[], val: any) {
        return acc.concat(
          curDepth > 0 && Array.isArray(val) ? flatten(val, curDepth - 1) : val
        );
      }, []);
    })(this, d);
  };
}

if (!(Array.prototype as any).flatMap) {
  (Array.prototype as any).flatMap = function (callback: any, thisArg?: any) {
    return (this as any).map(callback, thisArg).flat();
  };
}

// 4. Promise.allSettled polyfill (Chrome 76+)
if (!(Promise as any).allSettled) {
  (Promise as any).allSettled = function (promises: any[]) {
    return Promise.all(
      promises.map((p) =>
        Promise.resolve(p).then(
          (value) => ({ status: 'fulfilled' as const, value }),
          (reason) => ({ status: 'rejected' as const, reason })
        )
      )
    );
  };
}

// 5. queueMicrotask polyfill (Chrome 71+)
if (typeof (window as any).queueMicrotask !== 'function') {
  (window as any).queueMicrotask = function (callback: () => void) {
    Promise.resolve()
      .then(callback)
      .catch((e) =>
        setTimeout(() => {
          throw e;
        }, 0)
      );
  };
}

// 6. requestIdleCallback fallback (Safari / older mobile browsers)
if (typeof (window as any).requestIdleCallback !== 'function') {
  (window as any).requestIdleCallback = function (cb: any) {
    const start = Date.now();
    return setTimeout(function () {
      cb({
        didTimeout: false,
        timeRemaining: function () {
          return Math.max(0, 50 - (Date.now() - start));
        },
      });
    }, 1);
  };
  (window as any).cancelIdleCallback = function (id: any) {
    clearTimeout(id);
  };
}

// 7. AbortController / AbortSignal safety fallback (Chrome 66+)
if (typeof (window as any).AbortController === 'undefined') {
  class SimpleAbortSignal {
    aborted = false;
    onabort: any = null;
    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() {
      return true;
    }
  }

  class SimpleAbortController {
    signal = new SimpleAbortSignal();
    abort() {
      this.signal.aborted = true;
      if (typeof this.signal.onabort === 'function') {
        try {
          this.signal.onabort();
        } catch (e) {
          console.warn(e);
        }
      }
    }
  }

  (window as any).AbortController = SimpleAbortController;
  (window as any).AbortSignal = SimpleAbortSignal;
}

// 8. ResizeObserver basic dummy fallback
if (typeof (window as any).ResizeObserver === 'undefined') {
  (window as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

export {};
