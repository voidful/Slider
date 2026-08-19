import type { Slide } from "../types";

function availableTargets(slide?: Slide) {
  const targets = new Set<string>();
  if (!slide) return targets;
  if (slide.keyMessage) targets.add("keyMessage");
  slide.bullets?.forEach((_, index) => targets.add(`bullets.${index}`));
  slide.metrics?.forEach((_, index) => targets.add(`metrics.${index}`));
  slide.table?.rows.forEach((_, index) => targets.add(`table.rows.${index}`));
  if (slide.visual?.src || slide.figureLabel) targets.add("visual");
  return targets;
}

export function getBuildOrder(slide?: Slide) {
  const available = availableTargets(slide);
  const seen = new Set<string>();
  return (slide?.revealOrder ?? []).filter((target) => {
    if (typeof target !== "string" || !available.has(target) || seen.has(target)) return false;
    seen.add(target);
    return true;
  });
}

export function getBuildCount(slide?: Slide) {
  return getBuildOrder(slide).length;
}

export function clampRevealed(slide: Slide | undefined, revealed: number) {
  return Math.max(0, Math.min(Math.trunc(revealed), getBuildCount(slide)));
}

export function isBuildTargetVisible(slide: Slide, target: string, revealed?: number) {
  if (revealed === undefined) return true;
  const index = getBuildOrder(slide).indexOf(target);
  return index < 0 || index < revealed;
}
