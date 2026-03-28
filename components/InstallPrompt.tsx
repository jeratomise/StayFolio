import React, { useState, useEffect, useRef } from 'react';
import { Download, X, Share, ShieldCheck } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'stayfolio_install_dismissed';

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as any).standalone === true;
}

function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
}

function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod/.test(navigator.userAgent);
}

export const InstallPrompt: React.FC = () => {
  const [dismissed, setDismissed] = useState(true);
  const [isIos, setIsIos] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstallNative, setCanInstallNative] = useState(false);

  useEffect(() => {
    if (isStandalone() || !isMobile()) return;
    if (localStorage.getItem(DISMISS_KEY) === 'true') return;

    setIsIos(isIosSafari());
    setDismissed(false);

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setCanInstallNative(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt.current) {
      await deferredPrompt.current.prompt();
      const { outcome } = await deferredPrompt.current.userChoice;
      if (outcome === 'accepted') handleDismiss();
      deferredPrompt.current = null;
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, 'true');
  };

  if (dismissed) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm mb-4">
      <div className="bg-indigo-600 p-2 rounded-lg text-white shrink-0">
        <ShieldCheck size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800">Add StayFolio to your Home Screen</p>
        {isIos ? (
          <p className="text-xs text-slate-500 mt-0.5">
            Tap <Share size={12} className="inline -mt-0.5" /> then "Add to Home Screen"
          </p>
        ) : (
          <p className="text-xs text-slate-500 mt-0.5">
            Install for quick access — no app store needed
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {canInstallNative && (
          <button
            onClick={handleInstall}
            className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1"
          >
            <Download size={14} /> Install
          </button>
        )}
        <button
          onClick={handleDismiss}
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
