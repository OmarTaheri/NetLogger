import { type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react';

// ── HudPanel ──────────────────────────────────────────────────────────
const ANIM_CLASSES = [
  'animate-hud-blink',
  'animate-hud-blink-delay-1',
  'animate-hud-blink-delay-2',
  'animate-hud-blink-delay-3',
  'animate-hud-blink-delay-4',
  'animate-hud-blink-delay-5',
  'animate-hud-blink-delay-6',
  'animate-hud-blink-delay-7',
  'animate-hud-blink-delay-8',
];

function animClass(delay: number): string {
  return `opacity-0 ${ANIM_CLASSES[delay] ?? ANIM_CLASSES[0]}`;
}

interface HudPanelProps {
  children: ReactNode;
  className?: string;
  corners?: boolean;
  animate?: boolean;
  animationDelay?: number;
}

export function HudPanel({ children, className = '', corners = false, animate = false, animationDelay = 0 }: HudPanelProps) {
  const ac = animate ? animClass(animationDelay) : '';
  return (
    <div className={`bg-hud-surface/50 border border-hud-border ${corners ? 'hud-corners' : ''} ${ac} ${className}`}>
      {children}
    </div>
  );
}

// ── HudStatCard ───────────────────────────────────────────────────────
interface HudStatCardProps {
  label: string;
  value: string | number;
  animate?: boolean;
  animationDelay?: number;
  progress?: number;
}

export function HudStatCard({ label, value, animate = false, animationDelay = 0, progress }: HudStatCardProps) {
  const ac = animate ? animClass(animationDelay) : '';
  return (
    <div className={`hud-corners bg-hud-surface/50 border border-hud-border p-4 ${ac}`}>
      <p className="text-hud-xs uppercase tracking-widest font-mono text-hud-text-dim mb-1">{label}</p>
      <p className="text-2xl font-mono text-hud-accent">{value}</p>
      {progress != null && (
        <div className="mt-2 h-px bg-white/5">
          <div className="h-full bg-hud-accent/40" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
        </div>
      )}
    </div>
  );
}

// ── HudButton ─────────────────────────────────────────────────────────
interface HudButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  children: ReactNode;
}

export function HudButton({ variant = 'primary', children, className = '', ...props }: HudButtonProps) {
  const base = 'uppercase tracking-wider font-mono text-hud-sm px-4 py-2 transition-all duration-150 disabled:opacity-40';
  const variants: Record<string, string> = {
    primary: 'bg-hud-accent text-black hover:bg-hud-accent/80 shadow-hud-glow',
    secondary: 'border border-hud-accent/50 text-hud-accent hover:bg-hud-accent/10',
    danger: 'border border-hud-red/50 text-hud-red hover:bg-hud-red/10',
    ghost: 'text-hud-text-dim hover:text-hud-text hover:bg-white/5',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

// ── HudInput ──────────────────────────────────────────────────────────
interface HudInputProps extends InputHTMLAttributes<HTMLInputElement> {}

export function HudInput({ className = '', ...props }: HudInputProps) {
  return (
    <input
      className={`w-full bg-hud-bg border border-hud-border px-3 py-2 font-mono text-sm text-hud-text placeholder:text-hud-text-muted focus:outline-none focus:border-hud-accent/50 focus:shadow-hud-glow transition-all ${className}`}
      {...props}
    />
  );
}

// ── HudSelect ─────────────────────────────────────────────────────────
interface HudSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode;
}

export function HudSelect({ className = '', children, ...props }: HudSelectProps) {
  return (
    <div className="relative">
      <select
        className={`w-full bg-hud-bg border border-hud-border px-3 py-2 font-mono text-sm text-hud-text appearance-none focus:outline-none focus:border-hud-accent/50 focus:shadow-hud-glow transition-all pr-8 ${className}`}
        {...props}
      >
        {children}
      </select>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-hud-accent">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

// ── HudBadge ──────────────────────────────────────────────────────────
interface HudBadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'muted';
}

export function HudBadge({ children, variant = 'default' }: HudBadgeProps) {
  const variants: Record<string, string> = {
    default: 'border-hud-accent/40 text-hud-accent bg-hud-accent/10',
    success: 'border-hud-green/40 text-hud-green bg-hud-green/10',
    danger: 'border-hud-red/40 text-hud-red bg-hud-red/10',
    warning: 'border-hud-yellow/40 text-hud-yellow bg-hud-yellow/10',
    info: 'border-hud-blue/40 text-hud-blue bg-hud-blue/10',
    muted: 'border-hud-text-muted/40 text-hud-text-muted bg-white/5',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 border text-hud-xs uppercase font-mono ${variants[variant]}`}>
      {children}
    </span>
  );
}

// ── HudSectionTitle ───────────────────────────────────────────────────
interface HudSectionTitleProps {
  children: ReactNode;
  className?: string;
  animate?: boolean;
  animationDelay?: number;
}

export function HudSectionTitle({ children, className = '', animate = false, animationDelay = 0 }: HudSectionTitleProps) {
  const ac = animate ? animClass(animationDelay) : '';
  return (
    <div className={`flex items-center gap-3 mb-3 ${ac} ${className}`}>
      <div className="w-1 h-4 bg-hud-accent" />
      <h3 className="text-sm uppercase tracking-widest font-mono text-hud-text-dim">{children}</h3>
    </div>
  );
}

// ── HudPageTitle ──────────────────────────────────────────────────────
interface HudPageTitleProps {
  children: ReactNode;
  subtitle?: string;
  animate?: boolean;
  animationDelay?: number;
}

export function HudPageTitle({ children, subtitle, animate = false, animationDelay = 0 }: HudPageTitleProps) {
  const ac = animate ? animClass(animationDelay) : '';
  return (
    <div className={`mb-6 ${ac}`}>
      <h2 className="text-2xl uppercase tracking-widest font-mono text-hud-text">{children}</h2>
      {subtitle && <p className="text-hud-xs uppercase tracking-widest font-mono text-hud-text-muted mt-1">{subtitle}</p>}
      <div className="mt-2 h-px bg-gradient-to-r from-hud-accent/60 via-hud-accent/20 to-transparent" />
    </div>
  );
}
