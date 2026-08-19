export type Layout = "cover" | "split" | "bullets" | "metrics" | "limitations" | "diagram" | "table-focus";
export type Venue = "neurips" | "iclr" | "acl" | "cvpr";
export type Theme = "zinc-editorial" | "deep-navy-academic" | "monochrome-impeccable";

export type Metric = {
  label: string;
  value: string;
  detail: string;
};

export type SlideTable = {
  headers: string[];
  rows: string[][];
  caption?: string;
  /** 0-based index of the row to highlight as the best/result row. */
  highlightRow?: number;
};

export type VisualAsset = {
  src: string;
  alt?: string;
  caption?: string;
  pageNumber?: number;
  storyRole?: string;
  score?: number;
  cropMode?: string;
  confidence?: "high" | "medium" | "low";
};

export type ReviewTarget = {
  id: string;
  label: string;
};

export type ReviewComment = {
  id: string;
  slideIndex: number;
  slideTitle: string;
  targetId: string;
  targetLabel: string;
  text: string;
  createdAt: string;
};

export type Slide = {
  id: number;
  title: string;
  layout: Layout;
  purpose: string;
  keyMessage: string;
  speakerNote: string;
  subtitle?: string;
  bullets?: string[];
  metrics?: Metric[];
  table?: SlideTable;
  figureLabel?: string;
  visualBinding?: { label?: string; pageNumber?: number; caption?: string; storyRole?: string; recommendedDeck?: string; score?: number };
  visual?: VisualAsset;
  visualBindingStatus?: { status?: "bound" | "placeholder"; confidence?: "high" | "medium" | "low"; reason?: string; candidateScore?: number; exportScore?: number; bindingScore?: number; policy?: string; fallbackStrategy?: string };
  appendix?: boolean;
  evidenceNote?: string;
  /** Semantic targets revealed one presenter beat at a time. */
  revealOrder?: string[];
};
