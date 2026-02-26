import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

interface LayoutProps {
  username: string;
  onLogout: () => void;
}

function HudClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="font-mono text-hud-sm text-hud-text-dim tabular-nums">
      {time.toLocaleTimeString('en-US', { hour12: false })}
    </span>
  );
}

const navItems = [
  {
    to: '/',
    end: true,
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" />
      </svg>
    ),
  },
  {
    to: '/links',
    label: 'Links',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
  {
    to: '/visitors',
    label: 'Visitors',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    to: '/domains',
    label: 'Domains',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
  },
];

export default function Layout({ username, onLogout }: LayoutProps) {
  return (
    <div className="flex flex-col h-screen">
      {/* Header bar */}
      <header className="h-10 bg-hud-bg border-b border-hud-border flex items-center justify-between px-4 flex-shrink-0 opacity-0 animate-hud-blink">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-hud-accent rounded-full animate-hud-pulse" />
          <span className="font-mono text-hud-sm uppercase tracking-widest text-hud-text-dim">
            GPS TRACKER <span className="text-hud-accent">//</span> TACTICAL HUD
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-hud-green rounded-full" />
              <span className="text-hud-xs uppercase font-mono text-hud-text-muted">SYS ONLINE</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-hud-green rounded-full" />
              <span className="text-hud-xs uppercase font-mono text-hud-text-muted">WS CONNECTED</span>
            </span>
          </div>
          <div className="w-px h-4 bg-hud-border" />
          <HudClock />
          <div className="w-px h-4 bg-hud-border" />
          <span className="font-mono text-hud-xs uppercase text-hud-text-dim">{username}</span>
          <button
            onClick={onLogout}
            className="font-mono text-hud-xs uppercase text-hud-red hover:text-hud-red/80 transition-colors"
          >
            LOGOUT
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Narrow icon sidebar */}
        <aside className="w-16 bg-hud-bg border-r border-hud-border flex flex-col items-center py-4 gap-2 flex-shrink-0 opacity-0 animate-hud-blink-delay-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={item.label}
              className={({ isActive }) =>
                `relative w-10 h-10 flex items-center justify-center transition-colors group ${
                  isActive
                    ? 'text-hud-accent'
                    : 'text-hud-text-muted hover:text-hud-text-dim'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-hud-accent" />
                  )}
                  {item.icon}
                  <div className="absolute left-full ml-2 px-2 py-1 bg-hud-surface border border-hud-border font-mono text-hud-xs uppercase text-hud-text whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {item.label}
                  </div>
                </>
              )}
            </NavLink>
          ))}
        </aside>

        {/* Main content area */}
        <main className="flex-1 overflow-auto bg-hud-bg-alt hud-grid-overlay hud-scanline-overlay">
          <div className="relative z-10 p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
