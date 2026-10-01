# Frontend Architecture

The app uses the Next.js App Router, React 19, and a feature-oriented UI structure. Browser requests stay on the frontend origin; Next rewrites `/api/*` to the configured backend origin so the browser does not need a cross-origin API session.

## Dependency flow

```text
App Router route adapters
        ↓
src/features/<area>/screens and feature UI
        ↓
src/components shared UI + src/lib API/types/utilities
        ↓
same-origin /api proxy → NestJS API
```

- `src/app` owns URLs, metadata, the signed-in shell, and lightweight route adapters.
- `src/features` owns screens by business area: overview, leads, properties, campaigns, agents, analytics, sources, integrations, and settings.
- `src/components` owns reusable presentation primitives and cross-feature components.
- `src/lib/api.ts` owns cookie-aware API transport, refresh-on-401, response unwrapping, and list normalization.
- `next.config.ts` sends `/api/:path*` through to `BACKEND_ORIGIN` (or `NEXT_PUBLIC_API_URL` for local development).

Feature screens may call shared API transport and shared UI. Shared components should not import feature screens. Keep business state and mutation handling beside the feature that owns it. Avoid storing authentication credentials in browser storage; the backend sets HTTP-only cookies and the session provider only holds the current-user view in memory.

## Experience system

The Dune UI is a dark, high-contrast operations workspace with a responsive mobile navigation, an accessible `Ctrl/⌘ K` page switcher, data-focused surfaces, and semantic status colors. The design tokens and shared surface styles live in `src/app/globals.css`; common page hierarchy is in `PageHeader`, `Card`, `StatCard`, and the dashboard shell.

## Local development

Run the Next dev server on port 3010 with `BACKEND_ORIGIN=http://localhost:5010` for the isolated demo stack. Normal local development defaults the API proxy to `http://localhost:5000`.
