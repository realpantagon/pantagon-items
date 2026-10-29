import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import ItemsNavbar from './ItemsNavbar';

interface ItemsAppLayoutProps {
  children: ReactNode;
}

export default function ItemsAppLayout({ children }: ItemsAppLayoutProps) {
  const { pathname } = useLocation();

  // Inner pages start at the top; the dashboard restores its own scroll position
  useEffect(() => {
    if (pathname !== '/') window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="app-shell">
      <ItemsNavbar />
      <main className="page">{children}</main>
    </div>
  );
}
