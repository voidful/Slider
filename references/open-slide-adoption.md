# open-slide Adoption Notes

Reviewed source: `1weiho/open-slide` at commit `73846490772893a5bce7db63efdf0192e84cfa6b` (2026-08-18), MIT licensed.

## Adopted or adapted

| open-slide strength | Slider adaptation |
|:---|:---|
| Current/next presenter view, notes, and timer | Linked presenter window in the React starter |
| Element-level review loop | Semantic review targets with exportable agent handoff JSON |
| `Steps` / `Step` build-on-reveal | Data-driven `revealOrder`, shared by HTML and React runtimes |
| Fixed canvas with scale-only presentation | Existing 1200×675 stage contract retained |
| Static HTML/PDF export | Existing self-contained HTML and React export paths retained |

## Deliberately not adopted

| Feature | Reason |
|:---|:---|
| Monorepo runtime and multi-deck home | Slider is a paper-to-artifact skill, not a deck workspace product |
| Browser writes directly into TSX source | Conflicts with portable `file://` and static-host operation; comments export as a sidecar instead |
| Arbitrary React as the default authoring format | Slider keeps structured evidence fields auditable before rendering |
| Remote logo search | Research figures must remain source-traceable and the final deck self-contained |
| 1920×1080 canvas | Slider preserves its rehearsed 1200×675 coordinate contract to avoid visual drift |

Future adoption should preserve four invariants: evidence fidelity, fixed-stage composition, self-contained default output, and post-render auditability.
