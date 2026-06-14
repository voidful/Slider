import { useEffect, useId, useRef, type RefObject } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function focusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement,
  );
}

/**
 * Accessible dialog behavior for the floating panels:
 * - records the previously focused element and restores it on unmount,
 * - moves focus into the panel (preferring an explicit initial target),
 * - closes on Escape locally so each panel owns its own dismissal,
 * - when `modal` (default), traps Tab / Shift+Tab inside the panel.
 *
 * Side-panel tools (review, visual assets, design lock, tweaks) pass
 * `modal: false` so the deck stays interactive (e.g. clicking slide
 * elements to attach review comments) and Tab can leave the panel.
 *
 * Returns a labelledby id to wire `aria-labelledby` to the panel heading.
 */
export function useModalDialog<T extends HTMLElement = HTMLDivElement>(
  onClose: () => void,
  options: { initialFocusRef?: RefObject<HTMLElement>; modal?: boolean } = {},
): { containerRef: RefObject<T>; titleId: string } {
  const containerRef = useRef<T>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  onCloseRef.current = onClose;
  const initialFocusRef = options.initialFocusRef;
  const modal = options.modal ?? true;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const initial = initialFocusRef?.current ?? focusableElements(container)[0] ?? container;
    if (!container.hasAttribute("tabindex") && initial === container) container.setAttribute("tabindex", "-1");
    initial.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (!modal || event.key !== "Tab") return;
      const focusable = focusableElements(container);
      if (focusable.length === 0) {
        event.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === container)) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    container.addEventListener("keydown", onKeyDown);
    return () => {
      container.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [initialFocusRef, modal]);

  return { containerRef, titleId };
}
