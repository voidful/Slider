import type { Theme, Venue } from "../types";
import { deckDesign, resolveThemePreset } from "./deckDesign";

export const themePreset: Theme = "zinc-editorial"; // @render-theme
export const runtimeThemePreset = resolveThemePreset(themePreset);
export const venuePreset: Venue = "iclr"; // @render-venue
export const deckTitle = "Paper Slideshow Project"; // @render-title
export const semanticPalette = deckDesign?.semantic_palette ?? null;
