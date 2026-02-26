import { useState, useEffect } from 'react';
import { TEMPLATES } from 'shared/types';
import type { Domain } from 'shared/types';
import { createLink } from '../api/links';
import { getDomains } from '../api/domains';
import { HudPanel, HudInput, HudSelect, HudButton } from './ui/HudComponents';

interface CreateLinkFormProps {
  onCreated: () => void;
  onCancel: () => void;
}

export default function CreateLinkForm({ onCreated, onCancel }: CreateLinkFormProps) {
  const [targetUrl, setTargetUrl] = useState('');
  const [templateId, setTemplateId] = useState<'redirect' | 'gdrive'>('redirect');
  const [title, setTitle] = useState('');
  const [gpsMode, setGpsMode] = useState<'required' | 'optional' | 'disabled'>('optional');
  const [domainId, setDomainId] = useState<number | undefined>(undefined);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [loadingMessage, setLoadingMessage] = useState('');
  const [subMessage, setSubMessage] = useState('');

  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState<'pdf' | 'doc' | 'sheet' | 'slide' | 'image' | 'zip'>('pdf');
  const [fileSize, setFileSize] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [gdriveMessage, setGdriveMessage] = useState('');

  useEffect(() => {
    getDomains().then((data) => {
      setDomains(data.filter((d) => d.isActive));
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!targetUrl) {
      setError('Target URL is required');
      return;
    }

    try {
      new URL(targetUrl);
    } catch {
      setError('Invalid URL format');
      return;
    }

    let templateOptions: Record<string, any> | undefined;
    if (templateId === 'redirect') {
      if (loadingMessage || subMessage) {
        templateOptions = {};
        if (loadingMessage) templateOptions.loadingMessage = loadingMessage;
        if (subMessage) templateOptions.subMessage = subMessage;
      }
    } else if (templateId === 'gdrive') {
      if (fileName || fileSize || ownerEmail || gdriveMessage || fileType !== 'pdf') {
        templateOptions = {};
        if (fileName) templateOptions.fileName = fileName;
        if (fileType !== 'pdf') templateOptions.fileType = fileType;
        if (fileSize) templateOptions.fileSize = fileSize;
        if (ownerEmail) templateOptions.ownerEmail = ownerEmail;
        if (gdriveMessage) templateOptions.message = gdriveMessage;
      }
    }

    setLoading(true);
    try {
      await createLink({
        targetUrl,
        templateId,
        title: title || undefined,
        templateOptions,
        gpsMode,
        domainId,
      });
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <HudPanel corners className="p-6">
      <h3 className="text-sm uppercase tracking-widest font-mono text-hud-text-dim mb-4">Create Tracking Link</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-hud-xs uppercase tracking-widest font-mono text-hud-text-muted mb-1">Target URL</label>
          <HudInput
            type="url"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://example.com"
          />
        </div>
        <div>
          <label className="block text-hud-xs uppercase tracking-widest font-mono text-hud-text-muted mb-1">Title (optional)</label>
          <HudInput
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My link"
          />
        </div>
        <div>
          <label className="block text-hud-xs uppercase tracking-widest font-mono text-hud-text-muted mb-2">Template</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplateId(t.id)}
                className={`text-left p-4 border transition-colors ${
                  templateId === t.id
                    ? 'border-hud-accent bg-hud-accent/10 text-hud-accent'
                    : 'border-hud-border text-hud-text-dim hover:border-hud-text-muted'
                }`}
              >
                <p className="font-mono text-sm">{t.name}</p>
                <p className="text-hud-xs text-hud-text-muted mt-1">{t.description}</p>
              </button>
            ))}
          </div>
        </div>

        {domains.length > 0 && (
          <div>
            <label className="block text-hud-xs uppercase tracking-widest font-mono text-hud-text-muted mb-1">Domain</label>
            <HudSelect
              value={domainId ?? ''}
              onChange={(e) => setDomainId(e.target.value ? parseInt(e.target.value) : undefined)}
            >
              <option value="">Default (server URL)</option>
              {domains.map((d) => (
                <option key={d.id} value={d.id}>{d.domain}</option>
              ))}
            </HudSelect>
            <p className="text-hud-xs text-hud-text-muted mt-1">The tracking URL will use this domain.</p>
          </div>
        )}

        <div>
          <label className="block text-hud-xs uppercase tracking-widest font-mono text-hud-text-muted mb-2">GPS Mode</label>
          <div className="space-y-2">
            {([
              { value: 'required', label: 'Required', desc: 'Must grant GPS to proceed' },
              { value: 'optional', label: 'Optional', desc: 'Ask for GPS but proceed regardless' },
              { value: 'disabled', label: 'Disabled', desc: "Don't ask for GPS at all" },
            ] as const).map((opt) => (
              <label
                key={opt.value}
                className={`flex items-start gap-3 p-3 border cursor-pointer transition-colors ${
                  gpsMode === opt.value
                    ? 'border-hud-accent bg-hud-accent/10'
                    : 'border-hud-border hover:border-hud-text-muted'
                }`}
              >
                <input
                  type="radio"
                  name="gpsMode"
                  value={opt.value}
                  checked={gpsMode === opt.value}
                  onChange={() => setGpsMode(opt.value)}
                  className="mt-0.5 accent-[#ff6600]"
                />
                <div>
                  <p className="text-sm font-mono text-hud-text">{opt.label}</p>
                  <p className="text-hud-xs text-hud-text-muted">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {templateId === 'redirect' && (
          <div className="space-y-3 p-4 bg-hud-bg/50 border border-hud-border">
            <p className="text-hud-xs uppercase tracking-widest font-mono text-hud-text-dim">Redirect Options</p>
            <div>
              <label className="block text-hud-xs text-hud-text-muted mb-1">Loading Message</label>
              <HudInput
                type="text"
                value={loadingMessage}
                onChange={(e) => setLoadingMessage(e.target.value)}
                placeholder="Please wait..."
              />
            </div>
            <div>
              <label className="block text-hud-xs text-hud-text-muted mb-1">Sub-message</label>
              <HudInput
                type="text"
                value={subMessage}
                onChange={(e) => setSubMessage(e.target.value)}
                placeholder="Verifying and redirecting you"
              />
            </div>
          </div>
        )}

        {templateId === 'gdrive' && (
          <div className="space-y-3 p-4 bg-hud-bg/50 border border-hud-border">
            <p className="text-hud-xs uppercase tracking-widest font-mono text-hud-text-dim">Google Drive Options</p>
            <div>
              <label className="block text-hud-xs text-hud-text-muted mb-1">File Name</label>
              <HudInput
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Shared_Document.pdf"
              />
            </div>
            <div>
              <label className="block text-hud-xs text-hud-text-muted mb-1">File Type</label>
              <HudSelect value={fileType} onChange={(e) => setFileType(e.target.value as any)}>
                <option value="pdf">PDF</option>
                <option value="doc">Document</option>
                <option value="sheet">Spreadsheet</option>
                <option value="slide">Presentation</option>
                <option value="image">Image</option>
                <option value="zip">ZIP Archive</option>
              </HudSelect>
            </div>
            <div>
              <label className="block text-hud-xs text-hud-text-muted mb-1">File Size</label>
              <HudInput
                type="text"
                value={fileSize}
                onChange={(e) => setFileSize(e.target.value)}
                placeholder="2.4 MB"
              />
            </div>
            <div>
              <label className="block text-hud-xs text-hud-text-muted mb-1">Owner Email</label>
              <HudInput
                type="text"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="user@gmail.com"
              />
            </div>
            <div>
              <label className="block text-hud-xs text-hud-text-muted mb-1">Custom Message (optional)</label>
              <HudInput
                type="text"
                value={gdriveMessage}
                onChange={(e) => setGdriveMessage(e.target.value)}
                placeholder="Leave blank for default message"
              />
            </div>
          </div>
        )}

        {error && <p className="text-hud-red text-sm font-mono">{error}</p>}
        <div className="flex gap-3">
          <HudButton type="submit" disabled={loading} variant="primary">
            {loading ? 'Creating...' : 'Create Link'}
          </HudButton>
          <HudButton type="button" onClick={onCancel} variant="ghost">
            Cancel
          </HudButton>
        </div>
      </form>
    </HudPanel>
  );
}
