import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../shared/utils/supabase';
import type { DashboardStats, GroupBurnRate, PantagonItem } from '../../../api/items/types';
import { calculateDailyBurnRate, calculateTotalProfit, formatCurrency } from '../../../api/items/calculations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Button from '../../../shared/components/Button';
import ItemCard from '../../items/components/ItemCard';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [groupData, setGroupData] = useState<GroupBurnRate[]>([]);
  const [items, setItems] = useState<PantagonItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<PantagonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [groups, setGroups] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchTerm, selectedGroup, selectedStatus, selectedCategory]);

  const filterItems = () => {
    let filtered = [...items];

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedGroup) {
      filtered = filtered.filter(item => item.group_name === selectedGroup);
    }

    if (selectedStatus) {
      filtered = filtered.filter(item => item.status === selectedStatus);
    }

    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    setFilteredItems(filtered);
    setCurrentPage(1);
  };

  const calculateItemDailyBurn = (item: PantagonItem) => {
    const daysHeld = item.sell_date
      ? Math.max(1, Math.floor((new Date(item.sell_date).getTime() - new Date(item.buy_date).getTime()) / (1000 * 60 * 60 * 24)))
      : Math.max(1, Math.floor((Date.now() - new Date(item.buy_date).getTime()) / (1000 * 60 * 60 * 24)));
    const realCost = item.buy_price + item.extra_cost;
    return realCost / daysHeld;
  };

  const fetchDashboardData = async () => {
    try {
      const { data: items, error } = await supabase
        .from('Pantagon_items')
        .select('*')
        .order('buy_date', { ascending: false });

      if (error) throw error;

      if (items) {
        // Calculate stats
        const totalItems = items.length;
        const ownedItems = items.filter(item => item.status === 'owned').length;
        const soldItems = items.filter(item => item.status === 'sold').length;
        const dailyBurnRate = calculateDailyBurnRate(items);
        const totalProfit = calculateTotalProfit(items);

        setStats({
          total_items: totalItems,
          owned_items: ownedItems,
          sold_items: soldItems,
          daily_burn_rate: dailyBurnRate,
          total_profit: totalProfit,
        });

        // Store items
        setItems(items);
        setFilteredItems(items);

        // Get unique groups and categories
        const uniqueGroups = Array.from(new Set(items.map(item => item.group_name).filter(Boolean))) as string[];
        const uniqueCategories = Array.from(new Set(items.map(item => item.category).filter(Boolean))) as string[];
        setGroups(uniqueGroups);
        setCategories(uniqueCategories);

        // Calculate group burn rates - ONLY OWNED ITEMS that are part of daily burn
        const ownedItemsOnly = items.filter(item => item.status === 'owned' && item.daily_burn);
        const groupMap = new Map<string, { totalBurn: number; count: number }>();
        ownedItemsOnly.forEach(item => {
          const group = item.group_name || 'No Group';
          const daysHeld = Math.max(1, Math.floor((Date.now() - new Date(item.buy_date).getTime()) / (1000 * 60 * 60 * 24)));
          const realCost = item.buy_price + item.extra_cost;
          const burnRate = realCost / daysHeld;

          if (!groupMap.has(group)) {
            groupMap.set(group, { totalBurn: 0, count: 0 });
          }
          const current = groupMap.get(group)!;
          current.totalBurn += burnRate;
          current.count += 1;
        });

        const groupBurnRates: GroupBurnRate[] = Array.from(groupMap.entries()).map(([group, data]) => ({
          group_name: group,
          avg_burn_rate: data.totalBurn,
          item_count: data.count,
        }));
        setGroupData(groupBurnRates);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Stats Grid - Premium Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-2xl p-4 shadow-lg shadow-black/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </span>
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total</span>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {stats?.total_items || 0}
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-2xl p-4 shadow-lg shadow-black/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </span>
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Owned</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">
            {stats?.owned_items || 0}
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-2xl p-4 shadow-lg shadow-black/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 bg-purple-500/10 rounded-lg text-purple-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </span>
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Profit</span>
          </div>
          <div className={`text-2xl font-bold tracking-tight ${(stats?.total_profit || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {stats ? formatCurrency(stats.total_profit, 0) : '฿0'}
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-2xl p-4 shadow-lg shadow-black/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 bg-red-500/10 rounded-lg text-red-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>
            </span>
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Daily Burn</span>
          </div>
          <div className="text-2xl font-bold text-red-400 tracking-tight">
            {stats ? formatCurrency(stats.daily_burn_rate) : '฿0'}
          </div>
        </div>
      </div>

      {/* Bar Chart - Group Burn Rates */}
      <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-5 border border-gray-700/50 shadow-sm">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-6">
          Daily Burn by Group
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={groupData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis
              dataKey="group_name"
              stroke="#9CA3AF"
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis
              stroke="#9CA3AF"
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              dx={-10}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{
                backgroundColor: '#111827',
                border: '1px solid #374151',
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
              }}
              labelStyle={{ color: '#F9FAFB', fontWeight: 600, marginBottom: '4px' }}
            />
            <Bar
              dataKey="avg_burn_rate"
              fill="#3b82f6"
              name="Avg ฿/day"
              radius={[4, 4, 0, 0]}
              barSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Items List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold text-white">Recent Items</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/list')}
            className="text-blue-400 hover:text-blue-300 px-0"
          >
            See All →
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input
            type="text"
            placeholder="Search your items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
          />
        </div>

        {/* Collapsible Filters - Styled */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${showFilters
              ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
              : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:bg-gray-800'
              }`}
          >
            Filters {showFilters ? '−' : '+'}
          </button>

          {showFilters && (
            <>
              <select
                value={selectedStatus || ''}
                onChange={(e) => setSelectedStatus(e.target.value || null)}
                className="px-3 py-1.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Status: All</option>
                <option value="owned">Owned</option>
                <option value="sold">Sold</option>
              </select>

              {groups.length > 0 && (
                <select
                  value={selectedGroup || ''}
                  onChange={(e) => setSelectedGroup(e.target.value || null)}
                  className="px-3 py-1.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Group: All</option>
                  {groups.map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              )}

              {categories.length > 0 && (
                <select
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(e.target.value || null)}
                  className="px-3 py-1.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Category: All</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              )}
            </>
          )}
        </div>

        {/* Items List - Card Style */}
        <div className="space-y-3">
          {paginatedItems.map(item => {
            const dailyBurn = calculateItemDailyBurn(item);
            return (
              <ItemCard key={item.id} item={item} dailyBurn={dailyBurn} />
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-800 rounded-2xl">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">📦</span>
            </div>
            <h3 className="text-white font-medium mb-1">No items found</h3>
            <p className="text-gray-500 text-sm">Try adjusting your filters or search</p>
          </div>
        )}

        {/* Pagination */}{totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 py-4">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ←
            </button>
            <span className="text-sm font-medium text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
