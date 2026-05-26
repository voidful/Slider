import { X } from "lucide-react";
import type { Slide } from "../types";

export function OverviewPanel({
  slides,
  current,
  onSelect,
}: {
  slides: Slide[];
  current: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="floating-panel overview-panel" role="dialog" aria-label="Slide overview">
      <div className="panel-grid">
        {slides.map((slide, index) => (
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

export function NotesPanel({ current, slide }: { current: number; slide: Slide }) {
  return (
    <aside className="floating-panel notes-panel" aria-label="Speaker notes">
      <p className="panel-kicker">Slide {current + 1}</p>
      <h2>{slide.title}</h2>
      <p>{slide.speakerNote}</p>
      {slide.evidenceNote ? <p className="evidence-note">{slide.evidenceNote}</p> : null}
    </aside>
  );
}

export function ClickNavZones({
  current,
  count,
  onPrev,
  onNext,
}: {
  current: number;
  count: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <button
        className="click-nav-zone click-nav-zone-prev"
        type="button"
        aria-label="Previous slide"
        disabled={current === 0}
        onClick={onPrev}
      />
      <button
        className="click-nav-zone click-nav-zone-next"
        type="button"
        aria-label="Next slide"
        disabled={current >= count - 1}
        onClick={onNext}
      />
    </>
  );
}

export function HelpPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="floating-panel help-panel" role="dialog" aria-label="Keyboard shortcuts">
      <div className="panel-header">
        <p>Keyboard</p>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Close keyboard help">
          <X aria-hidden="true" />
        </button>
      </div>
      <dl>
        <div><dt>Left / Right</dt><dd>Slide navigation</dd></div>
        <div><dt>Space</dt><dd>Next slide</dd></div>
        <div><dt>1-9</dt><dd>Jump</dd></div>
        <div><dt>O / N / F</dt><dd>Overview, notes, fullscreen</dd></div>
        <div><dt>C / V / D</dt><dd>Comments, visuals, design lock</dd></div>
        <div><dt>P / L</dt><dd>Presenter, laser pointer</dd></div>
        <div><dt>B / W</dt><dd>Black screen, white screen</dd></div>
        <div><dt>Swipe / Wheel</dt><dd>Slide navigation</dd></div>
      </dl>
    </div>
  );
}
