import "@testing-library/jest-dom";

// jsdom ships no ResizeObserver, and Radix primitives that measure themselves
// (Switch, Select, …) throw on mount without it. Nothing under test depends on
// real measurements, so a no-op is enough.
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
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
