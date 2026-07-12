import { Link } from 'react-router-dom';
import ThemeToggle from '../../../shared/components/ThemeToggle';

export default function ItemsNavbar() {
  return (
    <nav
      style={{
        background: 'color-mix(in srgb, var(--bg-primary) 84%, transparent)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0.75rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.85rem' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
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
                  fontSize: '1rem',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  color: 'var(--text-primary)',
                  lineHeight: 1,
                }}
              >
                Pantagon Items
              </div>
              <div
                className="hud-label"
                style={{ marginTop: '0.2rem', letterSpacing: '0.14em', fontSize: '0.65rem' }}
              >
                Asset registry
              </div>
            </div>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexShrink: 0 }}>
            <Link
              to="/new"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '2.5rem',
                height: '2.5rem',
                border: '1px solid var(--border-subtle)',
                color: 'var(--accent-strong)',
                background: 'color-mix(in srgb, var(--accent) 8%, var(--bg-elevated))',
                boxShadow: 'var(--shadow-sm)',
                textDecoration: 'none',
                flexShrink: 0,
                borderRadius: '999px',
                transition: 'all 0.16s ease',
              }}
              aria-label="Add new item"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m-7-7h14" />
              </svg>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
