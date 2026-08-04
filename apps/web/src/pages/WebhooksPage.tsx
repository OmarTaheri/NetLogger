import { useState, useEffect, useCallback } from 'react';
import { HudPageTitle, HudPanel, HudInput, HudButton, HudSectionTitle } from '../components/ui/HudComponents';
import { getWebhooks, createWebhook, updateWebhook, deleteWebhook } from '../api/webhooks';
import { useToast } from '../hooks/useToast';
import type { Webhook } from '@netlogger/shared/types';

const AVAILABLE_EVENTS = ['new_visitor', 'high_risk_visitor'];

export default function WebhooksPage() {
  const { addToast } = useToast();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['new_visitor']);
  const [creating, setCreating] = useState(false);

  const loadWebhooks = useCallback(async () => {
    try {
      const data = await getWebhooks();
      setWebhooks(data);
    } catch {}
  }, []);

  useEffect(() => { loadWebhooks(); }, [loadWebhooks]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      addToast('URL is required', 'error');
      return;
    }
    if (selectedEvents.length === 0) {
      addToast('Select at least one event', 'error');
      return;
    }
    setCreating(true);
    try {
      await createWebhook({ url, events: selectedEvents, secret: secret || undefined });
      addToast('Webhook created', 'success');
      setUrl('');
      setSecret('');
      setSelectedEvents(['new_visitor']);
      setShowCreate(false);
      loadWebhooks();
    } catch (err: any) {
      addToast(err.message || 'Failed to create webhook', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (webhook: Webhook) => {
    try {
      await updateWebhook(webhook.id, { isActive: !webhook.isActive });
      loadWebhooks();
    } catch (err: any) {
      addToast(err.message || 'Failed to update webhook', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this webhook?')) return;
    try {
      await deleteWebhook(id);
      addToast('Webhook deleted', 'success');
      loadWebhooks();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete webhook', 'error');
    }
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between opacity-0 animate-hud-blink">
        <HudPageTitle subtitle="Receive notifications when events occur">Webhooks</HudPageTitle>
        {!showCreate && (
          <HudButton onClick={() => setShowCreate(true)} variant="primary">
            + New Webhook
          </HudButton>
        )}
      </div>

      {showCreate && (
        <HudPanel corners className="p-6">
          <HudSectionTitle>Create Webhook</HudSectionTitle>
          <form onSubmit={handleCreate} className="space-y-4 mt-4">
            <div>
              <label className="block text-hud-xs uppercase tracking-widest font-mono text-hud-text-muted mb-1">Webhook URL</label>
              <HudInput type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/webhook" />
            </div>
            <div>
              <label className="block text-hud-xs uppercase tracking-widest font-mono text-hud-text-muted mb-2">Events</label>
              <div className="flex gap-3">
                {AVAILABLE_EVENTS.map((event) => (
                  <label
                    key={event}
                    className={`flex items-center gap-2 px-3 py-2 border cursor-pointer transition-colors ${
                      selectedEvents.includes(event)
                        ? 'border-hud-accent bg-hud-accent/10 text-hud-accent'
                        : 'border-hud-border text-hud-text-dim hover:border-hud-text-muted'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(event)}
                      onChange={() => toggleEvent(event)}
                      className="accent-[#ff6600]"
                    />
                    <span className="font-mono text-xs uppercase">{event}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-hud-xs uppercase tracking-widest font-mono text-hud-text-muted mb-1">Secret (optional HMAC key)</label>
              <HudInput type="text" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Optional signing secret" />
            </div>
            <div className="flex gap-3">
              <HudButton type="submit" disabled={creating} variant="primary">
                {creating ? 'Creating...' : 'Create Webhook'}
              </HudButton>
              <HudButton type="button" onClick={() => setShowCreate(false)} variant="ghost">
                Cancel
              </HudButton>
            </div>
          </form>
        </HudPanel>
      )}

      <div className="space-y-3">
        {webhooks.map((webhook, i) => (
          <HudPanel key={webhook.id} corners animate animationDelay={Math.min(1 + i, 8)} className="p-5 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${webhook.isActive ? 'bg-hud-green' : 'bg-hud-text-muted'}`} />
                <p className="font-mono text-sm text-hud-text truncate">{webhook.url}</p>
              </div>
              <div className="flex items-center gap-2">
                {webhook.events.map((event) => (
                  <span key={event} className="px-2 py-0.5 border border-hud-border text-hud-xs font-mono text-hud-text-muted uppercase">
                    {event}
                  </span>
                ))}
                {webhook.secret && (
                  <span className="px-2 py-0.5 border border-hud-accent/30 text-hud-xs font-mono text-hud-accent uppercase">
                    HMAC
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => handleToggle(webhook)}
                className={`px-3 py-1.5 text-hud-xs font-mono uppercase border transition-colors ${
                  webhook.isActive
                    ? 'border-hud-green/40 text-hud-green bg-hud-green/10 hover:bg-hud-green/20'
                    : 'border-hud-text-muted/40 text-hud-text-muted bg-white/5 hover:bg-white/10'
                }`}
              >
                {webhook.isActive ? 'Active' : 'Disabled'}
              </button>
              <button
                onClick={() => handleDelete(webhook.id)}
                className="px-3 py-1.5 text-hud-xs font-mono uppercase text-hud-red hover:bg-hud-red/10 border border-transparent hover:border-hud-red/30 transition-colors"
              >
                Delete
              </button>
            </div>
          </HudPanel>
        ))}
        {webhooks.length === 0 && !showCreate && (
          <div className="text-center py-12 text-hud-text-muted font-mono">
            No webhooks configured yet.
          </div>
        )}
      </div>
    </div>
  );
}
