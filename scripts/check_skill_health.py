#!/usr/bin/env python3
"""Run lightweight health checks for the slider skill."""
from __future__ import annotations
import argparse, base64, json, py_compile, re, shutil, subprocess, sys, tempfile
from pathlib import Path

try:
    import fitz
except ModuleNotFoundError:  # pragma: no cover - environment dependent
    fitz = None

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS_DIR = ROOT / 'scripts'
REQUIRED_RELEASE_DOCS = ['README.md', 'ARCHITECTURE.md', 'TEST_MATRIX.md', 'CHANGELOG.md']
REF_LIMITS = {
    'SKILL.md': 470,
    'assets/react-slideshow-starter/App.tsx': 620,
    'assets/html-slideshow-starter/paper-presentation.html': 860,
    'assets/react-project-starter/src/App.tsx': 260,
    'assets/react-project-starter/src/components/SlideRenderer.tsx': 240,
    'scripts/generate_slide_data.py': 470,
    'scripts/check_skill_health.py': 360,
}
SAMPLE_TEXT = '''Paper Title Goes Here
Alice Example, Bob Example

Abstract
We study a representation learning problem that matters when labels are scarce.
Our method introduces a masked contrastive objective and improves accuracy by 4.2% on Dataset X.

1 Introduction
Existing methods struggle with long-range context and degrade on small data.
This bottleneck matters for real-world deployment.

3 Method
Our key idea is to enforce contextual reasoning with a masked prediction module.
The method has an encoder, a context mixer, and a lightweight prediction head.

4 Experiments
We evaluate on Dataset X and Dataset Y using accuracy and F1.
We compare against StrongBaseline and PriorSOTA.
Our method achieves 85.5 accuracy versus 81.3 for the strongest baseline.
Ablation shows removing the masked module drops performance by 2.1 points.

5 Limitations
We only test on classification tasks and do not study scaling behavior fully.

Figure 1. Overview of the proposed method with (a) encoder and (b) decoder panels.
Figure 2. Qualitative examples and failure cases on Dataset Y.
Table 1. Main quantitative results on Dataset X.
Table 2. Additional implementation details and sensitivity analysis.
Table 3. Ablation study of the masked module on Dataset X.
'''
ONE_PIXEL_PNG = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn6mL8AAAAASUVORK5CYII=')

def assert_python_syntax() -> list[str]:
    failures = []
    for path in sorted(SCRIPTS_DIR.glob('*.py')):
        try:
            py_compile.compile(str(path), doraise=True)
        except Exception as exc:
            failures.append(f'Python syntax failed: {path.name}: {exc}')
    return failures

def assert_skill_references() -> list[str]:
    refs = re.findall(r'\]\(([^)]+)\)', (ROOT / 'SKILL.md').read_text(encoding='utf-8'))
    return [f'Broken SKILL.md reference: {ref}' for ref in refs if not ref.startswith('http') and not (ROOT / ref).exists()]

def assert_release_docs() -> list[str]:
    return [f'Missing release document: {name}' for name in REQUIRED_RELEASE_DOCS if not (ROOT / name).exists()]

def validate_typescript_files(paths: list[Path]) -> tuple[list[str], list[str]]:
    node = shutil.which('node')
    if node is None:
        return [], ['Node is not available for TypeScript validation']
    code = r'''
const fs = require("fs"); const ts = require("typescript");
for (const path of JSON.parse(process.argv[1])) {
  const res = ts.transpileModule(fs.readFileSync(path, "utf8"), {compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}, fileName:path, reportDiagnostics:true});
  if (res.diagnostics && res.diagnostics.length) {
    for (const d of res.diagnostics) console.error(path + ": " + ts.flattenDiagnosticMessageText(d.messageText, "\\n"));
    process.exit(1);
  }
}
'''
    proc = subprocess.run([node, '-e', code, json.dumps([str(p) for p in paths])], capture_output=True, text=True)
    if proc.returncode == 0:
        return [], []
    stderr = proc.stderr.strip()
    if "Cannot find module 'typescript'" in stderr:
        return [], ['TypeScript module is unavailable; skipped TypeScript validation']
    return [f'TypeScript validation failed: {stderr}'], []

def line_count_warnings() -> list[str]:
    warnings = []
    for rel, limit in REF_LIMITS.items():
        path = ROOT / rel
        if not path.exists():
            warnings.append(f'Concision warning: {rel} is missing; skipped line-count check')
            continue
        lines = sum(1 for _ in path.open(encoding='utf-8'))
        if lines > limit:
            warnings.append(f'Concision warning: {rel} has {lines} lines, above target {limit}')
    return warnings

def build_fake_exports(scored_visuals: dict[str, object], exports_path: Path, assets_dir: Path) -> None:
    assets_dir.mkdir(parents=True, exist_ok=True)
    exports = []
    for idx, candidate in enumerate(scored_visuals.get('scored_candidates', [])[:4]):
        image_path = assets_dir / f'visual-{idx+1}.png'
        image_path.write_bytes(ONE_PIXEL_PNG)
        exports.append({'label': candidate.get('label', candidate.get('type', 'visual')), 'type': candidate.get('type', 'figure'), 'page_number': candidate.get('page_number', 1), 'caption_excerpt': candidate.get('caption_excerpt', ''), 'output_path': str(image_path), 'crop_mode': 'healthcheck-synthetic', 'clip': [0,0,1,1], 'caption_found': True, 'detection_confidence': 'high', 'anchor_found': True, 'anchor_strength': 0.9, 'detector': 'healthcheck', 'venue_policy': {'venue': 'cvpr', 'main_threshold': 0.62, 'appendix_threshold': 0.4, 'insertion_thresholds': {'qualitative': 0.68, 'ablation': 0.8, 'results': 0.72}, 'appendix_policy': {'max_visual_slides': 3, 'role_order': ['qualitative', 'results', 'ablation', 'method'], 'role_thresholds': {'qualitative': 0.44, 'results': 0.46, 'ablation': 0.44, 'method': 0.42}}}, 'panel_geometry': candidate.get('panel_geometry', {}), 'panel_boundaries': candidate.get('panel_boundaries', []), 'panel_separators': candidate.get('panel_separators', []), 'separator_geometry': candidate.get('separator_geometry', {'strength': 0.66}), 'table_structure': {}, 'semantic_table': {'role_labels': {'strength': 0.72, 'calibrated_strength': 0.78, 'column_roles': ['stub','metric','metric'], 'column_confidences': [0.85, 0.82, 0.8]}, 'strength': 0.72}})
    exports_path.write_text(json.dumps({'exports': exports}, indent=2, ensure_ascii=False), encoding='utf-8')

def build_sample_pdf(path: Path) -> None:
    if fitz is None:
        raise RuntimeError("PyMuPDF is unavailable")
    doc = fitz.open(); page = doc.new_page(width=595, height=842)
    page.insert_text((60,80), 'Intro paragraph above the figure.', fontsize=12)
    page.draw_rect(fitz.Rect(90,150,500,360), color=(0,0,0), fill=(0.9,0.9,0.9))
    page.insert_text((95,375), 'Figure 1. Overview of the proposed method with (a) encoder and (b) decoder panels.', fontsize=11)
    page2 = doc.new_page(width=595, height=842)
    page2.insert_text((70,120), 'Table 1. Main quantitative results on Dataset X.', fontsize=11)
    for i, row in enumerate(['Model Acc F1', 'Baseline 87.1 84.0', 'Ours 89.2 86.1', 'Delta +2.1 +2.1']):
        page2.insert_text((90, 170 + i * 26), row, fontsize=12)
    doc.save(path); doc.close()

def run_roundtrip() -> tuple[list[str], list[str]]:
    failures, warnings = [], []
    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        paper_txt = tmp / 'sample.txt'; paper_txt.write_text(SAMPLE_TEXT, encoding='utf-8')
        evidence_json, visuals_json, scored_json = tmp/'evidence.json', tmp/'visuals.json', tmp/'scored.json'
        exports_json, plan_json, bound_json = tmp/'exports.json', tmp/'plan.json', tmp/'bound.json'
        react_out, html_out, project_dir = tmp/'App.tsx', tmp/'paper-presentation.html', tmp/'deck-project'
        subprocess.run([sys.executable, str(SCRIPTS_DIR/'extract_paper_evidence.py'), str(paper_txt), '--output', str(evidence_json)], check=True, capture_output=True, text=True)
        subprocess.run([sys.executable, str(SCRIPTS_DIR/'find_visual_evidence.py'), str(paper_txt), '--output', str(visuals_json)], check=True, capture_output=True, text=True)
        subprocess.run([sys.executable, str(SCRIPTS_DIR/'score_visual_candidates.py'), '--visuals', str(visuals_json), '--evidence', str(evidence_json), '--venue', 'cvpr', '--output', str(scored_json)], check=True, capture_output=True, text=True)
        scored = json.loads(scored_json.read_text(encoding='utf-8'))
        build_fake_exports(scored, exports_json, tmp/'assets')
        subprocess.run([sys.executable, str(SCRIPTS_DIR/'generate_slide_data.py'), '--evidence', str(evidence_json), '--visuals', str(scored_json), '--mode', 'json', '--output', str(plan_json)], check=True, capture_output=True, text=True)
        subprocess.run([sys.executable, str(SCRIPTS_DIR/'bind_visual_assets.py'), '--slide-data', str(plan_json), '--visuals', str(scored_json), '--exports', str(exports_json), '--output', str(bound_json)], check=True, capture_output=True, text=True)
        subprocess.run([sys.executable, str(SCRIPTS_DIR/'render_slideshow_artifact.py'), '--slide-data', str(bound_json), '--mode', 'react', '--output', str(react_out)], check=True, capture_output=True, text=True)
        subprocess.run([sys.executable, str(SCRIPTS_DIR/'render_slideshow_artifact.py'), '--slide-data', str(bound_json), '--mode', 'html', '--output', str(html_out)], check=True, capture_output=True, text=True)
        subprocess.run([sys.executable, str(SCRIPTS_DIR/'render_slideshow_artifact.py'), '--slide-data', str(bound_json), '--mode', 'react-project', '--output', str(project_dir)], check=True, capture_output=True, text=True)
        ts_files = [react_out, project_dir/'src/App.tsx', project_dir/'src/components/SlideRenderer.tsx', project_dir/'src/components/PresenterPanel.tsx', project_dir/'src/data/slideData.ts', project_dir/'src/lib/presentationConfig.ts', project_dir/'src/lib/presenterWindow.ts']
        ts_files = [path for path in ts_files if path.exists()]
        ts_failures, ts_warnings = validate_typescript_files(ts_files)
        failures.extend(ts_failures)
        warnings.extend(ts_warnings)
        bound_plan = bound_json.read_text(encoding='utf-8'); html_text = html_out.read_text(encoding='utf-8'); react_text = react_out.read_text(encoding='utf-8')
        project_app = (project_dir/'src/App.tsx').read_text(encoding='utf-8'); project_slide_data = (project_dir/'src/data/slideData.ts').read_text(encoding='utf-8')
        if '@render-' in html_text or '@render-' in react_text or '@render-' in project_slide_data:
            warnings.append('Template markers remain in rendered artifacts')
        if '"bindingScore"' not in bound_plan or '"fallbackStrategy"' not in bound_plan:
            failures.append('Visual binding output is missing calibrated confidence metadata')
        if 'visual-1.png' not in html_text or 'visual-1.png' not in project_slide_data:
            failures.append('Rendered artifacts do not appear to carry bound visual asset paths')
        if '<img src=' not in html_text:
            failures.append('Rendered HTML artifact is not using bound visuals in image tags')
        if (
            not any(token in react_text for token in ('metric-grid', 'gridTemplateColumns', 'result-metrics-row'))
            or not any(token in html_text for token in ('metrics-with-visual', 'result-metrics-row', 'result-visual-fill'))
        ):
            failures.append('Metrics layout does not appear to support bound visuals')
        if (
            'Fullscreen' not in html_text
            or 'onFullscreen' not in project_app
            or 'aria-label="Fullscreen"' not in (ROOT / 'assets/react-project-starter/src/components/ControlDock.tsx').read_text(encoding='utf-8')
        ):
            failures.append('Fullscreen controls were not found in one or more rendered artifacts')
        if fitz is None:
            warnings.append('PyMuPDF (fitz) is unavailable; skipped PDF export roundtrip checks')
        else:
            sample_pdf, sample_visuals, sample_exports, sample_manifest = tmp/'sample.pdf', tmp/'sample-visuals.json', tmp/'sample-exports', tmp/'sample-manifest.json'
            build_sample_pdf(sample_pdf)
            subprocess.run([sys.executable, str(SCRIPTS_DIR/'find_visual_evidence.py'), str(sample_pdf), '--output', str(sample_visuals)], check=True, capture_output=True, text=True)
            subprocess.run([sys.executable, str(SCRIPTS_DIR/'export_pdf_visuals.py'), str(sample_pdf), '--candidates', str(sample_visuals), '--output-dir', str(sample_exports), '--manifest', str(sample_manifest)], check=True, capture_output=True, text=True)
            manifest = json.loads(sample_manifest.read_text(encoding='utf-8'))
            if not manifest.get('exports') or 'detection_confidence' not in manifest['exports'][0] or 'detector' not in manifest['exports'][0]:
                failures.append('PDF export manifest is missing auto-detection metadata')
            if manifest.get('exports') and 'anchor_strength' not in manifest['exports'][0]:
                failures.append('PDF export manifest is missing anchor strength metadata')
            if 'panel_count' not in sample_visuals.read_text(encoding='utf-8'):
                failures.append('Visual detection output is missing multi-panel metadata')
            if not any(x.get('panel_exports') for x in manifest.get('exports', [])):
                failures.append('PDF export manifest is missing multi-panel panel exports')
            if not any((x.get('panel_geometry') or {}).get('layout') for x in manifest.get('exports', [])):
                failures.append('PDF export manifest is missing panel geometry metadata')
            if not any(x.get('panel_boundaries') for x in manifest.get('exports', [])):
                failures.append('PDF export manifest is missing panel boundary metadata')
            if not any(x.get('panel_separators') for x in manifest.get('exports', [])):
                failures.append('PDF export manifest is missing panel separator metadata')
            if not any((x.get('separator_geometry') or {}).get('strength', 0) > 0 for x in manifest.get('exports', [])):
                failures.append('PDF export manifest is missing separator geometry metadata')
            if not any('auto-table-structure-aware' == x.get('crop_mode') for x in manifest.get('exports', [])):
                failures.append('PDF export manifest is missing structure-aware table crop metadata')
            if not any((x.get('table_structure') or {}).get('row_count', 0) >= 2 and (x.get('table_structure') or {}).get('column_count', 0) >= 2 for x in manifest.get('exports', [])):
                failures.append('PDF export manifest is missing inferred table row or column counts')
            if not any((x.get('semantic_table') or {}).get('strength', 0) > 0 for x in manifest.get('exports', [])):
                failures.append('PDF export manifest is missing semantic table parsing metadata')
            if not any(((x.get('semantic_table') or {}).get('role_labels') or {}).get('strength', 0) > 0 for x in manifest.get('exports', [])):
                failures.append('PDF export manifest is missing semantic table role labeling metadata')
            if 'panel_geometry' not in sample_visuals.read_text(encoding='utf-8'):
                failures.append('Visual detection output is missing panel geometry metadata')
            if 'panel_boundaries' not in sample_visuals.read_text(encoding='utf-8'):
                failures.append('Visual detection output is missing panel boundary metadata')
            if 'panel_separators' not in sample_visuals.read_text(encoding='utf-8'):
                failures.append('Visual detection output is missing panel separator metadata')
            if 'separator_geometry' not in sample_visuals.read_text(encoding='utf-8'):
                failures.append('Visual detection output is missing separator geometry metadata')
            if 'pdf-layout-anchor' not in sample_visuals.read_text(encoding='utf-8') and 'region_hint' not in sample_visuals.read_text(encoding='utf-8'):
                failures.append('Visual detection output is missing stronger auto-detection metadata')
        if 'confidenceBreakdown' not in bound_plan or 'regionHint' not in bound_plan:
            failures.append('Bound slide data is missing calibrated confidence breakdown metadata')
        if 'panelHint' not in bound_plan or 'panelGeometry' not in bound_plan or 'tableStructure' not in bound_plan:
            failures.append('Bound slide data is missing geometry-aware confidence metadata')
        if 'panelBoundary' not in bound_plan or 'semanticTable' not in bound_plan:
            failures.append('Bound slide data is missing panel-boundary or semantic-table confidence metadata')
        if 'panelSeparator' not in bound_plan or 'semanticRoleLabeling' not in bound_plan:
            failures.append('Bound slide data is missing panel-separator or semantic-role-labeling confidence metadata')
        if 'separatorGeometry' not in bound_plan or 'semanticRoleCalibration' not in bound_plan:
            failures.append('Bound slide data is missing separator-geometry or semantic-role-calibration confidence metadata')
        if 'venue_policy' not in scored_json.read_text(encoding='utf-8'):
            failures.append('Scored visuals are missing venue-specific threshold metadata')
        if 'appendix_policy' not in scored_json.read_text(encoding='utf-8'):
            failures.append('Scored visuals are missing venue-specific appendix policy metadata')
        if 'A cleaner benchmark comparison' not in plan_json.read_text(encoding='utf-8') and 'Qualitative evidence of the gain' not in plan_json.read_text(encoding='utf-8') and 'One ablation that explains the mechanism' not in plan_json.read_text(encoding='utf-8'):
            failures.append('Score-aware slide insertion did not add any venue-aware evidence slide')
        plan = json.loads(plan_json.read_text(encoding='utf-8'))
        main_slides = [slide for slide in plan.get('slideData', []) if not slide.get('appendix')]
        if len(main_slides) < 15:
            failures.append(f'Generated main deck has only {len(main_slides)} slides; expected at least 15 for a full talk')
        if any(not slide.get('pageRole') for slide in main_slides):
            failures.append('Generated main deck is missing pageRole metadata on one or more slides')
        appendix_labels = [((slide.get('visualBinding') or {}).get('label')) for slide in plan.get('slideData', []) if slide.get('appendix') and slide.get('visualBinding')]
        if len([x for x in appendix_labels if x]) > 3:
            failures.append('Venue-specific appendix policy inserted too many appendix visuals')
        if len({x for x in appendix_labels if x}) != len([x for x in appendix_labels if x]):
            failures.append('Appendix visual insertion did not suppress redundant appendix evidence')
    return failures, warnings

def main() -> None:
    parser = argparse.ArgumentParser(description='Run health checks for the slider skill')
    parser.add_argument('--strict', action='store_true')
    args = parser.parse_args()
    failures = assert_python_syntax() + assert_skill_references() + assert_release_docs()
    try:
        roundtrip_failures, roundtrip_warnings = run_roundtrip()
    except subprocess.CalledProcessError as exc:
        detail = (exc.stderr or exc.stdout or str(exc)).strip()
        roundtrip_failures, roundtrip_warnings = [f'Roundtrip command failed: {detail}'], []
    failures.extend(roundtrip_failures)
    warnings = roundtrip_warnings + line_count_warnings()
    report = {'failures': failures, 'warnings': warnings, 'ok': not failures and (not warnings or not args.strict)}
    print(json.dumps(report, indent=2, ensure_ascii=False))
    if failures or (args.strict and warnings):
        raise SystemExit(1)
if __name__ == '__main__':
    main()
