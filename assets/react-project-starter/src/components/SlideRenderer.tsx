import { Image as ImageIcon } from "lucide-react";
import type { Slide, Theme, VisualAsset } from "../types";
import { venueLabels } from "../lib/presets";
import { venuePreset } from "../lib/presentationConfig";

function FigureFrame({ label, visual }: { label?: string; visual?: VisualAsset }) {
  if (visual?.src) {
    return (
      <figure className="figure-frame">
        <img data-review-target="visual.image" data-review-label="Visual image" src={visual.src} alt={visual.alt || label || "Paper visual"} />
        <figcaption>
          {visual.caption || label || "Paper visual"}{visual.confidence ? ` · ${visual.confidence} confidence` : ""}
        </figcaption>
      </figure>
    );
  }
  return (
    <div className="figure-placeholder">
      <ImageIcon aria-hidden="true" />
      <span data-review-target="visual.placeholder" data-review-label="Visual placeholder">{label || "Insert paper figure"}</span>
    </div>
  );
}

function BulletList({ bullets }: { bullets?: string[] }) {
  if (!bullets?.length) return null;
  return (
    <ul className="bullet-list stagger-3">
      {bullets.map((bullet, index) => (
        <li key={`${index}-${bullet}`}>
          <span className="bullet-dot" aria-hidden="true" />
          <span data-review-target={`bullet.${index}`} data-review-label={`Bullet ${index + 1}`}>{bullet}</span>
        </li>
      ))}
    </ul>
  );
}

function MetricsGrid({ slide }: { slide: Slide }) {
  if (!slide.metrics?.length) return null;
  return (
    <div className="metric-grid stagger-3">
      {slide.metrics.map((metric) => (
        <div key={metric.label} className="metric-card">
          <p className="metric-label" data-review-target={`metric.${metric.label}.label`} data-review-label={`${metric.label} label`}>{metric.label}</p>
          <p className="metric-value" data-review-target={`metric.${metric.label}.value`} data-review-label={`${metric.label} value`}>{metric.value}</p>
          <p className="metric-detail" data-review-target={`metric.${metric.label}.detail`} data-review-label={`${metric.label} detail`}>{metric.detail}</p>
        </div>
      ))}
    </div>
  );
}

export function SlideRenderer({ slide, theme }: { slide: Slide; theme: Theme }) {
  const themeClass = `slide-content slide-${theme}`;

  switch (slide.layout) {
    case "cover":
      return (
        <div className={`${themeClass} cover-layout`} data-slide-layout="cover">
          <p className="eyebrow stagger-1">{venueLabels[venuePreset]}</p>
          <h1 className="cover-title stagger-2" data-review-target="title" data-review-label="Title">{slide.title}</h1>
          {slide.subtitle ? <p className="subtitle stagger-3">{slide.subtitle}</p> : null}
          <p className="key-message cover-message stagger-4" data-review-target="keyMessage" data-review-label="Key message">{slide.keyMessage}</p>
        </div>
      );
    case "split":
    case "diagram":
      return (
        <div className={`${themeClass} split-layout`} data-slide-layout={slide.layout}>
          <div className="slide-copy">
            <p className="eyebrow stagger-1">Key point</p>
            <h2 className="slide-title stagger-2" data-review-target="title" data-review-label="Title">{slide.title}</h2>
            <p className="key-message stagger-3" data-review-target="keyMessage" data-review-label="Key message">{slide.keyMessage}</p>
            <BulletList bullets={slide.bullets} />
          </div>
          <div className="visual-column stagger-4">
            <FigureFrame label={slide.figureLabel} visual={slide.visual} />
          </div>
        </div>
      );
    case "metrics": {
      return (
        <div className={`${themeClass} metrics-layout`} data-slide-layout="metrics">
          <p className="eyebrow stagger-1">Main result</p>
          <h2 className="slide-title stagger-2" data-review-target="title" data-review-label="Title">{slide.title}</h2>
          <p className="key-message stagger-3" data-review-target="keyMessage" data-review-label="Key message">{slide.keyMessage}</p>
          {slide.visual?.src ? (
            <div className="metrics-with-visual">
              <MetricsGrid slide={slide} />
              <FigureFrame label={slide.figureLabel} visual={slide.visual} />
            </div>
          ) : <MetricsGrid slide={slide} />}
          {slide.visualBindingStatus?.status === "placeholder" ? (
            <p className="binding-note">Visual fallback: {slide.visualBindingStatus.reason || "no reliable crop was bound."}{slide.visualBindingStatus.fallbackStrategy ? ` (${slide.visualBindingStatus.fallbackStrategy})` : ""}</p>
          ) : null}
        </div>
      );
    }
    case "limitations":
      return (
        <div className={`${themeClass} limitations-layout`} data-slide-layout="limitations">
          <p className="eyebrow stagger-1">Boundaries</p>
          <h2 className="slide-title stagger-2" data-review-target="title" data-review-label="Title">{slide.title}</h2>
          <div className="limitation-panel stagger-3">
            <p className="key-message" data-review-target="keyMessage" data-review-label="Key message">{slide.keyMessage}</p>
            <BulletList bullets={slide.bullets} />
          </div>
        </div>
      );
    case "bullets":
    default:
      return (
        <div className={`${themeClass} bullets-layout`} data-slide-layout="bullets">
          <p className="eyebrow stagger-1">{slide.appendix ? "Appendix" : "Core idea"}</p>
          <h2 className="slide-title stagger-2" data-review-target="title" data-review-label="Title">{slide.title}</h2>
          <p className="key-message stagger-3" data-review-target="keyMessage" data-review-label="Key message">{slide.keyMessage}</p>
          <BulletList bullets={slide.bullets} />
        </div>
      );
  }
}
