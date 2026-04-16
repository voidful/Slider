import { Image as ImageIcon } from "lucide-react";
import type { Slide, Theme, VisualAsset } from "../types";
import { themeClasses, venueLabels } from "../lib/presets";
import { venuePreset } from "../lib/presentationConfig";

function FigureFrame({ label, visual }: { label?: string; visual?: VisualAsset }) {
  if (visual?.src) {
    return (
      <figure className="overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50">
        <img src={visual.src} alt={visual.alt || label || "Paper visual"} className="max-h-[360px] w-full object-contain bg-white" />
        <figcaption className="border-t border-zinc-200 px-4 py-3 text-sm text-zinc-500">
          {visual.caption || label || "Paper visual"}{visual.confidence ? ` · ${visual.confidence} confidence` : ""}
        </figcaption>
      </figure>
    );
  }
  return (
    <div className="flex min-h-[260px] w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-zinc-500">
      <ImageIcon className="h-10 w-10" />
      <span className="text-sm">{label || "Insert paper figure"}</span>
    </div>
  );
}

function BulletList({ bullets }: { bullets?: string[] }) {
  if (!bullets?.length) return null;
  return (
    <ul className="mt-8 space-y-4 text-lg">
      {bullets.map((bullet) => (
        <li key={bullet} className="flex items-start gap-3">
          <span className="mt-2 h-2 w-2 rounded-full bg-zinc-900" />
          <span>{bullet}</span>
        </li>
      ))}
    </ul>
  );
}

export function SlideRenderer({ slide, theme }: { slide: Slide; theme: Theme }) {
  const palette = themeClasses[theme];
  const titleClass = `tracking-tight ${palette.title}`;
  const mutedClass = palette.muted;

  switch (slide.layout) {
    case "cover":
      return (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <p className={`text-sm font-semibold uppercase tracking-[0.22em] ${mutedClass}`}>{venueLabels[venuePreset]}</p>
          <h1 className={`mt-4 max-w-5xl text-balance text-4xl font-black md:text-6xl ${titleClass}`}>{slide.title}</h1>
          {slide.subtitle ? <p className={`mt-6 text-lg ${mutedClass}`}>{slide.subtitle}</p> : null}
          <p className={`mt-8 max-w-3xl text-xl ${mutedClass}`}>{slide.keyMessage}</p>
        </div>
      );
    case "split":
    case "diagram":
      return (
        <div className="grid h-full gap-10 md:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col justify-center">
            <p className={`text-sm font-semibold uppercase tracking-[0.22em] ${mutedClass}`}>Key point</p>
            <h2 className={`mt-3 max-w-4xl text-3xl font-bold md:text-5xl ${titleClass}`}>{slide.title}</h2>
            <p className={`mt-5 max-w-3xl text-lg ${mutedClass}`}>{slide.keyMessage}</p>
            <BulletList bullets={slide.bullets} />
          </div>
          <div className="flex items-center justify-center">
            <FigureFrame label={slide.figureLabel} visual={slide.visual} />
          </div>
        </div>
      );
    case "metrics": {
      const metricsGrid = (
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {slide.metrics?.map((metric) => (
            <div key={metric.label} className={`rounded-3xl border p-6 shadow-sm ${palette.card}`}>
              <p className={`text-sm font-medium ${mutedClass}`}>{metric.label}</p>
              <p className={`mt-4 text-5xl font-black tracking-tight ${titleClass}`}>{metric.value}</p>
              <p className={`mt-3 text-sm ${mutedClass}`}>{metric.detail}</p>
            </div>
          ))}
        </div>
      );
      return (
        <div className="flex h-full flex-col justify-center">
          <p className={`text-sm font-semibold uppercase tracking-[0.22em] ${mutedClass}`}>Main result</p>
          <h2 className={`mt-3 text-3xl font-bold md:text-5xl ${titleClass}`}>{slide.title}</h2>
          <p className={`mt-5 max-w-3xl text-lg ${mutedClass}`}>{slide.keyMessage}</p>
          {slide.visual?.src ? (
            <div className="mt-10 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div>{metricsGrid}</div>
              <div className="flex items-center justify-center">
                <FigureFrame label={slide.figureLabel} visual={slide.visual} />
              </div>
            </div>
          ) : metricsGrid}
          {slide.visualBindingStatus?.status === "placeholder" ? (
            <p className={`mt-4 text-sm ${mutedClass}`}>Visual fallback: {slide.visualBindingStatus.reason || "no reliable crop was bound."}{slide.visualBindingStatus.fallbackStrategy ? ` (${slide.visualBindingStatus.fallbackStrategy})` : ""}</p>
          ) : null}
        </div>
      );
    }
    case "limitations":
      return (
        <div className="flex h-full flex-col justify-center">
          <p className={`text-sm font-semibold uppercase tracking-[0.22em] ${mutedClass}`}>Boundaries</p>
          <h2 className={`mt-3 text-3xl font-bold md:text-5xl ${titleClass}`}>{slide.title}</h2>
          <div className={`mt-8 rounded-3xl border p-8 ${palette.card}`}>
            <p className={`text-lg ${mutedClass}`}>{slide.keyMessage}</p>
            <BulletList bullets={slide.bullets} />
          </div>
        </div>
      );
    case "bullets":
    default:
      return (
        <div className="flex h-full flex-col justify-center">
          <p className={`text-sm font-semibold uppercase tracking-[0.22em] ${mutedClass}`}>{slide.appendix ? "Appendix" : "Core idea"}</p>
          <h2 className={`mt-3 max-w-4xl text-3xl font-bold md:text-5xl ${titleClass}`}>{slide.title}</h2>
          <p className={`mt-5 max-w-3xl text-lg ${mutedClass}`}>{slide.keyMessage}</p>
          <BulletList bullets={slide.bullets} />
        </div>
      );
  }
}
