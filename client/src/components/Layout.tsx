import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';

const hideNavRoutes = ['/projects/new', '/projects/edit'];

export default function Layout() {
  const { pathname } = useLocation();
  const hideNav = hideNavRoutes.some(r => pathname.includes(r)) || pathname.endsWith('/edit');

  return (
    <div className="flex flex-col h-full bg-surface-900 max-w-md mx-auto relative">
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
