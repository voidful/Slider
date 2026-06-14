import { Download, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { useModalDialog } from "../lib/useModalDialog";
import { themeClassNames, themeLabels } from "../lib/presets";
import { TRANSITION_RANGE, TYPE_SCALE_RANGE, type Tweaks } from "../lib/useTweaks";
import type { Theme } from "../types";

const THEME_OPTIONS = Object.keys(themeClassNames) as Theme[];

function ColorRow({
  label,
  value,
  fallback,
  onChange,
  onClear,
}: {
  label: string;
  value: string;
  fallback: string;
  onChange: (value: string) => void;
  onClear: () => void;
}) {
  const id = `tweak-color-${label.toLowerCase()}`;
  return (
    <div className="tweak-row">
      <label htmlFor={id}>{label}</label>
      <div className="tweak-color">
        <input id={id} type="color" value={value || fallback} onChange={(event) => onChange(event.target.value)} />
        {value ? (
          <button type="button" className="tweak-clear" onClick={onClear} aria-label={`Reset ${label} to theme default`}>
            Auto
          </button>
        ) : (
          <span className="tweak-auto" aria-hidden="true">Auto</span>
        )}
      </div>
    </div>
  );
}

export function TweaksPanel({
  tweaks,
  setTweak,
  reset,
  exportTweaks,
  onClose,
}: {
  tweaks: Tweaks;
  setTweak: <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => void;
  reset: () => void;
  exportTweaks: () => void;
  onClose: () => void;
}) {
  const { containerRef, titleId } = useModalDialog<HTMLElement>(onClose, { modal: false });

  return (
    <aside ref={containerRef} className="floating-panel tweaks-panel" role="dialog" aria-labelledby={titleId} data-wheel-nav-ignore>
      <div className="panel-header">
        <div>
          <p id={titleId}><SlidersHorizontal aria-hidden="true" /> Tweaks</p>
          <span className="panel-subtitle">Live design, saved to this browser</span>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Close tweaks panel">
          <X aria-hidden="true" />
        </button>
      </div>

      <div className="tweak-section">
        <p className="tweak-section-title">Theme</p>
        <div className="tweak-theme-grid" role="radiogroup" aria-label="Theme preset">
          {THEME_OPTIONS.map((theme) => (
            <button
              key={theme}
              type="button"
              role="radio"
              aria-checked={tweaks.themePreset === theme}
              className="tweak-theme-button"
              data-active={tweaks.themePreset === theme}
              onClick={() => setTweak("themePreset", theme)}
            >
              {themeLabels[theme]}
            </button>
          ))}
        </div>
      </div>

      <div className="tweak-section">
        <p className="tweak-section-title">Color</p>
        <ColorRow label="Accent" value={tweaks.accent} fallback="#1f1f1f" onChange={(v) => setTweak("accent", v)} onClear={() => setTweak("accent", "")} />
        <ColorRow label="Positive" value={tweaks.positive} fallback="#059669" onChange={(v) => setTweak("positive", v)} onClear={() => setTweak("positive", "")} />
        <ColorRow label="Negative" value={tweaks.negative} fallback="#9d2c2c" onChange={(v) => setTweak("negative", v)} onClear={() => setTweak("negative", "")} />
      </div>

      <div className="tweak-section">
        <p className="tweak-section-title">Layout & motion</p>
        <div className="tweak-row">
          <label htmlFor="tweak-typescale">Text size</label>
          <input
            id="tweak-typescale"
            type="range"
            min={TYPE_SCALE_RANGE.min}
            max={TYPE_SCALE_RANGE.max}
            step={TYPE_SCALE_RANGE.step}
            value={tweaks.typeScale}
            onChange={(event) => setTweak("typeScale", Number(event.target.value))}
          />
          <span className="tweak-value">{Math.round(tweaks.typeScale * 100)}%</span>
        </div>
        <div className="tweak-row">
          <label htmlFor="tweak-transition">Transition</label>
          <input
            id="tweak-transition"
            type="range"
            min={TRANSITION_RANGE.min}
            max={TRANSITION_RANGE.max}
            step={TRANSITION_RANGE.step}
            value={tweaks.transitionMs}
            onChange={(event) => setTweak("transitionMs", Number(event.target.value))}
          />
          <span className="tweak-value">{tweaks.transitionMs}ms</span>
        </div>
        <div className="tweak-row tweak-row-toggle">
          <label htmlFor="tweak-progress">Progress bar</label>
          <input
            id="tweak-progress"
            type="checkbox"
            checked={tweaks.showProgressBar}
            onChange={(event) => setTweak("showProgressBar", event.target.checked)}
          />
        </div>
      </div>

      <div className="tweak-actions">
        <button type="button" className="tweak-action" onClick={reset}>
          <RotateCcw aria-hidden="true" /> Reset
        </button>
        <button type="button" className="tweak-action" onClick={exportTweaks}>
          <Download aria-hidden="true" /> Export
        </button>
      </div>
    </aside>
  );
}
