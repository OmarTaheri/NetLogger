import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import NoiseLayer from '../components/landing/NoiseLayer';
import { getGuestLinkResults, type GuestLinkResults } from '../api/publicLinks';

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };
  return <button type="button" onClick={copy}>{copied ? 'COPIED' : 'COPY LINK'}</button>;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }).format(new Date(value));
}

export default function GuestResultsPage() {
  const { slug = '' } = useParams();
  const token = useMemo(() => window.location.hash.slice(1), []);
  const [results, setResults] = useState<GuestLinkResults | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug || !token) {
      setError('This private result link is incomplete.');
      return;
    }
    let disposed = false;
    const load = () => getGuestLinkResults(slug, token)
      .then((data) => { if (!disposed) { setResults(data); setError(''); } })
      .catch((caught) => { if (!disposed) setError(caught instanceof Error ? caught.message : 'Results unavailable'); });
    void load();
    const interval = window.setInterval(load, 8000);
    return () => { disposed = true; clearInterval(interval); };
  }, [slug, token]);

  const remaining = results ? Math.max(0, results.link.maxVisits - results.link.visitCount) : 0;

  return (
    <main className="guest-results-shell">
      <NoiseLayer motionEnabled className="quick-create-noise" />
      <header className="quick-create-header">
        <Link to="/" className="quick-create-logo"><i /> NETLOGGER <span>// GUEST RESULTS</span></Link>
        <div><span>LIMITED TELEMETRY</span><Link to="/create">NEW LINK</Link><Link to="/signup" className="primary">UNLOCK FULL DATA</Link></div>
      </header>

      {error ? <section className="guest-results-error"><span>SIGNAL LOST</span><h1>Results unavailable.</h1><p>{error}</p><Link to="/create">CREATE A NEW GUEST LINK</Link></section> : !results ? <section className="guest-results-loading"><i /><span>SYNCING GUEST SIGNAL…</span></section> : <>
        <section className="guest-results-head">
          <div><p>LIVE GUEST LINK // {results.link.slug}</p><h1>{results.link.title || 'Untitled signal'}</h1><span className={results.link.isActive ? 'active' : ''}><i /> {results.link.isActive ? 'COLLECTING' : 'EXPIRED'}</span></div>
          <div className="guest-results-link"><span>SHARE THIS TRACKING LINK</span><code>{results.link.trackingUrl}</code><CopyButton value={results.link.trackingUrl} /></div>
        </section>

        <section className="guest-results-metrics">
          <div><span>CAPTURED VISITS</span><strong>{results.link.visitCount.toString().padStart(2, '0')}</strong><i /></div>
          <div><span>VISITS REMAINING</span><strong>{remaining.toString().padStart(2, '0')}</strong><i /></div>
          <div><span>EXPIRES</span><strong>{formatTime(results.link.expiresAt)}</strong><i /></div>
          <div><span>DATA LEVEL</span><strong>ESSENTIAL</strong><i /></div>
        </section>

        <section className="guest-results-grid">
          <div className="guest-visitor-panel">
            <div className="guest-panel-title"><span>RECENT SIGNALS // AUTO REFRESH</span><strong>{results.recentVisitors.length.toString().padStart(2, '0')} SHOWN</strong></div>
            {results.recentVisitors.length === 0 ? <div className="guest-empty"><i /><strong>WAITING FOR THE FIRST VISIT</strong><p>Share the tracking link. New clicks will appear here automatically.</p></div> : <div className="guest-visitor-table"><div className="head"><span>TIME</span><span>LOCATION</span><span>DEVICE</span><span>HUMAN</span><span>RISK</span></div>{results.recentVisitors.map((visitor) => <div key={visitor.id}><span>{formatTime(visitor.createdAt)}</span><span>{[visitor.ipCity,visitor.ipCountry].filter(Boolean).join(', ') || 'Unknown'}</span><span>{visitor.browser || 'Browser'} / {visitor.os || 'OS'}<small>{visitor.deviceTier || 'unclassified'}</small></span><span>{visitor.humanScore ?? '--'}</span><span className={visitor.vpnDetected ? 'risk' : 'clear'}>{visitor.vpnDetected ? 'VPN' : 'CLEAR'}</span></div>)}</div>}
          </div>

          <aside className="guest-upgrade-panel">
            <p>YOU ARE SEEING THE ESSENTIAL LAYER</p><h2>More signal<br /><span>is waiting.</span></h2><div>{results.limitations.upgradeFeatures.map((feature) => <span key={feature}><i>+</i>{feature}</span>)}</div><Link to="/signup">CREATE FREE ACCOUNT <b>↗</b></Link><small>Private workspace · Persistent links · Google sign-in</small>
          </aside>
        </section>
      </>}
    </main>
  );
}
