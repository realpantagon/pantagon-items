import type { ReactNode } from 'react';
import ItemsNavbar from './ItemsNavbar';

interface ItemsAppLayoutProps {
  children: ReactNode;
}

export default function ItemsAppLayout({ children }: ItemsAppLayoutProps) {
  return (
    <div
      className="scan-overlay"
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ── Grid background ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,43,43,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,43,43,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          animation: 'grid-fade 6s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ── Ambient corner glows ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: '-200px',
          left: '-200px',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(179,0,0,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          bottom: '-200px',
          right: '-200px',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(255,43,43,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ── Horizontal energy lines ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: '30%',
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,43,43,0.08), transparent)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: '70%',
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,43,43,0.06), transparent)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ── Noise texture overlay ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
          opacity: 0.4,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ── Navbar ── */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <ItemsNavbar />
      </div>

      {/* ── Main content ── */}
      <main
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '480px',
          margin: '0 auto',
          padding: '16px 16px 80px',
        }}
      >
        {children}
      </main>

      {/* ── Bottom edge glow ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,43,43,0.4), transparent)',
          pointerEvents: 'none',
          zIndex: 100,
        }}
      />
    </div>
  );
}
