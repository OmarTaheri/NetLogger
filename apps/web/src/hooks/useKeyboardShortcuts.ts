import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const NAV_SHORTCUTS: Record<string, string> = {
  '1': '/app',
  '2': '/app/links',
  '3': '/app/visitors',
  '4': '/app/domains',
  '5': '/app/webhooks',
  '6': '/app/settings',
};

export function useKeyboardShortcuts(enabled = true) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Skip when focused on input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // Alt+number for navigation
      if (e.altKey && NAV_SHORTCUTS[e.key]) {
        e.preventDefault();
        navigate(NAV_SHORTCUTS[e.key]);
        return;
      }

      // Escape to close modals
      if (e.key === 'Escape') {
        window.dispatchEvent(new CustomEvent('close-modals'));
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, navigate]);
}
