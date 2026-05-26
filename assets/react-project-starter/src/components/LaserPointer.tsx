import { useEffect, useState, type RefObject } from "react";

type Position = { x: number; y: number } | null;

export function LaserPointer({
  enabled,
  rootRef,
}: {
  enabled: boolean;
  rootRef: RefObject<HTMLElement>;
}) {
  const [position, setPosition] = useState<Position>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!enabled || !root) {
      setPosition(null);
      return;
    }

    const onMove = (event: PointerEvent) => setPosition({ x: event.clientX, y: event.clientY });
    const onLeave = () => setPosition(null);
    root.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerleave", onLeave);
    return () => {
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled, rootRef]);

  if (!enabled || !position) return null;
  return (
    <div
      aria-hidden="true"
      className="laser-pointer"
      style={{ transform: `translate3d(${position.x - 9}px, ${position.y - 9}px, 0)` }}
    />
  );
}
