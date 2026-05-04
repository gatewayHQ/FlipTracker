import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, Wallet, TrendingUp, Settings } from 'lucide-react';

const tabs = [
  { to: '/portfolio', label: 'Portfolio', Icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', Icon: Building2 },
  { to: '/capital', label: 'Capital', Icon: Wallet },
  { to: '/analytics', label: 'Analytics', Icon: TrendingUp },
  { to: '/settings', label: 'Settings', Icon: Settings },
];

export default function BottomNav() {
  return (
    <nav className="bg-surface-800 border-t border-surface-400/30 safe-bottom">
      <div className="flex">
        {tabs.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-3 gap-1 text-[10px] font-semibold tracking-wider uppercase transition-colors ${
                isActive ? 'text-brand' : 'text-gray-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} className={isActive ? 'text-brand' : 'text-gray-500'} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
