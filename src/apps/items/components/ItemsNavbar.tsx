import { Link } from 'react-router-dom';
import ThemeToggle from '../../../shared/components/ThemeToggle';

export default function ItemsNavbar() {
  return (
    <nav
      style={{
        background: 'color-mix(in srgb, var(--bg-primary) 78%, transparent)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0.72rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.85rem' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                border: '1px solid var(--border-subtle)',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-elevated)',
                boxShadow: 'var(--shadow-sm)',
                position: 'relative',
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              <img
                src="/box-red.png"
                alt="Pantagon logo"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <div>
              <div
                className="font-display"
                style={{
                  fontSize: '1.55rem',
                  fontWeight: 500,
                  letterSpacing: '0.01em',
                  color: 'var(--text-primary)',
                  lineHeight: 1,
                }}
              >
                Pantagon Items
              </div>
              <div
                className="hud-label"
                style={{ marginTop: '0.25rem', letterSpacing: '0.13em', fontSize: '0.58rem' }}
              >
                Asset registry
              </div>
            </div>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexShrink: 0 }}>
            <Link to="/new" className="nav-action" aria-label="Add new item" title="Add new item">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 5v14m-7-7h14" />
              </svg>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
