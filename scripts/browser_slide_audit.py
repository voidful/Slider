#!/usr/bin/env python3
"""Audit rendered HTML slides in a real headless browser for overflow regressions."""

from __future__ import annotations

import argparse
import html
import json
import re
import shutil
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any

RESULT_NODE_ID = "codex-browser-audit"
DEFAULT_WINDOW_SIZE = (1440, 900)


@dataclass
class BrowserAuditReport:
    ok: bool
    errors: list[str]
    warnings: list[str]
    raw: dict[str, Any] | None = None
    browser: str | None = None


PROBE_SCRIPT = f"""
<script>
(function(){{
  if(window.__codexBrowserAuditInstalled)return;
  window.__codexBrowserAuditInstalled=true;

  const RESULT_ID='{RESULT_NODE_ID}';
  const TOLERANCE=2;
  const MAX_OFFENDERS=4;

  function readBinding(name){{
    try{{return window.eval(name);}}catch(_error){{return undefined;}}
  }}
  function readFunction(name){{
    const value=readBinding(name);
    return typeof value==='function'?value:null;
  }}
  function readSlides(){{
    const value=readBinding('slides');
    return Array.isArray(value)?value:[];
  }}
  function readState(){{
    const value=readBinding('state');
    return value&&typeof value==='object'?value:null;
  }}
  function readRoot(){{return readBinding('root')||document.getElementById('slide-root');}}
  function readDeck(){{return readBinding('deckEl')||document.getElementById('deck');}}
  function readWrapper(){{return readBinding('wrapperEl')||document.getElementById('deck-wrapper');}}
  function round(n){{return Number.isFinite(n)?Math.round(n*100)/100:0;}}
  function sleep(ms){{return new Promise(resolve=>setTimeout(resolve,ms));}}
  function afterPaint(){{return sleep(40);}}
  function selectorFor(el){{
    const tag=(el.tagName||'node').toLowerCase();
    const id=el.id?`#${{el.id}}`:'';
    const classes=Array.from(el.classList||[]).slice(0,3).map(cls=>`.${{cls}}`).join('');
    return `${{tag}}${{id}}${{classes}}`;
  }}
  function ensureResultNode(){{
    let node=document.getElementById(RESULT_ID);
    if(node)return node;
    node=document.createElement('pre');
    node.id=RESULT_ID;
    node.hidden=true;
    document.body.appendChild(node);
    return node;
  }}
  async function waitForImages(scope){{
    const images=Array.from((scope||document).querySelectorAll('img'));
    await Promise.all(images.map(img=>{{
      if(img.complete)return Promise.resolve();
      return new Promise(resolve=>{{
        let done=false;
        const finish=()=>{{if(done)return;done=true;resolve();}};
        img.addEventListener('load',finish,{{once:true}});
        img.addEventListener('error',finish,{{once:true}});
        setTimeout(finish,1500);
      }});
    }}));
  }}
  function detectBrokenImages(scope){{
    const broken=[];
    const images=Array.from((scope||document).querySelectorAll('img'));
    for(const img of images){{
      if(img.complete&&img.naturalWidth===0&&img.src&&img.src!==''){{
        broken.push(img.alt||img.src.slice(0,60));
      }}
    }}
    return broken;
  }}
  async function settle(scope){{
    const scaleDeck=readFunction('scaleDeck');
    const renderMath=readFunction('renderMath');
    if(scaleDeck)scaleDeck();
    if(renderMath&&scope)renderMath(scope);
    await afterPaint();
    await waitForImages(scope);
    await sleep(120);
    await afterPaint();
  }}
  function measureCurrentSlide(modeName){{
    const slide=document.querySelector('#slide-root .slide');
    const slidesData=readSlides();
    const state=readState();
    const slideIndex=state&&typeof state.currentSlide==='number'?state.currentSlide:0;
    const slideMeta=slidesData[slideIndex]||{{}};
    if(!slide){{
      return {{
        mode:modeName,
        slideNumber:slideIndex+1,
        slideId:slideMeta.id??null,
        title:slideMeta.title||'',
        error:'Rendered slide root is missing'
      }};
    }}

    const slideRect=slide.getBoundingClientRect();
    const offenders=[];
    let descendantOverflowX=0;
    let descendantOverflowY=0;

    slide.querySelectorAll('*').forEach(el=>{{
      if(el.closest('.katex-mathml,[aria-hidden="true"],[data-audit-ignore="true"]'))return;
      const style=window.getComputedStyle(el);
      if(style.display==='none'||style.visibility==='hidden')return;
      const rect=el.getBoundingClientRect();
      if(!rect.width&&!rect.height)return;
      const overflowX=Math.max(0,slideRect.left-rect.left,rect.right-slideRect.right);
      const overflowY=Math.max(0,slideRect.top-rect.top,rect.bottom-slideRect.bottom);
      descendantOverflowX=Math.max(descendantOverflowX,overflowX);
      descendantOverflowY=Math.max(descendantOverflowY,overflowY);
      if(overflowX>TOLERANCE||overflowY>TOLERANCE){{
        offenders.push({{
          selector:selectorFor(el),
          overflowX:round(overflowX),
          overflowY:round(overflowY)
        }});
      }}
    }});

    offenders.sort((a,b)=>Math.max(b.overflowX,b.overflowY)-Math.max(a.overflowX,a.overflowY));

    const brokenImgs=detectBrokenImages(slide);
    return {{
      mode:modeName,
      slideNumber:slideIndex+1,
      slideId:slideMeta.id??null,
      title:slideMeta.title||slide.querySelector('.title,.hero-text')?.textContent?.trim()||'',
      scrollOverflowX:round(Math.max(0,slide.scrollWidth-slide.clientWidth)),
      scrollOverflowY:round(Math.max(0,slide.scrollHeight-slide.clientHeight)),
      descendantOverflowX:round(descendantOverflowX),
      descendantOverflowY:round(descendantOverflowY),
      offenders:offenders.slice(0,MAX_OFFENDERS),
      brokenImages:brokenImgs
    }};
  }}
  async function captureSlide(index,modeName){{
    const goTo=readFunction('goTo');
    const render=readFunction('render');
    const state=readState();
    const root=readRoot();
    if(goTo)goTo(index);
    else if(state&&render){{state.currentSlide=index;render();}}
    else throw new Error('Slide navigation hooks are unavailable');
    await settle(root);
    return measureCurrentSlide(modeName);
  }}
  async function captureMode(modeName,setup,teardown){{
    const slidesData=readSlides();
    const root=readRoot();
    const deck=readDeck();
    if(setup)await setup();
    await settle(root);
    const slideReports=[];
    for(let i=0;i<slidesData.length;i++)slideReports.push(await captureSlide(i,modeName));

    if(!deck)throw new Error('Deck element is missing');
    const deckRect=deck.getBoundingClientRect();
    const viewportOverflowX=Math.max(0,-deckRect.left,deckRect.right-window.innerWidth);
    const viewportOverflowY=Math.max(0,-deckRect.top,deckRect.bottom-window.innerHeight);
    const modeReport={{
      mode:modeName,
      viewport:{{width:window.innerWidth,height:window.innerHeight}},
      deck:{{
        width:round(deckRect.width),
        height:round(deckRect.height),
        viewportOverflowX:round(viewportOverflowX),
        viewportOverflowY:round(viewportOverflowY)
      }},
      slides:slideReports
    }};

    if(teardown)await teardown();
    return modeReport;
  }}
  function summarize(report){{
    for(const mode of report.modes){{
      if(mode.deck.viewportOverflowX>TOLERANCE||mode.deck.viewportOverflowY>TOLERANCE){{
        report.failures.push(
          `${{mode.mode}}: scaled deck exceeds the viewport by `
          + `${{mode.deck.viewportOverflowX}}px horizontally and `
          + `${{mode.deck.viewportOverflowY}}px vertically`
        );
      }}
      for(const slide of mode.slides){{
        const label=`slide ${{slide.slideNumber}}${{slide.title?` "${{slide.title}}"`:''}}`;
        if(slide.error){{
          report.failures.push(`${{mode.mode}}: ${{label}} failed to render (${{slide.error}})`);
          continue;
        }}
        if(slide.scrollOverflowX>TOLERANCE||slide.scrollOverflowY>TOLERANCE){{
          report.failures.push(
            `${{mode.mode}}: ${{label}} scrolls inside the fixed stage `
            + `(${{slide.scrollOverflowX}}px x, ${{slide.scrollOverflowY}}px y)`
          );
        }}
        if(slide.descendantOverflowX>TOLERANCE||slide.descendantOverflowY>TOLERANCE){{
          const offenders=slide.offenders.map(item=>item.selector).join(', ');
          report.failures.push(
            `${{mode.mode}}: ${{label}} has content escaping the stage `
            + `(${{slide.descendantOverflowX}}px x, ${{slide.descendantOverflowY}}px y)`
            + `${{offenders?`; offenders: ${{offenders}}`:''}}`
          );
        }}
        if(slide.brokenImages&&slide.brokenImages.length>0){{
          report.failures.push(
            `${{mode.mode}}: ${{label}} has ${{slide.brokenImages.length}} broken image(s): `
            + slide.brokenImages.join(', ')
          );
        }}
      }}
    }}
    report.ok=report.failures.length===0;
  }}
  async function run(){{
    if(window.__codexBrowserAuditRan)return;
    window.__codexBrowserAuditRan=true;
    const resultNode=ensureResultNode();
    const report={{
      version:'1.0',
      ok:false,
      failures:[],
      warnings:[],
      meta:{{slideCount:0,url:location.href}},
      modes:[]
    }};

    try{{
      const slidesData=readSlides();
      const state=readState();
      const root=readRoot();
      const deck=readDeck();
      const wrapper=readWrapper();
      report.meta.slideCount=slidesData.length;

      if(!slidesData.length)throw new Error('Global slides array is unavailable');
      if(!state||typeof state.currentSlide!=='number')throw new Error('Global slide state is unavailable');
      if(!root)throw new Error('Slide root is missing');
      if(!deck||!wrapper)throw new Error('Deck wrapper is missing');

      const originalIndex=state.currentSlide;
      report.modes.push(await captureMode('windowed'));
      report.modes.push(await captureMode(
        'simulated-fullscreen',
        async()=>{{
          wrapper.classList.add('simulated-fs');
          document.body.style.overflow='hidden';
          const syncFSBody=readFunction('syncFSBody');
          if(syncFSBody)syncFSBody();
        }},
        async()=>{{
          wrapper.classList.remove('simulated-fs');
          document.body.style.overflow='';
          const syncFSBody=readFunction('syncFSBody');
          if(syncFSBody)syncFSBody();
        }}
      ));
      const goTo=readFunction('goTo');
      const render=readFunction('render');
      if(goTo)goTo(originalIndex);
      else if(render){{state.currentSlide=originalIndex;render();}}
      await settle(root);
      summarize(report);
    }}catch(error){{
      report.failures.push('Browser audit runtime error: '+(error&&error.message?error.message:String(error)));
      report.ok=false;
    }}

    resultNode.textContent=JSON.stringify(report);
  }}

  if(document.readyState==='complete'){{void run();}}
  else window.addEventListener('load',()=>{{void run();}},{{once:true}});
}})();
</script>
"""


def find_browser_executable() -> str | None:
    candidates = [
        shutil.which("chromium"),
        shutil.which("chromium-browser"),
        shutil.which("google-chrome"),
        shutil.which("google-chrome-stable"),
        "/opt/homebrew/bin/chromium",
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    ]
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return str(candidate)
    return None


def inject_probe(html_text: str) -> str:
    if RESULT_NODE_ID in html_text:
        return html_text
    if "</body>" in html_text:
        return html_text.replace("</body>", PROBE_SCRIPT + "\n</body>", 1)
    return html_text + PROBE_SCRIPT


def extract_report(dumped_dom: str) -> dict[str, Any]:
    match = re.search(
        rf'<pre[^>]*id="{RESULT_NODE_ID}"[^>]*>(.*?)</pre>',
        dumped_dom,
        flags=re.DOTALL,
    )
    if not match:
        raise RuntimeError("Browser audit result node was not found in dumped DOM")
    payload = html.unescape(match.group(1)).strip()
    if not payload:
        raise RuntimeError("Browser audit result node was empty")
    return json.loads(payload)


def run_browser_slide_audit(
    html_path: Path,
    *,
    expected_slide_count: int | None = None,
    window_size: tuple[int, int] = DEFAULT_WINDOW_SIZE,
    virtual_time_budget_ms: int | None = None,
) -> BrowserAuditReport:
    browser = find_browser_executable()
    if browser is None:
        return BrowserAuditReport(
            ok=True,
            errors=[],
            warnings=[
                "[WARN] browser: Chromium not found. Browser audit skipped. "
                "This is acceptable in sandbox environments (ChatGPT, Claude) "
                "but the deck should be audited locally before final delivery."
            ],
            raw=None,
            browser=None,
        )

    html_path = html_path.resolve()
    file_size_mb = html_path.stat().st_size / (1024 * 1024)
    # Scale budget: base per-slide + extra for large base64 image decode
    budget_ms = virtual_time_budget_ms or max(8000, (expected_slide_count or 8) * 900 + int(file_size_mb * 2000))
    timeout_s = max(30, budget_ms // 1000 + 15)
    probe_html = inject_probe(html_path.read_text(encoding="utf-8"))

    with tempfile.NamedTemporaryFile(
        "w",
        suffix=".html",
        prefix=".codex-browser-audit-",
        dir=html_path.parent,
        encoding="utf-8",
        delete=False,
    ) as handle:
        probe_path = Path(handle.name)
        handle.write(probe_html)

    try:
        with tempfile.TemporaryDirectory(
            prefix=".codex-browser-profile-",
            dir=html_path.parent,
        ) as profile_dir:
            chrome_args = [
                browser,
                "--headless",
                "--no-sandbox",
                "--disable-gpu",
                "--disable-dev-shm-usage",
                "--allow-file-access-from-files",
                "--run-all-compositor-stages-before-draw",
                f"--user-data-dir={profile_dir}",
                f"--window-size={window_size[0]},{window_size[1]}",
                f"--virtual-time-budget={budget_ms}",
                "--dump-dom",
                probe_path.as_uri(),
            ]
            proc = subprocess.run(
                chrome_args,
                capture_output=True,
                text=True,
                timeout=timeout_s,
                check=False,
            )
    except subprocess.TimeoutExpired as exc:
        return BrowserAuditReport(
            ok=False,
            errors=[f"[FAIL] browser: Chromium audit timed out after {timeout_s}s for {html_path.name}"],
            warnings=[],
            raw={"exception": str(exc)},
            browser=browser,
        )
    finally:
        probe_path.unlink(missing_ok=True)

    if proc.returncode != 0:
        detail = (proc.stderr or proc.stdout).strip().splitlines()
        excerpt = detail[-1] if detail else f"exit code {proc.returncode}"
        return BrowserAuditReport(
            ok=False,
            errors=[f"[FAIL] browser: Chromium audit command failed for {html_path.name}: {excerpt}"],
            warnings=[],
            raw={"returncode": proc.returncode, "stderr": proc.stderr, "stdout": proc.stdout},
            browser=browser,
        )

    try:
        raw = extract_report(proc.stdout)
    except Exception as exc:  # pragma: no cover - depends on browser output
        return BrowserAuditReport(
            ok=False,
            errors=[f"[FAIL] browser: Could not parse Chromium audit output for {html_path.name}: {exc}"],
            warnings=[],
            raw={"stdout": proc.stdout, "stderr": proc.stderr},
            browser=browser,
        )

    errors = [f"[FAIL] browser: {msg}" for msg in raw.get("failures", [])]
    warnings = [f"[WARN] browser: {msg}" for msg in raw.get("warnings", [])]

    if expected_slide_count is not None:
        actual_slide_count = raw.get("meta", {}).get("slideCount")
        if actual_slide_count != expected_slide_count:
            errors.append(
                "[FAIL] browser: Rendered slide count changed during browser audit "
                f"(expected {expected_slide_count}, got {actual_slide_count})"
            )

    return BrowserAuditReport(
        ok=not errors,
        errors=errors,
        warnings=warnings,
        raw=raw,
        browser=browser,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Audit rendered HTML slides in headless Chromium")
    parser.add_argument("html", type=Path, help="Path to the rendered HTML deck")
    parser.add_argument("--expected-slide-count", type=int, help="Optional expected slide count")
    parser.add_argument("--window-width", type=int, default=DEFAULT_WINDOW_SIZE[0])
    parser.add_argument("--window-height", type=int, default=DEFAULT_WINDOW_SIZE[1])
    parser.add_argument("--virtual-time-budget-ms", type=int)
    args = parser.parse_args()

    report = run_browser_slide_audit(
        args.html,
        expected_slide_count=args.expected_slide_count,
        window_size=(args.window_width, args.window_height),
        virtual_time_budget_ms=args.virtual_time_budget_ms,
    )
    payload = {
        "ok": report.ok,
        "browser": report.browser,
        "errors": report.errors,
        "warnings": report.warnings,
        "raw": report.raw,
    }
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    if report.errors:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
