import React from 'react';
import HealthBadge from '@/components/HealthBadge';
import { Camera, ShieldCheck, Cpu, CloudSun, UserCheck, Layers, FileText } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col gap-5 py-2">
      {/* Hero Welcome Banner */}
      <section className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-agri-700 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 text-white/10 text-9xl font-bold select-none pointer-events-none">
          🌾
        </div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm border border-white/30 font-medium">
            <Layers className="w-3.5 h-3.5" />
            <span>Architecture Skeleton Active</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Finger Millet Disease Detection & Advisory Platform
          </h2>
          <p className="text-xs sm:text-sm text-emerald-50 leading-relaxed max-w-2xl">
            AI-driven PWA for real-time leaf blast detection, Score-CAM heatmaps, Qdrant RAG advisories, and CIBRC safety guardrails.
          </p>
        </div>
      </section>

      {/* Connectivity Health Verification */}
      <HealthBadge />

      {/* Architecture Modules Overview */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-600" />
          <span>System Subsystems (SRS-WEB-AGRI-004)</span>
        </h3>

        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 p-3.5 rounded-xl flex flex-col gap-2 shadow-sm hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between">
              <Camera className="w-5 h-5 text-emerald-600" />
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded border border-emerald-200">Phase 2</span>
            </div>
            <span className="font-semibold text-xs text-slate-800">WASM Quality &amp; PWA Queue</span>
            <p className="text-[11px] text-slate-500">OpenCV.js blur gate (&gt;100 threshold) &amp; IndexedDB sync.</p>
          </div>

          <div className="bg-white border border-slate-200 p-3.5 rounded-xl flex flex-col gap-2 shadow-sm hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between">
              <Cpu className="w-5 h-5 text-blue-600" />
              <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded border border-blue-200">Phase 3-4</span>
            </div>
            <span className="font-semibold text-xs text-slate-800">Detection & Score-CAM</span>
            <p className="text-[11px] text-slate-500">8 disease classes, 4-tier severity, interactive slider overlay.</p>
          </div>

          <div className="bg-white border border-slate-200 p-3.5 rounded-xl flex flex-col gap-2 shadow-sm hover:border-amber-300 transition-colors">
            <div className="flex items-center justify-between">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              <span className="text-[10px] bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded border border-amber-200">Phase 5</span>
            </div>
            <span className="font-semibold text-xs text-slate-800">CIBRC Guardrail & RAG</span>
            <p className="text-[11px] text-slate-500">Deterministic pesticide validator & Qdrant GenAI tank-mix.</p>
          </div>

          <div className="bg-white border border-slate-200 p-3.5 rounded-xl flex flex-col gap-2 shadow-sm hover:border-sky-300 transition-colors">
            <div className="flex items-center justify-between">
              <CloudSun className="w-5 h-5 text-sky-600" />
              <span className="text-[10px] bg-sky-50 text-sky-700 font-semibold px-2 py-0.5 rounded border border-sky-200">Phase 6</span>
            </div>
            <span className="font-semibold text-xs text-slate-800">Weather Risk Fusion</span>
            <p className="text-[11px] text-slate-500">72-hour pathogen proliferation index via Ag Weather API.</p>
          </div>

          <div className="bg-white border border-slate-200 p-3.5 rounded-xl flex flex-col gap-2 shadow-sm hover:border-purple-300 transition-colors">
            <div className="flex items-center justify-between">
              <UserCheck className="w-5 h-5 text-purple-600" />
              <span className="text-[10px] bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded border border-purple-200">Phase 7</span>
            </div>
            <span className="font-semibold text-xs text-slate-800">3 Distinct Personas</span>
            <p className="text-[11px] text-slate-500">Farmer voice-first, Officer batch UI, Admin Mapbox GIS.</p>
          </div>

          <div className="bg-white border border-slate-200 p-3.5 rounded-xl flex flex-col gap-2 shadow-sm hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <FileText className="w-5 h-5 text-slate-600" />
              <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded border border-slate-200">SRS Spec</span>
            </div>
            <span className="font-semibold text-xs text-slate-800">LTTS Agri Standard</span>
            <p className="text-[11px] text-slate-500">SRS-WEB-AGRI-004 compliant implementation.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
