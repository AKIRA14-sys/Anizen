'use client';

import React, { useState } from 'react';
import { Smartphone, Download, Check, Sparkles, ShieldCheck, Info, HelpCircle } from 'lucide-react';

export default function AppDownloadBanner() {
  const [showInstructions, setShowInstructions] = useState(false);

  // Link to GitHub Releases APK artifact download
  const apkReleaseUrl = 'https://github.com/AKIRA14-sys/Anizen/releases/latest/download/app-debug.apk';
  const releasesPageUrl = 'https://github.com/AKIRA14-sys/Anizen/releases';

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-2xl border border-brand-accent/40 bg-gradient-to-r from-brand-surface via-brand-dark to-brand-surface p-5 sm:p-6 shadow-xl">
        {/* Ambient Glow */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-accent/10 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Left App Details */}
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-accent to-amber-500 text-white shadow-glow">
              <Smartphone className="h-7 w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-extrabold text-white sm:text-xl">
                  ANIZEN for Android
                </h3>
                <span className="rounded-full bg-brand-accent/20 border border-brand-accent/40 px-2 py-0.5 text-[10px] font-extrabold text-brand-accent flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Native APK (v1.0.0)
                </span>
                <span className="text-[11px] text-brand-muted font-semibold">
                  Size: ~4.2 MB
                </span>
              </div>
              <p className="mt-1 text-xs text-brand-muted max-w-md leading-relaxed">
                Enjoy fast full-screen anime streaming, in-app manga reading, and offline fallbacks on Android devices.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <a
              href={apkReleaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-xl bg-brand-accent px-5 py-3 text-xs font-extrabold text-white shadow-glow hover:bg-brand-accent-hover transition-all"
            >
              <Download className="h-4 w-4" />
              <span>Download Android APK</span>
            </a>

            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-brand-border bg-brand-surface px-4 py-3 text-xs font-bold text-white hover:border-brand-accent transition-colors"
            >
              <HelpCircle className="h-4 w-4 text-brand-accent" />
              <span>Install Help</span>
            </button>
          </div>
        </div>

        {/* Instructions Drawer */}
        {showInstructions && (
          <div className="mt-5 border-t border-brand-border/40 pt-4 text-xs text-brand-muted space-y-2">
            <div className="flex items-center gap-1.5 text-white font-bold">
              <Info className="h-4 w-4 text-brand-accent" />
              <span>Android APK Installation Instructions:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-gray-300">
              <li>Tap <strong>"Download Android APK"</strong> to obtain the <code className="text-brand-accent">app-debug.apk</code> file.</li>
              <li>Open the downloaded APK file on your Android device.</li>
              <li>If prompted by Android, grant permission to <strong>"Install unknown apps"</strong> in your browser or file manager settings.</li>
              <li>Tap <strong>Install</strong> to launch ANIZEN natively on your phone.</li>
            </ol>
            <p className="text-[11px] text-brand-muted pt-1">
              Note: You can view all release builds and source releases anytime on{' '}
              <a href={releasesPageUrl} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline font-bold">
                GitHub Releases
              </a>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
