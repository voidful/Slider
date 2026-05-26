import { useEffect, useRef, type RefObject } from "react";

const MIN_SWIPE_PX = 50;
const MAX_SWIPE_MS = 600;
const WHEEL_PAGE_THRESHOLD_PX = 14;
const WHEEL_NAV_COOLDOWN_MS = 140;
const WHEEL_GESTURE_IDLE_MS = 90;

function shouldIgnoreInputTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("input, textarea, select, [contenteditable='true'], [data-wheel-nav-ignore]"));
}

function normalizeWheelDelta(delta: number, deltaMode: number) {
  if (deltaMode === WheelEvent.DOM_DELTA_LINE) return delta * 16;
  if (deltaMode === WheelEvent.DOM_DELTA_PAGE) return delta * 800;
  return delta;
}

function isVisualViewportZoomed() {
  return window.visualViewport != null && window.visualViewport.scale > 1.01;
}

export function useWheelPageNavigation<T extends HTMLElement>({
  ref,
  enabled = true,
  canPrev,
  canNext,
  onPrev,
  onNext,
}: {
  ref: RefObject<T | null>;
  enabled?: boolean;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  const accumulatedDeltaRef = useRef(0);
  const lastWheelAtRef = useRef(0);
  const lastNavigateAtRef = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    const onWheel = (event: WheelEvent) => {
      if (event.defaultPrevented || event.ctrlKey || shouldIgnoreInputTarget(event.target)) return;
      if (isVisualViewportZoomed()) return;

      const deltaY = normalizeWheelDelta(event.deltaY, event.deltaMode);
      const deltaX = normalizeWheelDelta(event.deltaX, event.deltaMode);
      if (Math.abs(deltaY) <= Math.abs(deltaX)) return;

      const now = performance.now();
      if (now - lastWheelAtRef.current > WHEEL_GESTURE_IDLE_MS) accumulatedDeltaRef.current = 0;
      lastWheelAtRef.current = now;

      if (now - lastNavigateAtRef.current < WHEEL_NAV_COOLDOWN_MS) {
        event.preventDefault();
        return;
      }

      accumulatedDeltaRef.current += deltaY;
      if (Math.abs(accumulatedDeltaRef.current) < WHEEL_PAGE_THRESHOLD_PX) {
        event.preventDefault();
        return;
      }

      const direction = Math.sign(accumulatedDeltaRef.current);
      accumulatedDeltaRef.current = 0;
      event.preventDefault();

      if (direction > 0 && canNext) {
        lastNavigateAtRef.current = now;
        onNext();
      }
      if (direction < 0 && canPrev) {
        lastNavigateAtRef.current = now;
        onPrev();
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [canNext, canPrev, enabled, onNext, onPrev, ref]);
}

export function useTouchSwipe<T extends HTMLElement>({
  ref,
  enabled = true,
  onPrev,
  onNext,
}: {
  ref: RefObject<T | null>;
  enabled?: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  const startRef = useRef<{ x: number; y: number; t: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    const onStart = (event: TouchEvent) => {
      if (shouldIgnoreInputTarget(event.target) || event.touches.length !== 1) {
        startRef.current = null;
        return;
      }
      const touch = event.touches[0];
      startRef.current = { x: touch.clientX, y: touch.clientY, t: performance.now() };
    };

    const onEnd = (event: TouchEvent) => {
      const start = startRef.current;
      startRef.current = null;
      if (!start) return;
      const touch = event.changedTouches[0];
      if (!touch) return;
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (performance.now() - start.t > MAX_SWIPE_MS) return;
      if (Math.abs(dx) < MIN_SWIPE_PX || Math.abs(dx) <= Math.abs(dy)) return;
      if (dx < 0) onNext();
      else onPrev();
    };

    const onCancel = () => {
      startRef.current = null;
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onCancel);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onCancel);
    };
  }, [enabled, onNext, onPrev, ref]);
}

export function usePresentationKeyboard({
  blackout,
  slideCount,
  presenterMode,
  onPrev,
  onNext,
  onGoTo,
  onFullscreen,
  onPresenter,
  onLaser,
  onBlackout,
  onToggleHelp,
  onToggleNotes,
  onToggleOverview,
  onToggleReview,
  onToggleVisualAssets,
  onToggleDesignLock,
  onCloseOverlays,
}: {
  blackout: "black" | "white" | null;
  slideCount: number;
  presenterMode: boolean;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (index: number) => void;
  onFullscreen: () => void;
  onPresenter: () => void;
  onLaser: () => void;
  onBlackout: (mode: "black" | "white" | null) => void;
  onToggleHelp: () => void;
  onToggleNotes: () => void;
  onToggleOverview: () => void;
  onToggleReview: () => void;
  onToggleVisualAssets: () => void;
  onToggleDesignLock: () => void;
  onCloseOverlays: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreInputTarget(event.target)) return;
      const key = event.key.toLowerCase();
      if (["arrowright", "arrowleft", " ", "home", "end", "pagedown", "pageup"].includes(key)) event.preventDefault();
      if (key === "arrowright" || key === " " || key === "pagedown") onNext();
      if (key === "arrowleft" || key === "pageup") onPrev();
      if (key === "home") onGoTo(0);
      if (key === "end") onGoTo(slideCount - 1);
      if (key === "f" && !presenterMode) onFullscreen();
      if (key === "p" && !presenterMode) onPresenter();
      if (key === "l" && !presenterMode) onLaser();
      if (key === "b") onBlackout(blackout === "black" ? null : "black");
      if (key === "w") onBlackout(blackout === "white" ? null : "white");
      if (key === "c" && !presenterMode) onToggleReview();
      if (key === "v" && !presenterMode) onToggleVisualAssets();
      if (key === "d" && !presenterMode) onToggleDesignLock();
      if (key === "o") onToggleOverview();
      if (key === "n") onToggleNotes();
      if (key === "escape") {
        if (blackout) onBlackout(null);
        onCloseOverlays();
      }
      if (/^[1-9]$/.test(key)) {
        const nextIndex = Number(key) - 1;
        if (nextIndex < slideCount) onGoTo(nextIndex);
      }
      if (key === "?") onToggleHelp();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    blackout,
    onBlackout,
    onCloseOverlays,
    onFullscreen,
    onGoTo,
    onLaser,
    onNext,
    onPresenter,
    onPrev,
    onToggleHelp,
    onToggleNotes,
    onToggleOverview,
    onToggleReview,
    onToggleVisualAssets,
    onToggleDesignLock,
    presenterMode,
    slideCount,
  ]);
}
