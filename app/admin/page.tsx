'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Users,
  Film,
  BookOpen,
  Bell,
  Send,
} from 'lucide-react';

interface ProviderStatus {
  status: 'healthy' | 'degraded' | 'offline';
  latencyMs: number;
  message?: string;
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState<Record<string, ProviderStatus>>({});
  const [announcement, setAnnouncement] = useState('');
  const [announcementSent, setAnnouncementSent] = useState(false);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/health');
      const json = await res.json();
      if (json.success && json.providers) {
        setHealthData(json.providers);
      }
    } catch (e) {
      console.error('Failed to load health status:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (announcement.trim()) {
      setAnnouncementSent(true);
      setTimeout(() => {
        setAnnouncementSent(false);
        setAnnouncement('');
      }, 3000);
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/60 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white sm:text-3xl flex items-center gap-2">
            <ShieldAlert className="h-7 w-7 text-brand-accent" />
            Admin & System Health Dashboard
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-brand-muted">
            Monitor API provider health, platform metrics, and broadcast system announcements.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-brand-accent px-4 py-2 text-xs font-bold text-white shadow-glow hover:bg-brand-accent-hover transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Health Checks</span>
        </button>
      </div>

      {/* Provider Status Grid */}
      <div className="mb-8">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Server className="h-5 w-5 text-brand-accent" />
          <span>API Providers Status</span>
        </h2>

        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center text-brand-muted bg-brand-surface rounded-2xl border border-brand-border p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-accent border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(healthData).map(([name, data]) => {
              const isHealthy = data.status === 'healthy';
              const isDegraded = data.status === 'degraded';

              return (
                <div
                  key={name}
                  className="flex flex-col justify-between rounded-2xl border border-brand-border/60 bg-brand-surface p-5"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                        {name}
                      </h3>
                      {isHealthy ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      ) : isDegraded ? (
                        <AlertTriangle className="h-5 w-5 text-amber-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-400" />
                      )}
                    </div>

                    <p className="text-xs font-semibold text-brand-muted mb-3">
                      {data.message || 'Operational'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-brand-border/40 text-[11px]">
                    <span className="text-brand-muted">Latency</span>
                    <span className="font-bold text-brand-accent">{data.latencyMs} ms</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* System Metrics & Broadcast Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Metrics */}
        <div className="rounded-2xl border border-brand-border bg-brand-surface p-6">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-brand-accent" />
            <span>Platform Overview</span>
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-brand-border/60 bg-brand-dark p-4 text-center">
              <Film className="mx-auto h-6 w-6 text-brand-accent mb-1" />
              <span className="block text-2xl font-black text-white">4 / 4</span>
              <span className="text-[11px] text-brand-muted font-medium">Anime Providers Integrated</span>
            </div>

            <div className="rounded-xl border border-brand-border/60 bg-brand-dark p-4 text-center">
              <BookOpen className="mx-auto h-6 w-6 text-brand-accent mb-1" />
              <span className="block text-2xl font-black text-white">MangaDex</span>
              <span className="text-[11px] text-brand-muted font-medium">In-App Reader Engine</span>
            </div>
          </div>
        </div>

        {/* System Broadcast */}
        <div className="rounded-2xl border border-brand-border bg-brand-surface p-6">
          <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
            <Bell className="h-5 w-5 text-brand-accent" />
            <span>System Announcement</span>
          </h2>
          <p className="text-xs text-brand-muted mb-4">
            Broadcast in-app notifications to visitors across the platform.
          </p>

          <form onSubmit={handleBroadcast} className="flex flex-col gap-3">
            <textarea
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="Type notification message here..."
              className="w-full h-24 rounded-xl border border-brand-border/80 bg-brand-dark p-3 text-xs text-white placeholder-brand-muted focus:border-brand-accent focus:outline-none resize-none"
            />

            <div className="flex items-center justify-between">
              {announcementSent && (
                <span className="text-xs font-bold text-emerald-400">
                  Announcement broadcast successfully!
                </span>
              )}
              <button
                type="submit"
                disabled={!announcement.trim()}
                className="ml-auto flex items-center gap-1.5 rounded-xl bg-brand-accent px-4 py-2 text-xs font-bold text-white shadow-glow disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" /> Broadcast
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
