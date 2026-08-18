'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import HealthBadge from '@/components/HealthBadge';
import {
  Camera,
  Calendar,
  Layers,
  CloudSun,
  TrendingUp,
  PackageCheck,
  Headphones,
  Menu,
  X,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Sliders,
  Volume2,
  Droplets,
  Sprout
} from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<string>('detection');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Stub states for features
  const [blurScore, setBlurScore] = useState<number>(128);
  const [selectedDisease, setSelectedDisease] = useState<string>('Leaf Blast');
  const [landAcres, setLandAcres] = useState<number>(2.5);
  const [tankSizeLiters, setTankSizeLiters] = useState<number>(15);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('Kannada');

  const menuItems = [
    { id: 'detection', label: 'Crop Disease Detection', icon: Camera, badge: 'Phase 2' },
    { id: 'calendar', label: 'Smart Agriculture Calendar', icon: Calendar, badge: 'Planning' },
    { id: 'resources', label: 'Resource Management', icon: Layers, badge: 'Tank-Mix' },
    { id: 'weather', label: 'Weather Forecasting', icon: CloudSun, badge: '72h Risk' },
    { id: 'analytics', label: 'Predictive Yield Analytics', icon: TrendingUp, badge: 'Yield AI' },
    { id: 'products', label: 'Disease Based Products', icon: PackageCheck, badge: 'CIBRC Safe' },
    { id: 'support', label: 'Local Farmer Support', icon: Headphones, badge: '7 Lang Voice' },
  ];

  const diseaseClasses = [
    { name: 'Leaf Blast', severity: 'Grade 3 (32% necrotic area)', risk: 'High' },
    { name: 'Neck Blast', severity: 'Grade 2 (14% necrotic area)', risk: 'Medium' },
    { name: 'Finger Blast', severity: 'Grade 4 (58% necrotic area)', risk: 'Critical' },
    { name: 'Foot Rot', severity: 'Grade 1 (4% necrotic area)', risk: 'Low' },
    { name: 'Brown Leaf Spot', severity: 'Grade 2 (18% necrotic area)', risk: 'Medium' },
    { name: 'Smut Disease', severity: 'Grade 3 (28% necrotic area)', risk: 'High' },
    { name: 'Cercospora Spot', severity: 'Grade 1 (5% necrotic area)', risk: 'Low' },
    { name: 'Healthy Field', severity: 'Grade 0 (0% necrotic area)', risk: 'Optimal' },
  ];

  return (
    <div className="min-h-screen bg-emerald-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-emerald-900/90 backdrop-blur-md border-b border-emerald-800/60 px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 rounded-lg bg-emerald-800/60 hover:bg-emerald-700 text-emerald-200"
            aria-label="Toggle Menu"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-105 transition-transform">
              🌾
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-white tracking-tight leading-none flex items-center gap-2">
                Kasthataka Sahayaka
              </h1>
              <span className="text-[11px] text-emerald-300 font-mono">Smart Agriculture Dashboard</span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="hidden xs:inline-flex items-center gap-1.5 text-xs text-emerald-300 hover:text-white bg-emerald-900/60 border border-emerald-700/60 px-3 py-1.5 rounded-full transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Landing Page</span>
          </Link>
          <div className="text-xs bg-emerald-800/80 text-emerald-200 border border-emerald-600/50 px-2.5 py-1 rounded-full font-mono font-medium">
            Persona: Farmer
          </div>
        </div>
      </header>

      <div className="flex-1 flex relative">
        {/* Left Sidebar Overlay Backdrop (Mobile) */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
          />
        )}

        {/* Left Sidebar Menu */}
        <aside
          className={`fixed md:static top-[57px] bottom-0 left-0 z-30 w-72 bg-emerald-900/95 border-r border-emerald-800/60 p-4 flex flex-col gap-4 transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="px-2">
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Dashboard Navigation</h2>
            <p className="text-[11px] text-emerald-300/70">Finger Millet Protection Suite</p>
          </div>

          <nav className="flex-1 flex flex-col gap-1.5">
            {menuItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-900/50 border border-emerald-400/40'
                      : 'text-emerald-200 hover:bg-emerald-800/60 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-xs font-mono w-4 font-bold ${isActive ? 'text-emerald-200' : 'text-emerald-400'}`}>
                      0{idx + 1}
                    </span>
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                    <span className="text-xs truncate">{item.label}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-emerald-500'}`} />
                </button>
              );
            })}
          </nav>


        </aside>

        {/* Main Content Workspace (Full Screen Width) */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto w-full max-w-none">
          {/* TAB 1: Crop Disease Detection */}
          {activeTab === 'detection' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 border border-emerald-700/60 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Camera className="w-4 h-4" />
                  <span>AI Diagnostics</span>
                </div>
                <h2 className="text-xl font-bold text-white">Crop Disease Detection</h2>
                <p className="text-xs text-emerald-200/80 mt-1">
                  Real-time plant pathology diagnosis across 8 crop health classes and severity grades.
                </p>
              </div>

              <div className="bg-emerald-900/50 border border-emerald-800/70 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-emerald-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>8 Finger Millet Disease Target Classes &amp; Severity Diagnostics</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  {diseaseClasses.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedDisease(item.name)}
                      className={`p-3.5 rounded-xl text-left border transition-all flex flex-col justify-between gap-2 ${
                        selectedDisease === item.name
                          ? 'bg-emerald-600 border-emerald-400 text-white font-semibold shadow-lg shadow-emerald-950/60'
                          : 'bg-emerald-950/60 border-emerald-800 text-emerald-300 hover:bg-emerald-800/40'
                      }`}
                    >
                      <div className="font-bold text-xs">{item.name}</div>
                      <div className="text-[10px] text-emerald-200/80">{item.severity}</div>
                      <div className={`text-[9px] font-mono px-2 py-0.5 rounded w-fit ${
                        item.risk === 'Critical' ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                        item.risk === 'High' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                        item.risk === 'Medium' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {item.risk} Risk
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Smart Agriculture Calendar */}
          {activeTab === 'calendar' && (
            <div className="space-y-5">
              <div className="bg-emerald-900/60 border border-emerald-800/70 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Calendar className="w-4 h-4" />
                  <span>Finger Millet Crop Cycle</span>
                </div>
                <h2 className="text-lg font-bold text-white">Smart Agriculture Seasonal Calendar</h2>
                <p className="text-xs text-emerald-200/80 mt-1">
                  Automated schedules for land preparation, seed treatment, irrigation, weeding, and disease scouting.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-900/40 border border-emerald-800/60 p-4 rounded-xl space-y-2">
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">Days 0 - 20</span>
                  <h3 className="font-bold text-sm text-white">Nursery & Sowing</h3>
                  <p className="text-xs text-emerald-300/80">Treat seeds with Pseudomonas fluorescens. Maintain nursery moisture.</p>
                </div>
                <div className="bg-emerald-900/40 border border-emerald-800/60 p-4 rounded-xl space-y-2">
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">Days 21 - 50</span>
                  <h3 className="font-bold text-sm text-white">Tillering & Blast Scouting</h3>
                  <p className="text-xs text-emerald-300/80">First weeding pass. Inspect leaf tips for spindle-shaped Blast spots.</p>
                </div>
                <div className="bg-emerald-900/40 border border-emerald-800/60 p-4 rounded-xl space-y-2">
                  <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded font-mono">Days 51 - 90</span>
                  <h3 className="font-bold text-sm text-white">Flowering & Grain Filling</h3>
                  <p className="text-xs text-emerald-300/80">Monitor neck and finger blast. Apply CIBRC-approved bio-fungicides if humidity &gt;85%.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Resource Management */}
          {activeTab === 'resources' && (
            <div className="space-y-5">
              <div className="bg-emerald-900/60 border border-emerald-800/70 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Layers className="w-4 h-4" />
                  <span>Tank-Mix Knapsack Calculator</span>
                </div>
                <h2 className="text-lg font-bold text-white">Resource Management & Dosage Safety</h2>
                <p className="text-xs text-emerald-200/80 mt-1">
                  Compute precise grams/ml per knapsack pump based on your farm acreage and tank size.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-emerald-900/50 border border-emerald-800/70 p-4 rounded-2xl space-y-4">
                  <h3 className="text-sm font-semibold text-emerald-200 flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-emerald-400" />
                    <span>Knapsack Tank Mix Inputs</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-emerald-300 mb-1">Land Size (Acres)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={landAcres}
                        onChange={(e) => setLandAcres(Number(e.target.value))}
                        className="w-full bg-emerald-950 border border-emerald-700 rounded-lg p-2.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-emerald-300 mb-1">Knapsack Pump Size (Liters)</label>
                      <input
                        type="number"
                        value={tankSizeLiters}
                        onChange={(e) => setTankSizeLiters(Number(e.target.value))}
                        className="w-full bg-emerald-950 border border-emerald-700 rounded-lg p-2.5 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-950/80 border border-emerald-700/60 p-4 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">Calculated Mix</span>
                    <h4 className="font-bold text-base text-white mt-2">Recommended Tank Mix</h4>
                    <p className="text-xs text-emerald-300/90 mt-2 leading-relaxed">
                      For <span className="text-emerald-200 font-bold">{landAcres} acres</span> using a{' '}
                      <span className="text-emerald-200 font-bold">{tankSizeLiters}L pump</span>:
                    </p>
                    <div className="mt-3 bg-emerald-900/60 border border-emerald-700/50 p-3 rounded-xl text-xs space-y-1">
                      <div>Total Tanks Needed: <span className="font-bold text-white">{Math.ceil(landAcres * 4)} pumps</span></div>
                      <div>Tricyclazole 75% WP: <span className="font-bold text-emerald-400">18g per 15L tank</span></div>
                      <div>Water Volume: <span className="font-bold text-white">{landAcres * 200} Liters total</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Weather Forecasting */}
          {activeTab === 'weather' && (
            <div className="space-y-5">
              <div className="bg-emerald-900/60 border border-emerald-800/70 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <CloudSun className="w-4 h-4" />
                  <span>Tomorrow.io / OpenWeather Fusion</span>
                </div>
                <h2 className="text-lg font-bold text-white">72-Hour Pathogen Proliferation Vulnerability</h2>
                <p className="text-xs text-emerald-200/80 mt-1">
                  Real-time relative humidity, leaf wetness hours, and temperature forecasting for spore germination risk.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-emerald-900/50 border border-emerald-800/70 p-4 rounded-xl text-center space-y-1">
                  <span className="text-xs text-emerald-300">Relative Humidity</span>
                  <div className="text-2xl font-bold text-sky-400">88%</div>
                  <span className="text-[10px] text-amber-300 font-medium">High Blast Spore Risk</span>
                </div>
                <div className="bg-emerald-900/50 border border-emerald-800/70 p-4 rounded-xl text-center space-y-1">
                  <span className="text-xs text-emerald-300">Leaf Wetness Duration</span>
                  <div className="text-2xl font-bold text-emerald-400">11.5 hrs</div>
                  <span className="text-[10px] text-emerald-300">Dew Point Favorable</span>
                </div>
                <div className="bg-emerald-900/50 border border-emerald-800/70 p-4 rounded-xl text-center space-y-1">
                  <span className="text-xs text-emerald-300">Avg Temperature</span>
                  <div className="text-2xl font-bold text-amber-400">26.4°C</div>
                  <span className="text-[10px] text-emerald-300">Fungal Growth Range</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Predictive Yield Analytics */}
          {activeTab === 'analytics' && (
            <div className="space-y-5">
              <div className="bg-emerald-900/60 border border-emerald-800/70 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>Harvest Loss & Yield Forecasting</span>
                </div>
                <h2 className="text-lg font-bold text-white">Predictive Yield Analytics</h2>
                <p className="text-xs text-emerald-200/80 mt-1">
                  AI estimation of harvest yield loss based on necrotic leaf area ratio and disease progression.
                </p>
              </div>

              <div className="bg-emerald-950/80 border border-emerald-700/60 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between text-xs border-b border-emerald-800/60 pb-3">
                  <span className="text-emerald-300">Estimated Yield (Uninfected Baseline)</span>
                  <span className="font-bold text-white">12.5 Quintals / Acre</span>
                </div>
                <div className="flex items-center justify-between text-xs border-b border-emerald-800/60 pb-3">
                  <span className="text-emerald-300">Current Necrotic Impact (Leaf Blast Grade 3)</span>
                  <span className="font-bold text-amber-400">-18% Projected Loss</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-emerald-200 font-bold">Protected Harvest Forecast (Post-Advisory)</span>
                  <span className="font-bold text-emerald-400 text-sm">10.25 Quintals / Acre</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Disease Based Products */}
          {activeTab === 'products' && (
            <div className="space-y-5">
              <div className="bg-emerald-900/60 border border-emerald-800/70 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <PackageCheck className="w-4 h-4" />
                  <span>Deterministic CIBRC Safety Gate</span>
                </div>
                <h2 className="text-lg font-bold text-white">CIBRC Banned Pesticide Guardrail & Products</h2>
                <p className="text-xs text-emerald-200/80 mt-1">
                  Pre-approved chemical & bio-fungicide treatments validated by rule-based food-safety guardrails.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-900/40 border border-emerald-800/60 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">Approved Bio-Control</span>
                    <span className="text-[10px] text-emerald-400 font-bold">CIBRC Passed</span>
                  </div>
                  <h3 className="font-bold text-sm text-white">Pseudomonas fluorescens 1.15% WP</h3>
                  <p className="text-xs text-emerald-300/80">Bio-fungicide for seed treatment and foliar spray against early blast pathogens.</p>
                </div>

                <div className="bg-emerald-900/40 border border-emerald-800/60 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">Approved Systemic</span>
                    <span className="text-[10px] text-emerald-400 font-bold">CIBRC Passed</span>
                  </div>
                  <h3 className="font-bold text-sm text-white">Tricyclazole 75% WP</h3>
                  <p className="text-xs text-emerald-300/80">Systemic fungicide specifically recommended for severe finger millet neck blast protection.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: Local Farmer Support */}
          {activeTab === 'support' && (
            <div className="space-y-5">
              <div className="bg-emerald-900/60 border border-emerald-800/70 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Headphones className="w-4 h-4" />
                  <span>Multilingual Web Speech STT/TTS</span>
                </div>
                <h2 className="text-lg font-bold text-white">Local Farmer Support & Vernacular Voice</h2>
                <p className="text-xs text-emerald-200/80 mt-1">
                  Voice-first advisory synthesis supporting Kannada, Telugu, Tamil, Marathi, Odia, Hindi, and English.
                </p>
              </div>

              <div className="bg-emerald-900/50 border border-emerald-800/70 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-emerald-300">Select Support Language</span>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="bg-emerald-950 border border-emerald-700 text-xs rounded-lg px-3 py-1.5 text-white"
                  >
                    <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                    <option value="Telugu">Telugu (తెలుగు)</option>
                    <option value="Tamil">Tamil (தமிழ்)</option>
                    <option value="Marathi">Marathi (मराठी)</option>
                    <option value="Odia">Odia (ଓଡ଼ିଆ)</option>
                    <option value="Hindi">Hindi (हिन्दी)</option>
                    <option value="English">English</option>
                  </select>
                </div>

                <div className="bg-emerald-950/90 border border-emerald-700/60 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <Volume2 className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Voice Advisory System</h4>
                      <p className="text-[11px] text-emerald-300/80">Active Language: {selectedLanguage}</p>
                    </div>
                  </div>
                  <button className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold px-4 py-2 rounded-lg text-xs transition-transform hover:scale-105">
                    Listen Audio
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
