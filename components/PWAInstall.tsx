'use client';

import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Check, HelpCircle, Sparkles } from 'lucide-react';

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showGuideDialog, setShowGuideDialog] = useState(false);

  useEffect(() => {
    // Register Service Worker in production/browser
    if ('serviceWorker' in navigator && typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.error('ServiceWorker registration failed:', err);
        });
      });
    }

    // Detect if already installed / standalone
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone
    ) {
      setIsStandalone(true);
    }

    // Check dismissal state
    const dismissed = localStorage.getItem('anizen_pwa_install_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowGuideDialog(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem('anizen_pwa_install_dismissed', 'true');
    } catch {}
  };

  if (isStandalone || isDismissed) return null;

  return (
    <>
      {/* Floating Install Banner for Browsers */}
      <div className="fixed bottom-16 sm:bottom-6 right-4 left-4 sm:left-auto sm:max-w-md z-40 animate-fade-in">
        <div className="relative overflow-hidden rounded-2xl border border-brand-accent/50 bg-brand-dark/95 p-4 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-accent to-amber-500 text-white shadow-glow">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white">Install ANIZEN Web App</h4>
              <p className="text-[10px] text-brand-muted">Fast full-screen access & offline caching</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1 rounded-xl bg-brand-accent px-3 py-1.5 text-xs font-extrabold text-white shadow-glow hover:bg-brand-accent-hover transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Install</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-brand-muted hover:text-white"
              aria-label="Dismiss PWA prompt"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Installation Guide Dialog */}
      {showGuideDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-2xl text-white">
            <button
              onClick={() => setShowGuideDialog(false)}
              className="absolute top-4 right-4 text-brand-muted hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-brand-accent mb-2">
              <Sparkles className="h-5 w-5" />
              <h3 className="text-lg font-black">How to Install ANIZEN</h3>
            </div>

            <p className="text-xs text-brand-muted mb-4 leading-relaxed">
              Install ANIZEN as an app on your home screen for full-screen performance.
            </p>

            <div className="space-y-3 text-xs text-gray-300">
              <div className="rounded-xl border border-brand-border bg-brand-dark p-3">
                <strong className="text-white block mb-1">Android (Chrome / Brave / Firefox):</strong>
                Tap the <strong>⋮ Menu</strong> in top right corner, then select <strong>"Add to Home screen"</strong> or <strong>"Install App"</strong>.
              </div>

              <div className="rounded-xl border border-brand-border bg-brand-dark p-3">
                <strong className="text-white block mb-1">iOS (Safari):</strong>
                Tap the <strong>Share</strong> icon in the bottom menu bar, scroll down and select <strong>"Add to Home Screen"</strong>.
              </div>
            </div>

            <button
              onClick={() => setShowGuideDialog(false)}
              className="mt-5 w-full rounded-xl bg-brand-accent py-2.5 text-xs font-bold text-white shadow-glow"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
