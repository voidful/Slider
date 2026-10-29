# Output contracts

Choose the user's requested deliverable. HTML is the default only when they have not chosen a format. Planning and audit requests do not require building a deck.

## HTML deck

Use `scripts/render_slideshow_artifact.py --slide-data slide-plan.json --mode html --output deck.html`. It injects structured data into the canonical template at `assets/html-slideshow-starter/paper-presentation.html`, preserving the editor, navigation, notes, and fixed-stage rendering.

Use the bundled renderer for normal deck creation. A request to fix the engine can change the template; verify the affected behavior instead of treating template maintenance as forbidden.

- Keep paper figures in data URIs for a portable file. The renderer preserves supplied image paths and does not automatically bundle them.
- Preserve UTF-8 JSON through the renderer's base64 transport. See [artifact rendering](artifact-rendering.md).
- Open in presentation mode, retaining keyboard controls and editor access.
- Keep the same 1200×675 composition when scaling into fullscreen.
- Return the built HTML; keep the source plan available for revisions.

### Network and offline behavior

One HTML file does not by itself mean zero network dependencies. The bundled template references KaTeX for math and PeerJS/QR resources for phone features. Ordinary local presentation/editing opens without a server, but dependent features need their resources.

For an offline talk, embed figures and math resources and verify the final file without network access. The helper:

```bash
python3 scripts/offline_katex.py deck.html
```

writes `deck_offline.html`. It fetches KaTeX scripts, styles, and fonts during preparation; it does not make phone signaling or every external resource offline. Inspect its download results and the final file before claiming offline readiness. If strict zero-network behavior is requested, remove or disable unused network features and test the result.

Real phone pairing needs a reachable HTTP(S) deck/controller URL plus signaling/STUN connectivity. A `file://` URL, desktop-only `localhost`, or a simulated-fullscreen test does not verify phone access. The bundled controller uses the deck URL with `?token=...`; a custom controller URL is a user delivery choice.

## React component

Use `--mode react --output App.tsx` when integrating into an existing React application. Follow [React implementation rules](react-implementation-rules.md). Confirm the host project's dependencies, styles, and startup command; a TSX file alone is not a browser-openable deck.

## React project

Use `--mode react-project --output deck-project` for a reusable multi-file application. The Vite starter separates slides, components, and configuration and includes presenter tooling.

`--deck-design deck_design.json` embeds coordinated design settings in this mode. HTML and single-file React use their theme/venue settings; do not assume every field of a compiled design is consumed by every renderer.

Read [multi-file React project](multi-file-react-project.md) and [dual-screen speaker view](dual-screen-speaker-view.md) when those features are needed. Install project dependencies before development or export. Static/PDF export scripts have their own browser/runtime requirements.

## Other formats and limited environments

For a requested editable PPTX, PDF, or another format, preserve that request and use available tooling suitable for it. Slider's bundled renderer directly implements HTML/React targets; it does not provide native PPTX export. Do not silently substitute HTML or rename an extension.

If the required runtime or source template is unavailable, supply the supported slide plan or artifact and name the missing build/validation step. Do not hand-encode base64 or claim a mentally checked artifact passed execution.

## Shared evidence requirements

All implemented modes preserve source provenance, readable evidence, and the user's delivery brief. A plan can explicitly carry missing evidence; a finished research deck cannot present placeholders as verified results. Apply [verification](verification-workflow.md) to the actual output.
