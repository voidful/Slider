# Progressive Builds

## Purpose

Use progressive builds only when reveal order changes comprehension. They are useful for a method pipeline, a causal chain, or a misconception followed by its correction. A chart, quote, cover, or complete comparison usually reads better all at once.

Design the final composed slide first. A build changes visibility, never layout: hidden elements retain their space so text, figures, and alignment do not jump between presenter beats.

## Slide data contract

Add an optional `revealOrder` array to a slide. Each entry is a semantic target revealed by the next navigation action.

```json
{
  "title": "The bottleneck appears in three stages",
  "layout": "split",
  "bullets": ["Encode context", "Route evidence", "Score the answer"],
  "revealOrder": ["bullets.0", "bullets.1", "bullets.2"]
}
```

Supported targets:

| Target | Surface |
|:---|:---|
| `keyMessage` | The slide's key-message line |
| `bullets.N` | Classic bullet at zero-based index `N` |
| `metrics.N` | Classic metric card at index `N` |
| `visual` | Bound figure or visual placeholder |
| `contentBlocks.N` | Content block at index `N` |
| `table.rows.N` | React project table row at index `N` |

Unknown and duplicate targets are ignored at runtime, preventing empty presenter beats. Keep the order short; two to four builds on a slide is usually enough.

## Navigation semantics

- Forward entry starts with all listed targets pending.
- Right arrow, Space, next button, wheel, swipe, presenter control, or phone remote reveals one target before changing slides.
- Left navigation hides revealed targets in reverse order before returning to the previous slide.
- Backward entry and direct jumps from overview, Home/End, or slide number show the final composed state.
- Presenter previews mirror the audience's current build; thumbnails and next-slide previews show the complete state.
- Reduced-motion mode removes the reveal transition without changing the navigation contract.

## Authoring rules

- Keep the title and the evidence needed to interpret a result visible by default.
- Do not reveal metric cards one at a time when the audience must compare them simultaneously.
- Do not use builds to rescue an overcrowded slide. Split or simplify it.
- Speaker notes should name the intended pause or explanation for each build.
- Verify the empty, intermediate, final, backward-entry, and direct-jump states.

The interaction model was inspired by open-slide's `Steps`/`Step` primitive, reviewed at commit `7384649` (MIT). Slider uses a data-driven implementation so the default artifact remains one self-contained HTML file.
