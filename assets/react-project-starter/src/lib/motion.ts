/*
 * Motion graphics for the audience deck: slide transitions plus text, figure, card,
 * and number entrances modeled on effects catalogued at kittenjam-motion-library.vercel.app.
 * Mirrors the MOTION GRAPHICS engine in assets/html-slideshow-starter/paper-presentation.html
 * (same ids, presets, and timings; see references/motion-graphics.md).
 *
 * Guarantees: Web Animations only; every effect ends on the static layout; text is split only
 * when its line breaks stay identical; React-owned text nodes are restored, never replaced;
 * finishMotion() snaps everything to the final frame and runs before each slide/build commit.
 */
import type { Slide } from "../types";

export const MOTION_PRESET_IDS = ["none", "subtle", "editorial", "kinetic", "cinematic", "digital"] as const;
export const MOTION_TRANSITIONS = ["none", "fade", "rise", "push", "wipe", "curtain", "circle", "doors", "slices", "zoom", "glitch", "pixel", "morph"] as const;
export const MOTION_TEXT_EFFECTS = ["none", "fade-up", "rise", "blur", "spread", "merge", "scramble", "typewriter", "lines", "soft"] as const;
export const MOTION_CHANNELS = {
  kicker: MOTION_TEXT_EFFECTS,
  title: MOTION_TEXT_EFFECTS,
  hero: MOTION_TEXT_EFFECTS,
  text: MOTION_TEXT_EFFECTS,
  media: ["none", "fade-up", "clip", "mask", "zoom"],
  data: ["none", "count", "scramble"],
  group: ["none", "fade-up", "stagger"],
  emphasis: ["none", "sweep"],
} as const;

export type MotionPresetId = (typeof MOTION_PRESET_IDS)[number];
export type MotionTransition = (typeof MOTION_TRANSITIONS)[number];
export type MotionChannel = keyof typeof MOTION_CHANNELS;
export type MotionProfile = { transition: MotionTransition; accent: MotionTransition } & { [K in MotionChannel]: string };
export type DeckMotion = Partial<MotionProfile> & { preset: MotionPresetId; speed?: number };
export type ResolvedMotion = MotionProfile & { speed: number; reduced?: boolean };
type MotionPreset = MotionProfile & { name: string; note: string };

export const MOTION_PRESETS: Record<MotionPresetId, MotionPreset> = {
  none: { name: "None", note: "Instant cuts", transition: "none", accent: "none", kicker: "none", title: "none", hero: "none", text: "none", media: "none", data: "none", group: "none", emphasis: "none" },
  subtle: { name: "Subtle", note: "Short fades", transition: "fade", accent: "rise", kicker: "fade-up", title: "fade-up", hero: "fade-up", text: "fade-up", media: "fade-up", data: "none", group: "fade-up", emphasis: "none" },
  editorial: { name: "Editorial", note: "Push, rising words", transition: "push", accent: "curtain", kicker: "fade-up", title: "rise", hero: "spread", text: "soft", media: "mask", data: "count", group: "stagger", emphasis: "sweep" },
  kinetic: { name: "Kinetic", note: "Wipes, blur letters", transition: "wipe", accent: "circle", kicker: "rise", title: "blur", hero: "merge", text: "lines", media: "clip", data: "count", group: "stagger", emphasis: "sweep" },
  cinematic: { name: "Cinematic", note: "Zoom-through, doors", transition: "zoom", accent: "doors", kicker: "fade-up", title: "spread", hero: "blur", text: "soft", media: "zoom", data: "count", group: "stagger", emphasis: "none" },
  digital: { name: "Digital", note: "Glitch, scramble", transition: "glitch", accent: "pixel", kicker: "typewriter", title: "scramble", hero: "scramble", text: "blur", media: "clip", data: "scramble", group: "stagger", emphasis: "sweep" },
};

/* React project markup (SlideRenderer.tsx). */
const SEL = {
  targets: ".eyebrow,.cover-title,.slide-title,.subtitle,.key-message,.bullet-list li,.figure-frame,.figure-placeholder,.metric-card,.data-table tr,.data-table-frame figcaption,.limitation-panel,.binding-note",
  owners: ".metric-card,.figure-frame,.figure-placeholder",
  kicker: ".eyebrow",
  hero: ".cover-title",
  title: ".slide-title",
  media: ".figure-frame,.figure-placeholder",
  group: ".metric-card,.data-table tr",
  emphasis: ".limitation-panel",
  bullet: ".bullet-list li",
  data: ".metric-value",
};
const MOTION_KEYS = ["transition", "accent", ...Object.keys(MOTION_CHANNELS)] as (keyof MotionProfile)[];
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
type Ctx = { speed: number; S: (ms: number) => number; accent: string };
type Split = { units: HTMLElement[]; restore: () => void };
type LineSplit = { lines: HTMLElement[]; blocks: HTMLElement[]; restore: () => void };
type TransitionCtx = Ctx & {
  ghost: HTMLElement;
  incoming: HTMLElement;
  dir: number;
  deck: HTMLElement;
  under: HTMLElement;
  over: HTMLElement;
  add: (anim: Animation | null) => Animation | null;
};

const engine = { anims: new Set<Animation>(), jobs: new Set<Job>(), lastNavAt: -1e9 };
let segmenter: Intl.Segmenter | null | undefined;
let maskSupport: boolean | null = null;

/* ── Configuration ── */
export function sanitizeMotion(src: unknown, withPreset = true): Partial<DeckMotion> {
  const out: Partial<DeckMotion> = {};
  if (!src || typeof src !== "object") return out;
  const value = src as Record<string, unknown>;
  if (withPreset && typeof value.preset === "string" && value.preset in MOTION_PRESETS) out.preset = value.preset as MotionPresetId;
  for (const key of MOTION_KEYS) {
    const allowed: readonly string[] = key === "transition" || key === "accent" ? MOTION_TRANSITIONS : MOTION_CHANNELS[key as MotionChannel];
    if (typeof value[key] === "string" && allowed.includes(value[key] as string)) (out as Record<string, unknown>)[key] = value[key];
  }
  const speed = Number(value.speed);
  if (Number.isFinite(speed) && speed > 0) out.speed = Math.max(0.25, Math.min(4, speed));
  return out;
}

export function normalizeDeckMotion(next: unknown): DeckMotion {
  const clean = sanitizeMotion(typeof next === "string" ? { preset: next } : next);
  return { ...clean, preset: clean.preset ?? "editorial" };
}

export function prefersReducedMotion() {
  return typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

/* ?motion=<preset> previews or disables motion (e.g. ?motion=none for PDF capture) without saving it. */
function urlPreset(): MotionPresetId | null {
  try {
    const id = new URLSearchParams(window.location.search).get("motion");
    return id && id in MOTION_PRESETS ? (id as MotionPresetId) : null;
  } catch {
    return null;
  }
}

export function isAccentSlide(slides: Slide[], index: number) {
  const slide = slides[index];
  if (!slide) return false;
  if (typeof slide.accent === "boolean") return slide.accent;
  if (slide.layout === "cover" || slide.layout === "limitations") return true;
  if (["title", "main-result", "limitation", "takeaway"].includes(slide.pageRole ?? "")) return true;
  return Boolean(slide.appendix && index > 0 && !slides[index - 1]?.appendix);
}

export function resolveMotion(deck: DeckMotion, slides: Slide[], index: number, ignoreReduced = false): ResolvedMotion {
  const none = MOTION_PRESETS.none;
  if (!ignoreReduced && prefersReducedMotion()) return { ...none, speed: 1, reduced: true };
  const accent = isAccentSlide(slides, index);
  const forced = urlPreset();
  if (forced) {
    const preset = MOTION_PRESETS[forced];
    return { ...preset, transition: accent ? preset.accent : preset.transition, speed: 1 };
  }
  let profile: MotionProfile & { speed?: number } = { ...(MOTION_PRESETS[deck.preset] ?? MOTION_PRESETS.editorial), ...sanitizeMotion(deck, false) };
  const own = slides[index]?.motion;
  if (typeof own === "string" && own in MOTION_PRESETS) profile = { ...MOTION_PRESETS[own as MotionPresetId], speed: profile.speed };
  else if (own && typeof own === "object") {
    const patch = sanitizeMotion(own);
    profile = { ...(patch.preset ? { ...MOTION_PRESETS[patch.preset], speed: profile.speed } : profile), ...patch };
  }
  const slideTransition = slides[index]?.transition;
  const transition = (MOTION_TRANSITIONS as readonly string[]).includes(slideTransition ?? "") ? (slideTransition as MotionTransition) : accent ? profile.accent : profile.transition;
  return { ...profile, transition, speed: profile.speed ?? 1 };
}

function context(profile: ResolvedMotion, scope: Element): Ctx {
  const speed = Math.max(0.25, Math.min(4, Number(profile.speed) || 1));
  return { speed, S: (ms) => Math.max(0, ms) / speed, accent: getComputedStyle(scope).getPropertyValue("--accent").trim() || "#1f1f1f" };
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
  if (!list.length) {
    endJob(entry);
    return;
  }
  void Promise.all(list.map((anim) => anim.finished.catch(() => undefined))).then(() => endJob(entry));
}
function after(anims: (Animation | null)[], stop: () => void) {
  waitFor(job(stop), anims);
}
function trackSplit(split: { restore: () => void }, make: () => (Animation | null)[]) {
  const entry = job(split.restore);
  try {
    waitFor(entry, make());
  } catch {
    endJob(entry);
  }
}

export function motionActive() {
  return engine.anims.size > 0 || engine.jobs.size > 0;
}

/** Snap all running motion to its final frame and restore split text and layers. */
export function finishMotion() {
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

if (typeof window !== "undefined") window.addEventListener("beforeprint", finishMotion);

/* ── Text splitting: units keep the static line breaks or the split is undone ── */
function graphemes(text: string) {
  if (segmenter === undefined) segmenter = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
  return segmenter ? Array.from(segmenter.segment(text), (part) => part.segment) : Array.from(text);
}
type Token = { space: boolean; text: string };
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
function splitText(el: HTMLElement, { chars = false, mask = false } = {}): Split | null {
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
function splitLines(el: HTMLElement, { mask = false } = {}): LineSplit | null {
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
type Fx = (el: HTMLElement, t: number, ctx: Ctx) => number;
const fxFadeUp = (el: HTMLElement, t: number, ctx: Ctx, distance = 18) => {
  animate(el, [{ opacity: 0, transform: `translateY(${distance}px)` }, { opacity: 1, transform: "none" }], { duration: ctx.S(640), delay: ctx.S(t), easing: EASE.out });
  return t + 640;
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
    const right = left + unit.offsetWidth;
    let row = rows.find((candidate) => Math.abs(candidate.top - top) <= 4);
    if (!row) {
      row = { top, min: left, max: right, units: [] };
      rows.push(row);
    }
    row.min = Math.min(row.min, left);
    row.max = Math.max(row.max, right);
    row.units.push(unit);
  }
  trackSplit(split, () =>
    rows.flatMap((row) => {
      const center = (row.min + row.max) / 2;
      return row.units.map((unit) => {
        const dx = (center - (unit.offsetLeft + unit.offsetWidth / 2)) * 0.9;
        return animate(unit, [{ opacity: 0, filter: "blur(8px)", transform: `translateX(${dx.toFixed(1)}px)` }, { opacity: 1, offset: 0.45 }, { opacity: 1, filter: "blur(0px)", transform: "none" }], { duration: ctx.S(1000), delay: ctx.S(t), easing: EASE.expo });
      });
    }),
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
function glyph(ch: string) {
  const pool = /\d/.test(ch) ? GLYPHS.digit : /[A-Za-z]/.test(ch) ? GLYPHS.latin : CJK.test(ch) ? GLYPHS.cjk : GLYPHS.other;
  return pool[Math.floor(Math.random() * pool.length)];
}
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
  const units = split.units;
  const n = units.length;
  const step = Math.max(10, Math.min(34, 1100 / Math.max(1, n)));
  const on = `2px 0 0 0 ${ctx.accent}`;
  const off = "0 0 0 0 transparent";
  const blink: Keyframe[] = [{ boxShadow: on }, { boxShadow: on, offset: 0.3 }, { boxShadow: off, offset: 0.31 }, { boxShadow: off, offset: 0.6 }, { boxShadow: on, offset: 0.61 }, { boxShadow: on, offset: 0.9 }, { boxShadow: off, offset: 0.91 }, { boxShadow: off }];
  trackSplit(split, () =>
    units.flatMap((unit, i) => {
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
const fxSoft: Fx = (el, t, ctx) => {
  const split = splitLines(el);
  const lines = split ? split.lines : [el];
  const make = () => lines.map((line, i) => animate(line, [{ opacity: 0, transform: "translateY(10px)", filter: "blur(4px)" }, { opacity: 1, transform: "none", filter: "blur(0px)" }], { duration: ctx.S(900), delay: ctx.S(t + i * 150), easing: EASE.out }));
  if (split) trackSplit(split, make);
  else make();
  return t + (lines.length - 1) * 150 + 900;
};
const TEXT_FX: Record<string, Fx> = { "fade-up": fxFadeUp, rise: fxRise, blur: fxBlur, spread: fxSpread, merge: fxMerge, scramble: fxScramble, typewriter: fxTypewriter, lines: fxLines, soft: fxSoft };

/* ── Figure, card, number, and panel effects ── */
const fxClip: Fx = (el, t, ctx) => {
  const media = el.querySelector("img,svg");
  animate(el, [{ clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)" }], { duration: ctx.S(980), delay: ctx.S(t), easing: "cubic-bezier(.7,0,.2,1)" });
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
  after(
    [
      animate(el, [{ "--mo-p": "0%" } as Keyframe, { "--mo-p": "130%" } as Keyframe], { duration: ctx.S(1150), delay: ctx.S(t), easing: EASE.inOut }),
      media && animate(media, [{ transform: "translateX(-10px) scale(1.08)" }, { transform: "none" }], { duration: ctx.S(1400), delay: ctx.S(t), easing: EASE.out }),
    ],
    () => el.classList.remove("mo-masking"),
  );
  return t + 1400;
};
const fxZoom: Fx = (el, t, ctx) => {
  animate(el, [{ opacity: 0, transform: "scale(1.06)", filter: "blur(8px)" }, { opacity: 1, transform: "none", filter: "blur(0px)" }], { duration: ctx.S(900), delay: ctx.S(t), easing: EASE.out });
  return t + 900;
};
const MEDIA_FX: Record<string, Fx> = { "fade-up": fxFadeUp, clip: fxClip, mask: fxMask, zoom: fxZoom };
const fxCard: Fx = (el, t, ctx) => {
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
  const grouped = whole.includes(",");
  const format = (value: number) => {
    let s = value.toFixed(decimals);
    if (grouped) {
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
  animate(el, [{ clipPath: "inset(0% 100% 0% 0% round 8px)" }, { clipPath: "inset(0% 0% 0% 0% round 8px)" }], { duration: ctx.S(820), delay: ctx.S(t), easing: EASE.inOut });
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
      el.querySelectorAll<HTMLElement>(SEL.data).forEach((value) => {
        end = Math.max(end, profile.data === "count" ? fxCount(value, t, ctx) : fxScramble(value, t + 80, ctx));
      });
    }
    return end;
  }
  if (channel === "emphasis") return effect === "sweep" ? fxSweep(el, t, ctx) : t;
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
const MORPH = { text: ".eyebrow,.slide-title,.cover-title", title: ".slide-title,.cover-title", frame: ".figure-frame", metric: ".metric-card", metricLabel: ".metric-label", eq: ".equation-block" };
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
    const H = c.deck.clientHeight;
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
    const skew = ((Math.atan2(slant, H) * 180) / Math.PI) * (d > 0 ? -1 : 1);
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
    const colors = ["var(--accent)", "color-mix(in srgb,var(--accent) 80%,var(--text))", "color-mix(in srgb,var(--accent) 60%,var(--text))"];
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
    const radius = (0.75 * Math.hypot(c.deck.clientWidth, c.deck.clientHeight)) / Math.SQRT2;
    const ring = document.createElement("div");
    ring.className = "mo-ring";
    ring.style.width = ring.style.height = `${radius * 2}px`;
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
    const cols = 16;
    const rows = 9;
    const duration = 900;
    const grid = document.createElement("div");
    grid.className = "mo-pixels";
    c.over.appendChild(c.ghost);
    c.over.appendChild(grid);
    for (let r = 0; r < rows; r++) {
      for (let q = 0; q < cols; q++) {
        const cell = document.createElement("i");
        cell.style.left = `${(q * 100) / cols}%`;
        cell.style.top = `${(r * 100) / rows}%`;
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

export type MotionLayers = { deck: HTMLElement; under: HTMLElement; over: HTMLElement };

function runTransition(id: MotionTransition, ghost: HTMLElement, incoming: HTMLElement, dir: number, profile: ResolvedMotion, layers: MotionLayers) {
  const fx = TRANSITION_FX[id];
  if (!fx) return 0;
  const anims: Animation[] = [];
  const entry = job(() => {
    layers.under.replaceChildren();
    layers.over.replaceChildren();
    ghost.remove();
  });
  const ctx: TransitionCtx = { ...context(profile, incoming), ghost, incoming, dir, deck: layers.deck, under: layers.under, over: layers.over, add: (anim) => (anim && anims.push(anim), anim) };
  let reveal = 0;
  try {
    reveal = fx(ctx);
  } catch {
    endJob(entry);
    return 0;
  }
  waitFor(entry, anims);
  return reveal;
}

/** Plays the incoming slide's transition (from a static clone of the outgoing stage) and entrance. */
export function playSlideMotion({ ghost, incoming, dir, entrance, force, profile, layers }: { ghost: HTMLElement | null; incoming: HTMLElement; dir: number; entrance: boolean; force?: boolean; profile: ResolvedMotion; layers: MotionLayers }) {
  const now = performance.now();
  const rapid = !force && now - engine.lastNavAt < 220;
  engine.lastNavAt = now;
  if (rapid) return;
  const reveal = ghost && profile.transition !== "none" ? runTransition(profile.transition, ghost, incoming, dir, profile, layers) : 0;
  if (entrance) playEntrance(incoming, profile, reveal);
}

/** Animates build targets revealed between `previous` and the current build count. */
export function playBuildMotion(stage: HTMLElement, targets: string[], profile: ResolvedMotion) {
  const list: HTMLElement[] = [];
  for (const target of targets) {
    stage.querySelectorAll<HTMLElement>(`[data-build-target="${CSS.escape(target)}"]`).forEach((el) => {
      if (el.matches(SEL.targets)) list.push(el);
      else list.push(...collectTargets(el));
    });
  }
  if (list.length) playEntrance(stage, profile, 0, list);
}
