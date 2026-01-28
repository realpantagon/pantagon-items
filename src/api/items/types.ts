export interface PantagonItem {
  id: string;
  name: string;
  category: string | null;
  group_name: string | null;
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
  daily_burn: boolean;
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

export interface GroupBurnRate {
  group_name: string;
  avg_burn_rate: number;
  item_count: number;
}

export interface CategoryDistribution {
  category: string;
  count: number;
  percentage: number;
}
