import type { Theme } from "../types";

export type DeckDesign = {
  version?: string;
  deck_mood_family?: string;
  theme_preset?: string;
  semantic_palette?: {
    accent?: string;
    positive?: string;
    negative?: string;
    neutral?: string;
  };
  motion_policy?: {
    mode?: string;
    transition_ms?: number;
    respect_reduced_motion?: boolean;
  };
};

export const deckDesign: DeckDesign | null = null; // @render-deck-design

export function resolveThemePreset(fallback: Theme): Theme {
  const preset = deckDesign?.theme_preset;
  if (preset === "deep-navy-academic" || preset === "monochrome-impeccable" || preset === "zinc-editorial") {
    return preset;
  }
  return fallback;
}
