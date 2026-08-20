import type { ReactNode } from 'react';
import ItemsNavbar from './ItemsNavbar';

interface ItemsAppLayoutProps {
  children: ReactNode;
}

export default function ItemsAppLayout({ children }: ItemsAppLayoutProps) {
  return (
    <div className="app-shell">
      <div style={{ position: 'relative', zIndex: 10 }}>
        <ItemsNavbar />
      </div>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: '760px', margin: '0 auto', padding: '1rem 0.95rem 6rem' }}>
        {children}
      </main>
    </div>
  );
}
