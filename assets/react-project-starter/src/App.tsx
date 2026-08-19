import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import { AudienceDeck } from "./components/AudienceDeck";
import { PresenterPanel } from "./components/PresenterPanel";
import { slideData } from "./data/slideData";
import { deckTitle, runtimeThemePreset as themePreset, semanticPalette, venuePreset } from "./lib/presentationConfig";
import { themeClassNames } from "./lib/presets";
import { createPresenterChannel, isPresenterWindow, openPresenterWindow, readPresenterSnapshot, type BlackoutMode, type PresenterCommand, type PresenterSnapshot } from "./lib/presenterWindow";
import { clampRevealed, getBuildCount } from "./lib/presentationBuilds";
import { usePresentationKeyboard, useTouchSwipe, useWheelPageNavigation } from "./lib/usePresentationInput";
import { useReviewComments } from "./lib/reviewComments";
import { useTweaks } from "./lib/useTweaks";

const STAGE_WIDTH = 1200;
const STAGE_HEIGHT = 675;
const MIN_SCALE = 0.28;

function calculateStageScale() {
  const fullscreen = Boolean(document.fullscreenElement);
  // Match the responsive .app-shell padding so the stage claims the room the
  // shell actually frees up on small screens (8 / 14 / 32 px breakpoints).
  const shellPadding = window.innerWidth <= 480 ? 8 : window.innerWidth <= 780 ? 14 : 32;
  const horizontalChrome = fullscreen ? 32 : shellPadding * 2;
  const verticalChrome = fullscreen ? 32 : shellPadding * 2 + 32;
  const availableWidth = Math.max(280, window.innerWidth - horizontalChrome);
  const availableHeight = Math.max(240, window.innerHeight - verticalChrome);
  return Math.max(MIN_SCALE, Math.min(availableWidth / STAGE_WIDTH, availableHeight / STAGE_HEIGHT));
}

export default function App() {
  const [presenterMode] = useState(() => isPresenterWindow());
  const [initialPresenterState] = useState<PresenterSnapshot | null>(() => (presenterMode ? readPresenterSnapshot() : null));
  const [presenterConnected, setPresenterConnected] = useState(false);
  const [position, setPosition] = useState(() => {
    const index = Math.max(0, Math.min(initialPresenterState?.index ?? 0, slideData.length - 1));
    const revealed = presenterMode
      ? clampRevealed(slideData[index], initialPresenterState?.revealed ?? getBuildCount(slideData[index]))
      : 0;
    return { index, revealed };
  });
  const [startedAt, setStartedAt] = useState(() => initialPresenterState?.startedAt ?? Date.now());
  const [blackout, setBlackout] = useState<BlackoutMode>(() => initialPresenterState?.blackout ?? null);
  const [showHelp, setShowHelp] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showVisualAssets, setShowVisualAssets] = useState(false);
  const [showDesignLock, setShowDesignLock] = useState(false);
  const [showTweaks, setShowTweaks] = useState(false);
  const [laserEnabled, setLaserEnabled] = useState(false);
  const tweaks = useTweaks(themePreset);
  const [stageScale, setStageScale] = useState(calculateStageScale);
  const deckWrapperRef = useRef<HTMLDivElement>(null);
  const presenterChannelRef = useRef<ReturnType<typeof createPresenterChannel> | null>(null);
  const positionRef = useRef(position);
  const startedAtRef = useRef(startedAt);
  const blackoutRef = useRef<BlackoutMode>(blackout);
  const currentSlide = position.index;
  const revealedBuilds = position.revealed;
  const slide = slideData[currentSlide];
  const buildCount = getBuildCount(slide);
  const canPrev = currentSlide > 0 || revealedBuilds > 0;
  const canNext = currentSlide < slideData.length - 1 || revealedBuilds < buildCount;
  const progress = useMemo(() => ((currentSlide + 1) / slideData.length) * 100, [currentSlide]);
  const themeClass = themeClassNames[tweaks.tweaks.themePreset];
  const shellStyle = {
    "--deck-scale": stageScale.toFixed(4),
    ...(semanticPalette?.accent ? { "--accent": semanticPalette.accent } : {}),
    ...(semanticPalette?.positive ? { "--positive": semanticPalette.positive } : {}),
    ...(semanticPalette?.negative ? { "--warning": semanticPalette.negative, "--negative": semanticPalette.negative } : {}),
    ...(semanticPalette?.neutral ? { "--muted": semanticPalette.neutral } : {}),
    ...tweaks.style,
  } as CSSProperties;
  const anyOverlayOpen = showHelp || showNotes || showOverview || showReview || showVisualAssets || showDesignLock || showTweaks;
  const inputEnabled = !presenterMode && !anyOverlayOpen;
  const review = useReviewComments(slideData, currentSlide);

  const setSyncedPosition = useCallback((index: number, revealed: number) => {
    const clampedIndex = Math.max(0, Math.min(index, slideData.length - 1));
    setPosition({ index: clampedIndex, revealed: clampRevealed(slideData[clampedIndex], revealed) });
  }, []);

  const applyPresenterCommand = useCallback((command: PresenterCommand) => {
    if (command.type === "prev") {
      setPosition((value) => {
        const revealed = clampRevealed(slideData[value.index], value.revealed);
        if (revealed > 0) return { ...value, revealed: revealed - 1 };
        if (value.index <= 0) return value;
        const index = value.index - 1;
        return { index, revealed: getBuildCount(slideData[index]) };
      });
    }
    if (command.type === "next") {
      setPosition((value) => {
        const count = getBuildCount(slideData[value.index]);
        const revealed = clampRevealed(slideData[value.index], value.revealed);
        if (revealed < count) return { ...value, revealed: revealed + 1 };
        if (value.index >= slideData.length - 1) return value;
        return { index: value.index + 1, revealed: 0 };
      });
    }
    if (command.type === "goto") {
      const index = Math.max(0, Math.min(command.index, slideData.length - 1));
      setPosition({ index, revealed: getBuildCount(slideData[index]) });
    }
    if (command.type === "blackout") setBlackout(command.mode);
    if (command.type === "reset-timer") setStartedAt(Date.now());
  }, []);

  const requestPresenterCommand = useCallback((command: PresenterCommand) => {
    if (presenterMode) {
      presenterChannelRef.current?.post({ type: "command", command });
      if (!presenterConnected) applyPresenterCommand(command);
      return;
    }
    applyPresenterCommand(command);
  }, [applyPresenterCommand, presenterConnected, presenterMode]);

  const goTo = useCallback((index: number) => {
    requestPresenterCommand({ type: "goto", index });
  }, [requestPresenterCommand]);

  const goPrev = useCallback(() => {
    requestPresenterCommand({ type: "prev" });
  }, [requestPresenterCommand]);

  const goNext = useCallback(() => {
    requestPresenterCommand({ type: "next" });
  }, [requestPresenterCommand]);

  const clearBlackout = useCallback((mode: BlackoutMode) => {
    requestPresenterCommand({ type: "blackout", mode });
  }, [requestPresenterCommand]);

  const closeOverlays = useCallback(() => {
    setShowHelp(false);
    setShowNotes(false);
    setShowOverview(false);
    setShowReview(false);
    setShowVisualAssets(false);
    setShowDesignLock(false);
    setShowTweaks(false);
  }, []);

  const handleDeckClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
    if (!showReview) return;
    const element = event.target instanceof Element ? event.target : null;
    if (element?.closest(".floating-panel, .control-dock")) return;
    review.selectTargetFromElement(element);
  }, [review, showReview]);

  const publishPresenterState = useCallback(() => {
    presenterChannelRef.current?.post({
      type: "state",
      state: {
        index: positionRef.current.index,
        count: slideData.length,
        revealed: positionRef.current.revealed,
        buildCount: getBuildCount(slideData[positionRef.current.index]),
        startedAt: startedAtRef.current,
        deckTitle,
        blackout: blackoutRef.current,
      },
    });
  }, []);

  useEffect(() => {
    document.title = presenterMode ? `${deckTitle} Presenter` : deckTitle;
  }, [presenterMode]);

  useEffect(() => {
    positionRef.current = position;
    startedAtRef.current = startedAt;
    blackoutRef.current = blackout;
  }, [blackout, position, startedAt]);

  useEffect(() => {
    const channel = createPresenterChannel((message) => {
      if (message.type === "request-state" && !presenterMode) publishPresenterState();
      if (message.type === "command" && !presenterMode) applyPresenterCommand(message.command);
      if (message.type === "state" && presenterMode) {
        setPresenterConnected(true);
        setSyncedPosition(message.state.index, message.state.revealed ?? getBuildCount(slideData[message.state.index]));
        setStartedAt(message.state.startedAt);
        setBlackout(message.state.blackout);
      }
    });
    presenterChannelRef.current = channel;
    if (presenterMode) channel.post({ type: "request-state" });
    if (!presenterMode) publishPresenterState();
    return () => {
      channel.close();
      presenterChannelRef.current = null;
    };
  }, [applyPresenterCommand, presenterMode, publishPresenterState, setSyncedPosition]);

  useEffect(() => {
    if (!presenterMode) publishPresenterState();
  }, [blackout, currentSlide, presenterMode, publishPresenterState, revealedBuilds, startedAt]);

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

  usePresentationKeyboard({
    blackout,
    slideCount: slideData.length,
    presenterMode,
    anyOverlayOpen,
    onPrev: goPrev,
    onNext: goNext,
    onGoTo: goTo,
    onFullscreen: () => deckWrapperRef.current?.requestFullscreen?.(),
    onPresenter: openPresenterWindow,
    onLaser: () => setLaserEnabled((value) => !value),
    onBlackout: clearBlackout,
    onToggleHelp: () => setShowHelp((value) => !value),
    onToggleNotes: () => setShowNotes((value) => !value),
    onToggleOverview: () => setShowOverview((value) => !value),
    onToggleReview: () => setShowReview((value) => !value),
    onToggleVisualAssets: () => setShowVisualAssets((value) => !value),
    onToggleDesignLock: () => setShowDesignLock((value) => !value),
    onToggleTweaks: () => setShowTweaks((value) => !value),
    onCloseOverlays: closeOverlays,
  });

  useWheelPageNavigation({
    ref: deckWrapperRef,
    enabled: inputEnabled,
    canPrev,
    canNext,
    onPrev: goPrev,
    onNext: goNext,
  });

  useTouchSwipe({
    ref: deckWrapperRef,
    enabled: inputEnabled,
    onPrev: goPrev,
    onNext: goNext,
  });

  if (presenterMode) {
    return (
      <main className={`app-shell ${themeClass} presenter-app-shell`}>
        <PresenterPanel
          slides={slideData}
          theme={tweaks.tweaks.themePreset}
          state={{ index: currentSlide, count: slideData.length, revealed: revealedBuilds, buildCount, startedAt, deckTitle, blackout }}
          connected={presenterConnected}
          onPrev={() => requestPresenterCommand({ type: "prev" })}
          onNext={() => requestPresenterCommand({ type: "next" })}
          onGoTo={(index) => requestPresenterCommand({ type: "goto", index })}
          onBlackout={(mode) => requestPresenterCommand({ type: "blackout", mode })}
          onResetTimer={() => requestPresenterCommand({ type: "reset-timer" })}
        />
      </main>
    );
  }

  return (
    <main className={`app-shell ${themeClass}`} style={shellStyle}>
      <AudienceDeck
        slides={slideData}
        slide={slide}
        currentSlide={currentSlide}
        revealedBuilds={revealedBuilds}
        buildCount={buildCount}
        canPrev={canPrev}
        canNext={canNext}
        progress={progress}
        deckTitle={deckTitle}
        theme={tweaks.tweaks.themePreset}
        venue={venuePreset}
        deckWrapperRef={deckWrapperRef}
        blackout={blackout}
        laserEnabled={laserEnabled}
        showHelp={showHelp}
        showNotes={showNotes}
        showOverview={showOverview}
        showReview={showReview}
        showVisualAssets={showVisualAssets}
        showDesignLock={showDesignLock}
        showTweaks={showTweaks}
        showProgressBar={tweaks.tweaks.showProgressBar}
        tweaks={tweaks.tweaks}
        setTweak={tweaks.setTweak}
        resetTweaks={tweaks.reset}
        exportTweaks={tweaks.exportTweaks}
        review={review}
        onDeckClick={handleDeckClick}
        onPrev={goPrev}
        onNext={goNext}
        onGoTo={goTo}
        onFullscreen={() => deckWrapperRef.current?.requestFullscreen?.()}
        onToggleHelp={() => setShowHelp((value) => !value)}
        onToggleNotes={() => setShowNotes((value) => !value)}
        onToggleOverview={() => setShowOverview((value) => !value)}
        onToggleReview={() => setShowReview((value) => !value)}
        onToggleVisualAssets={() => setShowVisualAssets((value) => !value)}
        onToggleDesignLock={() => setShowDesignLock((value) => !value)}
        onToggleTweaks={() => setShowTweaks((value) => !value)}
        onToggleLaser={() => setLaserEnabled((value) => !value)}
        onBlackout={(mode) => requestPresenterCommand({ type: "blackout", mode: blackout === mode ? null : mode })}
      />
    </main>
  );
}
