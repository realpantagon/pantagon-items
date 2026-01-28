import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../shared/utils/supabase';
import type { PantagonItem } from '../../../api/items/types';
import { enrichItemWithMetrics, formatCurrency } from '../../../api/items/calculations';
import { format } from 'date-fns';

import Button from '../../../shared/components/Button';

export default function ItemDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<PantagonItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchItem(id);
    }
  }, [id]);

  const fetchItem = async (itemId: string) => {
    try {
      const { data, error } = await supabase
        .from('Pantagon_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (error) throw error;
      setItem(data);
    } catch (error) {
      console.error('Error fetching item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!item || !confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase
        .from('Pantagon_items')
        .delete()
        .eq('id', item.id);

      if (error) throw error;
      navigate('/items-app/list');
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl">❓</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Item not found</h2>
        <p className="text-gray-400 mb-6">The item you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => navigate('/')} className="bg-blue-600">
          Back to Library
        </Button>
      </div>
    );
  }

  const enrichedItem = enrichItemWithMetrics(item);

  return (
    <div className="space-y-6 pb-20 pt-4">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors self-start"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back
        </button>

        <div className="flex justify-between items-start">
          <div>
            <div className="mb-1">
              <h1 className="text-3xl font-bold text-white tracking-tight">{item.name}</h1>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${item.status === 'owned'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                }`}>
                {item.status}
              </span>
              <span className="text-gray-600 self-center mx-1">•</span>
              <p className="text-gray-400 flex items-center gap-2 text-sm">
                <span className="text-gray-300 font-medium">
                  {item.group_name || 'Uncategorized'}
                </span>
                <span className="text-gray-600">•</span>
                <span>{item.category || 'No Category'}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Financial Card */}
        <div className="bg-gray-800/30 backdrop-blur-md border border-gray-700/30 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-700/30 pb-4">
            <span className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </span>
            <h2 className="text-lg font-bold text-white">Financial Details</h2>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Buy Price</p>
              <p className="text-2xl font-bold text-white tracking-tight">{formatCurrency(item.buy_price)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Cost</p>
              <p className="text-2xl font-bold text-blue-400 tracking-tight">{formatCurrency(enrichedItem.real_cost)}</p>
            </div>

            {item.extra_cost > 0 && (
              <div className="col-span-2 bg-gray-900/50 rounded-xl p-3 border border-gray-700/50 flex justify-between items-center">
                <span className="text-sm text-gray-400">Extra Costs</span>
                <span className="font-mono text-white">{formatCurrency(item.extra_cost)}</span>
              </div>
            )}

            {item.sell_date && (
              <>
                <div className="pt-2 border-t border-gray-700/30 col-span-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Sell Price</p>
                  <p className="text-xl font-bold text-white">{item.sell_price ? formatCurrency(item.sell_price) : '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Profit/Loss</p>
                  <p className={`text-xl font-bold ${(enrichedItem.profit || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {enrichedItem.profit ? formatCurrency(enrichedItem.profit) : '-'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Performance Card */}
        <div className="bg-gray-800/30 backdrop-blur-md border border-gray-700/30 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-700/30 pb-4">
            <span className="p-2 bg-red-500/10 rounded-lg text-red-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </span>
            <h2 className="text-lg font-bold text-white">Performance</h2>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500 font-medium">Daily Burn Rate</p>
                {item.status === 'sold' && <span className="text-[10px] text-gray-600 uppercase">Average while owned</span>}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-red-400">
                  {item.status === 'owned'
                    ? formatCurrency(enrichedItem.cost_per_day || 0)
                    : formatCurrency(enrichedItem.avg_cost_per_day_sold || 0)
                  }
                  <span className="text-sm font-normal text-gray-500">/day</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900/30 rounded-xl p-3 border border-gray-700/30">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Duration</p>
                <p className="text-lg font-semibold text-white">{enrichedItem.days_held} days</p>
              </div>
              <div className="bg-gray-900/30 rounded-xl p-3 border border-gray-700/30">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Purchase Date</p>
                <p className="text-lg font-semibold text-white">{format(new Date(item.buy_date), 'MMM d, yyyy')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="md:col-span-2 bg-gray-800/30 backdrop-blur-md border border-gray-700/30 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-700/30 pb-4">
            <span className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </span>
            <h2 className="text-lg font-bold text-white">Details & Notes</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Purchase Source</p>
                <p className="text-base text-white">{item.purchase_source || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Warranty Expiration</p>
                <p className={`text-base ${item.warranty_expire_date ? 'text-white' : 'text-gray-600'}`}>
                  {item.warranty_expire_date ? format(new Date(item.warranty_expire_date), 'MMM d, yyyy') : 'No warranty info'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {(item.note || item.reason_to_sell) ? (
                <>
                  {item.note && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Notes</p>
                      <p className="text-base text-gray-300 bg-black/20 p-3 rounded-lg border border-gray-700/50">{item.note}</p>
                    </div>
                  )}
                  {item.reason_to_sell && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Reason for selling</p>
                      <p className="text-base text-gray-300 bg-black/20 p-3 rounded-lg border border-gray-700/50">{item.reason_to_sell}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-600 italic">
                  No additional notes recorded
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="fixed bottom-6 left-0 right-0 max-w-md mx-auto px-4 z-10">
        <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700 rounded-2xl p-2 shadow-2xl flex gap-3">
          <Button
            onClick={() => navigate(`/${item.id}/edit`)}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-lg shadow-blue-500/20"
            size="lg"
          >
            Edit Item
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            className="flex-none w-1/3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30"
            size="lg"
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="text-center text-xs text-gray-600 pt-8 pb-20">
        Created {format(new Date(item.created_at), 'MMM d, yyyy')} • Updated {format(new Date(item.updated_at), 'MMM d, yyyy')}
      </div>
    </div>
  );
}
