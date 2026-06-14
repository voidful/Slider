import { useRef } from "react";
import type { MouseEvent, RefObject } from "react";
import { SlideRenderer } from "./SlideRenderer";
import { ControlDock } from "./ControlDock";
import { LaserPointer } from "./LaserPointer";
import { ClickNavZones, HelpPanel, NotesPanel, OverviewPanel } from "./AudienceOverlays";
import { ReviewPanel } from "./ReviewPanel";
import { VisualAssetPanel } from "./VisualAssetPanel";
import { DesignLockPanel } from "./DesignLockPanel";
import { TweaksPanel } from "./TweaksPanel";
import { deckDesign } from "../lib/deckDesign";
import { openPresenterWindow, type BlackoutMode } from "../lib/presenterWindow";
import type { Tweaks } from "../lib/useTweaks";
import type { ReviewComment, ReviewTarget, Slide, Theme, Venue } from "../types";
import { themeLabels, venueLabels } from "../lib/presets";

type ReviewState = {
  comments: ReviewComment[];
  target: ReviewTarget;
  draft: string;
  setDraft: (value: string) => void;
  addComment: () => void;
  deleteComment: (id: string) => void;
  exportComments: () => void;
};

export function AudienceDeck({
  slides,
  slide,
  currentSlide,
  progress,
  deckTitle,
  theme,
  venue,
  deckWrapperRef,
  blackout,
  laserEnabled,
  showHelp,
  showNotes,
  showOverview,
  showReview,
  showVisualAssets,
  showDesignLock,
  showTweaks,
  showProgressBar,
  tweaks,
  setTweak,
  resetTweaks,
  exportTweaks,
  review,
  onDeckClick,
  onPrev,
  onNext,
  onGoTo,
  onFullscreen,
  onToggleHelp,
  onToggleNotes,
  onToggleOverview,
  onToggleReview,
  onToggleVisualAssets,
  onToggleDesignLock,
  onToggleTweaks,
  onToggleLaser,
  onBlackout,
}: {
  slides: Slide[];
  slide: Slide;
  currentSlide: number;
  progress: number;
  deckTitle: string;
  theme: Theme;
  venue: Venue;
  deckWrapperRef: RefObject<HTMLDivElement>;
  blackout: BlackoutMode;
  laserEnabled: boolean;
  showHelp: boolean;
  showNotes: boolean;
  showOverview: boolean;
  showReview: boolean;
  showVisualAssets: boolean;
  showDesignLock: boolean;
  showTweaks: boolean;
  showProgressBar: boolean;
  tweaks: Tweaks;
  setTweak: <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => void;
  resetTweaks: () => void;
  exportTweaks: () => void;
  review: ReviewState;
  onDeckClick: (event: MouseEvent<HTMLDivElement>) => void;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (index: number) => void;
  onFullscreen: () => void;
  onToggleHelp: () => void;
  onToggleNotes: () => void;
  onToggleOverview: () => void;
  onToggleReview: () => void;
  onToggleVisualAssets: () => void;
  onToggleDesignLock: () => void;
  onToggleTweaks: () => void;
  onToggleLaser: () => void;
  onBlackout: (mode: Exclude<BlackoutMode, null>) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={deckWrapperRef} className="deck-viewport">
      <div ref={frameRef} className={`deck-frame ${laserEnabled ? "deck-laser-active" : ""} ${showReview ? "review-mode" : ""}`} role="region" aria-label={deckTitle} onClick={onDeckClick}>
        {showProgressBar ? (
          <div className="progress-track" aria-hidden="true">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
        ) : null}

        <div className="deck-meta" aria-label="Deck metadata">
          <span>{venueLabels[venue]}</span>
          <span>{themeLabels[theme]}</span>
          {slide?.appendix ? <span>Appendix</span> : null}
        </div>

        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          Slide {currentSlide + 1} of {slides.length}: {slide?.title}
        </div>

        <div className={`slide-stage ${showNotes ? "slide-stage-notes" : ""}`} key={currentSlide}>
          <SlideRenderer slide={slide} theme={theme} />
        </div>

        <ClickNavZones current={currentSlide} count={slides.length} onPrev={onPrev} onNext={onNext} />
        {showHelp ? <HelpPanel onClose={onToggleHelp} /> : null}
        {showOverview ? <OverviewPanel slides={slides} current={currentSlide} onSelect={(index) => { onGoTo(index); onToggleOverview(); }} onClose={onToggleOverview} /> : null}
        {showNotes ? <NotesPanel current={currentSlide} slide={slide} onClose={onToggleNotes} /> : null}
        {showReview ? <ReviewPanel comments={review.comments} current={currentSlide} target={review.target} value={review.draft} onValueChange={review.setDraft} onAdd={review.addComment} onDelete={review.deleteComment} onExport={review.exportComments} onClose={onToggleReview} /> : null}
        {showVisualAssets ? <VisualAssetPanel slides={slides} current={currentSlide} onSelect={onGoTo} onClose={onToggleVisualAssets} /> : null}
        {showDesignLock ? <DesignLockPanel design={deckDesign} onClose={onToggleDesignLock} /> : null}
        {showTweaks ? <TweaksPanel tweaks={tweaks} setTweak={setTweak} reset={resetTweaks} exportTweaks={exportTweaks} onClose={onToggleTweaks} /> : null}
        {blackout ? <div className={`blackout-overlay blackout-${blackout}`}>{blackout} screen</div> : null}

        <ControlDock
          count={slides.length}
          current={currentSlide}
          blackout={blackout}
          notesOpen={showNotes}
          overviewOpen={showOverview}
          helpOpen={showHelp}
          reviewOpen={showReview}
          visualAssetsOpen={showVisualAssets}
          designLockOpen={showDesignLock}
          tweaksOpen={showTweaks}
          laserOn={laserEnabled}
          onPrev={onPrev}
          onNext={onNext}
          onFullscreen={onFullscreen}
          onHelp={onToggleHelp}
          onNotes={onToggleNotes}
          onOverview={onToggleOverview}
          onReview={onToggleReview}
          onVisualAssets={onToggleVisualAssets}
          onDesignLock={onToggleDesignLock}
          onTweaks={onToggleTweaks}
          onPresenter={openPresenterWindow}
          onLaser={onToggleLaser}
          onBlackout={onBlackout}
        />
        <LaserPointer enabled={laserEnabled} frameRef={frameRef} />
      </div>
    </div>
  );
}
