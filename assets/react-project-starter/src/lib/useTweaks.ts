import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { Theme } from "../types";

const STORAGE_KEY = "paper-slide-tweaks";

export type Tweaks = {
  themePreset: Theme;
  accent: string; // empty string = inherit the theme default
  positive: string;
  negative: string;
  typeScale: number; // 0.85 – 1.25, multiplies slide text sizes
  transitionMs: number; // 0 – 800, slide entrance + progress speed
  showProgressBar: boolean;
};

export const TYPE_SCALE_RANGE = { min: 0.85, max: 1.25, step: 0.05 } as const;
export const TRANSITION_RANGE = { min: 0, max: 800, step: 20 } as const;

export function defaultTweaks(themePreset: Theme): Tweaks {
  return {
    themePreset,
    accent: "",
    positive: "",
    negative: "",
    typeScale: 1,
    transitionMs: 320,
    showProgressBar: true,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function loadTweaks(base: Tweaks): Tweaks {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw) as Partial<Tweaks>;
    const merged = { ...base, ...saved };
    return {
      ...merged,
      typeScale: clamp(Number(merged.typeScale) || 1, TYPE_SCALE_RANGE.min, TYPE_SCALE_RANGE.max),
      transitionMs: clamp(Number(merged.transitionMs) ?? 320, TRANSITION_RANGE.min, TRANSITION_RANGE.max),
      showProgressBar: merged.showProgressBar !== false,
    };
  } catch {
    return base;
  }
}

export function useTweaks(themePreset: Theme) {
  const base = useMemo(() => defaultTweaks(themePreset), [themePreset]);
  const [tweaks, setTweaks] = useState<Tweaks>(() => loadTweaks(base));

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tweaks));
    } catch {
      // Tweaks still apply in-memory when storage is unavailable.
    }
  }, [tweaks]);

  const setTweak = useCallback(<K extends keyof Tweaks>(key: K, value: Tweaks[K]) => {
    setTweaks((current) => ({ ...current, [key]: value }));
  }, []);

  const reset = useCallback(() => setTweaks(defaultTweaks(themePreset)), [themePreset]);

  const exportTweaks = useCallback(() => {
    const payload = { version: "1.0", tweaks };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "deck_tweaks.json";
    link.click();
    URL.revokeObjectURL(url);
  }, [tweaks]);

  // CSS custom properties the deck shell consumes. Empty color fields fall
  // back to the active theme's tokens by simply not being set.
  const style = useMemo(() => {
    const vars: Record<string, string> = {
      "--type-scale": String(tweaks.typeScale),
      "--deck-transition": `${tweaks.transitionMs}ms`,
    };
    if (tweaks.accent) vars["--accent"] = tweaks.accent;
    if (tweaks.positive) vars["--positive"] = tweaks.positive;
    if (tweaks.negative) {
      vars["--negative"] = tweaks.negative;
      vars["--warning"] = tweaks.negative;
    }
    return vars as CSSProperties;
  }, [tweaks]);

  return { tweaks, setTweak, reset, exportTweaks, style };
}
