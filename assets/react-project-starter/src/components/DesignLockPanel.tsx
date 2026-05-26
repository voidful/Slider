import { Palette } from "lucide-react";
import type { DeckDesign } from "../lib/deckDesign";

export function DesignLockPanel({ design }: { design: DeckDesign | null }) {
  const palette = design?.semantic_palette;
  return (
    <aside className="floating-panel design-lock-panel" aria-label="Deck design lock" data-wheel-nav-ignore>
      <div className="panel-header">
        <div>
          <p>Design Lock</p>
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
