import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { IsoDate } from "@/lib/api/types";
import { normalizeRange, type DateRange } from "@/lib/calendar/drag-range";
import { MOBILE_BREAKPOINT } from "@/hooks/use-mobile";

const DESKTOP_QUERY = `(min-width: ${MOBILE_BREAKPOINT}px)`;
const MOUSE_DESKTOP_QUERY = `${DESKTOP_QUERY} and (hover: hover) and (pointer: fine)`;
const DATE_ATTR = "data-drag-date";

type Gesture = { anchor: IsoDate; head: IsoDate; x: number; y: number; active: boolean };

export type DragRangeState = {
  /** The selected range while a drag is live, normalised; null otherwise. */
  range: DateRange | null;
  pointer: { x: number; y: number } | null;
  /** A mouse on the desktop layout: show the crosshair cue. */
  canDrag: boolean;
  cellProps: (date: IsoDate) => {
    [DATE_ATTR]: IsoDate;
    onPointerDown: (e: ReactPointerEvent) => void;
  };
  /** True for the click that ends a drag; the cell's click handler should then do nothing. */
  isClickSuppressed: () => boolean;
};

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(MOUSE_DESKTOP_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function dateAt(target: EventTarget | null): IsoDate | null {
  if (!(target instanceof Element)) return null;
  return target.closest(`[${DATE_ATTR}]`)?.getAttribute(DATE_ATTR) ?? null;
}

/**
 * Press a day cell, drag to another, release: `onSelect` gets the range. Mouse only, desktop
 * layout only; anything else stays a click. The head only ever lands on a cell carrying
 * `cellProps`, so the range never leaves the visible grid.
 */
export function useDragRange(onSelect: (range: DateRange) => void): DragRangeState {
  const [gesture, setGesture] = useState<Gesture | null>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const suppressClickRef = useRef(false);
  const detachRef = useRef<(() => void) | null>(null);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  });
  useEffect(() => () => detachRef.current?.(), []);

  const canDrag = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(MOUSE_DESKTOP_QUERY).matches,
    () => false
  );

  const updateGesture = (next: Gesture | null) => {
    gestureRef.current = next;
    setGesture(next);
  };

  const cellProps = useCallback((date: IsoDate) => {
    const onPointerDown = (e: ReactPointerEvent) => {
      if (e.button !== 0 || e.pointerType !== "mouse") return;
      if (!window.matchMedia(DESKTOP_QUERY).matches) return;
      detachRef.current?.();
      updateGesture({ anchor: date, head: date, x: e.clientX, y: e.clientY, active: false });
      let moved = false;
      const swallowClick = () => {
        suppressClickRef.current = true;
        setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);
      };
      const swallowClickOnRelease = () => {
        suppressClickRef.current = true;
        window.addEventListener("pointerup", swallowClick, { once: true });
      };

      const move = (ev: PointerEvent) => {
        const current = gestureRef.current;
        if (!current) return;
        const head = dateAt(ev.target) ?? current.head;
        const active = current.active || head !== current.anchor;
        if (active && !current.active) {
          ev.preventDefault();
          window.getSelection()?.removeAllRanges();
        }
        moved ||= active;
        updateGesture({ ...current, head, x: ev.clientX, y: ev.clientY, active });
      };
      const cancel = () => updateGesture(null);
      const key = (ev: KeyboardEvent) => {
        if (ev.key !== "Escape") return;
        cancelAndCleanup();
        if (moved) swallowClickOnRelease();
      };
      const up = () => {
        const current = gestureRef.current;
        cleanup();
        updateGesture(null);
        if (moved) swallowClick();
        if (current?.active) onSelectRef.current(normalizeRange(current.anchor, current.head));
      };
      const cleanup = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", cancelAndCleanup);
        window.removeEventListener("keydown", key);
        window.removeEventListener("blur", cancelAndCleanup);
        detachRef.current = null;
      };
      const cancelAndCleanup = () => {
        cleanup();
        cancel();
      };

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", cancelAndCleanup);
      window.addEventListener("keydown", key);
      window.addEventListener("blur", cancelAndCleanup);
      detachRef.current = cleanup;
    };
    return { [DATE_ATTR]: date, onPointerDown };
  }, []);

  const isClickSuppressed = useCallback(() => suppressClickRef.current, []);

  const active = gesture?.active === true;
  return {
    range: active ? normalizeRange(gesture.anchor, gesture.head) : null,
    pointer: active ? { x: gesture.x, y: gesture.y } : null,
    canDrag,
    cellProps,
    isClickSuppressed,
  };
}
