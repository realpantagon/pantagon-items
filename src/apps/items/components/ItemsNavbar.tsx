import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function ItemsNavbar() {
  const location = useLocation();
  const [time, setTime] = useState('');

  useEffect(() => {
    document.documentElement.classList.add('dark');
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const isRoot = location.pathname === '/';

  return (
    <nav
      style={{
        background: 'rgba(5,5,5,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,43,43,0.2)',
        boxShadow: '0 1px 0 rgba(255,43,43,0.1), 0 4px 24px rgba(0,0,0,0.6)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Top energy line */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, var(--neon-red) 30%, var(--neon-red) 70%, transparent 100%)',
          opacity: 0.6,
        }}
      />

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '52px' }}>

          {/* ── Brand ── */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Icon */}
            <div
              style={{
                width: '28px',
                height: '28px',
                border: '1px solid var(--neon-red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 10px rgba(255,43,43,0.4), inset 0 0 8px rgba(255,43,43,0.1)',
                position: 'relative',
                transform: 'rotate(45deg)',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  background: 'var(--neon-red)',
                  boxShadow: '0 0 8px var(--neon-red)',
                }}
              />
            </div>

            <div>
              <div
                className="font-display neon-glow"
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  color: 'var(--neon-red)',
                  lineHeight: 1,
                  animation: 'flicker 8s ease-in-out infinite',
                }}
              >
                PANTAGON
              </div>
              <div
                className="hud-label"
                style={{ marginTop: '2px', letterSpacing: '0.15em', fontSize: '7px' }}
              >
                ASSET CONTROL SYS
              </div>
            </div>
          </Link>

          {/* ── Right side ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

            {/* System clock */}
            <div
              className="font-tech"
              style={{
                fontSize: '10px',
                color: 'var(--text-dim)',
                letterSpacing: '0.1em',
                display: 'none',
              }}
            >
              {time}
            </div>

            {/* Dashboard link */}
            <Link
              to="/"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '9px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                padding: '4px 10px',
                border: `1px solid ${isRoot ? 'rgba(255,43,43,0.5)' : 'rgba(255,255,255,0.06)'}`,
                color: isRoot ? 'var(--neon-red)' : 'var(--text-secondary)',
                background: isRoot ? 'rgba(255,43,43,0.08)' : 'transparent',
                boxShadow: isRoot ? '0 0 10px rgba(255,43,43,0.2)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              GRID
            </Link>

            {/* Add button */}
            <Link
              to="/new"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                border: '1px solid var(--neon-red)',
                color: 'var(--neon-red)',
                background: 'rgba(255,43,43,0.08)',
                boxShadow: '0 0 12px rgba(255,43,43,0.3)',
                textDecoration: 'none',
                flexShrink: 0,
                position: 'relative',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,43,43,0.2)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(255,43,43,0.5)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,43,43,0.08)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 12px rgba(255,43,43,0.3)';
              }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.03)',
          padding: '3px 16px',
          maxWidth: '480px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ position: 'relative', width: '6px', height: '6px' }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: '#00E676',
                animation: 'status-ping 2s ease-in-out infinite',
                opacity: 0.4,
              }}
            />
            <div style={{ position: 'relative', width: '6px', height: '6px', borderRadius: '50%', background: '#00E676', boxShadow: '0 0 6px #00E676' }} />
          </div>
          <span className="hud-label" style={{ fontSize: '7px', color: '#00E676' }}>ONLINE</span>
        </div>
        <div className="hud-label" style={{ fontSize: '7px' }}>SYS//ACTIVE</div>
        <div className="hud-label" style={{ fontSize: '7px', marginLeft: 'auto', fontFamily: 'var(--font-tech)' }}>
          {time}
        </div>
      </div>
    </nav>
  );
}
