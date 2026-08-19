import React, { useEffect, useMemo, useRef, useState, CSSProperties } from "react";
import {
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Image as ImageIcon,
  Maximize,
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
    "aria-hidden": visible ? undefined : true,
  } as const;
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
          <div className="stagger-3" style={{ marginTop: 14, borderLeft: `4px solid ${m.limitationBorder}`, background: m.limitationBg, backdropFilter: "blur(12px)", borderRadius: "0 12px 12px 0", padding: "20px 24px" }}>
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
  const deckRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const progress = useMemo(() => ((currentSlide + 1) / slideData.length) * 100, [currentSlide]);
  const slide = slideData[currentSlide];
  const buildCount = getRevealOrder(slide).length;
  const mood = getMood(slide);
  const toolbar = toolbarPalettes[mood.toolbarTone];
  const goTo = (index: number) => {
    const clamped = Math.max(0, Math.min(index, slideData.length - 1));
    setCurrentSlide(clamped);
    setRevealed(getRevealOrder(slideData[clamped]).length);
  };
  const advance = () => {
    if (revealed < buildCount) { setRevealed(revealed + 1); return; }
    if (currentSlide < slideData.length - 1) { setCurrentSlide(currentSlide + 1); setRevealed(0); }
  };
  const retreat = () => {
    if (revealed > 0) { setRevealed(revealed - 1); return; }
    if (currentSlide > 0) {
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
      const key = event.key.toLowerCase();
      if (key === "arrowright" || key === " ") { event.preventDefault(); advance(); }
      if (key === "arrowleft") retreat();
      if (key === "home") goTo(0);
      if (key === "end") goTo(slideData.length - 1);
      if (key === "f") toggleFullscreen();
      if (key === "escape") setShowHelp(false);
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
          <div key={currentSlide} className="slide-enter fs-slide-padding" style={{ width: "100%", height: "100%", padding: "52px 56px 64px", overflow: "hidden", position: "relative", zIndex: 1 }}>
            <SlideRenderer slide={slide} revealed={revealed} />
          </div>

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
                <li>Home / End: first or last</li>
                <li>Esc: close overlays</li>
              </ul>
            </div>
          )}

          {/* Controls */}
          <div className="controls-bar">
            <button className="control-button" onClick={retreat} aria-label="Previous presenter beat" disabled={currentSlide === 0 && revealed === 0}><ChevronLeft style={{ width: 16, height: 16 }} /></button>
            <button className="control-button" onClick={advance} aria-label="Next presenter beat" disabled={currentSlide === slideData.length - 1 && revealed >= buildCount}><ChevronRight style={{ width: 16, height: 16 }} /></button>
            <span className="control-counter">{currentSlide + 1} / {slideData.length}{buildCount ? ` · ${revealed}/${buildCount}` : ""}</span>
            <button className="control-button" onClick={toggleFullscreen} aria-label="Fullscreen"><Maximize style={{ width: 16, height: 16 }} /></button>
            <button className="control-button" onClick={() => setShowHelp(v => !v)} aria-label="Help"><HelpCircle style={{ width: 16, height: 16 }} /></button>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
