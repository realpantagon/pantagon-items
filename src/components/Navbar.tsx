import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from '../shared/components/ThemeToggle';

export default function Navbar() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(20px)', background: 'color-mix(in srgb, var(--bg-primary) 84%, transparent)', borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="mx-auto max-w-[720px] px-4">
        <div className="flex min-h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 text-[1rem] font-semibold text-[var(--text-primary)] no-underline">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[var(--shadow-sm)]">
              <span className="h-3 w-3 rounded-full bg-[var(--accent)]" />
            </span>
            Pantagon Items
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className={`ui-button ui-button--sm ${isActive('/') && location.pathname === '/' ? 'ui-button--primary' : 'ui-button--secondary'}`}
            >
              Dashboard
            </Link>
            <Link
              to="/items"
              className={`ui-button ui-button--sm ${isActive('/items') ? 'ui-button--primary' : 'ui-button--secondary'}`}
            >
              Items
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
