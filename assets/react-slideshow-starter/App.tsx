import React, { useEffect, useMemo, useRef, useState, CSSProperties } from "react";
import {
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Image as ImageIcon,
  Maximize,
  Play,
  Sparkles,
  X,
} from "lucide-react";

/* ────────────────────────── Types ────────────────────────── */

type Mood = "cinematic" | "editorial" | "gradient-mesh" | "glass" | "warm" | "navy" | "minimal" | "celebration";
type Layout = "cover" | "split" | "bullets" | "metrics" | "limitations" | "diagram" | "comparison" | "timeline" | "hero-stat" | "table-focus" | "method-overview";
type Venue = "neurips" | "iclr" | "acl" | "cvpr";

type Metric = { label: string; value: string; detail: string; delta?: "positive" | "negative" };
type VisualAsset = { src: string; alt?: string; caption?: string; pageNumber?: number; storyRole?: string; score?: number; cropMode?: string; confidence?: "high" | "medium" | "low" };
type TableRow = { cells: string[]; best?: boolean };

type PageRole = "hook" | "bottleneck" | "method overview" | "method detail" | "setup" | "headline result" | "evidence" | "analysis" | "limitation" | "future" | "close";

type Slide = {
  id: number;
  title: string;
  layout: Layout;
  mood?: Mood;
  pageRole?: PageRole;
  purpose: string;
  keyMessage: string;
  speakerNote: string;
  visualIntent?: string;
  subtitle?: string;
  bullets?: string[];
  metrics?: Metric[];
  figureLabel?: string;
  visual?: VisualAsset;
  visualBinding?: { label?: string; pageNumber?: number; caption?: string; storyRole?: string };
  visualBindingStatus?: { status?: "bound" | "placeholder"; confidence?: "high" | "medium" | "low"; reason?: string };
  tableHeaders?: string[];
  tableRows?: TableRow[];
  equation?: string;
  equationExplain?: string;
  callout?: string;
  calloutStyle?: "accent" | "positive" | "negative";
  timelineSteps?: string[];
  comparisonLeft?: { label: string; items: string[] };
  comparisonRight?: { label: string; items: string[] };
  appendix?: boolean;
  evidenceNote?: string;
  revealOrder?: string[];
  /** Transition into this slide; overrides the deck default (see Motion graphics below). */
  transition?: string;
  /** Motion preset name, or channel overrides such as { title: "scramble" }, for this slide. */
  motion?: string | Record<string, string | number>;
  /** Force or suppress the deck's stronger accent transition for this slide. */
  accent?: boolean;
  /** Morph ids by build target, e.g. { visual: "fig-2" }; the same id on the next slide flies there with the morph transition. */
  morph?: Record<string, string>;
};

/* ────────────────────────── Pro-Max Mood Definitions ────────────────────────── */

type MoodStyle = {
  background: string;
  color: string;
  accent: string;
  muted: string;
  labelColor: string;
  cardBg: string;
  cardBorder: string;
  titleColor: string;
  titleShadow?: string;
  calloutBg: string;
  calloutBorder: string;
  calloutColor: string;
  tableBg: string;
  tableHeaderBg: string;
  tableBestBg: string;
  bestValueColor: string;
  metricValueColor: string;
  heroNumberColor: string;
  heroNumberShadow?: string;
  timelineStepBg: string;
  timelineStepBorder: string;
  timelineStepColor: string;
  timelineArrowColor: string;
  bulletDotColor: string;
  limitationBg: string;
  limitationBorder: string;
  pseudoBefore?: CSSProperties;
  noiseOverlay?: boolean;
  toolbarTone: "light" | "dark";
};

const moodStyles: Record<Mood, MoodStyle> = {
  cinematic: {
    background: "radial-gradient(ellipse at 30% 50%, #1a1a3e 0%, #0a0a1a 100%)",
    noiseOverlay: true,
    color: "#f0f0f0",
    accent: "#00d4ff",
    muted: "#b0b8c4",
    labelColor: "#00d4ff",
    cardBg: "rgba(255,255,255,0.05)",
    cardBorder: "rgba(0,212,255,0.15)",
    titleColor: "#fff",
    titleShadow: "0 2px 20px rgba(0,212,255,0.15)",
    calloutBg: "rgba(0,212,255,0.1)",
    calloutBorder: "#00d4ff",
    calloutColor: "#e8ecf0",
    tableBg: "transparent",
    tableHeaderBg: "rgba(0,212,255,0.1)",
    tableBestBg: "rgba(0,212,255,0.08)",
    bestValueColor: "#00d4ff",
    metricValueColor: "#00d4ff",
    heroNumberColor: "#00d4ff",
    heroNumberShadow: "0 0 30px rgba(0,212,255,0.4)",
    timelineStepBg: "rgba(0,212,255,0.12)",
    timelineStepBorder: "rgba(0,212,255,0.25)",
    timelineStepColor: "#e8ecf0",
    timelineArrowColor: "rgba(0,212,255,0.5)",
    bulletDotColor: "#00d4ff",
    limitationBg: "rgba(220,38,38,0.1)",
    limitationBorder: "#ef4444",
    toolbarTone: "dark",
  },
  editorial: {
    background: "#fafaf8",
    color: "#1a1a2e",
    accent: "#2563eb",
    muted: "#6b7280",
    labelColor: "#2563eb",
    cardBg: "#ffffff",
    cardBorder: "rgba(226,232,240,0.6)",
    titleColor: "#1a1a2e",
    calloutBg: "rgba(37,99,235,0.06)",
    calloutBorder: "#2563eb",
    calloutColor: "#1a1a2e",
    tableBg: "transparent",
    tableHeaderBg: "rgba(37,99,235,0.06)",
    tableBestBg: "rgba(5,150,105,0.07)",
    bestValueColor: "#059669",
    metricValueColor: "#2563eb",
    heroNumberColor: "#2563eb",
    timelineStepBg: "rgba(37,99,235,0.06)",
    timelineStepBorder: "rgba(37,99,235,0.12)",
    timelineStepColor: "#1a1a2e",
    timelineArrowColor: "#2563eb",
    bulletDotColor: "#2563eb",
    limitationBg: "rgba(220,38,38,0.05)",
    limitationBorder: "#dc2626",
    toolbarTone: "light",
  },
  "gradient-mesh": {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #667eea 100%)",
    color: "#fff",
    accent: "#c4b5fd",
    muted: "rgba(255,255,255,0.88)",
    labelColor: "rgba(255,255,255,0.88)",
    cardBg: "rgba(255,255,255,0.12)",
    cardBorder: "rgba(255,255,255,0.25)",
    titleColor: "#fff",
    titleShadow: "0 2px 16px rgba(0,0,0,0.25)",
    calloutBg: "rgba(255,255,255,0.14)",
    calloutBorder: "rgba(255,255,255,0.5)",
    calloutColor: "#fff",
    tableBg: "transparent",
    tableHeaderBg: "rgba(255,255,255,0.12)",
    tableBestBg: "rgba(255,255,255,0.15)",
    bestValueColor: "#fff",
    metricValueColor: "#fff",
    heroNumberColor: "#fff",
    heroNumberShadow: "0 0 30px rgba(255,255,255,0.3)",
    timelineStepBg: "rgba(255,255,255,0.14)",
    timelineStepBorder: "rgba(255,255,255,0.25)",
    timelineStepColor: "#fff",
    timelineArrowColor: "rgba(255,255,255,0.6)",
    bulletDotColor: "#fde68a",
    limitationBg: "rgba(255,255,255,0.12)",
    limitationBorder: "rgba(255,255,255,0.5)",
    toolbarTone: "dark",
  },
  glass: {
    background: "linear-gradient(160deg, #e0f2fe 0%, #f0fdf4 100%)",
    color: "#1e293b",
    accent: "#10b981",
    muted: "#475569",
    labelColor: "#10b981",
    cardBg: "rgba(255,255,255,0.6)",
    cardBorder: "rgba(255,255,255,0.3)",
    titleColor: "#1e293b",
    calloutBg: "rgba(16,185,129,0.08)",
    calloutBorder: "#10b981",
    calloutColor: "#1e293b",
    tableBg: "transparent",
    tableHeaderBg: "rgba(16,185,129,0.08)",
    tableBestBg: "rgba(5,150,105,0.1)",
    bestValueColor: "#047857",
    metricValueColor: "#047857",
    heroNumberColor: "#047857",
    heroNumberShadow: "0 0 30px rgba(5,150,105,0.3)",
    timelineStepBg: "rgba(16,185,129,0.08)",
    timelineStepBorder: "rgba(16,185,129,0.15)",
    timelineStepColor: "#1e293b",
    timelineArrowColor: "#10b981",
    bulletDotColor: "#10b981",
    limitationBg: "rgba(220,38,38,0.05)",
    limitationBorder: "#dc2626",
    toolbarTone: "light",
  },
  warm: {
    background: "linear-gradient(135deg, #fef3c7 0%, #fce7f3 100%)",
    color: "#292524",
    accent: "#b45309",
    muted: "#57534e",
    labelColor: "#b45309",
    cardBg: "rgba(255,255,255,0.7)",
    cardBorder: "rgba(217,119,6,0.12)",
    titleColor: "#292524",
    calloutBg: "rgba(217,119,6,0.08)",
    calloutBorder: "#b45309",
    calloutColor: "#292524",
    tableBg: "transparent",
    tableHeaderBg: "rgba(217,119,6,0.08)",
    tableBestBg: "rgba(5,150,105,0.07)",
    bestValueColor: "#047857",
    metricValueColor: "#b45309",
    heroNumberColor: "#b45309",
    heroNumberShadow: "0 4px 20px rgba(217,119,6,0.2)",
    timelineStepBg: "rgba(217,119,6,0.1)",
    timelineStepBorder: "rgba(217,119,6,0.2)",
    timelineStepColor: "#57534e",
    timelineArrowColor: "#b45309",
    bulletDotColor: "#b45309",
    limitationBg: "rgba(220,38,38,0.05)",
    limitationBorder: "#dc2626",
    toolbarTone: "light",
  },
  navy: {
    background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
    noiseOverlay: true,
    color: "#e2e8f0",
    accent: "#2dd4bf",
    muted: "#cbd5e1",
    labelColor: "#2dd4bf",
    cardBg: "rgba(30,41,59,0.8)",
    cardBorder: "rgba(148,163,184,0.15)",
    titleColor: "#f1f5f9",
    calloutBg: "rgba(20,184,166,0.1)",
    calloutBorder: "#2dd4bf",
    calloutColor: "#e2e8f0",
    tableBg: "transparent",
    tableHeaderBg: "rgba(20,184,166,0.12)",
    tableBestBg: "rgba(20,184,166,0.12)",
    bestValueColor: "#5eead4",
    metricValueColor: "#2dd4bf",
    heroNumberColor: "#2dd4bf",
    heroNumberShadow: "0 0 30px rgba(20,184,166,0.3)",
    timelineStepBg: "rgba(20,184,166,0.1)",
    timelineStepBorder: "rgba(20,184,166,0.2)",
    timelineStepColor: "#e2e8f0",
    timelineArrowColor: "#2dd4bf",
    bulletDotColor: "#2dd4bf",
    limitationBg: "rgba(220,38,38,0.1)",
    limitationBorder: "#ef4444",
    toolbarTone: "dark",
  },
  minimal: {
    background: "#ffffff",
    color: "#111827",
    accent: "#374151",
    muted: "#6b7280",
    labelColor: "#374151",
    cardBg: "#ffffff",
    cardBorder: "#e5e7eb",
    titleColor: "#111827",
    calloutBg: "rgba(55,65,81,0.04)",
    calloutBorder: "#6b7280",
    calloutColor: "#4b5563",
    tableBg: "transparent",
    tableHeaderBg: "rgba(55,65,81,0.04)",
    tableBestBg: "rgba(5,150,105,0.06)",
    bestValueColor: "#047857",
    metricValueColor: "#374151",
    heroNumberColor: "#374151",
    timelineStepBg: "rgba(55,65,81,0.04)",
    timelineStepBorder: "#e5e7eb",
    timelineStepColor: "#111827",
    timelineArrowColor: "#6b7280",
    bulletDotColor: "#ef4444",
    limitationBg: "rgba(220,38,38,0.04)",
    limitationBorder: "#ef4444",
    toolbarTone: "light",
  },
  celebration: {
    background: "linear-gradient(135deg, #059669 0%, #2563eb 50%, #7c3aed 100%)",
    noiseOverlay: true,
    color: "#fff",
    accent: "#fde68a",
    muted: "rgba(255,255,255,0.90)",
    labelColor: "rgba(255,255,255,0.90)",
    cardBg: "rgba(255,255,255,0.18)",
    cardBorder: "rgba(255,255,255,0.25)",
    titleColor: "#fff",
    titleShadow: "0 2px 20px rgba(0,0,0,0.35)",
    calloutBg: "rgba(255,255,255,0.14)",
    calloutBorder: "#fde68a",
    calloutColor: "#fff",
    tableBg: "transparent",
    tableHeaderBg: "rgba(255,255,255,0.12)",
    tableBestBg: "rgba(255,255,255,0.18)",
    bestValueColor: "#fff",
    metricValueColor: "#fff",
    heroNumberColor: "#fff",
    heroNumberShadow: "0 0 40px rgba(255,255,255,0.4)",
    timelineStepBg: "rgba(255,255,255,0.18)",
    timelineStepBorder: "rgba(255,255,255,0.25)",
    timelineStepColor: "#fff",
    timelineArrowColor: "rgba(255,255,255,0.6)",
    bulletDotColor: "#fde68a",
    limitationBg: "rgba(255,255,255,0.12)",
    limitationBorder: "rgba(255,255,255,0.5)",
    toolbarTone: "dark",
  },
};

const defaultMood: Mood = "editorial";

const toolbarPalettes = {
  light: {
    background: "#ffffff",
    text: "#111111",
    muted: "#52525b",
    border: "rgba(17,17,17,0.16)",
    hover: "rgba(17,17,17,0.08)",
    shadow: "0 12px 30px rgba(0,0,0,0.14)",
  },
  dark: {
    background: "#000000",
    text: "#ffffff",
    muted: "#d4d4d8",
    border: "rgba(255,255,255,0.2)",
    hover: "rgba(255,255,255,0.14)",
    shadow: "0 12px 30px rgba(0,0,0,0.3)",
  },
} as const;

/* ────────────────────────── Venue config ────────────────────────── */

const venuePreset: Venue = "iclr"; // @render-venue
const venueLabels: Record<Venue, string> = { neurips: "NeurIPS", iclr: "ICLR", acl: "ACL", cvpr: "CVPR" };
const deckMotion: DeckMotion = {"preset":"editorial"}; // @render-motion

/* ────────────────────────── Slide data (18-slide Pro-Max starter) ────────────────────────── */

const slideData: Slide[] = [
  { id: 1, title: "Paper Title Goes Here", layout: "cover", mood: "cinematic", purpose: "Introduce the paper.", keyMessage: "One-sentence TL;DR.", speakerNote: "Open with the problem.", subtitle: "Authors · Venue · Year" },
  { id: 2, title: "Why this problem matters", layout: "split", mood: "editorial", purpose: "Frame the motivation.", keyMessage: "Current methods fail in an important regime.", speakerNote: "Spend one sentence on context.", bullets: ["Context sentence.", "Pain point sentence.", "Impact sentence."], revealOrder: ["bullets.0", "bullets.1", "bullets.2"], figureLabel: "Insert Figure: motivating comparison" },
  { id: 3, title: "The gap in prior work", layout: "bullets", mood: "editorial", purpose: "Show limitations of existing approaches.", keyMessage: "Prior methods miss a key opportunity.", speakerNote: "Name 2-3 concrete prior-work gaps.", bullets: ["Prior approach A limitation.", "Prior approach B limitation.", "Opportunity for improvement."] },
  { id: 4, title: "What came before", layout: "comparison", mood: "editorial", purpose: "Compare prior work.", keyMessage: "Existing solutions have clear tradeoffs.", speakerNote: "Use a concrete comparison.", comparisonLeft: { label: "Prior Work", items: ["Approach A", "Approach B"] }, comparisonRight: { label: "This Paper", items: ["Our approach", "Key difference"] } },
  { id: 5, title: "The core idea in one slide", layout: "diagram", mood: "glass", purpose: "Explain the conceptual leap.", keyMessage: "The paper changes the framing.", speakerNote: "Keep it conceptual.", bullets: ["Prior assumption.", "New mechanism.", "Consequence."], figureLabel: "Insert Figure: core idea diagram" },
  { id: 6, title: "Three-stage architecture", layout: "timeline", mood: "glass", purpose: "Show the full pipeline.", keyMessage: "The method has three stages.", speakerNote: "Walk through the flow.", timelineSteps: ["Stage A", "Stage B", "Stage C", "Output"] },
  { id: 7, title: "Architecture deep dive", layout: "split", mood: "glass", purpose: "Show the architecture figure.", keyMessage: "Each component plays a specific role.", speakerNote: "Let the figure dominate.", figureLabel: "Insert Figure: full architecture diagram" },
  { id: 8, title: "Key mechanism detail", layout: "bullets", mood: "navy", purpose: "Explain a key component.", keyMessage: "This mechanism enables the breakthrough.", speakerNote: "One mechanism per slide.", bullets: ["How it works.", "Why it helps.", "Key insight."], callout: "This is the critical design decision.", calloutStyle: "accent" },
  { id: 9, title: "Training objective", layout: "bullets", mood: "navy", purpose: "Explain the loss/objective.", keyMessage: "The training objective aligns representation with the goal.", speakerNote: "Keep the equation simple.", equation: "L = L_main + λ · L_aux", equationExplain: "Main loss + auxiliary regularization" },
  { id: 10, title: "Experimental setup", layout: "bullets", mood: "glass", purpose: "Describe evaluation.", keyMessage: "Evaluation covers N datasets and M baselines.", speakerNote: "Be specific about setup.", bullets: ["Datasets: X, Y, Z", "Metrics: A, B, C", "Baselines: D, E, F", "Implementation: framework, hardware"] },
  { id: 11, title: "The strongest result", layout: "hero-stat", mood: "celebration", purpose: "Headline achievement.", keyMessage: "The method delivers the clearest gain.", speakerNote: "Anchor on one number.", metrics: [{ label: "Main gain", value: "+4.2%", detail: "Accuracy on Dataset X", delta: "positive" }] },
  { id: 12, title: "Full comparison table", layout: "table-focus", mood: "glass", purpose: "Detailed comparison.", keyMessage: "Our method outperforms across metrics.", speakerNote: "Highlight the best row.", tableHeaders: ["Method", "Metric A", "Metric B", "Metric C"], tableRows: [{ cells: ["Baseline A", "81.3", "72.1", "0.89"] }, { cells: ["Baseline B", "83.7", "74.5", "0.91"] }, { cells: ["Ours", "85.5", "78.2", "0.94"], best: true }] },
  { id: 13, title: "Qualitative evidence", layout: "split", mood: "glass", purpose: "Show visual examples.", keyMessage: "The improvements are visible.", speakerNote: "Let the visual speak.", figureLabel: "Insert Figure: qualitative comparison" },
  { id: 14, title: "Ablation study", layout: "table-focus", mood: "navy", purpose: "Component isolation.", keyMessage: "Each component contributes.", speakerNote: "Highlight the full-method row.", tableHeaders: ["Configuration", "Metric A", "Metric B"], tableRows: [{ cells: ["w/o Component A", "82.1", "73.4"] }, { cells: ["w/o Component B", "83.9", "75.1"] }, { cells: ["Full method", "85.5", "78.2"], best: true }] },
  { id: 15, title: "Why the method succeeds", layout: "bullets", mood: "editorial", purpose: "Explain the analysis.", keyMessage: "The success stems from the key design choice.", speakerNote: "Connect results back to the core idea.", bullets: ["Design insight A.", "Design insight B.", "Connection to core idea."] },
  { id: 16, title: "Limitations of the current work", layout: "limitations", mood: "minimal", purpose: "End honestly.", keyMessage: "Clear boundaries exist.", speakerNote: "Be honest.", bullets: ["Limitation A.", "Limitation B.", "Limitation C."] },
  { id: 17, title: "Future directions", layout: "bullets", mood: "editorial", purpose: "Forward-looking.", keyMessage: "Several promising directions remain.", speakerNote: "Keep it concrete.", bullets: ["Direction A.", "Direction B.", "Direction C."] },
  { id: 18, title: "Final takeaway", layout: "cover", mood: "cinematic", purpose: "Close memorably.", keyMessage: "One sentence the audience should remember.", speakerNote: "End strong.", subtitle: "Code & samples: github.com/example" },
]; // @render-slide-data

/* ────────────────────────── Animation CSS ────────────────────────── */

const animationCSS = `
:root {
  --spring: cubic-bezier(0.16, 1, 0.3, 1);
  --noise-url: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

body {
  font-family: "Avenir Next", "Segoe UI", "SF Pro Text", system-ui, -apple-system, sans-serif;
  font-feature-settings: 'cv01', 'cv02', 'ss01';
  font-optical-sizing: auto;
}

/* Static-first motion: only brief entrance animations, no ambient bg loops */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes floatIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-12px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(12px); }
  to { opacity: 1; transform: translateX(0); }
}

.slide-enter { animation: fadeUp 400ms var(--spring) both; }
.stagger-1 { animation: floatIn 400ms 100ms var(--spring) both; }
.stagger-2 { animation: floatIn 400ms 200ms var(--spring) both; }
.stagger-3 { animation: floatIn 400ms 300ms var(--spring) both; }
.stagger-4 { animation: floatIn 400ms 400ms var(--spring) both; }
.slide-in-left { animation: slideInLeft 400ms 150ms var(--spring) both; }
.slide-in-right { animation: slideInRight 400ms 250ms var(--spring) both; }

.metric-card-anim { transition: box-shadow 160ms ease; }
.timeline-step-anim { transition: box-shadow 160ms ease; }
.comparison-panel-anim > div:first-child { animation: slideInLeft 400ms 150ms var(--spring) both; }
.comparison-panel-anim > div:last-child { animation: slideInRight 400ms 250ms var(--spring) both; }
.comparison-panel-anim > div { transition: box-shadow 160ms ease; }
.grid-card-anim { transition: box-shadow 160ms ease; }

.noise-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--noise-url);
  opacity: 0.03;
  mix-blend-mode: overlay;
  pointer-events: none;
  z-index: 1;
}

.progress-shimmer { background: var(--accent, #2563eb); }

.app-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #f5f5f4;
  font-family: "Avenir Next", "Segoe UI", "SF Pro Text", system-ui, -apple-system, sans-serif;
  padding: 24px;
  overflow: hidden;
}

.slide-label {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--deck-label, #2563eb);
  overflow-wrap: break-word;
  text-shadow: var(--deck-copy-shadow, none);
}

.slide-label-negative { color: var(--deck-negative, #dc2626); }

.slide-title {
  margin-top: 10px;
  font-size: clamp(2rem, 3.5vw, 2.8rem);
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--deck-title, #111827);
  text-shadow: var(--deck-title-shadow, none);
  text-wrap: balance;
  overflow-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
}

.slide-title-hero {
  margin-top: 16px;
  font-size: clamp(2rem, 3.5vw, 3rem);
  font-weight: 800;
}

.slide-body {
  margin-top: 14px;
  font-size: clamp(1.1rem, 1.6vw, 1.3rem);
  line-height: 1.6;
  color: var(--deck-muted, #6b7280);
  max-width: 56ch;
  overflow-wrap: break-word;
  text-shadow: var(--deck-copy-shadow, none);
}

.slide-body-wide { max-width: none; }
.slide-body-tight { margin-top: 12px; }
.slide-body-center { text-align: center; }

.slide-hero-number {
  margin-top: 20px;
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 900;
  letter-spacing: -0.05em;
  color: var(--deck-hero-number, var(--deck-accent, #2563eb));
  text-shadow: var(--deck-hero-number-shadow, none);
}

.figure-caption {
  border-top: 1px solid var(--deck-card-border, rgba(226,232,240,0.8));
  padding: 8px 12px;
  font-size: 14px;
  color: var(--deck-muted, #6b7280);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.figure-placeholder {
  color: var(--deck-muted, #6b7280);
}

.placeholder-label {
  font-size: 15px;
  color: var(--deck-muted, #6b7280);
}

.bullet-list {
  margin-top: 14px;
  display: grid;
  gap: 12px;
  list-style: none;
  padding: 0;
}

.bullet-item {
  display: grid;
  grid-template-columns: 8px 1fr;
  gap: 10px;
  align-items: start;
  font-size: clamp(1.1rem, 1.6vw, 1.3rem);
  line-height: 1.5;
  color: var(--deck-muted, #6b7280);
  overflow-wrap: break-word;
  text-shadow: var(--deck-copy-shadow, none);
}

.bullet-dot {
  width: 8px;
  height: 8px;
  margin-top: 8px;
  border-radius: 999px;
  background: var(--bullet-dot-color, var(--deck-bullet-dot, var(--deck-accent, #2563eb)));
  flex-shrink: 0;
}

.callout-box {
  font-size: clamp(1.1rem, 1.6vw, 1.3rem);
  line-height: 1.6;
  color: var(--deck-callout-color, var(--deck-text, #111827));
  text-shadow: var(--deck-copy-shadow, none);
}

.metric-label {
  font-size: 16px;
  color: var(--deck-muted, #6b7280);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-shadow: var(--deck-copy-shadow, none);
}

.metric-value {
  margin-top: 6px;
  font-size: clamp(1.6rem, 3vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  color: var(--deck-metric-value, var(--deck-accent, #2563eb));
  text-shadow: var(--deck-copy-shadow, none);
}

.metric-detail {
  margin-top: 4px;
  font-size: 15px;
  color: var(--deck-muted, #6b7280);
  overflow-wrap: break-word;
  text-shadow: var(--deck-copy-shadow, none);
}

.timeline-step-card {
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  color: var(--deck-timeline-step-color, var(--deck-text, #111827));
  text-shadow: var(--deck-copy-shadow, none);
}

.timeline-arrow {
  color: var(--deck-timeline-arrow-color, var(--deck-muted, #6b7280));
  font-size: 18px;
  font-weight: 700;
}

.result-table-base {
  width: 100%;
  border-collapse: collapse;
  font-size: 18px;
  table-layout: auto;
}

.result-table-head {
  font-weight: 600;
  color: var(--deck-title, #111827);
  text-shadow: var(--deck-copy-shadow, none);
}

.table-cell {
  color: var(--deck-text, #111827);
  text-shadow: var(--deck-copy-shadow, none);
}

.table-cell-best {
  color: var(--deck-best-value, var(--deck-accent, #2563eb));
  font-weight: 800;
}

.comparison-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 14px;
}

.comparison-label {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 8px;
  text-shadow: var(--deck-copy-shadow, none);
}

.comparison-label-muted { color: var(--deck-muted, #6b7280); }
.comparison-label-accent { color: var(--deck-label, #2563eb); }

.comparison-list {
  list-style: none;
  padding: 0;
}

.comparison-item {
  font-size: clamp(1.1rem, 1.6vw, 1.3rem);
  line-height: 1.6;
  color: var(--deck-text, #111827);
  margin-bottom: 4px;
  text-shadow: var(--deck-copy-shadow, none);
}

.equation-block {
  text-align: center;
  margin: 16px auto;
  padding: 20px 28px;
  font-size: 1.6rem;
  font-family: "Times New Roman", "Latin Modern Math", Georgia, serif;
  color: var(--deck-text, #111827);
  text-shadow: var(--deck-copy-shadow, none);
}

.equation-explain {
  text-align: center;
  max-width: none;
  margin-top: 8px;
  font-size: 1.15rem;
  color: var(--deck-muted, #6b7280);
  text-shadow: var(--deck-copy-shadow, none);
}

.help-overlay {
  position: absolute;
  right: 20px;
  top: 20px;
  z-index: 40;
  width: 320px;
  border-radius: 12px;
  padding: 16px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--deck-muted, #6b7280);
  box-shadow: 0 12px 32px rgba(0,0,0,0.08);
  backdrop-filter: blur(16px);
}

.help-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.help-title {
  font-weight: 700;
  color: var(--deck-title, #111827);
}

.help-close {
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--deck-muted, #6b7280);
  padding: 4px;
}

.help-list {
  margin-top: 12px;
  padding-left: 16px;
  font-size: 13px;
  color: var(--deck-muted, #6b7280);
}

.controls-bar {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--toolbar-border);
  border-radius: 999px;
  background: var(--toolbar-bg);
  box-shadow: var(--toolbar-shadow);
  backdrop-filter: blur(12px);
  z-index: 20;
  font-size: 13px;
  opacity: 0.18;
  transition: opacity 160ms ease, background-color 240ms ease, border-color 240ms ease, color 240ms ease;
}

.control-button {
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--toolbar-text, #111111);
  padding: 6px 8px;
  border-radius: 999px;
}

.control-button:hover {
  background: var(--toolbar-hover);
}

.control-counter {
  min-width: 56px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--toolbar-muted, #52525b);
}

.deck-container { position: relative; width: 1200px; height: 675px; overflow: hidden; border-radius: 16px; box-shadow: 0 16px 48px rgba(0,0,0,0.1); transform-origin: center center; }

/* Fullscreen: wrapper fills screen, deck stays 1200×675 inside it */
.deck-wrapper:fullscreen, .deck-wrapper:-webkit-full-screen { background: #000; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
.deck-wrapper:fullscreen .deck-container, .deck-wrapper:-webkit-full-screen .deck-container { border: none; border-radius: 0; box-shadow: none; }
.deck-wrapper::backdrop { background: #000; }

/* Fullscreen controls: auto-hide */
.deck-wrapper:fullscreen .controls-bar, .deck-wrapper:-webkit-full-screen .controls-bar { opacity: 0; transition: opacity 200ms, background-color 240ms ease, border-color 240ms ease, color 240ms ease; }
.deck-wrapper:fullscreen .controls-bar:hover, .deck-wrapper:-webkit-full-screen .controls-bar:hover,
.deck-wrapper:fullscreen .controls-bar:focus-within, .deck-wrapper:-webkit-full-screen .controls-bar:focus-within { opacity: 1; }
.deck-container:hover .controls-bar, .deck-container:focus-within .controls-bar { opacity: 1; }

@media (prefers-reduced-motion: reduce) {
  .slide-enter, .stagger-1, .stagger-2, .stagger-3, .stagger-4 { animation: none; }
  .metric-card-anim, .timeline-step-anim, [data-build-target] { transition: none; }
}
[data-build-target] { transition: opacity 180ms cubic-bezier(0, 0, 0.2, 1); }
[data-build-state="pending"] { opacity: 0 !important; visibility: hidden; pointer-events: none; }
[data-build-state="revealed"] { opacity: 1; visibility: visible; }

/* Motion graphics: the engine drives entrances in .motion-managed stages, so their CSS entrances are off */
.motion-managed .stagger-1, .motion-managed .stagger-2, .motion-managed .stagger-3, .motion-managed .stagger-4,
.motion-managed .slide-in-left, .motion-managed .slide-in-right, .motion-managed .comparison-panel-anim > div { animation: none; }
.motion-managed [data-build-target] { transition: none; }
.motion-layer { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.motion-under { z-index: 0; }
.motion-over { z-index: 3; }
.motion-piece { position: absolute; inset: 0; }
.mo-curtain { position: absolute; top: 0; bottom: 0; }
.mo-wipe-edge { position: absolute; left: 0; top: -8%; bottom: -8%; width: 6px; margin-left: -3px; background: var(--accent); box-shadow: 0 0 22px var(--accent); }
.mo-ring { position: absolute; left: 50%; top: 50%; border: 4px solid var(--accent); border-radius: 50%; box-shadow: 0 0 24px var(--accent), inset 0 0 24px var(--accent); }
.mo-pixels { position: absolute; inset: 0; }
.mo-pixels i { position: absolute; width: calc(100% / 16 + 1px); height: calc(100% / 9 + 1px); background: var(--deck-text, #111827); }
.mo-pixels i.hot { background: var(--accent); }
.mo-w, .mo-c, .mo-m { display: inline-block; }
.mo-w { white-space: nowrap; }
.mo-m { clip-path: inset(-0.22em -0.12em -0.3em -0.12em); }
.mo-l, .mo-li, .mo-half { display: block; }
.mo-lm { clip-path: inset(-0.25em -1em -0.35em -1em); }
.mo-li { transform-origin: 0 100%; }
.mo-merge { position: relative; }
.mo-top { clip-path: inset(-0.4em -0.6em calc(50% - 0.5px) -0.6em); }
.mo-bottom { position: absolute; top: 0; right: 0; left: 0; clip-path: inset(calc(50% - 0.5px) -0.6em -0.5em -0.6em); }
.mo-scr { position: relative; -webkit-text-fill-color: transparent; }
.mo-scr::after { content: attr(data-g); position: absolute; top: 0; left: 50%; transform: translateX(-50%); color: var(--accent); -webkit-text-fill-color: var(--accent); }
.mo-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.mo-masking { -webkit-mask-image: linear-gradient(90deg, #000 calc(var(--mo-p, 130%) - 26%), transparent var(--mo-p, 130%)); mask-image: linear-gradient(90deg, #000 calc(var(--mo-p, 130%) - 26%), transparent var(--mo-p, 130%)); }
.timeline-arrow { transform-origin: 0 50%; }

.motion-panel { position: absolute; right: 20px; bottom: 72px; z-index: 35; width: 320px; padding: 14px 16px 16px; border: 1px solid var(--toolbar-border); border-radius: 12px; background: var(--toolbar-bg); color: var(--toolbar-text); box-shadow: var(--toolbar-shadow); font-size: 13px; line-height: 1.4; }
.motion-head { display: flex; align-items: center; justify-content: space-between; }
.motion-title { font-weight: 800; font-size: 15px; }
.motion-panel .help-close { color: var(--toolbar-muted); }
.motion-presets { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; margin-top: 10px; }
.motion-chip { border: 1px solid var(--toolbar-border); border-radius: 8px; padding: 7px 8px; background: transparent; color: inherit; cursor: pointer; text-align: left; font-weight: 750; font-size: 12px; line-height: 1.2; }
.motion-chip small { display: block; margin-top: 3px; font-weight: 500; font-size: 10.5px; color: var(--toolbar-muted); }
.motion-chip[aria-pressed="true"] { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
.motion-row { display: grid; grid-template-columns: 74px minmax(0, 1fr) auto; align-items: center; gap: 8px; margin-top: 10px; font-size: 12px; font-weight: 700; color: var(--toolbar-muted); }
.motion-row select { grid-column: 2 / 4; min-width: 0; border: 1px solid var(--toolbar-border); border-radius: 6px; background: transparent; color: var(--toolbar-text); padding: 5px 6px; font-size: 12px; }
.motion-row output { min-width: 34px; text-align: right; color: var(--toolbar-text); font-variant-numeric: tabular-nums; }
.motion-replay { display: inline-flex; align-items: center; gap: 6px; margin-top: 12px; border: 1px solid var(--toolbar-border); border-radius: 8px; padding: 6px 10px; background: transparent; color: inherit; cursor: pointer; font-weight: 700; font-size: 12px; }
.motion-note { margin-top: 8px; font-size: 11px; color: var(--toolbar-muted); }
@media (max-width: 900px) {
  .deck-container { border-radius: 0; }
}
`;

/* ────────────────────────── Helper: get mood for slide ────────────────────────── */

function getMood(slide: Slide): MoodStyle {
  return moodStyles[slide.mood || defaultMood];
}

function getRevealOrder(slide: Slide) {
  const available = new Set<string>();
  if (slide.keyMessage) available.add("keyMessage");
  slide.bullets?.forEach((_, index) => available.add(`bullets.${index}`));
  slide.metrics?.forEach((_, index) => available.add(`metrics.${index}`));
  slide.tableRows?.forEach((_, index) => available.add(`table.rows.${index}`));
  if (slide.visual?.src || slide.figureLabel) available.add("visual");
  const seen = new Set<string>();
  return (slide.revealOrder || []).filter((target) => {
    if (!available.has(target) || seen.has(target)) return false;
    seen.add(target);
    return true;
  });
}

function buildProps(slide: Slide, target: string, revealed?: number) {
  const index = getRevealOrder(slide).indexOf(target);
  const visible = revealed === undefined || index < 0 || index < revealed;
  return {
    "data-build-target": target,
    "data-build-state": visible ? "revealed" : "pending",
    "data-morph": slide.morph?.[target] || undefined,
    "aria-hidden": visible ? undefined : true,
  } as const;
}

/* ────────────────────────── Motion graphics ────────────────────────── */
/* Slide transitions plus text, figure, card, and number entrances modeled on effects catalogued at
   kittenjam-motion-library.vercel.app. Mirrors the engines in assets/html-slideshow-starter/paper-presentation.html
   and assets/react-project-starter/src/lib/motion.ts: same ids, presets, and timings (references/motion-graphics.md).
   Every effect ends on the static layout, text is split only when its line breaks stay identical, React-owned
   text nodes are restored rather than replaced, and navigation finishes running motion before it commits. */

const MOTION_PRESET_IDS = ["none", "subtle", "editorial", "kinetic", "cinematic", "digital"] as const;
const MOTION_TRANSITIONS = ["none", "fade", "rise", "push", "wipe", "curtain", "circle", "doors", "slices", "zoom", "glitch", "pixel", "morph"] as const;
const MOTION_TEXT_EFFECTS = ["none", "fade-up", "rise", "blur", "spread", "merge", "scramble", "typewriter", "lines", "soft"] as const;
const MOTION_CHANNELS = {
  kicker: MOTION_TEXT_EFFECTS,
  title: MOTION_TEXT_EFFECTS,
  hero: MOTION_TEXT_EFFECTS,
  text: MOTION_TEXT_EFFECTS,
  media: ["none", "fade-up", "clip", "mask", "zoom"],
  data: ["none", "count", "scramble"],
  group: ["none", "fade-up", "stagger"],
  emphasis: ["none", "sweep"],
} as const;

type MotionPresetId = (typeof MOTION_PRESET_IDS)[number];
type MotionTransition = (typeof MOTION_TRANSITIONS)[number];
type MotionChannel = keyof typeof MOTION_CHANNELS;
type MotionProfile = { transition: MotionTransition; accent: MotionTransition } & { [K in MotionChannel]: string };
type DeckMotion = Partial<MotionProfile> & { preset: MotionPresetId; speed?: number };
type ResolvedMotion = MotionProfile & { speed: number; reduced?: boolean };
type NavKind = "next" | "prev" | "goto";

const MOTION_PRESETS: Record<MotionPresetId, MotionProfile & { name: string; note: string }> = {
  none: { name: "None", note: "Instant cuts", transition: "none", accent: "none", kicker: "none", title: "none", hero: "none", text: "none", media: "none", data: "none", group: "none", emphasis: "none" },
  subtle: { name: "Subtle", note: "Short fades", transition: "fade", accent: "rise", kicker: "fade-up", title: "fade-up", hero: "fade-up", text: "fade-up", media: "fade-up", data: "none", group: "fade-up", emphasis: "none" },
  editorial: { name: "Editorial", note: "Push, rising words", transition: "push", accent: "curtain", kicker: "fade-up", title: "rise", hero: "spread", text: "soft", media: "mask", data: "count", group: "stagger", emphasis: "sweep" },
  kinetic: { name: "Kinetic", note: "Wipes, blur letters", transition: "wipe", accent: "circle", kicker: "rise", title: "blur", hero: "merge", text: "lines", media: "clip", data: "count", group: "stagger", emphasis: "sweep" },
  cinematic: { name: "Cinematic", note: "Zoom-through, doors", transition: "zoom", accent: "doors", kicker: "fade-up", title: "spread", hero: "blur", text: "soft", media: "zoom", data: "count", group: "stagger", emphasis: "none" },
  digital: { name: "Digital", note: "Glitch, scramble", transition: "glitch", accent: "pixel", kicker: "typewriter", title: "scramble", hero: "scramble", text: "blur", media: "clip", data: "scramble", group: "stagger", emphasis: "sweep" },
};

const Motion = (() => {
  /* This component's markup (SlideRenderer below). */
  const SEL = {
    targets: ".slide-label,.slide-title,.slide-body,.bullet-item,.callout-box,.limitation-panel,.slide-hero-number,figure,.figure-placeholder,.equation-block,.metric-card-anim,.comparison-grid>div,.timeline-step-card,.timeline-arrow,.result-table-base tr",
    owners: ".metric-card-anim,figure,.figure-placeholder,.equation-block,.comparison-grid>div,.timeline-step-card,.callout-box",
    kicker: ".slide-label",
    hero: ".slide-title-hero",
    title: ".slide-title",
    media: "figure,.figure-placeholder,.equation-block",
    group: ".metric-card-anim,.comparison-grid>div,.timeline-step-card,.timeline-arrow,.result-table-base tr,.slide-hero-number",
    emphasis: ".callout-box,.limitation-panel",
    bullet: ".bullet-item",
    data: ".metric-value,.slide-hero-number",
  };
  const KEYS = ["transition", "accent", ...Object.keys(MOTION_CHANNELS)] as (keyof MotionProfile)[];
  const EASE = { out: "cubic-bezier(.22,1,.36,1)", expo: "cubic-bezier(.16,1,.3,1)", inOut: "cubic-bezier(.65,0,.35,1)", in: "cubic-bezier(.55,0,1,.45)", soft: "cubic-bezier(.33,1,.68,1)", card: "cubic-bezier(.215,.61,.355,1)" };
  const GAPS: Record<MotionChannel, number> = { kicker: 70, title: 120, hero: 150, text: 110, media: 130, group: 80, emphasis: 110, data: 0 };
  const BLOCKERS = "img,svg,canvas,video,iframe,table,input,textarea,select,button,br";
  const CJK = /[\u2e80-\u9fff\uf900-\ufaff\ufe30-\ufe4f\uff00-\uffef\uac00-\ud7af]/;
  const CLOSE = /^[、。，．・：；？！ー々ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶ」』）】〉》〕｝〗〙〛’”…‥,.;:!?)\]}%％]$/;
  const OPEN = /^[「『（【〈《〔｛〖〘〚‘“(\[{]$/;
  const GLYPHS = { latin: "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#$%&*+=?", digit: "0123456789", cjk: "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン", other: "#%&*+=<>/|" };
  const NUMBER = /^(\D*?)([+\-−–]?)(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?(\D*)$/;
  const GLITCH = "drop-shadow(5px 0 0 rgba(255,0,92,.75)) drop-shadow(-5px 0 0 rgba(0,224,255,.75))";
  type Job = { stop: () => void; done: boolean };
  type Ctx = { S: (ms: number) => number; accent: string };
  type Fx = (el: HTMLElement, t: number, ctx: Ctx) => number;
  type Token = { space: boolean; text: string };
  type Layers = { deck: HTMLElement; under: HTMLElement; over: HTMLElement };
  type TransitionCtx = Ctx & Layers & { ghost: HTMLElement; incoming: HTMLElement; dir: number; add: (anim: Animation | null) => void };
  const engine = { anims: new Set<Animation>(), jobs: new Set<Job>(), lastNavAt: -1e9 };
  let segmenter: Intl.Segmenter | null | undefined;
  let maskSupport: boolean | null = null;

  /* ── Configuration ── */
  function sanitize(src: unknown, withPreset = true): Partial<DeckMotion> {
    const out: Partial<DeckMotion> = {};
    if (!src || typeof src !== "object") return out;
    const value = src as Record<string, unknown>;
    if (withPreset && typeof value.preset === "string" && value.preset in MOTION_PRESETS) out.preset = value.preset as MotionPresetId;
    for (const key of KEYS) {
      const allowed: readonly string[] = key === "transition" || key === "accent" ? MOTION_TRANSITIONS : MOTION_CHANNELS[key as MotionChannel];
      if (typeof value[key] === "string" && allowed.includes(value[key] as string)) (out as Record<string, unknown>)[key] = value[key];
    }
    const speed = Number(value.speed);
    if (Number.isFinite(speed) && speed > 0) out.speed = Math.max(0.25, Math.min(4, speed));
    return out;
  }
  function normalize(next: unknown): DeckMotion {
    const clean = sanitize(typeof next === "string" ? { preset: next } : next);
    return { ...clean, preset: clean.preset ?? "editorial" };
  }
  function reduced() {
    return typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  }
  /* ?motion=<preset> previews or disables motion (e.g. ?motion=none for captures) without saving it. */
  function urlPreset(): MotionPresetId | null {
    try {
      const id = new URLSearchParams(window.location.search).get("motion");
      return id && id in MOTION_PRESETS ? (id as MotionPresetId) : null;
    } catch {
      return null;
    }
  }
  function isAccent(slides: Slide[], index: number) {
    const slide = slides[index];
    if (!slide) return false;
    if (typeof slide.accent === "boolean") return slide.accent;
    if (slide.layout === "cover" || slide.layout === "limitations" || slide.layout === "hero-stat") return true;
    if (["title", "main-result", "limitation", "takeaway", "headline result", "close"].includes(slide.pageRole ?? "")) return true;
    return Boolean(slide.appendix && index > 0 && !slides[index - 1]?.appendix);
  }
  function resolve(deck: DeckMotion, slides: Slide[], index: number, ignoreReduced = false): ResolvedMotion {
    if (!ignoreReduced && reduced()) return { ...MOTION_PRESETS.none, speed: 1, reduced: true };
    const accent = isAccent(slides, index);
    const forced = urlPreset();
    if (forced) {
      const preset = MOTION_PRESETS[forced];
      return { ...preset, transition: accent ? preset.accent : preset.transition, speed: 1 };
    }
    let profile: MotionProfile & { speed?: number } = { ...(MOTION_PRESETS[deck.preset] ?? MOTION_PRESETS.editorial), ...sanitize(deck, false) };
    const own = slides[index]?.motion;
    if (typeof own === "string" && own in MOTION_PRESETS) profile = { ...MOTION_PRESETS[own as MotionPresetId], speed: profile.speed };
    else if (own && typeof own === "object") {
      const patch = sanitize(own);
      profile = { ...(patch.preset ? { ...MOTION_PRESETS[patch.preset], speed: profile.speed } : profile), ...patch };
    }
    const slideTransition = slides[index]?.transition ?? "";
    const transition = (MOTION_TRANSITIONS as readonly string[]).includes(slideTransition) ? (slideTransition as MotionTransition) : accent ? profile.accent : profile.transition;
    return { ...profile, transition, speed: profile.speed ?? 1 };
  }
  function context(profile: ResolvedMotion, scope: Element): Ctx {
    const speed = Math.max(0.25, Math.min(4, Number(profile.speed) || 1));
    return { S: (ms) => Math.max(0, ms) / speed, accent: getComputedStyle(scope).getPropertyValue("--accent").trim() || "#2563eb" };
  }

  /* ── Bookkeeping: every animation and timer job can be finished synchronously ── */
  function animate(el: Element | null, frames: Keyframe[], opts: KeyframeAnimationOptions): Animation | null {
    if (!el || typeof (el as HTMLElement).animate !== "function") return null;
    const anim = (el as HTMLElement).animate(frames, { fill: "backwards", easing: EASE.out, ...opts });
    engine.anims.add(anim);
    const done = () => engine.anims.delete(anim);
    anim.finished.then(done, done);
    return anim;
  }
  function job(stop: () => void): Job {
    const entry = { stop, done: false };
    engine.jobs.add(entry);
    return entry;
  }
  function endJob(entry: Job) {
    if (entry.done) return;
    entry.done = true;
    engine.jobs.delete(entry);
    try {
      entry.stop();
    } catch {
      /* restoring must never break the deck */
    }
  }
  function waitFor(entry: Job, anims: (Animation | null)[]) {
    const list = anims.filter((anim): anim is Animation => Boolean(anim));
    if (!list.length) return endJob(entry);
    void Promise.all(list.map((anim) => anim.finished.catch(() => undefined))).then(() => endJob(entry));
  }
  function trackSplit(split: { restore: () => void }, make: () => (Animation | null)[]) {
    const entry = job(split.restore);
    try {
      waitFor(entry, make());
    } catch {
      endJob(entry);
    }
  }
  /** Snap all running motion to its final frame and restore split text and layers. */
  function finish() {
    for (const anim of [...engine.anims]) {
      try {
        anim.finish();
      } catch {
        try {
          anim.cancel();
        } catch {
          /* already gone */
        }
      }
    }
    engine.anims.clear();
    for (const entry of [...engine.jobs]) endJob(entry);
  }
  if (typeof window !== "undefined") window.addEventListener("beforeprint", finish);

  /* ── Text splitting: units keep the static line breaks or the split is undone ── */
  function graphemes(text: string) {
    if (segmenter === undefined) segmenter = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
    return segmenter ? Array.from(segmenter.segment(text), (part) => part.segment) : Array.from(text);
  }
  function tokens(text: string): Token[] {
    const out: Token[] = [];
    for (const part of text.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        out.push({ space: true, text: part });
        continue;
      }
      const units: string[] = [];
      let latin = "";
      for (const g of graphemes(part)) {
        if (CJK.test(g)) {
          if (latin) units.push(latin);
          latin = "";
          units.push(g);
        } else latin += g;
      }
      if (latin) units.push(latin);
      let prefix = "";
      for (const unit of units) {
        const last = out[out.length - 1];
        if (OPEN.test(unit)) {
          prefix += unit;
          continue;
        }
        if (!prefix && CLOSE.test(unit) && last && !last.space) {
          last.text += unit;
          continue;
        }
        out.push({ space: false, text: prefix + unit });
        prefix = "";
      }
      if (prefix) out.push({ space: false, text: prefix });
    }
    return out;
  }
  /* Only a single React text node is split, so React's node references stay valid. */
  function soleText(el: HTMLElement): Text | null {
    if (!el.isConnected || el.childNodes.length !== 1 || el.firstChild?.nodeType !== Node.TEXT_NODE || el.querySelector(BLOCKERS)) return null;
    const text = el.textContent ?? "";
    return text.trim() && text.length <= 420 ? (el.firstChild as Text) : null;
  }
  function srOnly(text: string) {
    const sr = document.createElement("span");
    sr.className = "mo-sr";
    sr.textContent = text;
    return sr;
  }
  function lineIndices(tops: number[]) {
    let line = 0;
    let last: number | null = null;
    return tops.map((top) => {
      if (last !== null && Math.abs(top - last) > 3) line++;
      last = top;
      return line;
    });
  }
  function rangeTops(node: Text, list: Token[]) {
    const range = document.createRange();
    const tops: number[] = [];
    let offset = 0;
    for (const token of list) {
      if (!token.space) {
        range.setStart(node, offset);
        range.setEnd(node, offset + token.text.length);
        const rects = range.getClientRects();
        if (rects.length !== 1) return null;
        tops.push(rects[0].top);
      }
      offset += token.text.length;
    }
    return tops;
  }
  function splitText(el: HTMLElement, { chars = false, mask = false } = {}) {
    const node = soleText(el);
    if (!node) return null;
    const text = node.data;
    const list = tokens(text);
    const tops = rangeTops(node, list);
    if (!tops) return null;
    const height = el.offsetHeight;
    const width = el.offsetWidth;
    const nodes: Node[] = [srOnly(text)];
    const units: HTMLElement[] = [];
    const words: HTMLElement[] = [];
    for (const token of list) {
      if (token.space) {
        nodes.push(document.createTextNode(token.text));
        continue;
      }
      const word = document.createElement("span");
      word.className = "mo-w";
      word.setAttribute("aria-hidden", "true");
      for (const part of chars ? graphemes(token.text) : [token.text]) {
        const unit = document.createElement("span");
        unit.className = "mo-c";
        unit.textContent = part;
        if (mask) {
          const holder = document.createElement("span");
          holder.className = "mo-m";
          holder.appendChild(unit);
          word.appendChild(holder);
        } else word.appendChild(unit);
        units.push(unit);
      }
      nodes.push(word);
      words.push(word);
    }
    el.replaceChildren(...nodes);
    const restore = () => el.replaceChildren(node);
    const same =
      Math.abs(el.offsetHeight - height) <= 1 &&
      Math.abs(el.offsetWidth - width) <= 1 &&
      lineIndices(tops).join() === lineIndices(words.map((word) => word.getBoundingClientRect().top)).join();
    if (!same) {
      restore();
      return null;
    }
    return { units, restore };
  }
  function splitLines(el: HTMLElement, { mask = false } = {}) {
    const node = soleText(el);
    if (!node || getComputedStyle(el).display.startsWith("inline")) return null;
    const text = node.data;
    const height = el.offsetHeight;
    const width = el.offsetWidth;
    const restore = () => el.replaceChildren(node);
    const pieces: (Text | HTMLElement)[] = tokens(text).map((token) => {
      if (token.space) return document.createTextNode(token.text);
      const span = document.createElement("span");
      span.textContent = token.text;
      return span;
    });
    el.replaceChildren(...pieces);
    const groups: Node[][] = [];
    let top: number | null = null;
    for (const piece of pieces) {
      if (piece instanceof HTMLElement) {
        if (piece.getClientRects().length > 1) {
          restore();
          return null;
        }
        if (top === null || Math.abs(piece.offsetTop - top) > 2) {
          groups.push([]);
          top = piece.offsetTop;
        }
      }
      if (!groups.length) groups.push([]);
      groups[groups.length - 1].push(piece);
    }
    const lines: HTMLElement[] = [];
    const blocks = groups.map((group) => {
      const line = document.createElement("span");
      line.className = mask ? "mo-l mo-lm" : "mo-l";
      line.setAttribute("aria-hidden", "true");
      let inner = line;
      if (mask) {
        inner = document.createElement("span");
        inner.className = "mo-li";
        line.appendChild(inner);
      }
      inner.append(...group);
      lines.push(inner);
      return line;
    });
    el.replaceChildren(srOnly(text), ...blocks);
    if (Math.abs(el.offsetHeight - height) > 1 || Math.abs(el.offsetWidth - width) > 1) {
      restore();
      return null;
    }
    return { lines, blocks, restore };
  }

  /* ── Text effects: (element, start ms, context) -> end ms, all at 1x speed ── */
  const fxFadeUp = (el: HTMLElement, t: number, ctx: Ctx, distance = 18) => {
    animate(el, [{ opacity: 0, transform: `translateY(${distance}px)` }, { opacity: 1, transform: "none" }], { duration: ctx.S(640), delay: ctx.S(t), easing: EASE.out });
    return t + 640;
  };
  const fxSoft: Fx = (el, t, ctx) => {
    const split = splitLines(el);
    const lines = split ? split.lines : [el];
    const make = () => lines.map((line, i) => animate(line, [{ opacity: 0, transform: "translateY(10px)", filter: "blur(4px)" }, { opacity: 1, transform: "none", filter: "blur(0px)" }], { duration: ctx.S(900), delay: ctx.S(t + i * 150), easing: EASE.out }));
    if (split) trackSplit(split, make);
    else make();
    return t + (lines.length - 1) * 150 + 900;
  };
  const fxRise: Fx = (el, t, ctx) => {
    const split = splitText(el, { mask: true });
    if (!split) return fxFadeUp(el, t, ctx);
    const n = split.units.length;
    const step = Math.min(42, 420 / Math.max(1, n - 1));
    trackSplit(split, () => split.units.map((unit, i) => animate(unit, [{ transform: "translateY(122%)" }, { transform: "none" }], { duration: ctx.S(780), delay: ctx.S(t + i * step), easing: EASE.expo })));
    return t + (n - 1) * step + 780;
  };
  const fxBlur: Fx = (el, t, ctx) => {
    const short = (el.textContent ?? "").length <= 60;
    const split = splitText(el, { chars: short });
    if (!split) return fxSoft(el, t, ctx);
    const n = split.units.length;
    const step = Math.min(short ? 28 : 46, (short ? 520 : 620) / Math.max(1, n - 1));
    trackSplit(split, () =>
      split.units.map((unit, i) =>
        animate(unit, [{ opacity: 0, filter: "blur(10px)", transform: "translateY(.25em) scale(1.15)" }, { opacity: 1, filter: "blur(0px)", transform: "none" }], { duration: ctx.S(720), delay: ctx.S(t + i * step), easing: EASE.out }),
      ),
    );
    return t + (n - 1) * step + 720;
  };
  const fxSpread: Fx = (el, t, ctx) => {
    const split = (el.textContent ?? "").length <= 90 ? splitText(el, { chars: true }) : null;
    if (!split) return fxSoft(el, t, ctx);
    const rows: { top: number; min: number; max: number; units: HTMLElement[] }[] = [];
    for (const unit of split.units) {
      const top = unit.offsetTop;
      const left = unit.offsetLeft;
      let row = rows.find((candidate) => Math.abs(candidate.top - top) <= 4);
      if (!row) rows.push((row = { top, min: left, max: left + unit.offsetWidth, units: [] }));
      row.min = Math.min(row.min, left);
      row.max = Math.max(row.max, left + unit.offsetWidth);
      row.units.push(unit);
    }
    trackSplit(split, () =>
      rows.flatMap((row) =>
        row.units.map((unit) => {
          const dx = ((row.min + row.max) / 2 - (unit.offsetLeft + unit.offsetWidth / 2)) * 0.9;
          return animate(unit, [{ opacity: 0, filter: "blur(8px)", transform: `translateX(${dx.toFixed(1)}px)` }, { opacity: 1, offset: 0.45 }, { opacity: 1, filter: "blur(0px)", transform: "none" }], { duration: ctx.S(1000), delay: ctx.S(t), easing: EASE.expo });
        }),
      ),
    );
    return t + 1000;
  };
  const fxMerge: Fx = (el, t, ctx) => {
    const split = splitLines(el);
    if (!split) return fxFadeUp(el, t, ctx);
    trackSplit(split, () =>
      split.blocks.flatMap((line, i) => {
        line.classList.add("mo-merge");
        const top = document.createElement("span");
        top.className = "mo-half mo-top";
        top.append(...Array.from(line.childNodes));
        const bottom = top.cloneNode(true) as HTMLElement;
        bottom.className = "mo-half mo-bottom";
        line.append(top, bottom);
        const timing = { duration: ctx.S(880), delay: ctx.S(t + i * 90), easing: EASE.expo };
        return [
          animate(top, [{ opacity: 0, transform: "translateX(-26%)" }, { opacity: 1, transform: "none" }], timing),
          animate(bottom, [{ opacity: 0, transform: "translateX(26%)" }, { opacity: 1, transform: "none" }], timing),
        ];
      }),
    );
    return t + (split.blocks.length - 1) * 90 + 880;
  };
  const glyph = (ch: string) => {
    const pool = /\d/.test(ch) ? GLYPHS.digit : /[A-Za-z]/.test(ch) ? GLYPHS.latin : CJK.test(ch) ? GLYPHS.cjk : GLYPHS.other;
    return pool[Math.floor(Math.random() * pool.length)];
  };
  const fxScramble: Fx = (el, t, ctx) => {
    const split = (el.textContent ?? "").length <= 64 ? splitText(el, { chars: true }) : null;
    if (!split) return fxBlur(el, t, ctx);
    const chars = split.units.filter((unit) => unit.textContent?.trim());
    chars.forEach((unit) => {
      unit.dataset.g = glyph(unit.textContent ?? "");
      unit.classList.add("mo-scr");
    });
    animate(el, [{ opacity: 0 }, { opacity: 1 }], { duration: ctx.S(160), delay: ctx.S(t), easing: "linear" });
    const start = performance.now() + ctx.S(t);
    const total = ctx.S(820);
    let timer = 0;
    const entry = job(() => {
      window.clearTimeout(timer);
      split.restore();
    });
    const tick = () => {
      const p = (performance.now() - start) / total;
      if (p >= 0) {
        chars.forEach((unit, i) => {
          if (!unit.classList.contains("mo-scr")) return;
          if (p >= 0.25 + (0.75 * i) / Math.max(1, chars.length - 1)) unit.classList.remove("mo-scr");
          else if (Math.random() < 0.55) unit.dataset.g = glyph(unit.textContent ?? "");
        });
      }
      if (p < 1) timer = window.setTimeout(tick, 45);
      else endJob(entry);
    };
    tick();
    return t + 820;
  };
  const fxTypewriter: Fx = (el, t, ctx) => {
    const split = (el.textContent ?? "").length <= 160 ? splitText(el, { chars: true }) : null;
    if (!split) return fxSoft(el, t, ctx);
    const n = split.units.length;
    const step = Math.max(10, Math.min(34, 1100 / Math.max(1, n)));
    const on = `2px 0 0 0 ${ctx.accent}`;
    const off = "0 0 0 0 transparent";
    const blink: Keyframe[] = [{ boxShadow: on }, { boxShadow: on, offset: 0.3 }, { boxShadow: off, offset: 0.31 }, { boxShadow: off, offset: 0.6 }, { boxShadow: on, offset: 0.61 }, { boxShadow: on, offset: 0.9 }, { boxShadow: off, offset: 0.91 }, { boxShadow: off }];
    trackSplit(split, () =>
      split.units.flatMap((unit, i) => {
        const at = ctx.S(t + i * step);
        const last = i === n - 1;
        return [
          animate(unit, [{ opacity: 0 }, { opacity: 1 }], { duration: 1, delay: at, easing: "steps(1,end)" }),
          animate(unit, last ? blink : [{ boxShadow: on }, { boxShadow: on }], { duration: ctx.S(last ? 900 : step), delay: at, easing: "linear", fill: "none" }),
        ];
      }),
    );
    return t + n * step + 300;
  };
  const fxLines: Fx = (el, t, ctx) => {
    const split = splitLines(el, { mask: true });
    if (!split) return fxFadeUp(el, t, ctx);
    trackSplit(split, () => split.lines.map((line, i) => animate(line, [{ transform: "translateY(118%) rotate(2.5deg)" }, { transform: "none" }], { duration: ctx.S(820), delay: ctx.S(t + i * 110), easing: EASE.expo })));
    return t + (split.lines.length - 1) * 110 + 820;
  };
  const TEXT_FX: Record<string, Fx> = { "fade-up": fxFadeUp, rise: fxRise, blur: fxBlur, spread: fxSpread, merge: fxMerge, scramble: fxScramble, typewriter: fxTypewriter, lines: fxLines, soft: fxSoft };

  /* ── Figure, card, number, and panel effects ── */
  const fxClip: Fx = (el, t, ctx) => {
    const across = el.matches(".equation-block");
    const media = el.querySelector("img,svg");
    animate(el, [{ clipPath: across ? "inset(0% 100% 0% 0%)" : "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)" }], { duration: ctx.S(980), delay: ctx.S(t), easing: "cubic-bezier(.7,0,.2,1)" });
    if (media) animate(media, [{ transform: "scale(1.18)" }, { transform: "none" }], { duration: ctx.S(1300), delay: ctx.S(t), easing: EASE.out });
    return t + 1300;
  };
  function maskReady() {
    if (maskSupport !== null) return maskSupport;
    maskSupport = false;
    try {
      const supported = CSS.supports("mask-image", "linear-gradient(#000,transparent)") || CSS.supports("-webkit-mask-image", "linear-gradient(#000,transparent)");
      if (supported && "registerProperty" in CSS) {
        CSS.registerProperty({ name: "--mo-p", syntax: "<percentage>", inherits: false, initialValue: "130%" });
        maskSupport = true;
      }
    } catch (error) {
      maskSupport = error instanceof DOMException && error.name === "InvalidModificationError";
    }
    return maskSupport;
  }
  const fxMask: Fx = (el, t, ctx) => {
    if (!maskReady()) return fxClip(el, t, ctx);
    const media = el.querySelector("img,svg");
    el.classList.add("mo-masking");
    waitFor(job(() => el.classList.remove("mo-masking")), [
      animate(el, [{ "--mo-p": "0%" } as Keyframe, { "--mo-p": "130%" } as Keyframe], { duration: ctx.S(1150), delay: ctx.S(t), easing: EASE.inOut }),
      media && animate(media, [{ transform: "translateX(-10px) scale(1.08)" }, { transform: "none" }], { duration: ctx.S(1400), delay: ctx.S(t), easing: EASE.out }),
    ]);
    return t + 1400;
  };
  const fxZoom: Fx = (el, t, ctx) => {
    animate(el, [{ opacity: 0, transform: "scale(1.06)", filter: "blur(8px)" }, { opacity: 1, transform: "none", filter: "blur(0px)" }], { duration: ctx.S(900), delay: ctx.S(t), easing: EASE.out });
    return t + 900;
  };
  const MEDIA_FX: Record<string, Fx> = { "fade-up": fxFadeUp, clip: fxClip, mask: fxMask, zoom: fxZoom };
  const fxCard: Fx = (el, t, ctx) => {
    if (el.matches(".timeline-arrow")) {
      animate(el, [{ opacity: 0, transform: "scaleX(0)" }, { opacity: 1, transform: "none" }], { duration: ctx.S(420), delay: ctx.S(t), easing: EASE.out });
      return t + 420;
    }
    const row = el.tagName === "TR";
    animate(
      el,
      row
        ? [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }]
        : [{ opacity: 0, transform: "translateY(24px) scale(.96)", filter: "blur(6px)" }, { opacity: 1, transform: "none", filter: "blur(0px)" }],
      { duration: ctx.S(row ? 560 : 720), delay: ctx.S(t), easing: EASE.card },
    );
    return t + 720;
  };
  /* Counts on the existing text node so React keeps its reference. */
  const fxCount: Fx = (el, t, ctx) => {
    const node = soleText(el);
    const text = node?.data ?? "";
    const match = node && text.trim() === text ? text.match(NUMBER) : null;
    if (!node || !match || !/^(block|flex|grid|flow-root|list-item)$/.test(getComputedStyle(el).display)) return t;
    const [, prefix, sign, whole, fraction = "", suffix] = match;
    const target = Number(whole.replace(/,/g, "") + fraction);
    if (!Number.isFinite(target)) return t;
    const decimals = Math.max(0, fraction.length - 1);
    const format = (value: number) => {
      let s = value.toFixed(decimals);
      if (whole.includes(",")) {
        const [i, f] = s.split(".");
        s = i.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (f ? `.${f}` : "");
      }
      return prefix + sign + s + suffix;
    };
    const start = performance.now() + ctx.S(t + 60);
    const duration = ctx.S(1100);
    let frame = 0;
    node.data = format(0);
    const entry = job(() => {
      cancelAnimationFrame(frame);
      node.data = text;
    });
    const step = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - start) / duration));
      node.data = format(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) frame = requestAnimationFrame(step);
      else endJob(entry);
    };
    frame = requestAnimationFrame(step);
    return t + 1160;
  };
  const fxSweep: Fx = (el, t, ctx) => {
    const round = el.matches(".limitation-panel") ? "round 0 12px 12px 0" : "round 12px";
    animate(el, [{ clipPath: `inset(0% 100% 0% 0% ${round})` }, { clipPath: `inset(0% 0% 0% 0% ${round})` }], { duration: ctx.S(820), delay: ctx.S(t), easing: EASE.inOut });
    return t + 820;
  };

  /* ── Choreography: reading-order stagger, compressed so long slides settle quickly ── */
  function channelOf(el: Element): MotionChannel {
    if (el.matches(SEL.kicker)) return "kicker";
    if (el.matches(SEL.hero)) return "hero";
    if (el.matches(SEL.title)) return "title";
    if (el.matches(SEL.media)) return "media";
    if (el.matches(SEL.group)) return "group";
    if (el.matches(SEL.emphasis)) return "emphasis";
    return "text";
  }
  function collectTargets(scope: Element) {
    return Array.from(scope.querySelectorAll<HTMLElement>(SEL.targets)).filter((el) => {
      if (el.closest('[data-build-state="pending"]')) return false;
      const owner = el.parentElement?.closest(SEL.owners);
      return !(owner && scope.contains(owner));
    });
  }
  function playTarget(el: HTMLElement, channel: MotionChannel, t: number, profile: ResolvedMotion, ctx: Ctx) {
    const effect = profile[channel];
    if (channel === "media") return MEDIA_FX[effect]?.(el, t, ctx) ?? t;
    if (channel === "group") {
      let end = effect === "stagger" ? fxCard(el, t, ctx) : effect === "fade-up" ? fxFadeUp(el, t, ctx, 12) : t;
      if (profile.data === "count" || profile.data === "scramble") {
        const values = [el, ...Array.from(el.querySelectorAll<HTMLElement>(SEL.data))].filter((node) => node.matches(SEL.data));
        values.forEach((value) => {
          end = Math.max(end, profile.data === "count" ? fxCount(value, t, ctx) : fxScramble(value, t + 80, ctx));
        });
      }
      return end;
    }
    if (channel === "emphasis") {
      let end = effect === "sweep" ? fxSweep(el, t, ctx) : t;
      const fx = el.matches(".callout-box") ? TEXT_FX[profile.text] : undefined;
      if (fx) end = Math.max(end, fx(el, t + (effect === "sweep" ? 160 : 0), ctx));
      return end;
    }
    const fx = TEXT_FX[effect];
    if (!fx) return t;
    if (el.matches(SEL.bullet)) {
      const dot = el.querySelector(".bullet-dot");
      const text = el.lastElementChild as HTMLElement | null;
      if (dot) animate(dot, [{ opacity: 0, transform: "scale(0)" }, { opacity: 1, transform: "none" }], { duration: ctx.S(460), delay: ctx.S(t), easing: EASE.out });
      return text && text !== dot ? fx(text, t + 40, ctx) : t;
    }
    return fx(el, t, ctx);
  }
  function playEntrance(scope: Element, profile: ResolvedMotion, startAt = 0, targets?: HTMLElement[]) {
    const ctx = context(profile, scope);
    const plan: [HTMLElement, MotionChannel, number][] = [];
    let cursor = 0;
    for (const el of targets ?? collectTargets(scope)) {
      if (morphedWithin(el, scope)) continue;
      const channel = channelOf(el);
      plan.push([el, channel, cursor]);
      cursor += GAPS[channel] || 100;
    }
    const squeeze = cursor > 760 ? 760 / cursor : 1;
    for (const [el, channel, at] of plan) {
      try {
        playTarget(el, channel, startAt + at * squeeze, profile, ctx);
      } catch {
        /* a failed effect leaves the element static */
      }
    }
  }

  /* Morph ("magic move"): elements on both slides fly from the old box to the new one while the rest
     crossfades. Pairs, in order: data-morph ids (slide.morph maps build targets to ids), the same image,
     the same metric label, the same label, title, or equation text, then title to title. Styled clones fly
     in the over layer because slide columns clip their children. */
  const MORPH = { text: ".slide-label,.slide-title,.slide-title-hero", title: ".slide-title,.slide-title-hero", frame: "figure", metric: ".metric-card-anim", metricLabel: ".metric-label", eq: ".equation-block" };
  type Box = { x: number; y: number; w: number; h: number };
  type Flight = { a: HTMLElement; b: HTMLElement; boxA: Box; boxB: Box; inkA: Box; inkB: Box; sx: number; sy: number; same: boolean; cloneA: HTMLElement | null; cloneB: HTMLElement };
  const MORPH_STYLE = ["display", "flexDirection", "alignItems", "justifyContent", "gap", "fontFamily", "fontSize", "fontWeight", "fontStyle", "lineHeight", "letterSpacing", "color", "textAlign", "textTransform", "whiteSpace", "overflowWrap", "backgroundColor", "borderRadius", "boxShadow", "objectFit"] as const;
  const morphed = new WeakSet<Element>();
  function morphedWithin(el: Element, scope: Element) {
    for (let node: Element | null = el; node && node !== scope; node = node.parentElement) if (morphed.has(node)) return true;
    return false;
  }
  function morphKeys(scope: Element) {
    const keyed = new Map<string, HTMLElement>();
    const take = (key: string | false | undefined | null, el: HTMLElement) => {
      if (key && !keyed.has(key) && !el.closest('[data-build-state="pending"]')) keyed.set(key, el);
    };
    scope.querySelectorAll<HTMLElement>("[data-morph]").forEach((el) => take(`id:${el.dataset.morph}`, el));
    scope.querySelectorAll<HTMLElement>(MORPH.frame).forEach((el) => {
      const src = el.querySelector("img")?.getAttribute("src");
      take(src && `img:${src}`, el);
    });
    scope.querySelectorAll<HTMLElement>(MORPH.metric).forEach((el) => {
      const label = el.querySelector(MORPH.metricLabel)?.textContent?.trim();
      take(label && `metric:${label}`, el);
    });
    scope.querySelectorAll<HTMLElement>(`${MORPH.text},${MORPH.eq}`).forEach((el) => {
      const text = (el.textContent || "").replace(/\s+/g, " ").trim();
      take(text && `${el.matches(MORPH.eq) ? "eq" : el.matches(MORPH.title) ? "title" : "text"}:${text}`, el);
    });
    return keyed;
  }
  function morphPairs(ghost: HTMLElement, incoming: HTMLElement) {
    const from = morphKeys(ghost);
    const pairs: [HTMLElement, HTMLElement][] = [];
    const used = new Set<Element>();
    const free = (a: HTMLElement, b: HTMLElement) =>
      !used.has(a) && !used.has(b) && a.querySelectorAll("*").length <= 80 && !pairs.some(([x, y]) => x.contains(a) || a.contains(x) || y.contains(b) || b.contains(y));
    const pair = (a: HTMLElement | null | undefined, b: HTMLElement) => {
      if (a && free(a, b)) {
        pairs.push([a, b]);
        used.add(a);
        used.add(b);
      }
    };
    for (const [key, b] of morphKeys(incoming)) pair(from.get(key), b);
    const titleB = incoming.querySelector<HTMLElement>(MORPH.title);
    if (titleB && !titleB.closest('[data-build-state="pending"]')) pair(ghost.querySelector<HTMLElement>(MORPH.title), titleB);
    return pairs;
  }
  function morphClone(el: HTMLElement, box: Box) {
    const clone = el.cloneNode(true) as HTMLElement;
    const copy = (src: Element, dst: Element) => {
      const from = getComputedStyle(src);
      const to = (dst as HTMLElement).style;
      for (const prop of MORPH_STYLE) to[prop] = from[prop];
    };
    copy(el, clone);
    const nodes = clone.querySelectorAll("*");
    el.querySelectorAll("*").forEach((node, i) => copy(node, nodes[i]));
    clone.removeAttribute("id");
    clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
    clone.classList.add("mo-morph");
    Object.assign(clone.style, { position: "absolute", left: `${box.x}px`, top: `${box.y}px`, width: `${box.w}px`, height: `${box.h}px`, margin: "0", boxSizing: "border-box", visibility: "visible", opacity: "1", pointerEvents: "none" });
    return clone;
  }
  /* Measures every pair before any clone or hidden element changes layout. */
  function morphFlights(c: TransitionCtx, pairs: [HTMLElement, HTMLElement][]): Flight[] {
    const deckRect = c.deck.getBoundingClientRect();
    const scale = deckRect.width / (c.deck.offsetWidth || 1) || 1;
    const local = (r: DOMRect): Box => ({ x: (r.left - deckRect.left) / scale - c.deck.clientLeft, y: (r.top - deckRect.top) / scale - c.deck.clientTop, w: r.width / scale || 1, h: r.height / scale || 1 });
    const ink = (el: HTMLElement) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const r = range.getBoundingClientRect();
      return r.width && r.height ? r : el.getBoundingClientRect();
    };
    return pairs.map(([a, b]) => {
      const text = a.matches(MORPH.text) && b.matches(MORPH.text);
      const boxA = local(a.getBoundingClientRect());
      const boxB = local(b.getBoundingClientRect());
      const inkA = text ? local(ink(a)) : boxA;
      const inkB = text ? local(ink(b)) : boxB;
      const ratio = text ? parseFloat(getComputedStyle(a).fontSize) / parseFloat(getComputedStyle(b).fontSize) || 1 : 0;
      const same = (a.textContent || "").trim() === (b.textContent || "").trim() && a.querySelector("img")?.getAttribute("src") === b.querySelector("img")?.getAttribute("src");
      return { a, b, boxA, boxB, inkA, inkB, sx: ratio || boxA.w / boxB.w, sy: ratio || boxA.h / boxB.h, same, cloneA: same ? null : morphClone(a, boxA), cloneB: morphClone(b, boxB) };
    });
  }
  /* ── Transitions: (context) -> ms when the incoming slide's entrance should begin ── */
  function piece(layer: HTMLElement, ghost: HTMLElement, clip: string) {
    const holder = document.createElement("div");
    holder.className = "motion-piece";
    holder.appendChild(ghost.cloneNode(true));
    holder.style.clipPath = clip;
    layer.appendChild(holder);
    return holder;
  }
  const TRANSITION_FX: Record<string, (c: TransitionCtx) => number> = {
    fade(c) {
      c.over.appendChild(c.ghost);
      c.add(animate(c.ghost, [{ opacity: 1 }, { opacity: 0 }], { duration: c.S(460), easing: EASE.soft, fill: "forwards" }));
      return 60;
    },
    rise(c) {
      c.over.appendChild(c.ghost);
      c.add(animate(c.ghost, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: `translateY(${-14 * c.dir}px)` }], { duration: c.S(360), easing: EASE.soft, fill: "forwards" }));
      c.add(animate(c.incoming, [{ opacity: 0, transform: `translateY(${20 * c.dir}px)` }, { opacity: 1, transform: "none" }], { duration: c.S(600), delay: c.S(80), easing: EASE.out }));
      return 120;
    },
    push(c) {
      const d = c.dir;
      c.under.appendChild(c.ghost);
      c.add(animate(c.ghost, [{ transform: "none", filter: "brightness(1)" }, { transform: `translateX(${-30 * d}%)`, filter: "brightness(.62)" }], { duration: c.S(720), easing: EASE.inOut, fill: "forwards" }));
      c.add(animate(c.incoming, [{ transform: `translateX(${100 * d}%)`, boxShadow: `${-28 * d}px 0 56px rgba(15,23,42,.24)` }, { transform: "none", boxShadow: `${-28 * d}px 0 56px rgba(15,23,42,0)` }], { duration: c.S(720), easing: EASE.inOut }));
      return 300;
    },
    wipe(c) {
      const d = c.dir;
      const W = c.deck.clientWidth;
      const slant = W * 0.32;
      c.under.appendChild(c.ghost);
      c.add(
        animate(
          c.incoming,
          d > 0
            ? [{ clipPath: "polygon(0% 0%, 0% 0%, -32% 100%, -32% 100%)" }, { clipPath: "polygon(0% 0%, 132% 0%, 100% 100%, 0% 100%)" }]
            : [{ clipPath: "polygon(100% 0%, 100% 0%, 132% 100%, 132% 100%)" }, { clipPath: "polygon(100% 0%, -32% 0%, 0% 100%, 100% 100%)" }],
          { duration: c.S(780), easing: EASE.inOut },
        ),
      );
      const edge = document.createElement("div");
      edge.className = "mo-wipe-edge";
      c.over.appendChild(edge);
      const skew = ((Math.atan2(slant, c.deck.clientHeight) * 180) / Math.PI) * (d > 0 ? -1 : 1);
      const from = d > 0 ? -slant / 2 : W + slant / 2;
      const to = d > 0 ? W * 1.32 - slant / 2 : W - W * 1.32 + slant / 2;
      c.add(animate(edge, [{ transform: `translateX(${from}px) skewX(${skew}deg)` }, { transform: `translateX(${to}px) skewX(${skew}deg)` }], { duration: c.S(780), easing: EASE.inOut, fill: "both" }));
      return 260;
    },
    curtain(c) {
      const d = c.dir;
      const n = 3;
      const duration = 1020;
      const gap = 70;
      const colors = ["var(--accent)", "color-mix(in srgb,var(--accent) 80%,var(--deck-text))", "color-mix(in srgb,var(--accent) 60%,var(--deck-text))"];
      c.over.appendChild(c.ghost);
      for (let i = 0; i < n; i++) {
        const panel = document.createElement("div");
        panel.className = "mo-curtain";
        panel.style.left = `${(i * 100) / n}%`;
        panel.style.width = `calc(${100 / n}% + 1px)`;
        panel.style.background = "var(--accent)";
        panel.style.background = colors[i];
        c.over.appendChild(panel);
        const enter = d > 0 ? -101 : 101;
        const leave = d > 0 ? 101 : -101;
        c.add(
          animate(
            panel,
            [{ transform: `translateY(${enter}%)`, easing: EASE.inOut }, { transform: "none", offset: 0.44 }, { transform: "none", offset: 0.56, easing: EASE.inOut }, { transform: `translateY(${leave}%)` }],
            { duration: c.S(duration), delay: c.S((d > 0 ? i : n - 1 - i) * gap), easing: "linear", fill: "both" },
          ),
        );
      }
      const covered = (n - 1) * gap + duration * 0.45;
      c.add(animate(c.ghost, [{ opacity: 1 }, { opacity: 0 }], { duration: c.S(covered), easing: "steps(1,end)", fill: "forwards" }));
      return covered + duration * 0.1;
    },
    circle(c) {
      const forward = c.dir > 0;
      const timing = { duration: c.S(forward ? 820 : 760), easing: EASE.inOut };
      const ring = document.createElement("div");
      ring.className = "mo-ring";
      ring.style.width = ring.style.height = `${((0.75 * Math.hypot(c.deck.clientWidth, c.deck.clientHeight)) / Math.SQRT2) * 2}px`;
      if (forward) {
        c.under.appendChild(c.ghost);
        c.add(animate(c.incoming, [{ clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(75% at 50% 50%)" }], timing));
        c.add(animate(c.ghost, [{ transform: "none", opacity: 1 }, { transform: "scale(.94)", opacity: 0.45 }], { ...timing, fill: "forwards" }));
      } else {
        c.over.appendChild(c.ghost);
        c.add(animate(c.ghost, [{ clipPath: "circle(75% at 50% 50%)" }, { clipPath: "circle(0% at 50% 50%)" }], { ...timing, fill: "forwards" }));
        c.add(animate(c.incoming, [{ transform: "scale(.94)", opacity: 0.45 }, { transform: "none", opacity: 1 }], timing));
      }
      c.over.appendChild(ring);
      c.add(
        animate(
          ring,
          [{ transform: `translate(-50%,-50%) scale(${forward ? 0 : 1})`, opacity: forward ? 1 : 0 }, { opacity: 1, offset: forward ? 0.72 : 0.28 }, { transform: `translate(-50%,-50%) scale(${forward ? 1 : 0})`, opacity: forward ? 0 : 1 }],
          { ...timing, fill: "both" },
        ),
      );
      return 220;
    },
    doors(c) {
      const left = piece(c.over, c.ghost, "inset(0 50% 0 0)");
      const right = piece(c.over, c.ghost, "inset(0 0 0 50%)");
      c.ghost.remove();
      c.add(animate(left, [{ transform: "none" }, { transform: "translateX(-51%)" }], { duration: c.S(860), easing: EASE.inOut, fill: "forwards" }));
      c.add(animate(right, [{ transform: "none" }, { transform: "translateX(51%)" }], { duration: c.S(860), easing: EASE.inOut, fill: "forwards" }));
      c.add(animate(c.incoming, [{ transform: "scale(.9)", filter: "blur(6px)", opacity: 0.6 }, { transform: "none", filter: "blur(0px)", opacity: 1 }], { duration: c.S(900), easing: EASE.out }));
      return 280;
    },
    slices(c) {
      const n = 6;
      for (let i = 0; i < n; i++) {
        const left = ((i * 100) / n).toFixed(3);
        const right = (100 - ((i + 1) * 100) / n).toFixed(3);
        const strip = piece(c.over, c.ghost, `inset(0 calc(${right}% - 1px) 0 calc(${left}% - 1px))`);
        c.add(animate(strip, [{ transform: "none" }, { transform: `translateY(${i % 2 ? 112 : -112}%)` }], { duration: c.S(640), delay: c.S((c.dir > 0 ? i : n - 1 - i) * 55), easing: "cubic-bezier(.55,0,.75,.2)", fill: "both" }));
      }
      c.ghost.remove();
      c.add(animate(c.incoming, [{ transform: "scale(1.08)" }, { transform: "none" }], { duration: c.S(1000), easing: EASE.out }));
      return 180;
    },
    zoom(c) {
      const d = c.dir;
      c.over.appendChild(c.ghost);
      c.add(animate(c.ghost, [{ transform: "none", opacity: 1, filter: "blur(0px)" }, { transform: `scale(${d > 0 ? 1.4 : 0.82})`, opacity: 0, filter: "blur(10px)" }], { duration: c.S(620), easing: EASE.in, fill: "forwards" }));
      c.add(animate(c.incoming, [{ transform: `scale(${d > 0 ? 0.88 : 1.12})`, opacity: 0 }, { transform: "none", opacity: 1 }], { duration: c.S(760), delay: c.S(140), easing: EASE.out }));
      return 260;
    },
    glitch(c) {
      const n = 7;
      const steps = 6;
      for (let i = 0; i < n; i++) {
        const top = ((i * 100) / n).toFixed(3);
        const bottom = (100 - ((i + 1) * 100) / n).toFixed(3);
        const strip = piece(c.over, c.ghost, `inset(calc(${top}% - 1px) 0 calc(${bottom}% - 1px) 0)`);
        const frames: Keyframe[] = [];
        for (let f = 0; f <= steps; f++) {
          const x = f === 0 || f === steps ? 0 : (Math.random() * 2 - 1) * 38;
          frames.push({ offset: f / steps, transform: `translateX(${x.toFixed(1)}px)`, filter: f % 2 ? GLITCH : "none", opacity: f === steps ? 0 : 1, easing: "steps(1,end)" });
        }
        c.add(animate(strip, frames, { duration: c.S(400), easing: "linear", fill: "forwards" }));
      }
      c.ghost.remove();
      c.add(
        animate(
          c.incoming,
          [
            { opacity: 0, easing: "steps(1,end)" },
            { opacity: 1, transform: "translateX(-12px)", filter: GLITCH, offset: 0.25, easing: "steps(1,end)" },
            { opacity: 1, transform: "translateX(8px) skewX(-6deg)", filter: "none", offset: 0.5, easing: "steps(1,end)" },
            { opacity: 1, transform: "translateX(-3px)", filter: GLITCH, offset: 0.75, easing: "steps(1,end)" },
            { opacity: 1, transform: "none", filter: "none" },
          ],
          { duration: c.S(300), delay: c.S(340), easing: "linear" },
        ),
      );
      return 380;
    },
    pixel(c) {
      const duration = 900;
      const grid = document.createElement("div");
      grid.className = "mo-pixels";
      c.over.appendChild(c.ghost);
      c.over.appendChild(grid);
      for (let r = 0; r < 9; r++) {
        for (let q = 0; q < 16; q++) {
          const cell = document.createElement("i");
          cell.style.left = `${(q * 100) / 16}%`;
          cell.style.top = `${(r * 100) / 9}%`;
          if (Math.random() < 0.14) cell.className = "hot";
          grid.appendChild(cell);
          const a = Math.random() * 0.38;
          const b = 0.56 + Math.random() * 0.38;
          c.add(animate(cell, [{ opacity: 0, offset: 0 }, { opacity: 0, offset: a }, { opacity: 1, offset: a + 0.001 }, { opacity: 1, offset: b }, { opacity: 0, offset: b + 0.001 }, { opacity: 0, offset: 1 }], { duration: c.S(duration), easing: "linear", fill: "both" }));
        }
      }
      c.add(animate(c.ghost, [{ opacity: 1 }, { opacity: 0 }], { duration: c.S(duration * 0.42), easing: "steps(1,end)", fill: "forwards" }));
      return duration * 0.55;
    },
    morph(c) {
      c.over.appendChild(c.ghost);
      const pairs = morphPairs(c.ghost, c.incoming);
      if (!pairs.length) return TRANSITION_FX.fade(c);
      const duration = c.S(760);
      const timing: KeyframeAnimationOptions = { duration, easing: EASE.inOut, fill: "both" };
      for (const f of morphFlights(c, pairs)) {
        f.cloneB.style.transformOrigin = `${f.inkB.x - f.boxB.x}px ${f.inkB.y - f.boxB.y}px`;
        const start = `translate(${f.inkA.x - f.inkB.x}px,${f.inkA.y - f.inkB.y}px) scale(${f.sx},${f.sy})`;
        f.a.style.visibility = "hidden";
        morphed.add(f.b);
        c.add(animate(f.b, [{ opacity: 0 }, { opacity: 0 }], { duration, easing: "linear" }));
        c.over.appendChild(f.cloneB);
        if (f.same || !f.cloneA) {
          c.add(animate(f.cloneB, [{ transform: start }, { transform: "none" }], timing));
          continue;
        }
        f.cloneA.style.transformOrigin = `${f.inkA.x - f.boxA.x}px ${f.inkA.y - f.boxA.y}px`;
        c.over.insertBefore(f.cloneA, f.cloneB);
        c.add(animate(f.cloneA, [{ transform: "none", opacity: 1 }, { transform: `translate(${f.inkB.x - f.inkA.x}px,${f.inkB.y - f.inkA.y}px) scale(${1 / f.sx},${1 / f.sy})`, opacity: 0 }], timing));
        c.add(animate(f.cloneB, [{ transform: start, opacity: 0 }, { transform: "none", opacity: 1 }], timing));
      }
      c.add(animate(c.ghost, [{ opacity: 1 }, { opacity: 0 }], { duration: c.S(420), easing: EASE.soft, fill: "forwards" }));
      return 160;
    },
  };
  function runTransition(id: MotionTransition, ghost: HTMLElement, incoming: HTMLElement, dir: number, profile: ResolvedMotion, layers: Layers) {
    const fx = TRANSITION_FX[id];
    if (!fx) return 0;
    const anims: (Animation | null)[] = [];
    const entry = job(() => {
      layers.under.replaceChildren();
      layers.over.replaceChildren();
      ghost.remove();
    });
    try {
      const reveal = fx({ ...context(profile, incoming), ...layers, ghost, incoming, dir, add: (anim) => void anims.push(anim) });
      waitFor(entry, anims);
      return reveal;
    } catch {
      endJob(entry);
      return 0;
    }
  }
  /** Plays the incoming slide's transition (from a static clone of the outgoing stage) and entrance. */
  function playSlide(o: { ghost: HTMLElement | null; incoming: HTMLElement; dir: number; entrance: boolean; force?: boolean; profile: ResolvedMotion; layers: Layers }) {
    const now = performance.now();
    const rapid = !o.force && now - engine.lastNavAt < 220;
    engine.lastNavAt = now;
    if (rapid) return;
    const reveal = o.ghost && o.profile.transition !== "none" ? runTransition(o.profile.transition, o.ghost, o.incoming, o.dir, o.profile, o.layers) : 0;
    if (o.entrance) playEntrance(o.incoming, o.profile, reveal);
  }
  /** Animates the build targets revealed since the last commit. */
  function playBuild(stage: HTMLElement, targets: string[], profile: ResolvedMotion) {
    const list: HTMLElement[] = [];
    for (const target of targets) {
      stage.querySelectorAll<HTMLElement>(`[data-build-target="${CSS.escape(target)}"]`).forEach((el) => {
        if (el.matches(SEL.targets)) list.push(el);
        else list.push(...collectTargets(el));
      });
    }
    if (list.length) playEntrance(stage, profile, 0, list);
  }
  return { normalize, resolve, finish, playSlide, playBuild, reduced };
})();

type MotionStageProps = {
  slides: Slide[];
  index: number;
  revealed: number;
  motion: DeckMotion;
  navKind: NavKind;
  replayToken: number;
  className: string;
  style: CSSProperties;
  children: React.ReactNode;
};
type MotionSnapshot = { kind: "slide"; ghost: HTMLElement; from: number } | { kind: "replay"; ghost: HTMLElement } | { kind: "build"; previous: number } | null;

/* The outgoing slide keeps its own mood: copy the deck's CSS variables onto the clone before they switch. */
function cloneStage(stage: HTMLElement) {
  const ghost = stage.cloneNode(true) as HTMLElement;
  const deckStyle = stage.parentElement?.style;
  if (deckStyle) for (let i = 0; i < deckStyle.length; i++) if (deckStyle[i].startsWith("--")) ghost.style.setProperty(deckStyle[i], deckStyle.getPropertyValue(deckStyle[i]));
  return ghost;
}

/**
 * Keyed slide stage plus the transition layers around it. A class component because
 * getSnapshotBeforeUpdate runs before React mutates the DOM: the outgoing slide is cloned there and
 * running motion is finished, so split text is restored before React reconciles it.
 */
class MotionStage extends React.Component<MotionStageProps> {
  private stage = React.createRef<HTMLDivElement>();
  private under = React.createRef<HTMLDivElement>();
  private over = React.createRef<HTMLDivElement>();

  componentDidMount() {
    this.play(null, 1, true, true);
  }

  getSnapshotBeforeUpdate(prev: MotionStageProps): MotionSnapshot {
    const stage = this.stage.current;
    const slideChanged = prev.index !== this.props.index;
    const replay = prev.replayToken !== this.props.replayToken;
    if (!stage || !(slideChanged || replay || prev.revealed !== this.props.revealed)) return null;
    Motion.finish();
    if (slideChanged) return { kind: "slide", ghost: cloneStage(stage), from: prev.index };
    if (replay) return { kind: "replay", ghost: cloneStage(stage) };
    return { kind: "build", previous: prev.revealed };
  }

  componentDidUpdate(_prev: MotionStageProps, _state: unknown, snapshot: MotionSnapshot) {
    if (!snapshot) return;
    if (snapshot.kind === "build") {
      const stage = this.stage.current;
      if (!stage || this.props.revealed <= snapshot.previous) return;
      const targets = getRevealOrder(this.props.slides[this.props.index]).slice(snapshot.previous, this.props.revealed);
      Motion.playBuild(stage, targets, Motion.resolve(this.props.motion, this.props.slides, this.props.index));
      return;
    }
    if (snapshot.kind === "replay") {
      this.play(snapshot.ghost, 1, true, true);
      return;
    }
    // Going back shows the previous slide complete; forward moves and jumps replay its entrance.
    this.play(snapshot.ghost, this.props.index > snapshot.from ? 1 : -1, this.props.navKind !== "prev", false);
  }

  componentWillUnmount() {
    Motion.finish();
  }

  private play(ghost: HTMLElement | null, dir: number, entrance: boolean, force: boolean) {
    const stage = this.stage.current;
    const deck = stage?.parentElement;
    const under = this.under.current;
    const over = this.over.current;
    if (!stage || !deck || !under || !over) return;
    const profile = Motion.resolve(this.props.motion, this.props.slides, this.props.index);
    Motion.playSlide({ ghost, incoming: stage, dir, entrance, force, profile, layers: { deck, under, over } });
  }

  render() {
    const { index, className, style, children } = this.props;
    return (
      <>
        <div ref={this.under} className="motion-layer motion-under" aria-hidden="true" />
        <div ref={this.stage} key={index} className={className} style={style}>
          {children}
        </div>
        <div ref={this.over} className="motion-layer motion-over" aria-hidden="true" />
      </>
    );
  }
}

function MotionPanel({ motion, onChange, onReplay, onClose }: { motion: DeckMotion; onChange: (next: DeckMotion) => void; onReplay: () => void; onClose: () => void }) {
  const preset = MOTION_PRESETS[motion.preset];
  const speed = motion.speed ?? 1;
  return (
    <div
      className="motion-panel"
      role="dialog"
      aria-label="Motion graphics"
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Escape") onClose();
      }}
    >
      <div className="motion-head">
        <p className="motion-title">Motion graphics</p>
        <button type="button" className="help-close" onClick={onClose} aria-label="Close motion panel"><X style={{ width: 16, height: 16 }} /></button>
      </div>
      <div className="motion-presets" role="group" aria-label="Motion preset">
        {MOTION_PRESET_IDS.map((id) => (
          <button key={id} type="button" className="motion-chip" aria-pressed={motion.preset === id} onClick={() => onChange({ preset: id, speed: motion.speed })}>
            {MOTION_PRESETS[id].name}
            <small>{MOTION_PRESETS[id].note}</small>
          </button>
        ))}
      </div>
      <label className="motion-row">
        <span>Transition</span>
        <select
          value={motion.transition ?? ""}
          onChange={(event) => {
            const next: DeckMotion = { ...motion };
            if (event.target.value) next.transition = event.target.value as MotionTransition;
            else delete next.transition;
            onChange(next);
          }}
        >
          <option value="">Preset · {preset.transition}</option>
          {MOTION_TRANSITIONS.map((id) => <option key={id} value={id}>{id}</option>)}
        </select>
      </label>
      <label className="motion-row">
        <span>Speed</span>
        <input type="range" min={0.5} max={2} step={0.1} value={speed} onChange={(event) => onChange({ ...motion, speed: Number(event.target.value) })} />
        <output>{speed.toFixed(1)}×</output>
      </label>
      <button type="button" className="motion-replay" onClick={onReplay}><Play style={{ width: 14, height: 14 }} /> Replay slide</button>
      {Motion.reduced() ? <p className="motion-note">This system requests reduced motion, so slides change instantly here.</p> : null}
    </div>
  );
}

/* ────────────────────────── Sub-components ────────────────────────── */

function FigureFrame({ slide, label, visual, mood, revealed }: { slide: Slide; label?: string; visual?: VisualAsset; mood: MoodStyle; revealed?: number }) {
  if (visual?.src) {
    return (
      <figure {...buildProps(slide, "visual", revealed)} style={{ overflow: "hidden", borderRadius: 12, border: `1px solid ${mood.cardBorder}`, background: mood.cardBg, backdropFilter: "blur(16px)" }}>
        <img src={visual.src} alt={visual.alt || label || "Paper visual"} style={{ display: "block", width: "100%", height: "auto", maxHeight: 480, objectFit: "contain", background: "transparent" }} />
        <figcaption className="figure-caption fs-caption">
          {visual.caption || label || "Paper visual"}{visual.confidence ? ` · ${visual.confidence} confidence` : ""}
        </figcaption>
      </figure>
    );
  }
  return (
    <div {...buildProps(slide, "visual", revealed)} className="figure-placeholder" style={{ minHeight: 240, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, borderRadius: 12, border: `2px dashed ${mood.cardBorder}`, background: mood.cardBg, padding: 24, textAlign: "center", backdropFilter: "blur(8px)" }}>
      <ImageIcon style={{ width: 40, height: 40 }} />
      <span className="placeholder-label fs-placeholder">{label || "Insert paper figure"}</span>
    </div>
  );
}

function BulletList({ slide, bullets, mood, staggerBase = 1, revealed }: { slide: Slide; bullets?: string[]; mood: MoodStyle; staggerBase?: number; revealed?: number }) {
  if (!bullets?.length) return null;
  return (
    <ul className="bullet-list" style={{ ["--bullet-dot-color" as any]: mood.bulletDotColor }}>
      {bullets.map((bullet, i) => (
        <li key={i} {...buildProps(slide, `bullets.${i}`, revealed)} className={`bullet-item stagger-${Math.min(staggerBase + i, 4)} fs-bullet`}>
          <span className="bullet-dot" />
          <span>{bullet}</span>
        </li>
      ))}
    </ul>
  );
}

function CalloutBox({ text, style, mood }: { text: string; style?: "accent" | "positive" | "negative"; mood: MoodStyle }) {
  const bgMap = { accent: mood.calloutBg, positive: "rgba(5,150,105,0.07)", negative: "rgba(220,38,38,0.07)" };
  const borderMap = { accent: mood.calloutBorder, positive: "#059669", negative: "#dc2626" };
  return (
    <div className="stagger-3 fs-callout callout-box" style={{ background: bgMap[style || "accent"], borderLeft: `4px solid ${borderMap[style || "accent"]}`, borderRadius: 12, padding: "18px 22px", backdropFilter: "blur(12px)" }}>
      {text}
    </div>
  );
}

function MetricGrid({ slide, metrics, mood, revealed }: { slide: Slide; metrics: Metric[]; mood: MoodStyle; revealed?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(150px, 1fr))`, gap: 14, marginTop: 14 }}>
      {metrics.map((m, i) => (
        <div key={i} {...buildProps(slide, `metrics.${i}`, revealed)} className={`metric-card-anim stagger-${Math.min(i + 1, 4)} fs-metric-label`} style={{ border: `1px solid ${mood.cardBorder}`, borderRadius: 12, padding: 16, background: mood.cardBg, backdropFilter: "blur(12px)", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
          <p className="metric-label">{m.label}</p>
          <p className="metric-value fs-metric-value">{m.value}</p>
          <p className="metric-detail fs-metric-detail">{m.detail}</p>
        </div>
      ))}
    </div>
  );
}

function TimelineFlow({ steps, mood }: { steps: string[]; mood: MoodStyle }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 0", flexWrap: "wrap" }}>
      {steps.map((step, i) => (
        <React.Fragment key={i}>
          <div className="timeline-step-anim fs-timeline-step timeline-step-card" style={{ background: mood.timelineStepBg, border: `1px solid ${mood.timelineStepBorder}`, borderRadius: 10, padding: "12px 16px", flex: 1, minWidth: 0, overflowWrap: "break-word", backdropFilter: "blur(8px)" }}>
            {step}
          </div>
          {i < steps.length - 1 && <span className="timeline-arrow fs-timeline-arrow" style={{ flexShrink: 0 }}>→</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

function ResultTable({ slide, headers, rows, mood, revealed }: { slide: Slide; headers: string[]; rows: TableRow[]; mood: MoodStyle; revealed?: number }) {
  return (
    <div style={{ overflowX: "auto", marginTop: 14 }}>
      <table className="fs-table result-table-base">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="result-table-head" style={{ background: mood.tableHeaderBg, padding: "12px 16px", textAlign: "left", borderBottom: `2px solid ${mood.cardBorder}`, whiteSpace: "nowrap" as const }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} {...buildProps(slide, `table.rows.${ri}`, revealed)} style={{ background: row.best ? mood.tableBestBg : "transparent", fontWeight: row.best ? 700 : 400 }}>
              {row.cells.map((cell, ci) => (
                <td
                  key={ci}
                  className={`table-cell${ci > 0 ? " table-cell-num" : ""}${row.best && ci > 0 ? " table-cell-best" : ""}`}
                  style={{ padding: "10px 16px", borderBottom: `1px solid ${mood.cardBorder}`, overflowWrap: "break-word", fontVariantNumeric: ci > 0 ? "tabular-nums" : undefined, textAlign: ci > 0 ? "right" as const : "left" as const }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ComparisonPanel({ left, right, mood }: { left: { label: string; items: string[] }; right: { label: string; items: string[] }; mood: MoodStyle }) {
  const panelStyle: CSSProperties = { border: `1px solid ${mood.cardBorder}`, borderRadius: 12, padding: 16, background: mood.cardBg, backdropFilter: "blur(12px)", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" };
  return (
    <div className="comparison-grid comparison-panel-anim stagger-2">
      <div style={panelStyle}>
        <p className="comparison-label comparison-label-muted fs-comparison-label">{left.label}</p>
        <ul className="comparison-list">{left.items.map((item, i) => <li key={i} className="comparison-item fs-comparison-body">• {item}</li>)}</ul>
      </div>
      <div style={panelStyle}>
        <p className="comparison-label comparison-label-accent fs-comparison-label">{right.label}</p>
        <ul className="comparison-list">{right.items.map((item, i) => <li key={i} className="comparison-item fs-comparison-body">• {item}</li>)}</ul>
      </div>
    </div>
  );
}

/* ────────────────────────── Slide Renderer ────────────────────────── */

function SlideRenderer({ slide, revealed }: { slide: Slide; revealed?: number }) {
  const m = getMood(slide);

  switch (slide.layout) {
    case "cover":
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", height: "100%" }}>
          <p className="stagger-1 fs-label slide-label">{venueLabels[venuePreset]}</p>
          <h1 className="stagger-2 fs-hero slide-title slide-title-hero">{slide.title}</h1>
          {slide.subtitle && <p className="stagger-3 fs-body slide-body slide-body-wide slide-body-center" style={{ marginTop: 16 }}>{slide.subtitle}</p>}
          <p {...buildProps(slide, "keyMessage", revealed)} className="stagger-4 fs-body slide-body slide-body-wide slide-body-center" style={{ marginTop: 20 }}>{slide.keyMessage}</p>
        </div>
      );

    case "hero-stat":
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", height: "100%" }}>
          <p className="stagger-1 fs-label slide-label">Result</p>
          <h2 className="stagger-2 fs-title slide-title">{slide.title}</h2>
          {slide.metrics?.length && (
            <p {...buildProps(slide, "metrics.0", revealed)} className="stagger-3 fs-hero-number slide-hero-number">
              {slide.metrics[0].value}
            </p>
          )}
          {slide.metrics?.length && <p className="stagger-4 fs-body slide-body slide-body-wide slide-body-center slide-body-tight">{slide.metrics[0].detail}</p>}
          {slide.callout && <CalloutBox text={slide.callout} style={slide.calloutStyle} mood={m} />}
        </div>
      );

    case "split":
    case "diagram":
    case "method-overview":
      return (
        <div style={{ display: "flex", flexDirection: "row", gap: 32, alignItems: "center", height: "100%" }}>
          <div style={{ flex: "0 1 40%", minWidth: 0 }}>
            <p className="stagger-1 fs-label slide-label">Key point</p>
            <h2 className="stagger-2 fs-title slide-title">{slide.title}</h2>
            <p {...buildProps(slide, "keyMessage", revealed)} className="stagger-3 fs-body slide-body">{slide.keyMessage}</p>
            <BulletList slide={slide} bullets={slide.bullets} mood={m} revealed={revealed} />
            {slide.callout && <CalloutBox text={slide.callout} style={slide.calloutStyle} mood={m} />}
          </div>
          <div style={{ flex: "1 1 65%", minWidth: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FigureFrame slide={slide} label={slide.figureLabel} visual={slide.visual} mood={m} revealed={revealed} />
          </div>
        </div>
      );

    case "metrics":
      return (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
          <p className="stagger-1 fs-label slide-label">Main result</p>
          <h2 className="stagger-2 fs-title slide-title">{slide.title}</h2>
          <p {...buildProps(slide, "keyMessage", revealed)} className="stagger-3 fs-body slide-body">{slide.keyMessage}</p>
          {slide.metrics && <MetricGrid slide={slide} metrics={slide.metrics} mood={m} revealed={revealed} />}
        </div>
      );

    case "table-focus":
      return (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
          <p className="stagger-1 fs-label slide-label">Data</p>
          <h2 className="stagger-2 fs-title slide-title">{slide.title}</h2>
          <p {...buildProps(slide, "keyMessage", revealed)} className="stagger-3 fs-body slide-body">{slide.keyMessage}</p>
          {slide.tableHeaders && slide.tableRows && <div className="stagger-4"><ResultTable slide={slide} headers={slide.tableHeaders} rows={slide.tableRows} mood={m} revealed={revealed} /></div>}
        </div>
      );

    case "comparison":
      return (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
          <p className="stagger-1 fs-label slide-label">Comparison</p>
          <h2 className="stagger-2 fs-title slide-title">{slide.title}</h2>
          <p {...buildProps(slide, "keyMessage", revealed)} className="stagger-3 fs-body slide-body">{slide.keyMessage}</p>
          {slide.comparisonLeft && slide.comparisonRight && <ComparisonPanel left={slide.comparisonLeft} right={slide.comparisonRight} mood={m} />}
        </div>
      );

    case "timeline":
      return (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
          <p className="stagger-1 fs-label slide-label">Pipeline</p>
          <h2 className="stagger-2 fs-title slide-title">{slide.title}</h2>
          <p {...buildProps(slide, "keyMessage", revealed)} className="stagger-3 fs-body slide-body">{slide.keyMessage}</p>
          {slide.timelineSteps && <div className="stagger-4"><TimelineFlow steps={slide.timelineSteps} mood={m} /></div>}
          {slide.callout && <CalloutBox text={slide.callout} style={slide.calloutStyle} mood={m} />}
        </div>
      );

    case "limitations":
      return (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
          <p className="stagger-1 fs-label slide-label slide-label-negative">Limitations</p>
          <h2 className="stagger-2 fs-title slide-title">{slide.title}</h2>
          <div className="stagger-3 limitation-panel" style={{ marginTop: 14, borderLeft: `4px solid ${m.limitationBorder}`, background: m.limitationBg, backdropFilter: "blur(12px)", borderRadius: "0 12px 12px 0", padding: "20px 24px" }}>
            <p {...buildProps(slide, "keyMessage", revealed)} className="fs-body slide-body">{slide.keyMessage}</p>
            <BulletList slide={slide} bullets={slide.bullets} mood={{ ...m, bulletDotColor: m.limitationBorder }} staggerBase={3} revealed={revealed} />
          </div>
        </div>
      );

    case "bullets":
    default:
      return (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
          <p className="stagger-1 fs-label slide-label">{slide.appendix ? "Appendix" : "Core idea"}</p>
          <h2 className="stagger-2 fs-title slide-title">{slide.title}</h2>
          <p {...buildProps(slide, "keyMessage", revealed)} className="stagger-3 fs-body slide-body">{slide.keyMessage}</p>
          <BulletList slide={slide} bullets={slide.bullets} mood={m} revealed={revealed} />
          {slide.equation && (
            <div className="stagger-4 fs-equation equation-block" style={{ background: m.calloutBg, borderRadius: 12, backdropFilter: "blur(12px)" }}>
              {slide.equation}
              {slide.equationExplain && <p className="fs-equation-explain equation-explain">{slide.equationExplain}</p>}
            </div>
          )}
          {slide.callout && <CalloutBox text={slide.callout} style={slide.calloutStyle} mood={m} />}
        </div>
      );
  }
}

/* ────────────────────────── Main Shell ────────────────────────── */

export default function PaperSlideshowProMax() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showMotion, setShowMotion] = useState(false);
  const [motion, setMotion] = useState<DeckMotion>(() => Motion.normalize(deckMotion));
  const [replayToken, setReplayToken] = useState(0);
  const navKind = useRef<NavKind>("goto");
  const deckRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const progress = useMemo(() => ((currentSlide + 1) / slideData.length) * 100, [currentSlide]);
  const slide = slideData[currentSlide];
  const buildCount = getRevealOrder(slide).length;
  const mood = getMood(slide);
  const toolbar = toolbarPalettes[mood.toolbarTone];
  const goTo = (index: number) => {
    navKind.current = "goto";
    const clamped = Math.max(0, Math.min(index, slideData.length - 1));
    setCurrentSlide(clamped);
    setRevealed(getRevealOrder(slideData[clamped]).length);
  };
  const advance = () => {
    if (revealed < buildCount) { setRevealed(revealed + 1); return; }
    if (currentSlide < slideData.length - 1) { navKind.current = "next"; setCurrentSlide(currentSlide + 1); setRevealed(0); }
  };
  const retreat = () => {
    if (revealed > 0) { setRevealed(revealed - 1); return; }
    if (currentSlide > 0) {
      navKind.current = "prev";
      const previous = currentSlide - 1;
      setCurrentSlide(previous);
      setRevealed(getRevealOrder(slideData[previous]).length);
    }
  };
  const deckThemeVars: CSSProperties = {
    ["--accent" as any]: mood.accent,
    ["--deck-accent" as any]: mood.accent,
    ["--deck-text" as any]: mood.color,
    ["--deck-muted" as any]: mood.muted,
    ["--deck-label" as any]: mood.labelColor,
    ["--deck-title" as any]: mood.titleColor,
    ["--deck-negative" as any]: mood.limitationBorder || "#dc2626",
    ["--deck-card-border" as any]: mood.cardBorder,
    ["--deck-callout-color" as any]: mood.calloutColor,
    ["--deck-metric-value" as any]: mood.metricValueColor,
    ["--deck-hero-number" as any]: mood.heroNumberColor,
    ["--deck-hero-number-shadow" as any]: mood.heroNumberShadow || "none",
    ["--deck-title-shadow" as any]: mood.titleShadow || "none",
    ["--deck-copy-shadow" as any]: mood.titleShadow || "none",
    ["--deck-timeline-step-color" as any]: mood.timelineStepColor,
    ["--deck-timeline-arrow-color" as any]: mood.timelineArrowColor,
    ["--deck-bullet-dot" as any]: mood.bulletDotColor,
    ["--deck-best-value" as any]: mood.bestValueColor,
    ["--toolbar-bg" as any]: toolbar.background,
    ["--toolbar-text" as any]: toolbar.text,
    ["--toolbar-muted" as any]: toolbar.muted,
    ["--toolbar-border" as any]: toolbar.border,
    ["--toolbar-hover" as any]: toolbar.hover,
    ["--toolbar-shadow" as any]: toolbar.shadow,
  };

  const toggleFullscreen = () => {
    if (!wrapperRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      wrapperRef.current.requestFullscreen?.();
    }
  };

  /* Scale deck to fit viewport */
  useEffect(() => {
    const scaleDeck = () => {
      if (!deckRef.current) return;
      const isFS = !!document.fullscreenElement;
      const viewW = isFS ? window.innerWidth : window.innerWidth - 48;
      const viewH = isFS ? window.innerHeight : window.innerHeight - 48;
      const s = Math.min(viewW / 1200, viewH / 675);
      deckRef.current.style.width = '1200px';
      deckRef.current.style.height = '675px';
      deckRef.current.style.transform = `scale(${s})`;
      deckRef.current.style.transformOrigin = 'center center';
    };
    scaleDeck();
    window.addEventListener('resize', scaleDeck);
    document.addEventListener('fullscreenchange', scaleDeck);
    document.addEventListener('webkitfullscreenchange', scaleDeck);
    return () => {
      window.removeEventListener('resize', scaleDeck);
      document.removeEventListener('fullscreenchange', scaleDeck);
      document.removeEventListener('webkitfullscreenchange', scaleDeck);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement | null)?.closest?.("input, select, textarea, [contenteditable]")) return;
      const key = event.key.toLowerCase();
      if (key === "arrowright" || key === " ") { event.preventDefault(); advance(); }
      if (key === "arrowleft") retreat();
      if (key === "home") goTo(0);
      if (key === "end") goTo(slideData.length - 1);
      if (key === "f") toggleFullscreen();
      if (key === "escape") { setShowHelp(false); setShowMotion(false); }
      if (key === "m" && !event.metaKey && !event.ctrlKey && !event.altKey) setShowMotion((v) => !v);
      if (/^[1-9]$/.test(key)) { const n = Number(key) - 1; if (n < slideData.length) goTo(n); }
      if (key === "?") setShowHelp((v) => !v);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentSlide, revealed]);

  return (
    <>
      <style>{animationCSS}</style>
      <div className="app-shell">
        <div ref={wrapperRef} className="deck-wrapper">
        <div ref={deckRef} className={`deck-container${mood.noiseOverlay ? ' noise-overlay' : ''}`} style={{ ...deckThemeVars, background: mood.background, border: `1px solid rgba(226,232,240,0.4)`, position: "relative", transition: "background 500ms ease, color 300ms ease" }}>
          {/* Progress bar */}
          <div className="progress-shimmer" style={{ position: "absolute", top: 0, left: 0, height: 4, width: `${progress}%`, transition: "width 320ms ease", zIndex: 5, borderRadius: "0 2px 2px 0" }} />

          {/* Slide content */}
          <MotionStage
            slides={slideData}
            index={currentSlide}
            revealed={revealed}
            motion={motion}
            navKind={navKind.current}
            replayToken={replayToken}
            className="motion-managed fs-slide-padding"
            style={{ width: "100%", height: "100%", padding: "52px 56px 64px", overflow: "hidden", position: "relative", zIndex: 1, background: mood.background }}
          >
            <SlideRenderer slide={slide} revealed={revealed} />
          </MotionStage>

          {/* Help overlay */}
          {showHelp && (
            <div className="help-overlay" style={{ border: `1px solid ${mood.cardBorder}`, background: mood.cardBg }}>
              <div className="help-header">
                <p className="help-title">Keyboard shortcuts</p>
                <button className="help-close" onClick={() => setShowHelp(false)}><X style={{ width: 16, height: 16 }} /></button>
              </div>
              <ul className="help-list">
                <li>← / →: previous / next</li>
                <li>Space: next slide</li>
                <li>1-9: jump to slide</li>
                <li>F: fullscreen</li>
                <li>M: motion graphics</li>
                <li>Home / End: first or last</li>
                <li>Esc: close overlays</li>
              </ul>
            </div>
          )}

          {showMotion && <MotionPanel motion={motion} onChange={(next) => setMotion(Motion.normalize(next))} onReplay={() => setReplayToken((value) => value + 1)} onClose={() => setShowMotion(false)} />}

          {/* Controls */}
          <div className="controls-bar">
            <button className="control-button" onClick={retreat} aria-label="Previous presenter beat" disabled={currentSlide === 0 && revealed === 0}><ChevronLeft style={{ width: 16, height: 16 }} /></button>
            <button className="control-button" onClick={advance} aria-label="Next presenter beat" disabled={currentSlide === slideData.length - 1 && revealed >= buildCount}><ChevronRight style={{ width: 16, height: 16 }} /></button>
            <span className="control-counter">{currentSlide + 1} / {slideData.length}{buildCount ? ` · ${revealed}/${buildCount}` : ""}</span>
            <button className="control-button" onClick={() => setShowMotion((v) => !v)} aria-label="Motion graphics" aria-pressed={showMotion}><Sparkles style={{ width: 16, height: 16 }} /></button>
            <button className="control-button" onClick={toggleFullscreen} aria-label="Fullscreen"><Maximize style={{ width: 16, height: 16 }} /></button>
            <button className="control-button" onClick={() => setShowHelp(v => !v)} aria-label="Help"><HelpCircle style={{ width: 16, height: 16 }} /></button>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
