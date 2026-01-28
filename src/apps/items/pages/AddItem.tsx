import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../shared/utils/supabase';
import { format } from 'date-fns';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import Select from '../../../shared/components/Select';

export default function AddItem() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [existingGroups, setExistingGroups] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    group_name: '',
    buy_date: format(new Date(), 'yyyy-MM-dd'),
    buy_price: '',
    extra_cost: '0',
    sell_date: '',
    sell_price: '',
    purchase_source: '',
    status: 'owned',
    warranty_expire_date: '',
    note: '',
    daily_burn: true,
  });

  useEffect(() => {
    fetchExistingOptions();
  }, []);

  const fetchExistingOptions = async () => {
    try {
      const { data } = await supabase
        .from('Pantagon_items')
        .select('category, group_name');

      if (data) {
        const categories = Array.from(new Set(data.map(item => item.category).filter(Boolean))) as string[];
        const groups = Array.from(new Set(data.map(item => item.group_name).filter(Boolean))) as string[];
        setExistingCategories(categories);
        setExistingGroups(groups);
      }
    } catch (error) {
      console.error('Error fetching options:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    // Handle checkbox
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFormData(prev => ({ ...prev, [name]: newValue }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.buy_date) {
      newErrors.buy_date = 'Buy date is required';
    }
    if (!formData.buy_price || parseFloat(formData.buy_price) <= 0) {
      newErrors.buy_price = 'Buy price must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('Pantagon_items')
        .insert([{
          name: formData.name.trim(),
          category: formData.category.trim() || null,
          group_name: formData.group_name.trim() || null,
          buy_date: formData.buy_date,
          buy_price: parseFloat(formData.buy_price),
          extra_cost: parseFloat(formData.extra_cost) || 0,
          purchase_source: formData.purchase_source.trim() || null,
          status: formData.status,
          warranty_expire_date: formData.warranty_expire_date || null,
          note: formData.note.trim() || null,
          daily_burn: formData.daily_burn,
          sell_date: formData.status === 'sold' && formData.sell_date ? formData.sell_date : null,
          sell_price: formData.status === 'sold' && formData.sell_price ? parseFloat(formData.sell_price) : null,
        }])
        .select()
        .single();

      if (error) throw error;

      navigate('/items-app/list');
    } catch (error) {
      console.error('Error creating item:', error);
      alert('Failed to create item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Add Item</h1>
        <Button variant="secondary" onClick={() => navigate('/items-app/list')}>
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 space-y-3">
          <Input
            label="Name *"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="e.g., iPhone 14 Pro"
            className="bg-[#1a1a1a] border-gray-700 text-white"
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Category
            </label>
            <input
              list="categories"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="Select or type new..."
              className="w-full px-3 py-2 bg-gray-900/60 border border-gray-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
            />
            <datalist id="categories">
              {existingCategories.map(cat => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Group
            </label>
            <input
              list="groups"
              name="group_name"
              value={formData.group_name}
              onChange={handleChange}
              placeholder="Select or type new..."
              className="w-full px-3 py-2 bg-gray-900/60 border border-gray-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
            />
            <datalist id="groups">
              {existingGroups.map(group => (
                <option key={group} value={group} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Buy Date *"
              name="buy_date"
              type="date"
              value={formData.buy_date}
              onChange={handleChange}
              error={errors.buy_date}
              className="bg-[#1a1a1a] border-gray-700 text-white"
            />

            <Input
              label="Buy Price * (฿)"
              name="buy_price"
              type="number"
              step="0.01"
              value={formData.buy_price}
              onChange={handleChange}
              error={errors.buy_price}
              placeholder="0.00"
              className="bg-[#1a1a1a] border-gray-700 text-white"
            />

            <Input
              label="Extra Cost (฿)"
              name="extra_cost"
              type="number"
              step="0.01"
              value={formData.extra_cost}
              onChange={handleChange}
              placeholder="0.00"
              className="bg-[#1a1a1a] border-gray-700 text-white"
            />

            <Select
              label="Status *"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={[
                { value: 'owned', label: 'Owned' },
                { value: 'sold', label: 'Sold' },
              ]}
              className="bg-[#1a1a1a] border-gray-700 text-white"
            />
          </div>

          {/* Conditional Sell Fields */}
          {formData.status === 'sold' && (
            <div className="grid grid-cols-2 gap-3 bg-gray-900/30 p-3 rounded-lg border border-gray-700/30">
              <Input
                label="Sell Date"
                name="sell_date"
                type="date"
                value={formData.sell_date}
                onChange={handleChange}
                className="bg-[#1a1a1a] border-gray-700 text-white"
              />
              <Input
                label="Sell Price (฿)"
                name="sell_price"
                type="number"
                step="0.01"
                value={formData.sell_price}
                onChange={handleChange}
                placeholder="0.00"
                className="bg-[#1a1a1a] border-gray-700 text-white"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="daily_burn"
              name="daily_burn"
              checked={formData.daily_burn}
              onChange={handleChange}
              className="w-4 h-4 rounded border-gray-700 bg-gray-900/60 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="daily_burn" className="text-sm font-medium text-gray-300">
              Include in Daily Burn calculation
            </label>
          </div>

          <Input
            label="Purchase Source"
            name="purchase_source"
            value={formData.purchase_source}
            onChange={handleChange}
            placeholder="e.g., Apple Store"
            className="bg-[#1a1a1a] border-gray-700 text-white"
          />

          <Input
            label="Warranty Expire"
            name="warranty_expire_date"
            type="date"
            value={formData.warranty_expire_date}
            onChange={handleChange}
            className="bg-[#1a1a1a] border-gray-700 text-white"
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Note
            </label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900/60 text-white placeholder-gray-500 text-sm"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => navigate('/items-app/list')} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create'}
            </Button>

          </div>
        </div>
      </form>
    </div>
  );
}
