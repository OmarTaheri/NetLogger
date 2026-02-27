import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

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
  {
    to: '/webhooks',
    label: 'Webhooks',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function Layout({ username, onLogout }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useKeyboardShortcuts();

  // Close sidebar on route change
  useEffect(() => {
    const handler = () => setSidebarOpen(false);
    window.addEventListener('close-modals', handler);
    return () => window.removeEventListener('close-modals', handler);
  }, []);

  return (
    <div className="flex flex-col h-screen">
      {/* Header bar */}
      <header className="h-10 bg-hud-bg border-b border-hud-border flex items-center justify-between px-4 flex-shrink-0 opacity-0 animate-hud-blink">
        <div className="flex items-center gap-3">
          {/* Hamburger for mobile */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden text-hud-text-muted hover:text-hud-text transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="w-2 h-2 bg-hud-accent rounded-full animate-hud-pulse" />
          <span className="font-mono text-hud-sm uppercase tracking-widest text-hud-text-dim hidden sm:inline">
            GPS TRACKER <span className="text-hud-accent">//</span> TACTICAL HUD
          </span>
          <span className="font-mono text-hud-sm uppercase tracking-widest text-hud-text-dim sm:hidden">
            GPS <span className="text-hud-accent">//</span> HUD
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-hud-green rounded-full" />
              <span className="text-hud-xs uppercase font-mono text-hud-text-muted">SYS ONLINE</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-hud-green rounded-full" />
              <span className="text-hud-xs uppercase font-mono text-hud-text-muted">WS CONNECTED</span>
            </span>
          </div>
          <div className="w-px h-4 bg-hud-border hidden sm:block" />
          <HudClock />
          <div className="w-px h-4 bg-hud-border" />
          <span className="font-mono text-hud-xs uppercase text-hud-text-dim hidden sm:inline">{username}</span>
          <button
            onClick={onLogout}
            className="font-mono text-hud-xs uppercase text-hud-red hover:text-hud-red/80 transition-colors"
          >
            LOGOUT
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          fixed md:static inset-y-0 left-0 z-50 md:z-auto
          w-16 bg-hud-bg border-r border-hud-border flex flex-col items-center py-4 gap-2 flex-shrink-0
          transition-transform duration-200 ease-in-out
          mt-10 md:mt-0
          opacity-100 md:opacity-0 md:animate-hud-blink-delay-1
        `}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={item.label}
              onClick={() => setSidebarOpen(false)}
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
          <div className="relative z-10 p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
