/**
 * Fits the rendered slide to the fixed 1200×675 stage: normal, then compact, then tight density
 * (`data-density` on the stage). Every box on the slide must hold its content, measured by line
 * boxes so glyphs past a tight line-height do not count. A slide that still overflows gets
 * `data-overflow="true"` so it can be shortened or split. Measuring a hidden clone keeps running
 * entrance transforms out of the result.
 */
const STEPS = ["", "compact", "tight"] as const;

function lineHeight(el: Element) {
  const value = getComputedStyle(el).lineHeight;
  return value === "normal" ? 0 : parseFloat(value);
}

function lineRects(node: Node, height: number, scale: number) {
  let rects: DOMRectList;
  if (node.nodeType === Node.TEXT_NODE) {
    const range = document.createRange();
    range.selectNodeContents(node);
    rects = range.getClientRects();
  } else rects = (node as Element).getClientRects();
  return Array.from(rects).map((r) => {
    const trim = height ? Math.max(0, (r.height - height * scale) / 2) : 0;
    return { left: r.left, right: r.right, top: r.top + trim, bottom: r.bottom - trim };
  });
}

type Box = { left: number; right: number; top: number; bottom: number };

function contentRects(el: Element, scale: number, out: Box[] = []): Box[] {
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.nodeValue?.trim()) out.push(...lineRects(node, lineHeight(el), scale));
      continue;
    }
    if (!(node instanceof Element)) continue;
    const style = getComputedStyle(node);
    if (style.display === "none" || style.position === "absolute" || style.position === "fixed") continue;
    if (style.display === "contents") contentRects(node, scale, out);
    else if (style.display === "inline") out.push(...lineRects(node, lineHeight(node), scale));
    else out.push(node.getBoundingClientRect());
  }
  return out;
}

/** Largest distance (stage px) by which any box's content leaves its padding box. */
export function slideOverflow(content: HTMLElement): number {
  const scale = content.getBoundingClientRect().width / (content.offsetWidth || 1) || 1;
  let worst = 0;
  for (const el of [content, ...Array.from(content.querySelectorAll<HTMLElement>("*"))]) {
    if (el.closest("svg") && el.tagName.toLowerCase() !== "svg") continue;
    const display = getComputedStyle(el).display;
    if (display === "inline" || display === "contents" || display === "none" || (!el.clientWidth && !el.clientHeight)) continue;
    const box = el.getBoundingClientRect();
    const left = box.left + el.clientLeft * scale;
    const top = box.top + el.clientTop * scale;
    const right = left + el.clientWidth * scale;
    const bottom = top + el.clientHeight * scale;
    worst = Math.max(worst, el.scrollWidth - el.clientWidth);
    for (const r of contentRects(el, scale)) {
      worst = Math.max(worst, (left - r.left) / scale, (top - r.top) / scale, (r.right - right) / scale, (r.bottom - bottom) / scale);
    }
  }
  return worst;
}

export function fitSlide(stage: HTMLElement | null) {
  const deck = stage?.parentElement;
  if (!stage || !deck) return;
  const probe = stage.cloneNode(true) as HTMLElement;
  probe.setAttribute("aria-hidden", "true");
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  deck.appendChild(probe);
  let density = "";
  let overflow = true;
  try {
    const content = probe.querySelector<HTMLElement>(".slide-content");
    if (!content) return;
    for (const step of STEPS) {
      density = step;
      if (step) probe.dataset.density = step;
      else delete probe.dataset.density;
      if (slideOverflow(content) <= 1) {
        overflow = false;
        break;
      }
    }
  } finally {
    probe.remove();
  }
  if (density) stage.dataset.density = density;
  else delete stage.dataset.density;
  if (overflow) {
    stage.dataset.overflow = "true";
    const title = stage.querySelector("h1, h2")?.textContent?.trim();
    console.warn(`Slide${title ? ` "${title}"` : ""} does not fit even at tight density; shorten it or split it.`);
  } else delete stage.dataset.overflow;
}
