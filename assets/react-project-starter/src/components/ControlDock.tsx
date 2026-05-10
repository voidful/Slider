import { ChevronLeft, ChevronRight, Grid2X2, HelpCircle, Maximize, StickyNote } from "lucide-react";

type ControlDockProps = {
  count: number;
  current: number;
  notesOpen: boolean;
  overviewOpen: boolean;
  helpOpen: boolean;
  onPrev: () => void;
  onNext: () => void;
  onFullscreen: () => void;
  onHelp: () => void;
  onNotes: () => void;
  onOverview: () => void;
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
  notesOpen,
  overviewOpen,
  helpOpen,
  onPrev,
  onNext,
  onFullscreen,
  onHelp,
  onNotes,
  onOverview,
}: ControlDockProps) {
  return (
    <div className="control-dock" role="toolbar" aria-label="Presentation controls">
      <DockButton label="Previous slide" onClick={onPrev} disabled={current === 0}>
        <ChevronLeft aria-hidden="true" />
      </DockButton>
      <DockButton label="Next slide" onClick={onNext} disabled={current >= count - 1}>
        <ChevronRight aria-hidden="true" />
      </DockButton>
      <div className="slide-counter" aria-live="polite">
        {current + 1} / {count}
      </div>
      <DockButton label="Slide overview" onClick={onOverview} pressed={overviewOpen}>
        <Grid2X2 aria-hidden="true" />
      </DockButton>
      <DockButton label="Speaker notes" onClick={onNotes} pressed={notesOpen}>
        <StickyNote aria-hidden="true" />
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
