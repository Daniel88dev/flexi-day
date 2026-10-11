import { vi } from "vitest";

export function stubViewport({ width, mouse = true }: { width: number; mouse?: boolean }) {
  vi.spyOn(window, "matchMedia").mockImplementation((query: string) => {
    const wide = width >= 768;
    const matches = query.includes("pointer: fine") ? wide && mouse : wide;
    return {
      matches,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    } as unknown as MediaQueryList;
  });
}

export const mouse = { pointerType: "mouse", button: 0, clientX: 100, clientY: 100 };
