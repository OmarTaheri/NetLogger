import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

export default function AuthShell({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches), []);
  return (
    <main className="auth-shell">
      <div className="marketing-noise" />
      <video className="auth-shell__video" src="/media/videos/hero.mp4" autoPlay={!reduceMotion} muted loop playsInline aria-hidden="true" />
      <div className="auth-shell__wash" />
      <Link to="/" className="auth-shell__brand" aria-label="NetLogger home">
        <span className="auth-shell__pulse" /> NETLOGGER
      </Link>
      <section className="auth-card">
        <p className="auth-card__eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <div className="auth-card__rule" />
        {children}
      </section>
      <p className="auth-shell__status">SYSTEM ONLINE <span>//</span> PRIVATE SESSION</p>
    </main>
  );
}
