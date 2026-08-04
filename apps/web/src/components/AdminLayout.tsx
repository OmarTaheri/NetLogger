import { Link, NavLink, Outlet } from 'react-router-dom';

interface AdminLayoutProps {
  displayName: string;
  onLogout: () => Promise<void>;
}

const navigation = [
  { to: '/admin', end: true, label: 'Overview' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/domains', label: 'Domains' },
];

export default function AdminLayout({ displayName, onLogout }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-hud-bg hud-grid-overlay">
      <header className="sticky top-0 z-20 border-b border-hud-border bg-hud-bg/95 backdrop-blur px-4 md:px-7">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4">
          <Link to="/admin" className="font-mono text-sm uppercase tracking-[.18em] text-hud-text">
            NetLogger <span className="text-hud-accent">// Admin</span>
          </Link>
          <div className="flex items-center gap-3 text-hud-xs font-mono uppercase">
            <span className="hidden text-hud-text-muted sm:block">{displayName}</span>
            <button type="button" onClick={() => { void onLogout(); }} className="text-hud-red hover:text-hud-red/80">Logout</button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[190px_1fr] md:px-7">
        <nav className="flex gap-2 overflow-x-auto border-b border-hud-border pb-3 md:flex-col md:border-b-0 md:border-r md:pb-0 md:pr-5">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `whitespace-nowrap border px-3 py-2 font-mono text-hud-xs uppercase tracking-wider transition-colors ${
                isActive ? 'border-hud-accent bg-hud-accent/10 text-hud-accent' : 'border-transparent text-hud-text-muted hover:border-hud-border hover:text-hud-text-dim'
              }`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <main className="min-w-0"><Outlet /></main>
      </div>
    </div>
  );
}
