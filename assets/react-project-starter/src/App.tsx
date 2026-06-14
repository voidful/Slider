import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import { AudienceDeck } from "./components/AudienceDeck";
import { PresenterPanel } from "./components/PresenterPanel";
import { slideData } from "./data/slideData";
import { deckTitle, runtimeThemePreset as themePreset, semanticPalette, venuePreset } from "./lib/presentationConfig";
import { themeClassNames } from "./lib/presets";
import { createPresenterChannel, isPresenterWindow, openPresenterWindow, readPresenterSnapshot, type BlackoutMode, type PresenterCommand, type PresenterSnapshot } from "./lib/presenterWindow";
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
  const [currentSlide, setCurrentSlide] = useState(() => Math.max(0, Math.min(initialPresenterState?.index ?? 0, slideData.length - 1)));
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
  const currentSlideRef = useRef(currentSlide);
  const startedAtRef = useRef(startedAt);
  const blackoutRef = useRef<BlackoutMode>(blackout);
  const progress = useMemo(() => ((currentSlide + 1) / slideData.length) * 100, [currentSlide]);
  const slide = slideData[currentSlide];
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

  const setClampedSlide = useCallback((index: number) => {
    setCurrentSlide(Math.max(0, Math.min(index, slideData.length - 1)));
  }, []);

  const applyPresenterCommand = useCallback((command: PresenterCommand) => {
    if (command.type === "prev") setCurrentSlide((value) => Math.max(value - 1, 0));
    if (command.type === "next") setCurrentSlide((value) => Math.min(value + 1, slideData.length - 1));
    if (command.type === "goto") setClampedSlide(command.index);
    if (command.type === "blackout") setBlackout(command.mode);
    if (command.type === "reset-timer") setStartedAt(Date.now());
  }, [setClampedSlide]);

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
        index: currentSlideRef.current,
        count: slideData.length,
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
    currentSlideRef.current = currentSlide;
    startedAtRef.current = startedAt;
    blackoutRef.current = blackout;
  }, [blackout, currentSlide, startedAt]);

  useEffect(() => {
    const channel = createPresenterChannel((message) => {
      if (message.type === "request-state" && !presenterMode) publishPresenterState();
      if (message.type === "command" && !presenterMode) applyPresenterCommand(message.command);
      if (message.type === "state" && presenterMode) {
        setPresenterConnected(true);
        setClampedSlide(message.state.index);
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
  }, [applyPresenterCommand, presenterMode, publishPresenterState, setClampedSlide]);

  useEffect(() => {
    if (!presenterMode) publishPresenterState();
  }, [blackout, currentSlide, presenterMode, publishPresenterState, startedAt]);

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
    canPrev: currentSlide > 0,
    canNext: currentSlide < slideData.length - 1,
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
          state={{ index: currentSlide, count: slideData.length, startedAt, deckTitle, blackout }}
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
