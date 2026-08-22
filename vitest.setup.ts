import "@testing-library/jest-dom";

// jsdom ships no ResizeObserver, and Radix primitives that measure themselves
// (Switch, Select, …) throw on mount without it. jsdom has no layout, so the
// callback is never worth invoking — but it has to be accepted, or this double
// silently has a different signature from the API it stands in for.
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }
    private readonly callback: ResizeObserverCallback;
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// jsdom has no scrollIntoView either; Radix Select scrolls the highlighted
// option into view when its listbox opens.
if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// jsdom also lacks the pointer-capture API; Radix Select calls it on every
// trigger click and option pick.
if (typeof Element !== "undefined" && !Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
}

// jsdom implements neither IntersectionObserver nor matchMedia; the motion
// library needs both (whileInView tracking, useReducedMotion). No-ops render
// everything in its initial state, which is all the smoke tests assert on.
if (!globalThis.IntersectionObserver) {
  globalThis.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
}
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
