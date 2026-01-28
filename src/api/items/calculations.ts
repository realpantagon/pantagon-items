import { differenceInDays, parseISO } from 'date-fns';
import type { PantagonItem, ItemWithMetrics } from './types';

/**
 * Calculate days held for an item
 * If sold: sell_date - buy_date
 * If not sold: today - buy_date
 */
export function calculateDaysHeld(buyDate: string, sellDate: string | null): number {
  const buy = parseISO(buyDate);
  const end = sellDate ? parseISO(sellDate) : new Date();
  const days = differenceInDays(end, buy);
  return days > 0 ? days : 1; // Minimum 1 day to avoid division by zero
}

/**
 * Calculate real cost (buy_price + extra_cost)
 */
export function calculateRealCost(buyPrice: number, extraCost: number): number {
  return buyPrice + extraCost;
}

/**
 * Calculate cost per day (for items still owned)
 * Formula: (buy_price + extra_cost) / days_held
 */
export function calculateCostPerDay(realCost: number, daysHeld: number): number {
  return realCost / daysHeld;
}

/**
 * Calculate average cost per day for sold items
 * Formula: (buy_price + extra_cost) / days_held_until_sold
 */
export function calculateAvgCostPerDaySold(realCost: number, daysHeld: number): number {
  return realCost / daysHeld;
}

/**
 * Calculate profit for sold items
 * Formula: sell_price - buy_price
 */
export function calculateProfit(sellPrice: number, buyPrice: number): number {
  return sellPrice - buyPrice;
}

/**
 * Add computed metrics to a PantagonItem
 */
export function enrichItemWithMetrics(item: PantagonItem): ItemWithMetrics {
  const daysHeld = calculateDaysHeld(item.buy_date, item.sell_date);
  const realCost = calculateRealCost(item.buy_price, item.extra_cost);

  const enriched: ItemWithMetrics = {
    ...item,
    days_held: daysHeld,
    real_cost: realCost,
  };

  if (item.status === 'owned') {
    enriched.cost_per_day = calculateCostPerDay(realCost, daysHeld);
  } else if (item.status === 'sold' && item.sell_price !== null) {
    enriched.avg_cost_per_day_sold = calculateAvgCostPerDaySold(realCost, daysHeld);
    enriched.profit = calculateProfit(item.sell_price, item.buy_price);
  }

  return enriched;
}

/**
 * Calculate daily burn rate across all items
 * Sum of (real_cost / days_held) for items that are NOT sold
 * Only counts items with status 'owned'
 */
export function calculateDailyBurnRate(items: PantagonItem[]): number {
  return items
    .filter(item => item.status !== 'sold' && item.daily_burn) // Exclude sold items and respect daily_burn flag
    .reduce((total, item) => {
      const daysHeld = calculateDaysHeld(item.buy_date, item.sell_date);
      const realCost = calculateRealCost(item.buy_price, item.extra_cost);
      return total + (realCost / daysHeld);
    }, 0);
}

/**
 * Calculate total profit from sold items
 */
export function calculateTotalProfit(items: PantagonItem[]): number {
  return items
    .filter(item => item.status === 'sold' && item.sell_price !== null)
    .reduce((total, item) => {
      return total + (item.sell_price! - item.buy_price);
    }, 0);
}

/**
 * Format currency to Thai Baht
 */
/**
 * Format currency to Thai Baht
 */
export function formatCurrency(amount: number, maxDecimals: number = 2): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: maxDecimals,
    minimumFractionDigits: maxDecimals === 0 ? 0 : 2,
  }).format(amount);
}

/**
 * Format number with 2 decimal places
 */
export function formatNumber(num: number): string {
  return num.toFixed(2);
}
