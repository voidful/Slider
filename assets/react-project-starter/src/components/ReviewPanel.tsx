import { Download, Trash2 } from "lucide-react";
import type { ReviewComment, ReviewTarget } from "../types";
import { useModalDialog } from "../lib/useModalDialog";

export function ReviewPanel({
  comments,
  current,
  target,
  value,
  onValueChange,
  onAdd,
  onDelete,
  onExport,
  onClose,
}: {
  comments: ReviewComment[];
  current: number;
  target: ReviewTarget;
  value: string;
  onValueChange: (value: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onExport: () => void;
  onClose: () => void;
}) {
  const { containerRef, titleId } = useModalDialog<HTMLElement>(onClose, { modal: false });
  const slideComments = comments.filter((comment) => comment.slideIndex === current);
  return (
    <aside ref={containerRef} className="floating-panel review-panel" role="dialog" aria-labelledby={titleId} data-wheel-nav-ignore>
      <div className="panel-header">
        <div>
          <p id={titleId}>Review</p>
          <span className="panel-subtitle">Slide {current + 1} · {target.label}</span>
        </div>
        <button className="icon-button" type="button" aria-label="Export review comments" title="Export review comments" onClick={onExport}>
          <Download aria-hidden="true" />
        </button>
      </div>

      <textarea
        aria-label="Review comment"
        placeholder="Add a precise revision note..."
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
      />
      <button className="panel-primary-button" type="button" disabled={!value.trim()} onClick={onAdd}>
        Add comment
      </button>

      <div className="review-list">
        {slideComments.length ? (
          slideComments.map((comment) => (
            <article className="review-item" key={comment.id}>
              <div>
                <p>{comment.targetLabel}</p>
                <time>{new Date(comment.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</time>
              </div>
              <p>{comment.text}</p>
              <button type="button" aria-label="Delete comment" title="Delete comment" onClick={() => onDelete(comment.id)}>
                <Trash2 aria-hidden="true" />
              </button>
            </article>
          ))
        ) : (
          <p className="empty-panel-note">No comments on this slide.</p>
        )}
      </div>
    </aside>
  );
}
