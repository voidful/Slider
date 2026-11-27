#!/usr/bin/env python3
"""Audit rendered HTML slides in a real headless browser for overflow regressions."""

from __future__ import annotations

import argparse
import base64
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
# A small laptop or projector window; slide layout must match the default size exactly.
COMPARE_WINDOW_SIZE = (1024, 640)


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
  function finishMotion(){{
    const finish=readFunction('finishMotion');
    if(finish)finish();
  }}
  async function settle(scope){{
    const scaleDeck=readFunction('scaleDeck');
    const renderMath=readFunction('renderMath');
    // Motion graphics end on the static layout; measure that final frame.
    finishMotion();
    if(scaleDeck)scaleDeck();
    if(renderMath&&scope)renderMath(scope);
    await afterPaint();
    await waitForImages(scope);
    await sleep(120);
    await afterPaint();
  }}
  // Checks inside the stage: every box must hold its content, text must not be cut off or overlap, and the
  // fitter must not have given up. Rects are scaled CSS pixels; scroll sizes are unscaled stage pixels.
  const MIN_TEXT_PX=14;
  const BACKSLASH=String.fromCharCode(92);
  function rawMath(text){{
    if(text.includes('$$')||text.includes(BACKSLASH+'(')||text.includes(BACKSLASH+'['))return true;
    return text.includes(BACKSLASH)&&/[$][^$]+[$]/.test(text);
  }}
  function skipped(el){{
    if(el.closest('.katex'))return true;// KaTeX clips its own drawings (e.g. the \\sqrt SVG) by design
    return Boolean(el.closest('svg,[aria-hidden="true"],[data-audit-ignore="true"]'))&&!el.matches('svg');
  }}
  function visibleStyle(el){{
    const style=window.getComputedStyle(el);
    if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0)return null;
    return style;
  }}
  function textRuns(slide,scale){{
    const runs=[];
    const walker=document.createTreeWalker(slide,NodeFilter.SHOW_TEXT);
    for(let node=walker.nextNode();node;node=walker.nextNode()){{
      const owner=node.parentElement;
      if(!owner||!node.nodeValue.trim())continue;
      if(owner.closest('.katex-mathml,[aria-hidden="true"],[data-audit-ignore="true"]'))continue;
      let hidden=false;
      for(let el=owner;el&&el!==slide.parentElement;el=el.parentElement){{if(!visibleStyle(el)){{hidden=true;break;}}}}
      if(hidden)continue;
      const rects=lineRects(node,lineHeightPx(owner),scale).filter(r=>r.right-r.left>0.5&&r.bottom-r.top>0.5);
      if(rects.length)runs.push({{node,owner,rects}});
    }}
    return runs;
  }}
  function intersects(a,b,minW,minH){{
    const w=Math.min(a.right,b.right)-Math.max(a.left,b.left);
    const h=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
    return w>minW&&h>minH?{{w,h}}:null;
  }}
  function lineHeightPx(el){{
    const value=window.getComputedStyle(el).lineHeight;
    return value==='normal'?0:parseFloat(value);
  }}
  // Line boxes, not glyph boxes: ascenders and descenders past a tight line-height are not overflow.
  function lineRects(node,lineHeight,scale){{
    let rects;
    if(node.nodeType===3){{const range=document.createRange();range.selectNodeContents(node);rects=range.getClientRects();}}
    else rects=node.getClientRects();
    return Array.from(rects).map(r=>{{
      const trim=lineHeight?Math.max(0,(r.height-lineHeight*scale)/2):0;
      return {{left:r.left,right:r.right,top:r.top+trim,bottom:r.bottom-trim}};
    }});
  }}
  function contentRects(el,scale,out){{
    for(const node of el.childNodes){{
      if(node.nodeType===3){{if(node.nodeValue.trim())out.push(...lineRects(node,lineHeightPx(el),scale));continue;}}
      if(node.nodeType!==1||node.matches('[data-audit-ignore="true"]'))continue;
      const style=window.getComputedStyle(node);
      if(style.display==='none'||style.position==='absolute'||style.position==='fixed')continue;
      if(style.display==='contents')contentRects(node,scale,out);
      else if(style.display==='inline')out.push(...lineRects(node,lineHeightPx(node),scale));
      else out.push(node.getBoundingClientRect());
    }}
    return out;
  }}
  // Largest distance (stage px) by which the content of el leaves its padding box.
  function boxOverflow(el,scale){{
    const box=el.getBoundingClientRect();
    const left=box.left+el.clientLeft*scale,top=box.top+el.clientTop*scale;
    const right=left+el.clientWidth*scale,bottom=top+el.clientHeight*scale;
    let worst=0;
    for(const r of contentRects(el,scale,[]))worst=Math.max(worst,(left-r.left)/scale,(top-r.top)/scale,(r.right-right)/scale,(r.bottom-bottom)/scale);
    return worst;
  }}
  function inspectLayout(slide,slideRect){{
    const scale=slide.offsetWidth?slideRect.width/slide.offsetWidth:1;
    const boxes=[];
    if(slide.hasAttribute('data-overflow-fail'))boxes.push({{kind:'fit-failed',selector:selectorFor(slide),amount:0}});
    [slide,...slide.querySelectorAll('*')].forEach(el=>{{
      if(skipped(el)||el.matches('.katex'))return;
      const style=visibleStyle(el);
      if(!style||style.display==='inline'||style.display==='contents')return;
      if(!el.clientWidth&&!el.clientHeight)return;
      const clips=style.overflowX!=='visible'||style.overflowY!=='visible';
      const ox=el.scrollWidth-el.clientWidth,oy=el.scrollHeight-el.clientHeight;
      if((style.webkitLineClamp&&style.webkitLineClamp!=='none'&&oy>TOLERANCE)||(style.textOverflow==='ellipsis'&&ox>TOLERANCE)){{
        boxes.push({{el,kind:'truncated',selector:selectorFor(el),amount:round(Math.max(ox,oy))}});
        return;
      }}
      if(el===slide)return;// the stage itself is covered by the scroll and escape checks
      const amount=Math.max(ox,boxOverflow(el,scale));
      if(amount>TOLERANCE)boxes.push({{el,kind:clips?'clipped':'spill',selector:selectorFor(el),amount:round(amount)}});
    }});
    // Report the innermost box: an overflowing child also inflates every visible-overflow ancestor.
    const inner=boxes.filter(item=>!item.el||!boxes.some(other=>other!==item&&other.el&&item.el.contains(other.el)&&other.kind!=='fit-failed'));
    const runs=textRuns(slide,scale);
    const overlaps=[];
    const media=Array.from(slide.querySelectorAll('img,canvas,video,svg:not(.katex svg)')).filter(el=>!skipped(el)&&visibleStyle(el)).map(el=>{{
      const r=el.getBoundingClientRect();
      return {{el,rect:r}};
    }}).filter(item=>item.rect.width>2&&item.rect.height>2);
    for(let i=0;i<runs.length&&overlaps.length<MAX_OFFENDERS;i++){{
      for(let j=i+1;j<runs.length&&overlaps.length<MAX_OFFENDERS;j++){{
        const a=runs[i],b=runs[j];
        if(a.owner===b.owner||a.owner.contains(b.owner)||b.owner.contains(a.owner))continue;
        let hit=null;
        for(const ra of a.rects){{for(const rb of b.rects){{
          hit=intersects(ra,rb,4*scale,Math.min(ra.bottom-ra.top,rb.bottom-rb.top)*0.3);
          if(hit)break;
        }}if(hit)break;}}
        if(hit)overlaps.push({{kind:'overlap',selector:`${{selectorFor(a.owner)}} × ${{selectorFor(b.owner)}}`,amount:round(hit.h/scale),text:`"${{a.node.nodeValue.trim().slice(0,32)}}" / "${{b.node.nodeValue.trim().slice(0,32)}}"`}});
      }}
      for(const m of media){{
        if(m.el.contains(runs[i].owner)||runs[i].owner.contains(m.el))continue;
        const hit=runs[i].rects.map(r=>intersects(r,m.rect,8*scale,(r.bottom-r.top)*0.3)).find(Boolean);
        if(hit&&overlaps.length<MAX_OFFENDERS)overlaps.push({{kind:'overlap',selector:`${{selectorFor(runs[i].owner)}} × ${{selectorFor(m.el)}}`,amount:round(hit.h/scale),text:`"${{runs[i].node.nodeValue.trim().slice(0,32)}}" over an image`}});
      }}
    }}
    const notes=[];
    const small=new Map(),rawRuns=[];
    for(const run of runs){{
      if(run.owner.closest('.katex'))continue;
      const size=parseFloat(window.getComputedStyle(run.owner).fontSize);
      if(size<MIN_TEXT_PX-0.05&&!small.has(run.owner))small.set(run.owner,size);
      if(rawMath(run.node.nodeValue))rawRuns.push(run.node.nodeValue.trim().slice(0,40));
    }}
    for(const [owner,size] of small)notes.push({{kind:'small-text',selector:selectorFor(owner),amount:round(size)}});
    if(rawRuns.length)notes.push({{kind:'raw-math',selector:'',amount:rawRuns.length,text:rawRuns[0]}});
    // Stage-pixel geometry of every text owner and image, used to compare layouts across window sizes.
    const owners=[];
    for(const run of runs)if(!owners.includes(run.owner)&&!run.owner.closest('.katex'))owners.push(run.owner);
    const geometry=owners.concat(media.map(m=>m.el)).map(el=>{{
      const r=el.getBoundingClientRect();
      return [selectorFor(el),...[r.left-slideRect.left,r.top-slideRect.top,r.width,r.height].map(v=>Math.round(v/scale))];
    }});
    const fitClasses=Array.from(slide.classList).filter(cls=>/^density-|^fit-/.test(cls)).join(' ');
    return {{
      issues:inner.map(({{el,...rest}})=>rest).concat(overlaps).slice(0,MAX_OFFENDERS*2),
      notes:notes.slice(0,MAX_OFFENDERS),
      geometry,
      fitClasses
    }};
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
    const layout=inspectLayout(slide,slideRect);
    return {{
      layoutIssues:layout.issues,
      layoutNotes:layout.notes,
      geometry:layout.geometry,
      fitClasses:layout.fitClasses,
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
  async function auditProgressiveBuilds(report){{
    const slidesData=readSlides();
    const getRevealOrder=readFunction('getRevealOrder');
    const goTo=readFunction('goTo');
    const advance=readFunction('advance');
    const retreat=readFunction('retreat');
    const root=readRoot();
    if(!getRevealOrder||!goTo||!advance||!retreat){{
      report.failures.push('Progressive-build navigation hooks are unavailable');
      return;
    }}
    const index=slidesData.findIndex(slide=>getRevealOrder(slide).length>0);
    if(index<0){{
      report.warnings.push('No progressive-build slide was available for browser validation');
      return;
    }}
    const order=getRevealOrder(slidesData[index]),count=order.length;
    goTo(index,'forward');await settle(root);
    // Steps may reveal an element or only move the focus, so expect the pending elements each step leaves.
    const pendingFrom=k=>order.slice(k).reduce((sum,key)=>sum+root.querySelectorAll(`[data-build-target="${{CSS.escape(key)}}"]`).length,0);
    const expectedAtEntry=pendingFrom(0),expectedAfterOne=pendingFrom(1);
    const pendingAtEntry=root.querySelectorAll('[data-build-state="pending"]').length;
    if(pendingAtEntry!==expectedAtEntry)report.failures.push(`Progressive build starts with ${{pendingAtEntry}} pending target(s), expected ${{expectedAtEntry}}`);
    advance();await settle(root);
    const pendingAfterAdvance=root.querySelectorAll('[data-build-state="pending"]').length;
    if(pendingAfterAdvance!==expectedAfterOne)report.failures.push(`Progressive build did not consume exactly one step on advance`);
    retreat();await settle(root);
    const pendingAfterRetreat=root.querySelectorAll('[data-build-state="pending"]').length;
    if(pendingAfterRetreat!==expectedAtEntry)report.failures.push(`Progressive build did not restore one step on retreat`);
    goTo(index);await settle(root);
    const pendingAfterJump=root.querySelectorAll('[data-build-state="pending"]').length;
    if(pendingAfterJump!==0)report.failures.push(`Direct jump did not show the final progressive-build state`);
    report.meta.buildAudit={{slideNumber:index+1,count,pendingAtEntry,pendingAfterAdvance,pendingAfterRetreat,pendingAfterJump}};
  }}
  const ISSUE_TEXT={{
    'fit-failed':'does not fit even at the tightest density',
    clipped:'has content clipped inside',
    spill:'has content spilling out of',
    truncated:'has text cut off with an ellipsis or line clamp in',
    overlap:'has overlapping text:'
  }};
  const NOTE_TEXT={{'small-text':'has text below 14px in','raw-math':'shows unrendered LaTeX'}};
  function summarize(report){{
    const seen=new Set();
    for(const mode of report.modes){{
      for(const slide of mode.slides){{
        const label=`slide ${{slide.slideNumber}}${{slide.title?` "${{slide.title}}"`:''}}`;
        for(const item of slide.layoutIssues||[]){{
          const key=`F|${{slide.slideNumber}}|${{item.kind}}|${{item.selector}}`;
          if(seen.has(key))continue;
          seen.add(key);
          const detail=item.kind==='overlap'?` ${{item.selector}} ${{item.text||''}}`:item.kind==='fit-failed'?'':` ${{item.selector}} (${{item.amount}}px)`;
          report.failures.push(`${{label}} ${{ISSUE_TEXT[item.kind]||item.kind}}${{detail}}`);
        }}
        for(const item of slide.layoutNotes||[]){{
          const key=`W|${{slide.slideNumber}}|${{item.kind}}|${{item.selector}}`;
          if(seen.has(key))continue;
          seen.add(key);
          const detail=item.kind==='raw-math'?` (${{item.amount}} run(s), e.g. "${{item.text}}")`:` ${{item.selector}} (${{item.amount}}px)`;
          report.warnings.push(`${{label}} ${{NOTE_TEXT[item.kind]||item.kind}}${{detail}}`);
        }}
      }}
    }}
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
      await auditProgressiveBuilds(report);
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


def count_embedded_slides(html_text: str) -> int | None:
    """Slide count from the renderer's base64 payload, so the time budget fits decks audited from the CLI."""
    match = re.search(r'const SLIDE_DATA_B64\s*=\s*"([^"]+)"', html_text)
    if not match:
        return None
    try:
        slides = json.loads(base64.b64decode(match.group(1)).decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        return None
    return len(slides) if isinstance(slides, list) else None


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


def _run_chrome(
    browser: str,
    probe_path: Path,
    window_size: tuple[int, int],
    budget_ms: int,
    timeout_s: int,
) -> tuple[dict[str, Any] | None, str | None, dict[str, Any] | None]:
    """Run the injected probe once; returns (report, error message, raw failure detail)."""
    with tempfile.TemporaryDirectory(
        prefix=".codex-browser-profile-",
        dir=probe_path.parent,
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
        try:
            proc = subprocess.run(
                chrome_args,
                capture_output=True,
                text=True,
                timeout=timeout_s,
                check=False,
            )
        except subprocess.TimeoutExpired as exc:
            return None, f"Chromium audit timed out after {timeout_s}s", {"exception": str(exc)}
    if proc.returncode != 0:
        detail = (proc.stderr or proc.stdout).strip().splitlines()
        excerpt = detail[-1] if detail else f"exit code {proc.returncode}"
        return None, f"Chromium audit command failed: {excerpt}", {
            "returncode": proc.returncode, "stderr": proc.stderr, "stdout": proc.stdout}
    try:
        return extract_report(proc.stdout), None, None
    except Exception as exc:  # pragma: no cover - depends on browser output
        return None, f"Could not parse Chromium audit output: {exc}", {"stdout": proc.stdout, "stderr": proc.stderr}


def compare_window_layouts(
    base: dict[str, Any],
    other: dict[str, Any],
    base_size: tuple[int, int],
    other_size: tuple[int, int],
    tolerance: int = 2,
) -> list[str]:
    """The stage is fixed at 1200x675, so every slide must lay out identically at any window size."""
    def windowed(report: dict[str, Any]) -> list[dict[str, Any]]:
        modes = [mode for mode in report.get("modes", []) if mode.get("mode") == "windowed"]
        return modes[0].get("slides", []) if modes else []

    failures = []
    label = f"{other_size[0]}x{other_size[1]} than at {base_size[0]}x{base_size[1]}"
    for a, b in zip(windowed(base), windowed(other)):
        name = f'slide {a.get("slideNumber")}' + (f' "{a.get("title")}"' if a.get("title") else "")
        if a.get("fitClasses", "") != b.get("fitClasses", ""):
            failures.append(
                f"{name} fits differently at {label} "
                f'("{b.get("fitClasses") or "normal"}" vs "{a.get("fitClasses") or "normal"}"); '
                "slide typography must not depend on the browser window")
            continue
        geo_a, geo_b = a.get("geometry") or [], b.get("geometry") or []
        if len(geo_a) != len(geo_b):
            failures.append(f"{name} renders {len(geo_b)} measured elements at {label} ({len(geo_a)})")
            continue
        for item_a, item_b in zip(geo_a, geo_b):
            delta = max(abs(x - y) for x, y in zip(item_a[1:], item_b[1:]))
            if delta > tolerance:
                failures.append(
                    f"{name} lays out differently at {label}: {item_a[0]} moves or resizes by {delta}px "
                    "on the 1200x675 stage; slide typography must not depend on the browser window")
                break
    return failures


def run_browser_slide_audit(
    html_path: Path,
    *,
    expected_slide_count: int | None = None,
    window_size: tuple[int, int] = DEFAULT_WINDOW_SIZE,
    virtual_time_budget_ms: int | None = None,
    compare_window_size: tuple[int, int] | None = COMPARE_WINDOW_SIZE,
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
    html_text = html_path.read_text(encoding="utf-8")
    slide_count = expected_slide_count or count_embedded_slides(html_text) or 8
    # Scale budget: base per-slide + extra for large base64 image decode
    budget_ms = virtual_time_budget_ms or max(8000, slide_count * 900 + int(file_size_mb * 2000))
    timeout_s = max(30, budget_ms // 1000 + 15)
    probe_html = inject_probe(html_text)

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
        raw, error, detail = _run_chrome(browser, probe_path, window_size, budget_ms, timeout_s)
        other = None
        if raw is not None and compare_window_size and tuple(compare_window_size) != tuple(window_size):
            other, other_error, _ = _run_chrome(browser, probe_path, compare_window_size, budget_ms, timeout_s)
    finally:
        probe_path.unlink(missing_ok=True)

    if raw is None:
        return BrowserAuditReport(
            ok=False,
            errors=[f"[FAIL] browser: {error} for {html_path.name}"],
            warnings=[],
            raw=detail,
            browser=browser,
        )

    errors = [f"[FAIL] browser: {msg}" for msg in raw.get("failures", [])]
    warnings = [f"[WARN] browser: {msg}" for msg in raw.get("warnings", [])]
    if compare_window_size and tuple(compare_window_size) != tuple(window_size):
        if other is None:
            warnings.append(f"[WARN] browser: window-size comparison skipped ({other_error})")
        else:
            errors.extend(
                f"[FAIL] browser: {msg}"
                for msg in compare_window_layouts(raw, other, window_size, compare_window_size)
            )
            raw.setdefault("meta", {})["comparedWindow"] = list(compare_window_size)

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
    parser.add_argument(
        "--compare-window",
        default=f"{COMPARE_WINDOW_SIZE[0]}x{COMPARE_WINDOW_SIZE[1]}",
        help="Second window size (WxH) whose slide layout must match; 'none' skips the comparison",
    )
    args = parser.parse_args()
    compare = None
    if args.compare_window.lower() != "none":
        try:
            width, height = (int(part) for part in args.compare_window.lower().split("x"))
        except ValueError:
            parser.error("--compare-window must look like 1024x640 or 'none'")
        compare = (width, height)

    report = run_browser_slide_audit(
        args.html,
        expected_slide_count=args.expected_slide_count,
        window_size=(args.window_width, args.window_height),
        virtual_time_budget_ms=args.virtual_time_budget_ms,
        compare_window_size=compare,
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
