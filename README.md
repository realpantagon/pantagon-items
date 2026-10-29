# Pantagon Items

Personal asset tracker (PWA) built for iPhone 15 Pro Max, portrait only. Tracks what you bought, extra costs over time, daily burn rate and profit when you sell.

## Architecture

One Cloudflare Worker (`pantagon-items`) does both jobs:

- serves the built React SPA from `dist/` (Workers static assets, SPA fallback)
- answers `/api/*` from `worker/index.ts` (Hono), reading and writing the `items` table in the shared **PANTAGON_PERSONAL** D1 database (binding `DB`)

No client-side secrets: the browser only talks to `/api` on the same origin.

| Method | Path | |
| --- | --- | --- |
| GET | `/api/items` | all items, newest purchase first |
| GET | `/api/items/:id` | one item |
| POST | `/api/items` | create (server assigns `id`, timestamps) |
| PATCH | `/api/items/:id` | partial update |
| DELETE | `/api/items/:id` | delete |

`tags` and `extra_cost_details` are stored as JSON text and `daily_burn` as 0/1; the Worker converts them back to arrays and booleans.

Schema lives in [migrations/0001_create_items.sql](migrations/0001_create_items.sql).

## Scripts

```bash
pnpm install
pnpm dev            # Vite only (UI work; /api calls need the Worker)
pnpm dev:worker     # build, then run the Worker + assets locally on a local D1 copy
pnpm deploy         # build, then deploy the Worker
pnpm db:migrate     # apply migrations/ to the remote PANTAGON_PERSONAL database
```

For local D1 data: `wrangler d1 execute PANTAGON_PERSONAL --local --file migrations/0001_create_items.sql`.

## Cost logic

- **Days held**: `today − buy_date`, or `sell_date − buy_date` once sold (minimum 1)
- **Real cost**: `buy_price + extra_cost`
- **Cost per day**: `real_cost / days_held`
- **Profit**: `sell_price − real_cost`
- **Dashboard daily burn**: sum of cost per day over owned items with `daily_burn` on
- **Monthly spend**: purchases bought that month + extra cost rows dated that month
