import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { X } from "lucide-react";
import { SlideRenderer } from "./components/SlideRenderer";
import { ControlDock } from "./components/ControlDock";
import { slideData } from "./data/slideData";
import { deckTitle, themePreset, venuePreset } from "./lib/presentationConfig";
import { themeClassNames, themeLabels, venueLabels } from "./lib/presets";

const STAGE_WIDTH = 1200;
const STAGE_HEIGHT = 675;
const MIN_SCALE = 0.34;

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

function calculateStageScale() {
  const fullscreen = Boolean(document.fullscreenElement);
  const horizontalChrome = fullscreen ? 32 : 64;
  const verticalChrome = fullscreen ? 32 : 96;
  const availableWidth = Math.max(320, window.innerWidth - horizontalChrome);
  const availableHeight = Math.max(240, window.innerHeight - verticalChrome);
  return Math.max(MIN_SCALE, Math.min(availableWidth / STAGE_WIDTH, availableHeight / STAGE_HEIGHT));
}

function OverviewPanel({
  current,
  onSelect,
}: {
  current: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="floating-panel overview-panel" role="dialog" aria-label="Slide overview">
      <div className="panel-grid">
        {slideData.map((slide, index) => (
          <button
            className="overview-card"
            data-current={index === current}
            key={slide.id}
            type="button"
            onClick={() => onSelect(index)}
          >
            <span className="overview-number">{String(index + 1).padStart(2, "0")}</span>
            <span className="overview-title">{slide.title}</span>
            <span className="overview-cue">{slide.keyMessage}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function NotesPanel({ current }: { current: number }) {
  const slide = slideData[current];
  return (
    <aside className="floating-panel notes-panel" aria-label="Speaker notes">
      <p className="panel-kicker">Slide {current + 1}</p>
      <h2>{slide.title}</h2>
      <p>{slide.speakerNote}</p>
      {slide.evidenceNote ? <p className="evidence-note">{slide.evidenceNote}</p> : null}
    </aside>
  );
}

export default function App() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [stageScale, setStageScale] = useState(calculateStageScale);
  const deckWrapperRef = useRef<HTMLDivElement | null>(null);
  const progress = useMemo(() => ((currentSlide + 1) / slideData.length) * 100, [currentSlide]);
  const slide = slideData[currentSlide];
  const goTo = useCallback((index: number) => {
    setCurrentSlide(Math.max(0, Math.min(index, slideData.length - 1)));
  }, []);
  const themeClass = themeClassNames[themePreset];
  const shellStyle = { "--deck-scale": stageScale.toFixed(4) } as CSSProperties;

  useEffect(() => {
    document.title = deckTitle;
  }, []);

  useEffect(() => {
    const syncScale = () => setStageScale(calculateStageScale());
    syncScale();
    window.addEventListener("resize", syncScale);
    window.visualViewport?.addEventListener("resize", syncScale);
    document.addEventListener("fullscreenchange", syncScale);
    return () => {
      window.removeEventListener("resize", syncScale);
      window.visualViewport?.removeEventListener("resize", syncScale);
      document.removeEventListener("fullscreenchange", syncScale);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;
      const key = event.key.toLowerCase();
      if (["arrowright", "arrowleft", " ", "home", "end"].includes(key)) event.preventDefault();
      if (key === "arrowright" || key === " ") setCurrentSlide((value) => Math.min(value + 1, slideData.length - 1));
      if (key === "arrowleft") setCurrentSlide((value) => Math.max(value - 1, 0));
      if (key === "home") setCurrentSlide(0);
      if (key === "end") setCurrentSlide(slideData.length - 1);
      if (key === "f") deckWrapperRef.current?.requestFullscreen?.();
      if (key === "o") setShowOverview((value) => !value);
      if (key === "n") setShowNotes((value) => !value);
      if (key === "escape") {
        setShowHelp(false);
        setShowNotes(false);
        setShowOverview(false);
      }
      if (/^[1-9]$/.test(key)) {
        const nextIndex = Number(key) - 1;
        if (nextIndex < slideData.length) setCurrentSlide(nextIndex);
      }
      if (key === "?") setShowHelp((value) => !value);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <main className={`app-shell ${themeClass}`} style={shellStyle}>
      <div ref={deckWrapperRef} className="deck-viewport">
        <div className="deck-frame" role="region" aria-label={deckTitle}>
          <div className="progress-track" aria-hidden="true">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>

          <div className="deck-meta" aria-label="Deck metadata">
            <span>{venueLabels[venuePreset]}</span>
            <span>{themeLabels[themePreset]}</span>
            {slide.appendix ? <span>Appendix</span> : null}
          </div>

          <div className={`slide-stage ${showNotes ? "slide-stage-notes" : ""}`} key={currentSlide}>
            <SlideRenderer slide={slide} theme={themePreset} />
          </div>

          {showHelp ? (
            <div className="floating-panel help-panel" role="dialog" aria-label="Keyboard shortcuts">
              <div className="panel-header">
                <p>Keyboard</p>
                <button type="button" className="icon-button" onClick={() => setShowHelp(false)} aria-label="Close keyboard help">
                  <X aria-hidden="true" />
                </button>
              </div>
              <dl>
                <div><dt>Left / Right</dt><dd>Slide navigation</dd></div>
                <div><dt>Space</dt><dd>Next slide</dd></div>
                <div><dt>1-9</dt><dd>Jump</dd></div>
                <div><dt>O / N / F</dt><dd>Overview, notes, fullscreen</dd></div>
              </dl>
            </div>
          ) : null}

          {showOverview ? <OverviewPanel current={currentSlide} onSelect={(index) => { goTo(index); setShowOverview(false); }} /> : null}
          {showNotes ? <NotesPanel current={currentSlide} /> : null}

          <ControlDock
            count={slideData.length}
            current={currentSlide}
            notesOpen={showNotes}
            overviewOpen={showOverview}
            helpOpen={showHelp}
            onPrev={() => goTo(currentSlide - 1)}
            onNext={() => goTo(currentSlide + 1)}
            onFullscreen={() => deckWrapperRef.current?.requestFullscreen?.()}
            onHelp={() => setShowHelp((value) => !value)}
            onNotes={() => setShowNotes((value) => !value)}
            onOverview={() => setShowOverview((value) => !value)}
          />
        </div>
      </div>
    </main>
  );
}
