import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { TEMPLATES, type Domain, type TemplateId } from '@netlogger/shared/types';
import { createGuestLink, getGuestLinkConfig, type GuestLinkConfig, type GuestTemplateId } from '../api/publicLinks';
import { createLink } from '../api/links';
import { getDomains } from '../api/domains';
import { getTemplatePreview } from '../api/templates';
import { useAuth } from '../hooks/useAuth';

const fallbackConfig: GuestLinkConfig = {
  defaultDomain: 'netlogger.local',
  templates: [
    { id: 'redirect', name: 'Signal Redirect', description: 'A clean branded transition before the destination opens.' },
    { id: 'captcha', name: 'Human Check', description: 'A lightweight verification step before continuing.' },
  ],
  lockedTemplates: ['Google Drive', 'Dropbox', 'WeTransfer'],
  limits: { lifetimeHours: 24, maxVisits: 25, customDomains: false, gpsModes: ['optional', 'disabled'] },
};

const templateIcons: Record<TemplateId, string> = {
  redirect: '->',
  gdrive: 'GD',
  dropbox: 'DB',
  captcha: 'OK',
  wetransfer: 'WT',
};

type CreatedSignal = {
  mode: 'guest' | 'account';
  slug: string;
  trackingUrl: string;
  resultsUrl: string;
  visitCount: number;
};

function CopyButton({ value, label = 'COPY' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };
  return <button type="button" className="quick-copy" onClick={copy}>{copied ? 'COPIED' : label}</button>;
}

function LockMark() {
  return (
    <svg className="quick-lock-mark" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 10V7a5 5 0 0110 0v3m-11 0h12v10H6V10z" />
    </svg>
  );
}

export default function PublicCreateLinkPage() {
  const { user } = useAuth();
  const accountMode = Boolean(user);
  const [config, setConfig] = useState(fallbackConfig);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [templateId, setTemplateId] = useState<TemplateId>('redirect');
  const [title, setTitle] = useState('Campaign signal');
  const [slug, setSlug] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [gpsMode, setGpsMode] = useState<'required' | 'optional' | 'disabled'>('optional');
  const [domainId, setDomainId] = useState<number | undefined>();
  const [expiresAt, setExpiresAt] = useState('');
  const [maxVisits, setMaxVisits] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('Signal acquired');
  const [subMessage, setSubMessage] = useState('Opening your destination');
  const [siteTitle, setSiteTitle] = useState('Human verification');
  const [captchaMessage, setCaptchaMessage] = useState('Confirm you are human to continue.');
  const [fileName, setFileName] = useState('Quarterly-report.pdf');
  const [fileType, setFileType] = useState<'pdf' | 'doc' | 'sheet' | 'slide' | 'image' | 'zip'>('pdf');
  const [fileSize, setFileSize] = useState('4.8 MB');
  const [ownerEmail, setOwnerEmail] = useState('team@example.com');
  const [folderName, setFolderName] = useState('Shared campaign assets');
  const [dropboxMessage, setDropboxMessage] = useState('You have been invited to view this folder.');
  const [senderEmail, setSenderEmail] = useState('sender@example.com');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<CreatedSignal | null>(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(true);

  useEffect(() => {
    getGuestLinkConfig().then(setConfig).catch(() => {});
  }, []);

  useEffect(() => {
    if (!accountMode) {
      setDomains([]);
      setDomainId(undefined);
      setTemplateId((current) => ['redirect', 'captcha'].includes(current) ? current : 'redirect');
      setGpsMode((current) => current === 'required' ? 'optional' : current);
      return;
    }
    getDomains().then((items) => setDomains(items.filter((item) => item.isActive))).catch(() => setDomains([]));
  }, [accountMode]);

  const templates = accountMode ? TEMPLATES : config.templates;
  const selectedTemplate = useMemo(
    () => TEMPLATES.find((template) => template.id === templateId) || TEMPLATES[0],
    [templateId],
  );
  const selectedDomain = domains.find((domain) => domain.id === domainId)?.domain || config.defaultDomain;
  const displaySlug = created?.slug || slug || 'signal-preview';

  const templateOptions = (): Record<string, string> => {
    if (templateId === 'redirect') return { loadingMessage, subMessage };
    if (templateId === 'captcha') return { siteTitle, message: captchaMessage };
    if (templateId === 'gdrive') return { fileName, fileType, fileSize, ownerEmail, message: 'A file was shared with you.' };
    if (templateId === 'dropbox') return { folderName, ownerEmail, message: dropboxMessage };
    return { fileName, fileSize, senderEmail };
  };

  useEffect(() => {
    let active = true;
    setPreviewLoading(true);
    getTemplatePreview(templateId, templateOptions())
      .then(({ html }) => {
        if (active) setPreviewHtml(html);
      })
      .catch(() => {
        if (active) setPreviewHtml('');
      })
      .finally(() => {
        if (active) setPreviewLoading(false);
      });

    return () => {
      active = false;
    };
  }, [templateId, loadingMessage, subMessage, siteTitle, captchaMessage, fileName, fileType, fileSize, ownerEmail, folderName, dropboxMessage, senderEmail]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    let destination: URL;
    try {
      destination = new URL(targetUrl);
    } catch {
      setError('Enter a complete destination URL.');
      return;
    }
    if (!['https:', 'http:'].includes(destination.protocol) || (!accountMode && destination.protocol !== 'https:')) {
      setError(accountMode ? 'Destination must use HTTP or HTTPS.' : 'Guest links require an HTTPS destination.');
      return;
    }

    setSubmitting(true);
    try {
      if (accountMode) {
        const result = await createLink({
          targetUrl,
          templateId,
          title: title || undefined,
          slug: slug.trim() || undefined,
          templateOptions: templateOptions(),
          gpsMode,
          domainId,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
          maxVisits: maxVisits ? Number(maxVisits) : undefined,
        });
        setCreated({ mode: 'account', slug: result.slug, trackingUrl: result.trackingUrl, resultsUrl: `/app/links/${result.id}`, visitCount: result.visitCount });
      } else {
        const result = await createGuestLink({
          targetUrl,
          templateId: templateId as GuestTemplateId,
          title: title || undefined,
          templateOptions: templateOptions(),
          gpsMode: gpsMode as 'optional' | 'disabled',
          domainChoice: 'default',
        });
        setCreated({ mode: 'guest', slug: result.slug, trackingUrl: result.trackingUrl, resultsUrl: result.resultsUrl, visitCount: result.visitCount });
      }
      requestAnimationFrame(() => {
        const dashboardScroller = document.getElementById('dashboard-scroll-root');
        if (dashboardScroller) dashboardScroller.scrollTo({ top: 0, behavior: 'smooth' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not create this link.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`quick-create-shell quick-create-shell--embedded ${accountMode ? 'is-account-mode' : 'is-guest-mode'}`}>
      {created ? (
        <section className="quick-result">
          <div className="quick-result__signal"><span>LINK CREATED</span><i /><strong>{created.visitCount.toString().padStart(2, '0')}</strong><small>CAPTURED VISITS</small></div>
          <div className="quick-result__content">
            <p>03 / DEPLOY</p>
            <h2>Your signal<br />is live.</h2>
            <div className="quick-result__url"><span>TRACKING LINK</span><code>{created.trackingUrl}</code><CopyButton value={created.trackingUrl} /></div>
            {created.mode === 'guest' && <div className="quick-result__url quick-result__url--results"><span>PRIVATE RESULTS LINK</span><code>{created.resultsUrl}</code><CopyButton value={created.resultsUrl} /></div>}
            <div className="quick-result__actions">
              <a href={created.resultsUrl}>{created.mode === 'account' ? 'OPEN FULL ANALYTICS' : 'OPEN LIMITED RESULTS'} <b>-&gt;</b></a>
              <button type="button" onClick={() => setCreated(null)}>CREATE ANOTHER</button>
            </div>
            {created.mode === 'guest' ? <div className="quick-upgrade-strip">
              <div><span>UNLOCK THE FULL SIGNAL</span><strong>Keep links forever. See every fingerprint.</strong><p>Custom domains, GPS detail, exports, risk analysis, webhooks and all templates are available with a private account.</p></div>
              <Link to="/signup">CREATE FREE ACCOUNT <b>-&gt;</b></Link>
            </div> : <div className="quick-upgrade-strip quick-upgrade-strip--account">
              <div><span>SAVED TO YOUR ACCOUNT</span><strong>Full analytics are already connected.</strong><p>Visitor details, charts, exports, risk analysis and live updates will appear in this link's dashboard.</p></div>
              <Link to="/app/links">VIEW ALL LINKS <b>-&gt;</b></Link>
            </div>}
          </div>
        </section>
      ) : (
        <section className="quick-builder">
          <form onSubmit={handleSubmit} className="quick-builder__form">
            <div className="quick-builder__section">
              <p>01 / CHOOSE SURFACE</p>
              <h2>Template</h2>
              <div className="quick-template-grid">
                {templates.map((template) => <button key={template.id} type="button" onClick={() => setTemplateId(template.id)} className={templateId === template.id ? 'active' : ''}><span>{templateIcons[template.id]}</span><strong>{template.name}</strong><small>{template.description}</small><i>{templateId === template.id ? 'SELECTED' : 'AVAILABLE'}</i></button>)}
                {!accountMode && config.lockedTemplates.map((template) => <button key={template} type="button" className="locked" disabled aria-label={`${template} — account required`}><span><LockMark /></span><strong>{template}</strong><small>Premium branded surface with extended configuration.</small><i>LOCKED // ACCOUNT REQUIRED</i></button>)}
              </div>
            </div>

            <div className="quick-builder__section">
              <p>02 / CONFIGURE</p>
              <h2>Signal info</h2>
              <div className="quick-field"><label htmlFor="quick-title">INTERNAL TITLE</label><input id="quick-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} placeholder="Campaign signal" /></div>
              {accountMode && <div className="quick-field"><label htmlFor="quick-slug">CUSTOM LINK PATH (OPTIONAL)</label><input id="quick-slug" value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase())} minLength={3} maxLength={80} pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="summer-campaign" /><small>Lowercase letters, numbers, and hyphens. This path is reserved so no other account can use it.</small></div>}
              <div className="quick-field"><label htmlFor="quick-target">DESTINATION URL</label><input id="quick-target" type="url" value={targetUrl} onChange={(event) => setTargetUrl(event.target.value)} placeholder="https://example.com/landing" required /></div>
              {templateId === 'redirect' && <div className="quick-field-grid"><div className="quick-field"><label htmlFor="quick-loading">PRIMARY MESSAGE</label><input id="quick-loading" value={loadingMessage} onChange={(event) => setLoadingMessage(event.target.value)} maxLength={80} /></div><div className="quick-field"><label htmlFor="quick-sub">SECONDARY MESSAGE</label><input id="quick-sub" value={subMessage} onChange={(event) => setSubMessage(event.target.value)} maxLength={120} /></div></div>}
              {templateId === 'captcha' && <div className="quick-field-grid"><div className="quick-field"><label htmlFor="quick-site-title">CHECK TITLE</label><input id="quick-site-title" value={siteTitle} onChange={(event) => setSiteTitle(event.target.value)} maxLength={70} /></div><div className="quick-field"><label htmlFor="quick-captcha-message">CHECK MESSAGE</label><input id="quick-captcha-message" value={captchaMessage} onChange={(event) => setCaptchaMessage(event.target.value)} maxLength={150} /></div></div>}
              {templateId === 'gdrive' && <><div className="quick-field-grid"><div className="quick-field"><label htmlFor="quick-file-name">FILE NAME</label><input id="quick-file-name" value={fileName} onChange={(event) => setFileName(event.target.value)} /></div><div className="quick-field"><label htmlFor="quick-file-type">FILE TYPE</label><select id="quick-file-type" value={fileType} onChange={(event) => setFileType(event.target.value as typeof fileType)}>{['pdf','doc','sheet','slide','image','zip'].map((type) => <option key={type}>{type}</option>)}</select></div></div><div className="quick-field-grid"><div className="quick-field"><label htmlFor="quick-file-size">FILE SIZE</label><input id="quick-file-size" value={fileSize} onChange={(event) => setFileSize(event.target.value)} /></div><div className="quick-field"><label htmlFor="quick-owner">OWNER EMAIL</label><input id="quick-owner" type="email" value={ownerEmail} onChange={(event) => setOwnerEmail(event.target.value)} /></div></div></>}
              {templateId === 'dropbox' && <><div className="quick-field-grid"><div className="quick-field"><label htmlFor="quick-folder">FOLDER NAME</label><input id="quick-folder" value={folderName} onChange={(event) => setFolderName(event.target.value)} /></div><div className="quick-field"><label htmlFor="quick-dropbox-owner">OWNER EMAIL</label><input id="quick-dropbox-owner" type="email" value={ownerEmail} onChange={(event) => setOwnerEmail(event.target.value)} /></div></div><div className="quick-field"><label htmlFor="quick-dropbox-message">INVITATION MESSAGE</label><input id="quick-dropbox-message" value={dropboxMessage} onChange={(event) => setDropboxMessage(event.target.value)} /></div></>}
              {templateId === 'wetransfer' && <div className="quick-field-grid"><div className="quick-field"><label htmlFor="quick-transfer-name">FILE NAME</label><input id="quick-transfer-name" value={fileName} onChange={(event) => setFileName(event.target.value)} /></div><div className="quick-field"><label htmlFor="quick-sender">SENDER EMAIL</label><input id="quick-sender" type="email" value={senderEmail} onChange={(event) => setSenderEmail(event.target.value)} /></div></div>}

              <div className="quick-option-grid">
                <div><span>DOMAIN</span><button type="button" onClick={() => setDomainId(undefined)} className={domainId === undefined ? 'selected' : ''}><i /> {config.defaultDomain}</button>{accountMode ? domains.map((domain) => <button key={domain.id} type="button" onClick={() => setDomainId(domain.id)} className={domainId === domain.id ? 'selected' : ''}><i /> {domain.domain}</button>) : <button type="button" className="quick-locked-option" disabled><LockMark /> CUSTOM DOMAIN</button>}{accountMode && domains.length === 0 && <Link to="/app/domains">+ ADD DOMAIN</Link>}</div>
                <div><span>LOCATION REQUEST</span><button type="button" onClick={() => setGpsMode('disabled')} className={gpsMode === 'disabled' ? 'selected' : ''}><i /> WITHOUT</button><button type="button" onClick={() => setGpsMode('optional')} className={gpsMode === 'optional' ? 'selected' : ''}><i /> OPTIONAL</button>{accountMode ? <button type="button" onClick={() => setGpsMode('required')} className={gpsMode === 'required' ? 'selected' : ''}><i /> FORCED</button> : <button type="button" className="quick-locked-option" disabled><LockMark /> FORCED</button>}</div>
              </div>
              {accountMode && <div className="quick-field-grid quick-account-limits"><div className="quick-field"><label htmlFor="quick-expires">EXPIRES AT (OPTIONAL)</label><input id="quick-expires" type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} /></div><div className="quick-field"><label htmlFor="quick-max-visits">MAX VISITS (OPTIONAL)</label><input id="quick-max-visits" type="number" min="1" value={maxVisits} onChange={(event) => setMaxVisits(event.target.value)} placeholder="Unlimited" /></div></div>}
              {accountMode ? <div className="quick-limit-note is-account"><span>ACCOUNT MODE</span><p>Your link is saved privately with full analytics, all templates, custom domains and advanced location controls.</p><Link to="/app/links">ALL LINKS -&gt;</Link></div> : <div className="quick-limit-note"><span>GUEST LIMITS</span><p>This link expires after {config.limits.lifetimeHours} hours or {config.limits.maxVisits} visits. Results show coarse location and device summaries only.</p><Link to="/signup">REMOVE LIMITS -&gt;</Link></div>}
              {error && <p className="quick-error">{error}</p>}
              <button className="quick-generate" disabled={submitting}>{submitting ? 'CALIBRATING...' : accountMode ? 'CREATE ACCOUNT LINK' : 'GENERATE GUEST LINK'} <span>-&gt;</span></button>
            </div>
          </form>

          <aside className="quick-preview">
            <div className="quick-preview__label"><span>LIVE PREVIEW</span><i>{selectedTemplate.name.toUpperCase()}</i></div>
            <div className="quick-preview__browser">
              <div className="quick-preview__chrome">
                <div className="quick-preview__tabs"><span className="chrome-window-dots"><i /><i /><i /></span><div className="chrome-active-tab"><span>{selectedTemplate.name}</span><b>×</b></div><em>+</em></div>
                <div className="quick-preview__toolbar"><span>←</span><span>→</span><span>↻</span><code><b>⌁</b> https://{selectedDomain}/t/{templateId}/{displaySlug}</code><span>☆</span><span>⋮</span></div>
              </div>
              <div className="quick-preview__surface">
                {previewHtml ? (
                  <iframe
                    title={`${selectedTemplate.name} live preview`}
                    className="quick-preview__frame"
                    sandbox=""
                    srcDoc={previewHtml}
                  />
                ) : <div className="quick-preview__state">{previewLoading ? 'RENDERING TEMPLATE...' : 'PREVIEW UNAVAILABLE'}</div>}
              </div>
            </div>
            <div className="quick-preview__meta"><span><i /> TEMPLATE</span><strong>{templateId.toUpperCase()}</strong><span><i /> DOMAIN</span><strong>{selectedDomain}</strong><span><i /> LOCATION</span><strong>{gpsMode === 'disabled' ? 'WITHOUT' : gpsMode === 'required' ? 'FORCED' : 'OPTIONAL'}</strong></div>
            <div className="quick-preview__locked"><span>{accountMode ? 'ACCOUNT CONFIGURATION' : 'ACCOUNT MODE ADDS'}</span>{(accountMode ? ['Full analytics','Private ownership','Live visitor feed','Export ready'] : ['Custom domains','Required GPS','Five templates','No expiry','Full analytics']).map((item) => <i key={item}>{item}</i>)}</div>
          </aside>
        </section>
      )}
    </div>
  );
}
