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

      <main style={{ position: 'relative', zIndex: 1, maxWidth: '430px', margin: '0 auto', padding: '0.9rem 0.9rem 5.5rem' }}>
        {children}
      </main>
    </div>
  );
}
