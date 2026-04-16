# Multi-file React Project

## Goal

Use a directory-based React app when the user wants a stronger engineering foundation than a single-file component.

## Recommended project shape

Keep the project small and legible.

A sensible structure is:
- `src/App.tsx` for the app shell,
- `src/data/slideData.ts` for content,
- `src/lib/presentationConfig.ts` for theme and venue presets,
- `src/components/SlideRenderer.tsx` for layout rendering,
- `src/components/ControlDock.tsx` for controls,
- `src/components/PresenterPanel.tsx` for speaker-facing state.
- `src/lib/presenterWindow.ts` for the dedicated speaker window helper when needed.

## Rules

- Do not over-abstract a small deck.
- Keep the data module easy to edit by hand.
- Keep presentational components focused and short.
- Keep the app shell responsible only for state, routing-lite behavior, and overlay toggles.
- Prefer Vite for a lightweight scaffold.

## When to prefer this mode

Prefer a multi-file React project when the user wants:
- later iteration,
- deployment,
- a codebase another engineer can extend,
- stronger presenter features,
- more than one presentation variant.
