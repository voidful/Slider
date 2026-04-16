# Dual-screen Speaker View

## Goal

Support a dedicated presenter window for live talks.

The audience should see only the slide deck.
The speaker should have access to notes, next-slide context, timing, and progress.

## When to use

Prefer a dedicated speaker window when the user asks for:
- presenter mode that works across two screens,
- a talk-ready deck for live delivery,
- a reusable project with stronger presenter tooling.

## Core behavior

A dedicated speaker window should show:
- current slide title,
- current speaker note,
- current evidence note when available,
- next slide title,
- next slide key message,
- elapsed timer,
- overall progress.

The main deck and the speaker window must stay synchronized.

## Recommended implementation

For browser-native artifacts, a practical default is:
1. open a same-origin popup window,
2. write a minimal presenter shell into that window,
3. update it whenever slide state or timer state changes,
4. focus the popup when reopened instead of spawning duplicates.

This is simpler and more portable than introducing routing or a second browser entry point in the default skill starter.

## Control model

Support:
- a control-dock button such as `Window`,
- keyboard shortcut `W`,
- graceful fallback when the popup is blocked.

Do not let a popup failure break the main slideshow.

## Layout rules

The speaker window should:
- prioritize legibility over decoration,
- use a stable two-column or stacked panel layout,
- keep the current slide note visually dominant,
- show the next slide preview compactly,
- keep timing and progress easy to glance at.

## State rules

Sync at least:
- slide index,
- current slide title,
- current and next notes,
- timer state,
- elapsed seconds,
- progress percentage,
- theme and venue labels when available.

## Anti-patterns

Never:
- mirror the full audience slide with all controls on top of it,
- require the speaker to manually refresh the popup,
- open multiple duplicate presenter windows,
- expose dense debug state in the presenter view.
