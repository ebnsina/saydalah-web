# Saydalah — Pharmacy Management Web

A SvelteKit front-end for the **Saydalah** multi-branch pharmacy chain. It's a pure consumer of the
[`saydalah-api`](https://github.com/ebnsina/saydalah-api) JSON REST boundary (`/api/v1`) — all
business rules, messages, and validation live in the API; this app renders them.

## What you get

Everything a multi-branch pharmacy needs to sell, stock, and stay on top of the numbers — in one
fast, clean app that works on the counter till and on a phone.

### 🛒 Sell faster at the counter
- **Full point of sale** — search or scan products into the cart and ring up a sale in seconds.
- **Barcode scanning** — works with a handheld scanner *or* your device's camera.
- **Live stock check** — the till shows what's in stock at your branch before you add it, so a sale
  never fails at checkout.
- **On-screen keypad & change-making** — a touch numeric keypad, plus enter cash received and the
  exact change is calculated for you.
- **Every payment type** — cash, card, or mobile money, with discounts and **VAT handled
  automatically**.
- **Sell on credit** — let trusted customers **pay later**, then take full or partial payments
  against their balance anytime.
- **Instant receipts & invoices** — thermal receipt and A4/PDF invoice for every sale, ready to
  print.
- **Refunds** — cancel a sale and stock is returned automatically.
- **⌘K quick search** — jump to any product, customer, or screen from anywhere.

### 📦 Never lose money to expiry or stockouts
- **Batch & expiry tracking** with automatic **first-expiry-first-out** dispensing — you never sell
  expired stock.
- **Low-stock and near-expiry alerts**, per branch, with sortable views.
- **Suggested purchase orders** built from whatever is running low.
- **Stock operations** — adjustments, supplier returns, customer returns, inter-branch transfers,
  and physical stock-takes.
- **Full audit trail** — every stock movement is logged with who, what, and when.

### 🏬 Run every branch from one place
- **Shared catalog, separate stock** — one product list, stock kept per branch.
- **Branch switcher** in the sidebar — staff see only their branch, owners see them all.
- **Purchasing** — raise purchase orders and receive goods straight into dated stock batches.

### 📊 Know your numbers
- **Live dashboard** — today's revenue, sales, stock value, and reorder alerts at a glance.
- **Reports** — sales trends, payment-method breakdown, best-selling products, and inventory
  valuation, with clear charts.
- **End-of-day (Z-report)** and **CSV export** for your accountant.

### 💊 Prescriptions & customers
- **Prescriptions** — record and dispense (first-expiry-first-out), with a printable slip.
- **Customer profiles** — purchase history and any outstanding balance in one place.

### 📱 Built for real shops
- **True mobile experience** — bottom navigation and touch-friendly sheets on phones and tablets,
  not just a shrunk-down desktop page.
- **Staff roles** — cashier, pharmacist, manager, and admin each see the right screens and actions.
- **Light & dark themes**, fast and secure sign-in, and money shown in your currency
  (Bangladeshi Taka ৳ by default).

---

### Under the hood

This is a pure consumer of the API's JSON boundary — all business rules, messages, and validation
live in the API; the app renders them. Highlights: JWT auth with transparent single-flight token
refresh and reactive session state (no signed-out flash), zod on every form with server field
errors mapped back to inputs, TanStack Query caching with async/lazy comboboxes so large datasets
never block the UI, dependency-free CSS charts, and a semantic-token design system (borders over
shadows, pill controls, oklch light/dark themes).

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
