import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../../api/items/calculations';
import type { PantagonItem } from '../../../api/items/types';

interface ItemCardProps {
    item: PantagonItem;
    dailyBurn: number;
}

export default function ItemCard({ item, dailyBurn }: ItemCardProps) {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate(`/${item.id}`)}
            className="group relative bg-gray-800/20 border border-gray-700/30 hover:bg-gray-800/40 hover:border-gray-600/50 rounded-2xl p-4 cursor-pointer transition-all duration-300"
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex-1 pr-4">
                    <h3 className="text-white font-semibold text-base mb-1 group-hover:text-blue-400 transition-colors">
                        {item.name}
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium bg-gray-800/80 px-2 py-0.5 rounded border border-gray-700/50">
                            {item.group_name || 'No Group'}
                        </span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-white font-bold tracking-tight">
                        {formatCurrency(item.buy_price)}
                    </div>
                    <div className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${item.status === 'owned'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                        }`}>
                        {item.status}
                    </div>
                </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-700/30 flex justify-between items-center text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                    {item.status === 'owned' && item.daily_burn && (
                        <>
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-red-300 font-medium">
                                {formatCurrency(dailyBurn)}/day
                            </span>
                        </>
                    )}
                </div>

                <div>
                    {item.status === 'sold' && item.sell_date ? (
                        <span>Sold {format(new Date(item.sell_date), 'MMM d, yyyy')}</span>
                    ) : (
                        <span>Bought {format(new Date(item.buy_date), 'MMM d, yyyy')}</span>
                    )}
                </div>
            </div>
        </div>
    );
}
