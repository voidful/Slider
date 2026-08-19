import { X } from "lucide-react";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { Slide } from "../types";
import { useModalDialog } from "../lib/useModalDialog";

const OVERVIEW_COLUMNS = 3;

export function OverviewPanel({
  slides,
  current,
  onSelect,
  onClose,
}: {
  slides: Slide[];
  current: number;
  onSelect: (index: number) => void;
  onClose: () => void;
}) {
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const currentCardRef = useRef<HTMLButtonElement | null>(null);
  // The dialog hook focuses this on open, so it lands on the current slide's
  // card rather than the first card.
  const { containerRef, titleId } = useModalDialog<HTMLDivElement>(onClose, { initialFocusRef: currentCardRef });
  const [focusedIndex, setFocusedIndex] = useState(current);

  useLayoutEffect(() => {
    setFocusedIndex(current);
  }, [current]);

  const moveFocus = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(next, slides.length - 1));
    setFocusedIndex(clamped);
    cardRefs.current[clamped]?.focus({ preventScroll: true });
  }, [slides.length]);

  const onGridKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    const key = event.key;
    if (key === "ArrowRight") { event.preventDefault(); moveFocus(focusedIndex + 1); }
    else if (key === "ArrowLeft") { event.preventDefault(); moveFocus(focusedIndex - 1); }
    else if (key === "ArrowDown") { event.preventDefault(); moveFocus(focusedIndex + OVERVIEW_COLUMNS); }
    else if (key === "ArrowUp") { event.preventDefault(); moveFocus(focusedIndex - OVERVIEW_COLUMNS); }
    else if (key === "Home") { event.preventDefault(); moveFocus(0); }
    else if (key === "End") { event.preventDefault(); moveFocus(slides.length - 1); }
  }, [focusedIndex, moveFocus, slides.length]);

  return (
    <div ref={containerRef} className="floating-panel overview-panel" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <h2 id={titleId} className="sr-only">Slide overview — {slides.length} slides</h2>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div className="panel-grid" role="listbox" aria-label="Slides" onKeyDown={onGridKeyDown}>
        {slides.map((slide, index) => (
          <button
            className="overview-card"
            data-current={index === current}
            ref={(node) => { cardRefs.current[index] = node; if (index === current) currentCardRef.current = node; }}
            role="option"
            aria-selected={index === current}
            tabIndex={index === focusedIndex ? 0 : -1}
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

export function NotesPanel({ current, slide, onClose }: { current: number; slide: Slide; onClose: () => void }) {
  const titleId = useId();
  const ref = useRef<HTMLElement>(null);

  // Non-modal: Escape closes when focus is inside, but never steals focus or
  // traps Tab — a presenter keeps navigating slides while notes stay visible.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.stopPropagation(); onClose(); }
    };
    node.addEventListener("keydown", onKeyDown);
    return () => node.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <aside ref={ref} className="floating-panel notes-panel" role="region" aria-labelledby={titleId}>
      <p className="panel-kicker">Slide {current + 1}</p>
      <h2 id={titleId}>{slide.title}</h2>
      <p>{slide.speakerNote || "No speaker notes for this slide."}</p>
      {slide.evidenceNote ? <p className="evidence-note">{slide.evidenceNote}</p> : null}
    </aside>
  );
}

export function ClickNavZones({
  canPrev,
  canNext,
  onPrev,
  onNext,
}: {
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <button
        className="click-nav-zone click-nav-zone-prev"
        type="button"
        aria-label="Previous slide"
        tabIndex={-1}
        disabled={!canPrev}
        onClick={onPrev}
      />
      <button
        className="click-nav-zone click-nav-zone-next"
        type="button"
        aria-label="Next slide"
        tabIndex={-1}
        disabled={!canNext}
        onClick={onNext}
      />
    </>
  );
}

export function HelpPanel({ onClose }: { onClose: () => void }) {
  const { containerRef, titleId } = useModalDialog<HTMLDivElement>(onClose);
  return (
    <div ref={containerRef} className="floating-panel help-panel" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="panel-header">
        <p id={titleId}>Keyboard</p>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Close keyboard help">
          <X aria-hidden="true" />
        </button>
      </div>
      <dl>
        <div><dt>← / →</dt><dd>Previous / next presenter beat</dd></div>
        <div><dt>Space</dt><dd>Reveal next build or advance</dd></div>
        <div><dt>Type number</dt><dd>Jump to slide (e.g. 1 2 → slide 12)</dd></div>
        <div><dt>Home / End</dt><dd>First / last slide</dd></div>
        <div><dt>O / N</dt><dd>Overview, speaker notes</dd></div>
        <div><dt>C / V / D</dt><dd>Comments, visuals, design lock</dd></div>
        <div><dt>T</dt><dd>Live tweaks</dd></div>
        <div><dt>P / L / F</dt><dd>Presenter, laser, fullscreen</dd></div>
        <div><dt>B / W</dt><dd>Black screen, white screen</dd></div>
        <div><dt>Esc</dt><dd>Close panel / clear blackout</dd></div>
        <div><dt>? </dt><dd>This help</dd></div>
        <div><dt>Swipe / Wheel</dt><dd>Beat-aware navigation</dd></div>
      </dl>
      <p className="panel-footnote">P · L · F · C · V · D · T are projection-side; B · W · O · N work everywhere.</p>
    </div>
  );
}
