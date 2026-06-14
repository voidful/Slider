import { Palette } from "lucide-react";
import type { DeckDesign } from "../lib/deckDesign";
import { useModalDialog } from "../lib/useModalDialog";

export function DesignLockPanel({ design, onClose }: { design: DeckDesign | null; onClose: () => void }) {
  const { containerRef, titleId } = useModalDialog<HTMLElement>(onClose, { modal: false });
  const palette = design?.semantic_palette;
  return (
    <aside ref={containerRef} className="floating-panel design-lock-panel" role="dialog" aria-labelledby={titleId} data-wheel-nav-ignore>
      <div className="panel-header">
        <div>
          <p id={titleId}>Design Lock</p>
          <span className="panel-subtitle">{design?.deck_mood_family || "Template defaults"}</span>
        </div>
        <Palette aria-hidden="true" />
      </div>

      <dl className="design-lock-list">
        <div><dt>Theme</dt><dd>{design?.theme_preset || "Configured preset"}</dd></div>
        <div><dt>Motion</dt><dd>{design?.motion_policy?.mode || "Static-first"}</dd></div>
        <div><dt>Transition</dt><dd>{design?.motion_policy?.transition_ms ? `${design.motion_policy.transition_ms}ms` : "Template default"}</dd></div>
      </dl>

      {palette ? (
        <div className="palette-grid" aria-label="Semantic palette">
          {Object.entries(palette).map(([name, value]) => (
            <div key={name}>
              <span style={{ background: value }} />
              <p>{name}</p>
              <code>{value}</code>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-panel-note">No embedded deck_design.json. Render with --deck-design to lock a compiled design.</p>
      )}
    </aside>
  );
}
