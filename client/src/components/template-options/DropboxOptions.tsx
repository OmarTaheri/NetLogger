import { HudInput } from '../ui/HudComponents';

interface Props {
  folderName: string;
  setFolderName: (v: string) => void;
  ownerEmail: string;
  setOwnerEmail: (v: string) => void;
  message: string;
  setMessage: (v: string) => void;
}

export default function DropboxOptions({ folderName, setFolderName, ownerEmail, setOwnerEmail, message, setMessage }: Props) {
  return (
    <div className="space-y-3 border border-hud-border p-4">
      <p className="text-hud-xs uppercase tracking-widest font-mono text-hud-text-muted">Dropbox Options</p>
      <div>
        <label className="block text-hud-xs font-mono text-hud-text-muted mb-1">Folder Name</label>
        <HudInput value={folderName} onChange={(e) => setFolderName(e.target.value)} placeholder="Shared Files" />
      </div>
      <div>
        <label className="block text-hud-xs font-mono text-hud-text-muted mb-1">Owner Email</label>
        <HudInput value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="user@email.com" />
      </div>
      <div>
        <label className="block text-hud-xs font-mono text-hud-text-muted mb-1">Message</label>
        <HudInput value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Custom invitation message" />
      </div>
    </div>
  );
}
