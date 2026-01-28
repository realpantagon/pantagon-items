import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

export default function ItemsNavbar() {
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700/50">
      <div className="max-w-md mx-auto px-4">
        <div className="flex justify-between items-center h-14">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center">
              <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                Items
              </span>
            </Link>
          </div>

          <div className="flex gap-4 items-center">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors ${isActive('/') && location.pathname === '/'
                ? 'text-blue-400'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              Dashboard
            </Link>

            <Link
              to="/new"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
