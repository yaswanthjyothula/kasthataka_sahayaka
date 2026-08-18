import React from 'react';
import HealthBadge from '@/components/HealthBadge';
import { Camera, ShieldCheck, Cpu, CloudSun, UserCheck, Layers, FileText } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col gap-5 py-2">
      {/* Hero Welcome Banner */}
      <section className="bg-gradient-to-br from-agri-900/60 via-agri-card to-agri-dark border border-agri-700/50 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 text-agri-600/10 text-9xl font-bold select-none pointer-events-none">
          🌾
        </div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-agri-700/30 text-agri-400 text-xs px-2.5 py-1 rounded-full border border-agri-600/40">
            <Layers className="w-3.5 h-3.5" />
            <span>Architecture Skeleton Active</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Finger Millet Disease Detection & Advisory Platform
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            AI-driven PWA for real-time leaf blast detection, Score-CAM heatmaps, Qdrant RAG advisories, and CIBRC safety guardrails.
          </p>
        </div>
      </section>

      {/* Connectivity Health Verification */}
      <HealthBadge />

      {/* Architecture Modules Overview */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-agri-500" />
          <span>System Subsystems (SRS-WEB-AGRI-004)</span>
        </h3>

        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-agri-card border border-agri-700/30 p-3.5 rounded-xl flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Camera className="w-5 h-5 text-emerald-400" />
              <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">Phase 2</span>
            </div>
            <span className="font-semibold text-xs text-gray-200">WASM Quality &amp; PWA Queue</span>
            <p className="text-[11px] text-gray-400">OpenCV.js blur gate (&gt;100 threshold) &amp; IndexedDB sync.</p>
          </div>

          <div className="bg-agri-card border border-agri-700/30 p-3.5 rounded-xl flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Cpu className="w-5 h-5 text-blue-400" />
              <span className="text-[10px] bg-blue-950 text-blue-400 px-2 py-0.5 rounded border border-blue-800">Phase 3-4</span>
            </div>
            <span className="font-semibold text-xs text-gray-200">Detection & Score-CAM</span>
            <p className="text-[11px] text-gray-400">8 disease classes, 4-tier severity, interactive slider overlay.</p>
          </div>

          <div className="bg-agri-card border border-agri-700/30 p-3.5 rounded-xl flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span className="text-[10px] bg-amber-950 text-amber-400 px-2 py-0.5 rounded border border-amber-800">Phase 5</span>
            </div>
            <span className="font-semibold text-xs text-gray-200">CIBRC Guardrail & RAG</span>
            <p className="text-[11px] text-gray-400">Deterministic pesticide validator & Qdrant GenAI tank-mix.</p>
          </div>

          <div className="bg-agri-card border border-agri-700/30 p-3.5 rounded-xl flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <CloudSun className="w-5 h-5 text-sky-400" />
              <span className="text-[10px] bg-sky-950 text-sky-400 px-2 py-0.5 rounded border border-sky-800">Phase 6</span>
            </div>
            <span className="font-semibold text-xs text-gray-200">Weather Risk Fusion</span>
            <p className="text-[11px] text-gray-400">72-hour pathogen proliferation index via Ag Weather API.</p>
          </div>

          <div className="bg-agri-card border border-agri-700/30 p-3.5 rounded-xl flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <UserCheck className="w-5 h-5 text-purple-400" />
              <span className="text-[10px] bg-purple-950 text-purple-400 px-2 py-0.5 rounded border border-purple-800">Phase 7</span>
            </div>
            <span className="font-semibold text-xs text-gray-200">3 Distinct Personas</span>
            <p className="text-[11px] text-gray-400">Farmer voice-first, Officer batch UI, Admin Mapbox GIS.</p>
          </div>

          <div className="bg-agri-card border border-agri-700/30 p-3.5 rounded-xl flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <FileText className="w-5 h-5 text-gray-400" />
              <span className="text-[10px] bg-gray-800 text-gray-300 px-2 py-0.5 rounded border border-gray-700">SRS Spec</span>
            </div>
            <span className="font-semibold text-xs text-gray-200">LTTS Agri Standard</span>
            <p className="text-[11px] text-gray-400">SRS-WEB-AGRI-004 compliant implementation.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
