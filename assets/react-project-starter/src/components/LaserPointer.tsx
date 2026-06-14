import { useEffect, useState, type RefObject } from "react";

type Position = { x: number; y: number } | null;

const STAGE_WIDTH = 1200;

/**
 * Soft laser dot that tracks the cursor over the slide.
 *
 * The dot is an absolute child of the scaled `.deck-frame`, so it is placed in
 * the frame's fixed 1200x675 coordinate space and then scaled with the frame.
 * We derive the live scale from the frame's own bounding rect (rect.width /
 * 1200) so the dot stays under the cursor at any zoom and in fullscreen, where
 * the frame is centered rather than top-left aligned.
 */
export function LaserPointer({
  enabled,
  frameRef,
}: {
  enabled: boolean;
  frameRef: RefObject<HTMLElement>;
}) {
  const [position, setPosition] = useState<Position>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!enabled || !frame) {
      setPosition(null);
      return;
    }

    const onMove = (event: PointerEvent) => {
      const rect = frame.getBoundingClientRect();
      if (rect.width === 0) return;
      const scale = rect.width / STAGE_WIDTH;
      setPosition({
        x: (event.clientX - rect.left) / scale,
        y: (event.clientY - rect.top) / scale,
      });
    };
    const onLeave = () => setPosition(null);
    frame.addEventListener("pointermove", onMove, { passive: true });
    frame.addEventListener("pointerleave", onLeave);
    return () => {
      frame.removeEventListener("pointermove", onMove);
      frame.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled, frameRef]);

  if (!enabled || !position) return null;
  return (
    <div
      aria-hidden="true"
      className="laser-pointer"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    />
  );
}
