import { ChevronLeft, ChevronRight, HelpCircle, Maximize } from "lucide-react";

export function ControlDock({
  count,
  current,
  onPrev,
  onNext,
  onFullscreen,
  onHelp,
}: {
  count: number;
  current: number;
  onPrev: () => void;
  onNext: () => void;
  onFullscreen: () => void;
  onHelp: () => void;
}) {
  return (
    <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-zinc-200 bg-white/85 px-3 py-2 shadow-sm backdrop-blur-md">
      <button className="rounded-full p-2 hover:bg-zinc-100" onClick={onPrev} aria-label="Previous slide"><ChevronLeft className="h-4 w-4" /></button>
      <button className="rounded-full p-2 hover:bg-zinc-100" onClick={onNext} aria-label="Next slide"><ChevronRight className="h-4 w-4" /></button>
      <div className="mx-2 text-sm font-medium text-zinc-600">{current + 1} / {count}</div>
      <button className="rounded-full p-2 hover:bg-zinc-100" onClick={onFullscreen} aria-label="Fullscreen"><Maximize className="h-4 w-4" /></button>
      <button className="rounded-full p-2 hover:bg-zinc-100" onClick={onHelp} aria-label="Help"><HelpCircle className="h-4 w-4" /></button>
    </div>
  );
}
