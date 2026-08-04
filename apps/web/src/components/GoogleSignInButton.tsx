import { useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: { client_id: string; callback: (response: { credential?: string }) => void }) => void;
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

let googleScriptPromise: Promise<void> | null = null;

function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;
  googleScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-netlogger-google]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Google sign-in could not be loaded')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.netloggerGoogle = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google sign-in could not be loaded'));
    document.head.appendChild(script);
  });
  return googleScriptPromise;
}

export default function GoogleSignInButton({
  onCredential,
  onError,
  label = 'signin_with',
}: {
  onCredential: (credential: string) => void | Promise<void>;
  onError?: (message: string) => void;
  label?: 'signin_with' | 'signup_with' | 'continue_with';
}) {
  const { config } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!config.googleEnabled || !config.googleClientId || !containerRef.current) return;
    let cancelled = false;
    loadGoogleScript().then(() => {
      if (cancelled || !containerRef.current || !window.google) return;
      containerRef.current.replaceChildren();
      window.google.accounts.id.initialize({
        client_id: config.googleClientId!,
        callback: ({ credential }) => credential && onCredential(credential),
      });
      window.google.accounts.id.renderButton(containerRef.current, {
        type: 'standard',
        theme: 'filled_black',
        size: 'large',
        shape: 'rectangular',
        text: label,
        width: Math.min(360, containerRef.current.clientWidth || 360),
      });
    }).catch((error) => onError?.(error.message));
    return () => { cancelled = true; };
  }, [config.googleClientId, config.googleEnabled, label, onCredential, onError]);

  if (!config.googleEnabled) return null;
  return <div ref={containerRef} className="google-signin-slot" aria-label="Google sign-in" />;
}
