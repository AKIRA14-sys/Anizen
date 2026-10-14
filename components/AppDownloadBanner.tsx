'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Check, Sparkles, ShieldCheck } from 'lucide-react';

export default function AppDownloadBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handlePWAInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-2xl border border-brand-accent/40 bg-gradient-to-r from-brand-surface via-brand-dark to-brand-surface p-5 sm:p-6 shadow-xl">
        {/* Glow backdrop */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-accent/10 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Left Info */}
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-accent to-amber-500 text-white shadow-glow">
              <Smartphone className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-white sm:text-xl">
                  Get ANIZEN Mobile App
                </h3>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-extrabold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Safe APK
                </span>
              </div>
              <p className="mt-1 text-xs text-brand-muted max-w-md leading-relaxed">
                Download the official ANIZEN Android APK or install the instant Progressive Web App (PWA) for native full-screen streaming.
              </p>
              <div className="mt-2 flex items-center gap-3 text-[11px] text-brand-muted font-medium">
                <span>Version: v1.0.0</span>
                <span>•</span>
                <span>Size: 14.2 MB</span>
                <span>•</span>
                <span>Android 8.0+</span>
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Direct APK Download Button */}
            <a
              href="/downloads/ANIZEN.apk"
              download="ANIZEN.apk"
              className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-xl bg-brand-accent px-5 py-3 text-xs font-bold text-white shadow-glow hover:bg-brand-accent-hover transition-all"
            >
              <Download className="h-4 w-4" />
              <span>Download Android APK</span>
            </a>

            {/* PWA Install Button */}
            {deferredPrompt && !isInstalled && (
              <button
                onClick={handlePWAInstall}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-xl border border-brand-border bg-brand-surface px-5 py-3 text-xs font-bold text-white hover:border-brand-accent hover:text-brand-accent transition-all"
              >
                <Sparkles className="h-4 w-4 text-brand-accent" />
                <span>Install Web App (PWA)</span>
              </button>
            )}

            {isInstalled && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 px-3 py-2 bg-emerald-950/30 rounded-xl border border-emerald-500/30">
                <Check className="h-4 w-4" />
                <span>App Installed</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
