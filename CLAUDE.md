# Saydalah Web — working notes

SvelteKit 2 + **Svelte 5 (runes)** frontend for `saydalah-api`. Pure REST consumer — all business
rules/messages/validation live in the API. See `README.md` for the feature list. This file is the
conventions cheat-sheet.

## Runes & data
- Use runes: `$state`, `$derived` / `$derived.by`, `$props`, `$bindable`, `$effect`; `{#key}` +
  `transition:` for animated swaps.
- Data layer is **TanStack Svelte Query v6**. **Put `enabled` inline** in `createQuery`
  (e.g. `enabled: Boolean(branch.id)`) — a `$derived` flag is **not** tracked inside the query
  callback, so the query would never fire. This is the single most common footgun here.
- Large datasets never block the UI: server-side search via `Combobox`'s async `onSearch`, and
  `Pagination` on every list.

## Auth (important)
- The app authenticates **client-side** (`ssr = false` in the root `+layout.ts`) — the JWT lives in
  `localStorage`. **Do not enable SSR**; the server has no token and would flash the signed-out UI.
- Session state is **reactive** via `$lib/stores/session.svelte.ts` (flipped by `token.ts`
  `setTokens`/`clearTokens`). `isAuthenticated()` reads it, so chrome/guards update the instant you
  log in or out. Never gate UI on a non-reactive token read.
- Token refresh is transparent/single-flight in `$lib/api/client.ts`.

## Layout & UI
- Global chrome (root `+layout.svelte`, shown when `showChrome`): desktop `Sidebar` +
  `SidebarBranch` (branch switcher), mobile top bar + `BottomNav`, and `CommandPalette` (⌘K).
- **Bare (no-chrome) routes** — add new printable/full-bleed pages to the `bare` check in the root
  layout: `/login`, `/invoice/`, `/prescription-print/`, `/day-end/`, `/receipt/`.
- Reusable UI in `src/lib/components/ui/`: `Modal` (bottom-sheet on mobile, centered ≥sm),
  `Combobox` (async `onSearch`), `Pagination`, `Tabs` (segmented, tone-aware badges), `NumPad`,
  `StatCard` (sparkline), `BarChart`/`LineChart` (dependency-free CSS/SVG — no chart lib).
- Styling: **Tailwind v4**, oklch semantic tokens in `src/routes/layout.css` (`--color-*` auto-
  generate utilities). Borders over shadows; pill controls; theme-aware (light/dark). Input focus =
  `ring-2 ring-accent/40 ring-offset-2`.
- URL-synced tab/filter state via `$lib/url.ts`. Currency is BDT (৳) via `Intl` (`VITE_CURRENCY`).

## Commands (pnpm)
- `pnpm dev` (:5173), **`pnpm check`** (svelte-check — run before every commit), `pnpm test`
  (Vitest), `pnpm build`.
- API base URL: `VITE_API_BASE_URL` (default `http://localhost:8080/api/v1`).

## Git
- Commit author `ebnsina <ebnsina.me@gmail.com>`. **Do NOT add `Co-Authored-By` or any other
  trailer/identity.** Remotes use the `github-es` SSH alias. One feature per commit; commit/push
  only when asked.
