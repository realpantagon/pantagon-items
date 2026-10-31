import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from '../../../shared/components/ThemeToggle';
import { useGoBack } from '../../../shared/hooks/useGoBack';

export default function ItemsNavbar() {
  const { pathname } = useLocation();
  const goBack = useGoBack();
  const isHome = pathname === '/';

  return (
    <header className="top-bar">
      <div
        style={{
          maxWidth: '480px',
          margin: '0 auto',
          height: '52px',
          padding: '0 var(--gutter)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        {isHome ? (
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <img
              src="/box-red.png"
              alt=""
              width={32}
              height={32}
              style={{ borderRadius: '9px', border: '1px solid var(--border-subtle)', flexShrink: 0 }}
            />
            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.01em' }}>
              Items
            </span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={goBack}
            className="pressable"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              height: '44px',
              margin: '0 0 0 -8px',
              padding: '0 8px',
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              fontSize: '1.05rem',
              fontWeight: 500,
            }}
          >
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
            Back
          </button>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
