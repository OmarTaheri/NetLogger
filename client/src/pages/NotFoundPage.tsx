import { useNavigate } from 'react-router-dom';
import { HudButton } from '../components/ui/HudComponents';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 mb-6 border-2 border-hud-accent/30 rounded-full flex items-center justify-center">
        <span className="text-3xl font-mono text-hud-accent">404</span>
      </div>
      <h1 className="text-xl font-mono uppercase tracking-widest text-hud-text mb-2">Page Not Found</h1>
      <p className="text-sm font-mono text-hud-text-muted mb-8">
        The requested page does not exist in this system.
      </p>
      <HudButton onClick={() => navigate('/')} variant="primary">
        Return to Dashboard
      </HudButton>
    </div>
  );
}
