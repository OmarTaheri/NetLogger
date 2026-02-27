import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const NAV_SHORTCUTS: Record<string, string> = {
  '1': '/',
  '2': '/links',
  '3': '/visitors',
  '4': '/domains',
  '5': '/webhooks',
  '6': '/settings',
};

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
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
  }, [navigate]);
}
