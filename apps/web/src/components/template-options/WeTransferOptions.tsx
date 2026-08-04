import { HudInput } from '../ui/HudComponents';

interface Props {
  fileName: string;
  setFileName: (v: string) => void;
  fileSize: string;
  setFileSize: (v: string) => void;
  senderEmail: string;
  setSenderEmail: (v: string) => void;
}

export default function WeTransferOptions({ fileName, setFileName, fileSize, setFileSize, senderEmail, setSenderEmail }: Props) {
  return (
    <div className="space-y-3 border border-hud-border p-4">
      <p className="text-hud-xs uppercase tracking-widest font-mono text-hud-text-muted">WeTransfer Options</p>
      <div>
        <label className="block text-hud-xs font-mono text-hud-text-muted mb-1">File Name</label>
        <HudInput value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="Files.zip" />
      </div>
      <div>
        <label className="block text-hud-xs font-mono text-hud-text-muted mb-1">File Size</label>
        <HudInput value={fileSize} onChange={(e) => setFileSize(e.target.value)} placeholder="24.7 MB" />
      </div>
      <div>
        <label className="block text-hud-xs font-mono text-hud-text-muted mb-1">Sender Email</label>
        <HudInput value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} placeholder="someone@email.com" />
      </div>
    </div>
  );
}
