import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../shared/utils/supabase';
import type { DashboardStats, GroupBurnRate, PantagonItem } from '../../../api/items/types';
import { calculateDailyBurnRate, formatCurrency } from '../../../api/items/calculations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';

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
  
  // Quick add form state
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddData, setQuickAddData] = useState({
    name: '',
    buy_price: '',
    group_name: '',
  });

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
        .from('pantagon_items')
        .select('*')
        .order('buy_date', { ascending: false });

      if (error) throw error;

      if (items) {
        // Calculate stats
        const totalItems = items.length;
        const ownedItems = items.filter(item => item.status === 'owned').length;
        const soldItems = items.filter(item => item.status === 'sold').length;
        const dailyBurnRate = calculateDailyBurnRate(items);

        setStats({
          total_items: totalItems,
          owned_items: ownedItems,
          sold_items: soldItems,
          daily_burn_rate: dailyBurnRate,
        });

        // Store items
        setItems(items);
        setFilteredItems(items);

        // Get unique groups and categories
        const uniqueGroups = Array.from(new Set(items.map(item => item.group_name).filter(Boolean))) as string[];
        const uniqueCategories = Array.from(new Set(items.map(item => item.category).filter(Boolean))) as string[];
        setGroups(uniqueGroups);
        setCategories(uniqueCategories);

        // Calculate group burn rates - ONLY OWNED ITEMS
        const ownedItemsOnly = items.filter(item => item.status === 'owned');
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

  const handleQuickAdd = async () => {
    if (!quickAddData.name || !quickAddData.buy_price) {
      alert('Please enter name and price');
      return;
    }

    try {
      const { error } = await supabase
        .from('pantagon_items')
        .insert([{
          name: quickAddData.name.trim(),
          buy_price: parseFloat(quickAddData.buy_price),
          buy_date: format(new Date(), 'yyyy-MM-dd'),
          group_name: quickAddData.group_name.trim() || null,
          extra_cost: 0,
          status: 'owned',
        }]);

      if (error) throw error;

      // Reset form
      setQuickAddData({ name: '', buy_price: '', group_name: '' });
      setShowQuickAdd(false);
      
      // Refresh data
      fetchDashboardData();
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item');
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
    <div className="space-y-4 pt-4">
      {/* Stats Grid - Compact */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gray-800/40 rounded-xl p-3 border border-gray-700/50">
          <div className="text-xs text-gray-400 mb-1">Total Items</div>
          <div className="text-lg font-bold text-white">
            {stats?.total_items || 0}
          </div>
        </div>

        <div className="bg-gray-800/40 rounded-xl p-3 border border-gray-700/50">
          <div className="text-xs text-gray-400 mb-1">Items Owned</div>
          <div className="text-lg font-bold text-green-400">
            {stats?.owned_items || 0}
          </div>
        </div>

        <div className="bg-gray-800/40 rounded-xl p-3 border border-gray-700/50">
          <div className="text-xs text-gray-400 mb-1">Items Sold</div>
          <div className="text-lg font-bold text-blue-400">
            {stats?.sold_items || 0}
          </div>
        </div>

        <div className="bg-gray-800/40 rounded-xl p-3 border border-gray-700/50">
          <div className="text-xs text-gray-400 mb-1">Daily Burn</div>
          <div className="text-lg font-bold text-red-400">
            {stats ? formatCurrency(stats.daily_burn_rate) : '฿0'}
          </div>
        </div>
      </div>

      {/* Bar Chart - Group Burn Rates (Owned Items Only) */}
      <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50 mb-4">
        <h2 className="text-base font-semibold text-white mb-3">
          Burn Rate by Group (Owned)
        </h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={groupData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="group_name" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
            <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#F9FAFB' }}
            />
            <Bar dataKey="avg_burn_rate" fill="#3b82f6" name="Sum ฿/day" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Add Item Form */}
      <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50 mb-4">
        <button
          onClick={() => setShowQuickAdd(!showQuickAdd)}
          className="w-full flex items-center justify-between text-left"
        >
          <h2 className="text-base font-semibold text-white">
            Quick Add Item
          </h2>
          <span className="text-2xl text-gray-400">{showQuickAdd ? '−' : '+'}</span>
        </button>
        
        {showQuickAdd && (
          <div className="mt-4 space-y-3">
            <Input
              type="text"
              placeholder="Item name"
              value={quickAddData.name}
              onChange={(e) => setQuickAddData({ ...quickAddData, name: e.target.value })}
              className="bg-gray-900/60 border-gray-700 text-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Price"
                value={quickAddData.buy_price}
                onChange={(e) => setQuickAddData({ ...quickAddData, buy_price: e.target.value })}
                className="bg-gray-900/60 border-gray-700 text-white"
              />
              <Input
                type="text"
                placeholder="Group (optional)"
                value={quickAddData.group_name}
                onChange={(e) => setQuickAddData({ ...quickAddData, group_name: e.target.value })}
                className="bg-gray-900/60 border-gray-700 text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleQuickAdd} className="flex-1">
                Add Item
              </Button>
              <Button 
                onClick={() => navigate('/items-app/new')}
                variant="secondary"
                className="flex-1"
              >
                Full Form
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Items List Section */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-white">All Items</h2>
        
        <Input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-gray-900/60 border-gray-700 text-white"
        />

        {/* Collapsible Filters */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full text-left text-sm text-gray-400 hover:text-gray-300"
        >
          {showFilters ? '▼' : '▶'} Filters
        </button>

        {showFilters && (
          <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-3 space-y-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedStatus(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  selectedStatus === null
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedStatus('owned')}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  selectedStatus === 'owned'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                Owned
              </button>
              <button
                onClick={() => setSelectedStatus('sold')}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  selectedStatus === 'sold'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                Sold
              </button>
            </div>

            {groups.length > 0 && (
              <select
                value={selectedGroup || ''}
                onChange={(e) => setSelectedGroup(e.target.value || null)}
                className="w-full px-3 py-2 bg-gray-900/60 border border-gray-700/50 rounded-lg text-white text-sm"
              >
                <option value="">All Groups</option>
                {groups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            )}

            {categories.length > 0 && (
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="w-full px-3 py-2 bg-gray-900/60 border border-gray-700/50 rounded-lg text-white text-sm"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Items List */}
        <div className="space-y-2">
          {paginatedItems.map(item => {
            const dailyBurn = calculateItemDailyBurn(item);
            return (
              <div
                key={item.id}
                onClick={() => navigate(`/items-app/${item.id}`)}
                className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-3 active:bg-gray-700/50 cursor-pointer transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-white font-medium flex-1">{item.name}</h3>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ml-2 ${
                    item.status === 'owned'
                      ? 'bg-green-900 text-green-200'
                      : 'bg-blue-900 text-blue-200'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-400">
                  <div className="flex justify-between">
                    <span>{item.group_name || 'No Group'}</span>
                    <span className="text-white font-medium">{formatCurrency(item.buy_price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs">Daily burn:</span>
                    <span className="text-xs text-red-400 font-medium">{formatCurrency(dailyBurn)}/day</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Buy: {format(new Date(item.buy_date), 'MMM dd, yyyy')}</span>
                    {item.sell_date && (
                      <span>Sell: {format(new Date(item.sell_date), 'MMM dd, yyyy')}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No items found</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 pt-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className={`px-3 py-1.5 rounded text-sm ${
                currentPage === 1
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              ←
            </button>
            <span className="text-sm text-gray-300 px-3">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className={`px-3 py-1.5 rounded text-sm ${
                currentPage === totalPages
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
