import { HudInput } from '../ui/HudComponents';

interface Props {
  siteTitle: string;
  setSiteTitle: (v: string) => void;
  message: string;
  setMessage: (v: string) => void;
}

export default function CaptchaOptions({ siteTitle, setSiteTitle, message, setMessage }: Props) {
  return (
    <div className="space-y-3 border border-hud-border p-4">
      <p className="text-hud-xs uppercase tracking-widest font-mono text-hud-text-muted">CAPTCHA Options</p>
      <div>
        <label className="block text-hud-xs font-mono text-hud-text-muted mb-1">Site Title</label>
        <HudInput value={siteTitle} onChange={(e) => setSiteTitle(e.target.value)} placeholder="Security Check" />
      </div>
      <div>
        <label className="block text-hud-xs font-mono text-hud-text-muted mb-1">Message</label>
        <HudInput value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Please verify that you are a human" />
      </div>
    </div>
  );
}
