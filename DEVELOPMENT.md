# Pantagon Items - Development Guide

## Quick Start

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your Supabase credentials
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Database Setup (Supabase)
Run this SQL in your Supabase SQL Editor:

```sql
CREATE TABLE pantagon_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  group_name TEXT,
  buy_date DATE NOT NULL,
  buy_price DECIMAL NOT NULL,
  extra_cost DECIMAL DEFAULT 0,
  sell_date DATE,
  sell_price DECIMAL,
  status TEXT DEFAULT 'owned' CHECK (status IN ('owned', 'sold')),
  purchase_source TEXT,
  warranty_expire_date DATE,
  reason_to_sell TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pantagon_items_updated_at 
  BEFORE UPDATE ON pantagon_items 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (recommended for production)
ALTER TABLE pantagon_items ENABLE ROW LEVEL SECURITY;

-- Example policy: Allow all operations for authenticated users
CREATE POLICY "Enable all operations for authenticated users" 
  ON pantagon_items 
  FOR ALL 
  USING (true);
```

### 3. Run Development Server
```bash
pnpm dev
```

Visit http://localhost:5173

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint
- `pnpm deploy:pages` - Build and deploy to Cloudflare Pages
- `pnpm deploy:worker` - Deploy Cloudflare Worker API
- `pnpm dev:worker` - Run Cloudflare Worker locally

## Features Overview

### Dashboard (/)
- Total items count
- Items owned/sold statistics
- Daily burn rate calculation
- Bar chart by group (average burn rate)
- Pie chart by category

### Items List (/items)
- Table view with pagination
- Search by name
- Filter by status (owned/sold)
- Filter by group
- Filter by category
- Click row to view details

### Item Details (/items/:id)
- All item fields displayed
- Computed metrics:
  - Days held
  - Real cost (buy + extra)
  - Cost per day (if owned)
  - Average cost per day (if sold)
  - Profit/loss (if sold)
- Edit and delete buttons

### Add Item (/items/new)
- Form with validation
- Required fields: name, buy_date, buy_price
- Auto-defaults: status=owned, extra_cost=0

### Edit Item (/items/:id/edit)
- All fields editable
- Additional sell fields:
  - sell_date
  - sell_price
  - reason_to_sell

## Tech Architecture

### Frontend Stack
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router v7** - Client-side routing
- **TailwindCSS** - Utility-first styling
- **Recharts** - Charts and visualizations
- **date-fns** - Date manipulation

### Backend/Database
- **Supabase** - PostgreSQL database + Auth
- **Cloudflare Workers** - Optional API proxy (serverless)

### PWA Features
- Service worker with Workbox
- Offline-first caching
- Installable on mobile devices
- Network-first strategy for Supabase API

## Cost Calculation Formulas

### Days Held
```typescript
if (item.sell_date) {
  days_held = sell_date - buy_date
} else {
  days_held = today - buy_date
}
```

### Real Cost
```typescript
real_cost = buy_price + extra_cost
```

### Daily Burn Rate (Owned Items)
```typescript
cost_per_day = real_cost / days_held
```

### Average Daily Cost (Sold Items)
```typescript
avg_cost_per_day_sold = real_cost / days_held
```

### Profit/Loss
```typescript
profit = sell_price - real_cost
```

### Dashboard Total Burn Rate
```typescript
total_daily_burn_rate = Σ(item.real_cost / item.days_held) for all items
```

## Dark Mode

Dark mode is automatically detected from system preferences. Users can toggle it manually via the navbar button. The preference is saved to localStorage.

## Deployment

### Cloudflare Pages (Frontend)
```bash
# Build
pnpm build

# Deploy
npx wrangler pages deploy dist

# Or use automatic GitHub integration
```

Set environment variables in Cloudflare Pages dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Cloudflare Workers (Optional API)
```bash
# Set secrets
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY

# Deploy
pnpm deploy:worker
```

## File Structure

```
src/
├── components/       # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── FilterChip.tsx
│   ├── Input.tsx
│   ├── Layout.tsx
│   ├── Navbar.tsx
│   └── Select.tsx
├── pages/           # Route components
│   ├── Dashboard.tsx
│   ├── ItemsList.tsx
│   ├── ItemDetails.tsx
│   ├── AddItem.tsx
│   └── EditItem.tsx
├── lib/            # Third-party configs
│   └── supabase.ts
├── types/          # TypeScript interfaces
│   └── database.types.ts
├── utils/          # Helper functions
│   ├── calculations.ts
│   └── helpers.ts
├── App.tsx         # Main app with routing
├── main.tsx        # Entry point
└── index.css       # Tailwind directives
```

## Customization

### Add Custom Categories
Categories are dynamic based on your data. Just add items with new categories and they'll appear in filters.

### Modify Charts
Edit [Dashboard.tsx](src/pages/Dashboard.tsx) to customize Recharts configurations.

### Change Theme Colors
Edit [tailwind.config.js](tailwind.config.js) primary color palette.

### Add New Fields
1. Update Supabase table schema
2. Update TypeScript types in `src/types/database.types.ts`
3. Update forms in `AddItem.tsx` and `EditItem.tsx`
4. Update display in `ItemDetails.tsx`

## Known Issues & TODOs

- [ ] Add PWA icons (currently using placeholders)
- [ ] Implement user authentication with Supabase Auth
- [ ] Add RLS policies for multi-user support
- [ ] Add export to CSV/Excel functionality
- [ ] Add image upload for items
- [ ] Implement undo/redo for deletions
- [ ] Add email notifications for warranty expiry

## Support

For issues or questions, please refer to:
- Supabase docs: https://supabase.com/docs
- React Router docs: https://reactrouter.com/
- TailwindCSS docs: https://tailwindcss.com/
- Cloudflare Workers: https://developers.cloudflare.com/workers/

## License

MIT
