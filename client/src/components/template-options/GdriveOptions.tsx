import { HudInput, HudSelect } from '../ui/HudComponents';

interface Props {
  fileName: string;
  setFileName: (v: string) => void;
  fileType: 'pdf' | 'doc' | 'sheet' | 'slide' | 'image' | 'zip';
  setFileType: (v: 'pdf' | 'doc' | 'sheet' | 'slide' | 'image' | 'zip') => void;
  fileSize: string;
  setFileSize: (v: string) => void;
  ownerEmail: string;
  setOwnerEmail: (v: string) => void;
  gdriveMessage: string;
  setGdriveMessage: (v: string) => void;
}

export default function GdriveOptions({
  fileName, setFileName,
  fileType, setFileType,
  fileSize, setFileSize,
  ownerEmail, setOwnerEmail,
  gdriveMessage, setGdriveMessage,
}: Props) {
  return (
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
  );
}
