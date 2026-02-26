import { HudInput } from '../ui/HudComponents';

interface Props {
  loadingMessage: string;
  setLoadingMessage: (v: string) => void;
  subMessage: string;
  setSubMessage: (v: string) => void;
}

export default function RedirectOptions({ loadingMessage, setLoadingMessage, subMessage, setSubMessage }: Props) {
  return (
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
  );
}
