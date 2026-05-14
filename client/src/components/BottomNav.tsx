import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, Calculator, TrendingUp, Wrench, Settings } from 'lucide-react';

const tabs = [
  { to: '/portfolio', label: 'Portfolio', Icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', Icon: Building2 },
  { to: '/analyzer', label: 'Analyzer', Icon: Calculator },
  { to: '/analytics', label: 'Analytics', Icon: TrendingUp },
  { to: '/vendors', label: 'Vendors', Icon: Wrench },
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
              `flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[9px] font-semibold tracking-wider uppercase transition-colors ${
                isActive ? 'text-brand' : 'text-gray-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? 'text-brand' : 'text-gray-500'} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
