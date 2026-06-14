import { ChevronLeft, ChevronRight, RotateCcw, Square, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { SlideRenderer } from "./SlideRenderer";
import type { BlackoutMode, PresenterSnapshot } from "../lib/presenterWindow";
import type { Slide, Theme } from "../types";

type PresenterPanelProps = {
  slides: Slide[];
  theme: Theme;
  state: PresenterSnapshot;
  connected: boolean;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (index: number) => void;
  onBlackout: (mode: BlackoutMode) => void;
  onResetTimer: () => void;
};

function formatElapsed(startedAt: number, now: number) {
  const elapsed = Math.max(0, Math.floor((now - startedAt) / 1000));
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;
  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function PresenterPreview({ slide, theme, large = false }: { slide?: Slide; theme: Theme; large?: boolean }) {
  if (!slide) {
    return <div className="presenter-empty-preview">End of deck</div>;
  }
  return (
    <div className={large ? "presenter-preview presenter-preview-large" : "presenter-preview"}>
      <div className="presenter-preview-stage">
        <div className="slide-stage presenter-preview-slide">
          <SlideRenderer slide={slide} theme={theme} />
        </div>
      </div>
    </div>
  );
}

function PresenterButton({
  children,
  disabled,
  pressed,
  title,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  pressed?: boolean;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      className="presenter-button"
      type="button"
      aria-label={title}
      aria-pressed={pressed}
      disabled={disabled}
      title={title}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function PresenterPanel({
  slides,
  theme,
  state,
  connected,
  onPrev,
  onNext,
  onGoTo,
  onBlackout,
  onResetTimer,
}: PresenterPanelProps) {
  const [now, setNow] = useState(() => Date.now());
  const [jumpValue, setJumpValue] = useState("");
  const current = slides.length ? Math.max(0, Math.min(state.index, slides.length - 1)) : 0;
  const slide = slides[current];
  const nextSlide = slides[current + 1];
  const progress = slides.length ? ((current + 1) / slides.length) * 100 : 0;

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="presenter-shell" aria-label="Presenter mode">
      <header className="presenter-topbar">
        <div>
          <p className="presenter-kicker">Presenter</p>
          <h1>{state.deckTitle}</h1>
        </div>
        <div className="presenter-status">
          <span data-connected={connected}>{connected ? "Linked" : "Local preview"}</span>
          <time>{new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
          <strong>{formatElapsed(state.startedAt, now)}</strong>
          <span>{String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span>
        </div>
      </header>

      <div className="presenter-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="presenter-grid">
        <main className="presenter-current">
          <p className="presenter-section-label">Now showing</p>
          <PresenterPreview slide={slide} theme={theme} large />
          {state.blackout ? <div className={`presenter-blackout presenter-blackout-${state.blackout}`}>{state.blackout} screen</div> : null}
        </main>

        <aside className="presenter-side">
          <div>
            <p className="presenter-section-label">{nextSlide ? "Up next" : "Last slide"}</p>
            <PresenterPreview slide={nextSlide} theme={theme} />
          </div>

          <div className="presenter-notes">
            <p className="presenter-section-label">Speaker notes</p>
            <h2>{slide?.title ?? "End of deck"}</h2>
            <p>{slide?.speakerNote || "No speaker notes for this slide."}</p>
            {slide?.evidenceNote ? <p className="presenter-evidence-note">{slide.evidenceNote}</p> : null}
          </div>

          <form
            className="presenter-jump"
            onSubmit={(event) => {
              event.preventDefault();
              const value = Number.parseInt(jumpValue, 10);
              if (Number.isFinite(value) && value >= 1 && value <= slides.length) {
                onGoTo(value - 1);
                setJumpValue("");
              }
            }}
          >
            <label htmlFor="presenter-jump">Jump</label>
            <input
              id="presenter-jump"
              type="number"
              min={1}
              max={slides.length}
              placeholder={String(current + 1)}
              value={jumpValue}
              onChange={(event) => setJumpValue(event.target.value)}
            />
            <span>/ {slides.length}</span>
          </form>
        </aside>
      </div>

      <footer className="presenter-bottombar">
        <div className="presenter-button-row">
          <PresenterButton title="Previous slide" disabled={current === 0} onClick={onPrev}>
            <ChevronLeft aria-hidden="true" /> Previous
          </PresenterButton>
          <PresenterButton title="Next slide" disabled={current >= slides.length - 1} onClick={onNext}>
            Next <ChevronRight aria-hidden="true" />
          </PresenterButton>
        </div>
        <div className="presenter-button-row">
          <PresenterButton
            title="Black screen"
            pressed={state.blackout === "black"}
            onClick={() => onBlackout(state.blackout === "black" ? null : "black")}
          >
            <Square aria-hidden="true" /> Black
          </PresenterButton>
          <PresenterButton
            title="White screen"
            pressed={state.blackout === "white"}
            onClick={() => onBlackout(state.blackout === "white" ? null : "white")}
          >
            <Sun aria-hidden="true" /> White
          </PresenterButton>
          <PresenterButton title="Reset timer" onClick={onResetTimer}>
            <RotateCcw aria-hidden="true" /> Reset
          </PresenterButton>
        </div>
      </footer>
    </section>
  );
}
