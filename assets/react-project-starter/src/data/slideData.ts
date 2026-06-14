import type { Slide } from "../types";

export const slideData: Slide[] = [
  {
    id: 1,
    title: "Paper Title Goes Here",
    layout: "cover",
    purpose: "Introduce the paper and the central takeaway.",
    keyMessage: "One-sentence TL;DR that frames the whole talk.",
    speakerNote: "Open with the problem and state the paper's main claim in plain language.",
    subtitle: "Authors • Venue • Year",
  },
  {
    id: 2,
    title: "Why this problem matters",
    layout: "split",
    purpose: "Frame the motivation.",
    keyMessage: "Current methods fail in an important regime that matters to the field.",
    speakerNote: "Spend one sentence on context, one on the bottleneck, and one on why the audience should care.",
    bullets: [
      "Context sentence that grounds the task.",
      "Pain point sentence that states the real bottleneck.",
      "Impact sentence that explains why the bottleneck matters.",
    ],
    figureLabel: "Insert Figure: motivating comparison or task framing",
    evidenceNote: "Motivation should map to the paper introduction or motivating example.",
  },
  {
    id: 3,
    title: "The strongest result",
    layout: "metrics",
    purpose: "Highlight the main quantitative takeaway.",
    keyMessage: "The method delivers the clearest gain on the most relevant benchmark.",
    speakerNote: "Anchor the audience on one number, then say what baseline and metric it compares against.",
    metrics: [
      { label: "Main gain", value: "+4.2%", detail: "Accuracy on Dataset X" },
      { label: "Baseline", value: "81.3", detail: "Strong prior method" },
      { label: "Ours", value: "85.5", detail: "Proposed method" }
    ],
    evidenceNote: "Every displayed number should map to a precise dataset, metric, and comparison target.",
  },
  {
    id: 4,
    title: "Where the method stands against prior work",
    layout: "table-focus",
    purpose: "Compare against baselines on a shared benchmark.",
    keyMessage: "The method leads on the headline metric while staying competitive on cost.",
    speakerNote: "Walk down the column that matters most, then point to the highlighted row as the takeaway.",
    table: {
      headers: ["Method", "Accuracy", "Params", "Latency"],
      rows: [
        ["Prior baseline", "81.3", "120M", "42 ms"],
        ["Strong baseline", "83.1", "210M", "58 ms"],
        ["Ours", "85.5", "118M", "40 ms"],
      ],
      highlightRow: 2,
      caption: "Table 2 — Accuracy and efficiency on Dataset X (test split).",
    },
    evidenceNote: "Every row should map to a real comparison in the paper's results table.",
  }
]; // @render-slide-data
