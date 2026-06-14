import { Image as ImageIcon } from "lucide-react";
import type { Slide } from "../types";
import { useModalDialog } from "../lib/useModalDialog";

function visualStatus(slide: Slide) {
  if (slide.visual?.src) return "bound";
  if (slide.visualBindingStatus?.status) return slide.visualBindingStatus.status;
  if (slide.visualBinding || slide.figureLabel) return "missing";
  return "none";
}

export function VisualAssetPanel({
  slides,
  current,
  onSelect,
  onClose,
}: {
  slides: Slide[];
  current: number;
  onSelect: (index: number) => void;
  onClose: () => void;
}) {
  const { containerRef, titleId } = useModalDialog<HTMLElement>(onClose, { modal: false });
  const visualSlides = slides
    .map((slide, index) => ({ slide, index, status: visualStatus(slide) }))
    .filter((item) => item.status !== "none");

  return (
    <aside ref={containerRef} className="floating-panel visual-assets-panel" role="dialog" aria-labelledby={titleId} data-wheel-nav-ignore>
      <div className="panel-header">
        <div>
          <p id={titleId}>Visual Assets</p>
          <span className="panel-subtitle">{visualSlides.length} slide-level bindings</span>
        </div>
        <ImageIcon aria-hidden="true" />
      </div>

      <div className="visual-asset-list">
        {visualSlides.length ? (
          visualSlides.map(({ slide, index, status }) => (
            <button
              className="visual-asset-item"
              data-current={index === current}
              key={slide.id}
              type="button"
              onClick={() => onSelect(index)}
            >
              <span className={`asset-status asset-status-${status}`}>{status}</span>
              <strong>{String(index + 1).padStart(2, "0")} · {slide.title}</strong>
              <span>{slide.visual?.caption || slide.visualBinding?.caption || slide.figureLabel || slide.visualBinding?.label || "Paper visual"}</span>
              <small>
                {slide.visual?.confidence ? `${slide.visual.confidence} confidence` : null}
                {slide.visualBinding?.pageNumber ? ` · page ${slide.visualBinding.pageNumber}` : null}
                {slide.visualBindingStatus?.reason ? ` · ${slide.visualBindingStatus.reason}` : null}
              </small>
            </button>
          ))
        ) : (
          <p className="empty-panel-note">No slide-level visual bindings yet.</p>
        )}
      </div>
    </aside>
  );
}
