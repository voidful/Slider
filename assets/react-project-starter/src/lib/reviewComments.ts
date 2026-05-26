import { useCallback, useEffect, useState } from "react";
import type { ReviewComment, ReviewTarget, Slide } from "../types";

const STORAGE_KEY = "paper-slide-review-comments";
const DEFAULT_TARGET: ReviewTarget = { id: "slide", label: "Slide" };

function loadComments() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ReviewComment[]) : [];
  } catch {
    return [];
  }
}

function downloadJSON(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function useReviewComments(slides: Slide[], current: number) {
  const [comments, setComments] = useState<ReviewComment[]>(loadComments);
  const [draft, setDraft] = useState("");
  const [target, setTarget] = useState<ReviewTarget>(DEFAULT_TARGET);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
    } catch {
      // Review comments still work in memory when storage is unavailable.
    }
  }, [comments]);

  useEffect(() => {
    setTarget(DEFAULT_TARGET);
    setDraft("");
  }, [current]);

  const addComment = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    const slide = slides[current];
    setComments((items) => [
      ...items,
      {
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
        slideIndex: current,
        slideTitle: slide.title,
        targetId: target.id,
        targetLabel: target.label,
        text,
        createdAt: new Date().toISOString(),
      },
    ]);
    setDraft("");
  }, [current, draft, slides, target]);

  const deleteComment = useCallback((id: string) => {
    setComments((items) => items.filter((comment) => comment.id !== id));
  }, []);

  const exportComments = useCallback(() => {
    downloadJSON("slider-review-comments.json", {
      exportedAt: new Date().toISOString(),
      comments,
    });
  }, [comments]);

  const selectTargetFromElement = useCallback((element: Element | null) => {
    const targetElement = element?.closest("[data-review-target]");
    if (!(targetElement instanceof HTMLElement)) {
      setTarget(DEFAULT_TARGET);
      return;
    }
    setTarget({
      id: targetElement.dataset.reviewTarget || DEFAULT_TARGET.id,
      label: targetElement.dataset.reviewLabel || targetElement.dataset.reviewTarget || DEFAULT_TARGET.label,
    });
  }, []);

  return {
    comments,
    draft,
    target,
    setDraft,
    addComment,
    deleteComment,
    exportComments,
    selectTargetFromElement,
  };
}
