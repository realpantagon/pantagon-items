export interface PantagonItem {
  id: string;
  name: string;
  tags: string[] | null;
  buy_date: string;
  buy_price: number;
  extra_cost: number;
  sell_date: string | null;
  sell_price: number | null;
  status: 'owned' | 'sold';
  purchase_source: string | null;
  warranty_expire_date: string | null;
  reason_to_sell: string | null;
  note: string | null;
  extra_cost_details: {
    id: string;
    label: string;
    amount: number;
    date: string;
  }[] | null;
  daily_burn: boolean;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

export interface ItemWithMetrics extends PantagonItem {
  days_held: number;
  real_cost: number;
  cost_per_day?: number;
  avg_cost_per_day_sold?: number;
  profit?: number;
}

export interface DashboardStats {
  total_items: number;
  owned_items: number;
  sold_items: number;
  daily_burn_rate: number;
  total_profit: number;
}


