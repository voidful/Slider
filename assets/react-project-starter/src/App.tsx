import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { SlideRenderer } from "./components/SlideRenderer";
import { ControlDock } from "./components/ControlDock";
import { slideData } from "./data/slideData";
import { themePreset, venuePreset } from "./lib/presentationConfig";
import { themeClasses, venueLabels } from "./lib/presets";

export default function App() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const deckWrapperRef = useRef<HTMLDivElement | null>(null);
  const palette = themeClasses[themePreset];
  const progress = useMemo(() => ((currentSlide + 1) / slideData.length) * 100, [currentSlide]);
  const slide = slideData[currentSlide];
  const goTo = (index: number) => setCurrentSlide(Math.max(0, Math.min(index, slideData.length - 1)));

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "arrowright" || key === " ") goTo(currentSlide + 1);
      if (key === "arrowleft") goTo(currentSlide - 1);
      if (key === "home") goTo(0);
      if (key === "end") goTo(slideData.length - 1);
      if (key === "f") deckWrapperRef.current?.requestFullscreen?.();
      if (key === "escape") {
        setShowHelp(false);
      }
      if (/^[1-9]$/.test(key)) {
        const nextIndex = Number(key) - 1;
        if (nextIndex < slideData.length) goTo(nextIndex);
      }
      if (key === "?") setShowHelp((value) => !value);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentSlide]);



  return (
    <div className={`min-h-screen px-4 py-8 ${palette.shell}`}>
      <div ref={deckWrapperRef} className={`relative mx-auto aspect-video w-full max-w-7xl overflow-hidden rounded-3xl border shadow-2xl ${palette.frame}`}>
        <div className="absolute left-0 top-0 z-30 h-1.5 transition-all duration-300" style={{ width: `${progress}%` }}>
          <div className={`h-full w-full ${palette.accent.split(" ")[0]}`} />
        </div>

        <div className="absolute left-6 top-6 z-20 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          <span className={`rounded-full border px-3 py-1 ${palette.pill}`}>{venueLabels[venuePreset]}</span>
          <span className={`rounded-full border px-3 py-1 ${palette.pill}`}>{themePreset}</span>
          {slide.appendix ? <span className={`rounded-full border px-3 py-1 ${palette.pill}`}>Appendix</span> : null}
        </div>

        <div className={`flex h-full flex-col`}>
          <div className="min-w-0 flex-1">
            <div className="h-full px-8 py-12 md:px-14 md:py-14">
              <SlideRenderer slide={slide} theme={themePreset} />
            </div>
          </div>
        </div>

        {showHelp ? (
          <div className="absolute right-6 top-20 z-40 w-[320px] rounded-3xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-zinc-950">Keyboard shortcuts</p>
              <button onClick={() => setShowHelp(false)}><X className="h-4 w-4" /></button>
            </div>
            <ul className="mt-4 space-y-2 text-zinc-600">
              <li>← / →: previous or next</li>
              <li>Space: next slide</li>
              <li>1-9: jump to slide</li>
              <li>F: fullscreen</li>
              <li>Home / End: first or last slide</li>
              <li>Esc: close overlays</li>
            </ul>
          </div>
        ) : null}

        <ControlDock
          count={slideData.length}
          current={currentSlide}
          onPrev={() => goTo(currentSlide - 1)}
          onNext={() => goTo(currentSlide + 1)}
          onFullscreen={() => deckWrapperRef.current?.requestFullscreen?.()}
          onHelp={() => setShowHelp((value) => !value)}
        />
      </div>
    </div>
  );
}
