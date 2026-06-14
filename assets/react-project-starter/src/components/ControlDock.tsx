import { ChevronLeft, ChevronRight, Crosshair, Grid2X2, HelpCircle, Image, Maximize, MessageSquare, Monitor, Palette, SlidersHorizontal, Square, StickyNote, Sun } from "lucide-react";
import type { BlackoutMode } from "../lib/presenterWindow";

type ControlDockProps = {
  count: number;
  current: number;
  blackout: BlackoutMode;
  notesOpen: boolean;
  overviewOpen: boolean;
  helpOpen: boolean;
  reviewOpen: boolean;
  visualAssetsOpen: boolean;
  designLockOpen: boolean;
  tweaksOpen: boolean;
  laserOn: boolean;
  onPrev: () => void;
  onNext: () => void;
  onFullscreen: () => void;
  onHelp: () => void;
  onNotes: () => void;
  onOverview: () => void;
  onReview: () => void;
  onVisualAssets: () => void;
  onDesignLock: () => void;
  onTweaks: () => void;
  onPresenter: () => void;
  onLaser: () => void;
  onBlackout: (mode: Exclude<BlackoutMode, null>) => void;
};

type DockButtonProps = {
  label: string;
  pressed?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function DockButton({ label, pressed, disabled, onClick, children }: DockButtonProps) {
  return (
    <button
      className="dock-button"
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function ControlDock({
  count,
  current,
  blackout,
  notesOpen,
  overviewOpen,
  helpOpen,
  reviewOpen,
  visualAssetsOpen,
  designLockOpen,
  tweaksOpen,
  laserOn,
  onPrev,
  onNext,
  onFullscreen,
  onHelp,
  onNotes,
  onOverview,
  onReview,
  onVisualAssets,
  onDesignLock,
  onTweaks,
  onPresenter,
  onLaser,
  onBlackout,
}: ControlDockProps) {
  return (
    <div className="control-dock" role="toolbar" aria-label="Presentation controls">
      <DockButton label="Previous slide" onClick={onPrev} disabled={current === 0}>
        <ChevronLeft aria-hidden="true" />
      </DockButton>
      <DockButton label="Next slide" onClick={onNext} disabled={current >= count - 1}>
        <ChevronRight aria-hidden="true" />
      </DockButton>
      <div className="slide-counter" aria-hidden="true">
        {current + 1} / {count}
      </div>
      <span className="dock-divider" aria-hidden="true" />
      <DockButton label="Slide overview" onClick={onOverview} pressed={overviewOpen}>
        <Grid2X2 aria-hidden="true" />
      </DockButton>
      <DockButton label="Speaker notes" onClick={onNotes} pressed={notesOpen}>
        <StickyNote aria-hidden="true" />
      </DockButton>
      <DockButton label="Review comments" onClick={onReview} pressed={reviewOpen}>
        <MessageSquare aria-hidden="true" />
      </DockButton>
      <DockButton label="Visual assets" onClick={onVisualAssets} pressed={visualAssetsOpen}>
        <Image aria-hidden="true" />
      </DockButton>
      <DockButton label="Design lock" onClick={onDesignLock} pressed={designLockOpen}>
        <Palette aria-hidden="true" />
      </DockButton>
      <DockButton label="Live tweaks" onClick={onTweaks} pressed={tweaksOpen}>
        <SlidersHorizontal aria-hidden="true" />
      </DockButton>
      <span className="dock-divider" aria-hidden="true" />
      <DockButton label="Presenter window" onClick={onPresenter}>
        <Monitor aria-hidden="true" />
      </DockButton>
      <DockButton label="Laser pointer" onClick={onLaser} pressed={laserOn}>
        <Crosshair aria-hidden="true" />
      </DockButton>
      <DockButton label="Black screen" onClick={() => onBlackout("black")} pressed={blackout === "black"}>
        <Square aria-hidden="true" />
      </DockButton>
      <DockButton label="White screen" onClick={() => onBlackout("white")} pressed={blackout === "white"}>
        <Sun aria-hidden="true" />
      </DockButton>
      <DockButton label="Fullscreen" onClick={onFullscreen}>
        <Maximize aria-hidden="true" />
      </DockButton>
      <DockButton label="Keyboard help" onClick={onHelp} pressed={helpOpen}>
        <HelpCircle aria-hidden="true" />
      </DockButton>
    </div>
  );
}
