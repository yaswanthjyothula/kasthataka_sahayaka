'use client';

import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface HealthData {
  status: string;
  app: string;
  version: string;
  environment: string;
}

export default function HealthBadge() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const res = await fetch(`${backendUrl}/api/v1/health`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setHealth(data);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="bg-agri-card border border-agri-700/40 rounded-xl p-4 shadow-lg flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-agri-500 animate-pulse" />
          <span className="font-semibold text-sm text-gray-200">Backend Connectivity</span>
        </div>
        <button
          onClick={checkHealth}
          disabled={loading}
          className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors disabled:opacity-50"
          title="Re-check Health"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-950/30 p-2.5 rounded-lg border border-amber-800/40">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Testing `/api/v1/health` connection...</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/30 p-2.5 rounded-lg border border-red-800/40">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Offline/Disconnected ({error})</span>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 bg-agri-900/30 p-2.5 rounded-lg border border-agri-600/30 text-xs">
          <div className="flex items-center gap-2 text-agri-500 font-medium">
            <CheckCircle2 className="w-4 h-4 text-agri-500" />
            <span>Connected to FastAPI Backend</span>
          </div>
          {health && (
            <div className="grid grid-cols-2 gap-1 text-[11px] text-gray-400 mt-1 pl-6">
              <div>App: <span className="text-gray-200">{health.app}</span></div>
              <div>Version: <span className="text-gray-200">{health.version}</span></div>
              <div>Status: <span className="text-agri-400 uppercase font-mono">{health.status}</span></div>
              <div>Env: <span className="text-gray-200">{health.environment}</span></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
