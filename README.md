# Saydalah — Pharmacy Management Web

A SvelteKit front-end for the **Saydalah** multi-branch pharmacy chain. It's a pure consumer of the
[`saydalah-api`](https://github.com/ebnsina/saydalah-api) JSON REST boundary (`/api/v1`) — all
business rules, messages, and validation live in the API; this app renders them.

## Features

### Point of sale & sales
- **FEFO checkout** — search or scan products into a cart and ring up a sale (stock is dispensed
  first-expiry-first-out by the API).
- **Barcode entry** — an auto-focused barcode field (works with any hardware/keyboard-wedge
  scanner) **plus in-browser camera scanning** via the `BarcodeDetector` API, with a graceful
  fallback where it isn't supported.
- **Printable invoice** — a clean, print/PDF-ready invoice per sale (VOID watermark for voided
  sales), reachable from the receipt and from history.
- **Sales history** — list past sales, **void** a sale (refunds stock), open its invoice.

### Inventory & stock
- **Inventory views** — low-stock, near-expiry, and in-stock batches, scoped per branch.
- **Stock operations** — manual **adjustments, returns, inter-branch transfers, and physical
  stock-takes**, plus a full **movement ledger** (audit trail with who/what/when).

### Catalog, purchasing & prescriptions
- **Products** — URL-synced search and **category / active-status filters**, create & edit, with
  dosage-form icons (capsule, tablet, syrup, injection…).
- **Purchasing** — create purchase orders and **receive goods into stock batches**.
- **Prescriptions & customers** — record prescriptions, **dispense (FEFO)**, and manage customers.

### Reports & administration
- **Reports** — sales summary, a **top-products bar chart**, inventory valuation, and **CSV export**
  (manager/admin).
- **Admin** — full CRUD for branches, suppliers, and staff **users**, including **password reset**.
- **Settings** — profile, **Light / Dark / System** theme, and self-service **password change**.

### Platform & UX
- **Auth** — JWT with transparent, single-flight access-token refresh; role-scoped navigation;
  client-only render so there's no signed-out flash.
- **Validation** — [zod](https://zod.dev) on every form, and server-side field errors mapped back
  onto the right input.
- **Formatting** — currency (Bangladeshi Taka ৳) and dates via the standard `Intl` APIs.
- **Polish** — searchable icon dropdowns, skeleton loaders, modals with transitions, rolling
  `tabular-nums` stat cards, and graceful 404 / 500 / timeout handling.
- **Design** — a responsive sidebar layout; borders over shadows; a light-gray canvas with a white
  content sheet; pill-shaped controls (Mona Sans + Geist Mono, oklch semantic tokens).

## Stack

| Concern | Choice |
|---|---|
| Framework | SvelteKit 2 + **Svelte 5** (runes) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 (`@theme`, oklch tokens) |
| Data | TanStack Svelte Query v6 |
| Validation | zod |
| Icons | `@lucide/svelte` |
| Charts | inline CSS (dependency-free) |
| Adapter | `@sveltejs/adapter-node` |
| Tests | Vitest |

## Develop

Uses **pnpm**.

```sh
pnpm install
pnpm dev            # http://localhost:5173
```

Point it at the API with env vars (defaults shown):

```sh
VITE_API_BASE_URL=http://localhost:8080/api/v1   # backend base URL
VITE_CURRENCY=BDT                                # ISO currency for Intl formatting
```

## Scripts

```sh
pnpm dev            # dev server
pnpm build          # production build (adapter-node → build/, run with `node build`)
pnpm preview        # preview the production build
pnpm check          # svelte-check (type-check)
pnpm test           # Vitest unit tests
```

## Deploy

Builds a standalone Node server. A multi-stage **Dockerfile** is included; the API base URL is baked
in at build time:

```sh
docker build --build-arg VITE_API_BASE_URL=https://api.example.com/api/v1 -t saydalah-web .
docker run -p 3000:3000 saydalah-web
```

CI (`.github/workflows/ci.yml`) runs type-check, tests, and build on every push / PR.
