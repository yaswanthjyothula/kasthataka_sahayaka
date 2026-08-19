'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Camera,
  Calendar,
  Layers,
  CloudSun,
  TrendingUp,
  PackageCheck,
  ClipboardList,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  Volume2,
  Droplets,
  CheckCircle2,
  Send,
  Paperclip,
  Bot,
  User,
  Mic,
  MicOff,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
  image?: string;
}

// Consistent time formatter — avoids server/client locale mismatch (hydration error)
function getTime(): string {
  const d = new Date();
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<string>('detection');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Chatbot states — initial timestamp set client-side only to avoid hydration mismatch
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Namaste! I am your KisanMitra AI Advisor. Tap the Camera button to open the live leaf camera viewfinder, upload an image, or use the Mic to ask questions about crop disease symptoms and treatment.',
      time: '—',
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isBotTyping, setIsBotTyping] = useState<boolean>(false);

  // ─── Weather state ─────────────────────────────────────────────────────────
  const OWM_KEY = 'fbcb5222fdf88744e6ba4f9dd53d41b5';
  type WxStatus = 'idle' | 'locating' | 'loading' | 'ok' | 'error';
  const [wxStatus, setWxStatus]   = useState<WxStatus>('idle');
  const [wxError, setWxError]     = useState('');
  const [wxCoords, setWxCoords]   = useState<{ lat: number; lon: number } | null>(null);
  const [wxTz, setWxTz]           = useState(0);
  const [wxSearchQuery, setWxSearchQuery] = useState('');
  const [wxSearching, setWxSearching]     = useState(false);
  const [wxLocationLabel, setWxLocationLabel] = useState('');
  const [wxCurrent, setWxCurrent] = useState<{
    city: string; country: string; temp: number; feelsLike: number;
    humidity: number; pressure: number; windSpeed: number; windDeg: number;
    visibility: number; description: string; icon: string;
    clouds: number; rain1h: number; sunrise: number; sunset: number;
  } | null>(null);
  const [wxForecast, setWxForecast] = useState<{
    dt: number; temp: number; humidity: number; pop: number;
    description: string; icon: string; clouds: number;
  }[]>([]);

  const wxFetchWeather = async (lat: number, lon: number) => {
    setWxStatus('loading');
    try {
      const [cr, fr] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&units=metric`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&units=metric&cnt=24`),
      ]);
      if (!cr.ok || !fr.ok) throw new Error('Weather API error');
      const cur = await cr.json() as {
        name: string; sys: { country: string; sunrise: number; sunset: number };
        main: { temp: number; feels_like: number; humidity: number; pressure: number };
        wind: { speed: number; deg?: number };
        visibility?: number; weather: { description: string; icon: string }[];
        clouds: { all: number }; rain?: { '1h'?: number }; timezone?: number;
      };
      const fct = await fr.json() as { list: { dt: number; main: { temp: number; humidity: number }; pop: number; weather: { description: string; icon: string }[]; clouds: { all: number } }[] };
      const tz = cur.timezone ?? 0;
      setWxTz(tz);
      setWxCurrent({
        city: cur.name, country: cur.sys.country,
        temp: Math.round(cur.main.temp), feelsLike: Math.round(cur.main.feels_like),
        humidity: cur.main.humidity, pressure: cur.main.pressure,
        windSpeed: cur.wind.speed, windDeg: cur.wind.deg ?? 0,
        visibility: Math.round((cur.visibility ?? 10000) / 1000),
        description: cur.weather[0].description, icon: cur.weather[0].icon,
        clouds: cur.clouds.all, rain1h: cur.rain?.['1h'] ?? 0,
        sunrise: cur.sys.sunrise, sunset: cur.sys.sunset,
      });
      setWxForecast(fct.list.map(s => ({
        dt: s.dt, temp: Math.round(s.main.temp), humidity: s.main.humidity,
        pop: s.pop, description: s.weather[0].description, icon: s.weather[0].icon, clouds: s.clouds.all,
      })));
      setWxStatus('ok');
    } catch (e: unknown) {
      setWxError(e instanceof Error ? e.message : 'Failed to load weather');
      setWxStatus('error');
    }
  };

  const wxAcquireLocation = () => {
    setWxStatus('locating'); setWxError(''); setWxLocationLabel('');
    if (!navigator.geolocation) { setWxError('Geolocation not supported.'); setWxStatus('error'); return; }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lon } = pos.coords;
        localStorage.setItem('ks_wx_lat', String(lat));
        localStorage.setItem('ks_wx_lon', String(lon));
        setWxCoords({ lat, lon });
        wxFetchWeather(lat, lon);
      },
      err => {
        setWxError(err.code === 1 ? 'Location permission denied. Allow access and try again.' : 'Unable to get location. Please try again.');
        setWxStatus('error');
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  // Search weather by city/location name
  const wxSearchLocation = async (query: string) => {
    const q = query.trim();
    if (!q) return;
    setWxSearching(true);
    setWxError('');
    try {
      // Geocode the location name to lat/lon using OWM geocoding API
      const geoRes = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=1&appid=${OWM_KEY}`
      );
      if (!geoRes.ok) throw new Error('Geocoding failed');
      const geoData = await geoRes.json() as { lat: number; lon: number; name: string; country: string; state?: string }[];
      if (!geoData || geoData.length === 0) throw new Error(`No results found for "${q}". Try a city name like "Bengaluru" or "Hyderabad".`);
      const { lat, lon, name, country, state } = geoData[0];
      setWxCoords({ lat, lon });
      setWxLocationLabel(`${name}${state ? ', ' + state : ''}, ${country}`);
      await wxFetchWeather(lat, lon);
    } catch (e: unknown) {
      setWxError(e instanceof Error ? e.message : 'Location search failed');
      setWxStatus('error');
    } finally {
      setWxSearching(false);
    }
  };

  // Auto-load weather on mount if permission already granted
  useEffect(() => {
    if (!navigator.geolocation) return;
    const tryAuto = () => {
      const lat = localStorage.getItem('ks_wx_lat');
      const lon = localStorage.getItem('ks_wx_lon');
      if (lat && lon) {
        const la = parseFloat(lat), lo = parseFloat(lon);
        setWxCoords({ lat: la, lon: lo });
        wxFetchWeather(la, lo);
        navigator.geolocation.getCurrentPosition(
          p => { localStorage.setItem('ks_wx_lat', String(p.coords.latitude)); localStorage.setItem('ks_wx_lon', String(p.coords.longitude)); wxFetchWeather(p.coords.latitude, p.coords.longitude); },
          () => {}, { timeout: 10000, maximumAge: 300000 }
        );
        return;
      }
      wxAcquireLocation();
    };
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then(r => {
        if (r.state === 'granted') tryAuto();
        else if (r.state === 'prompt' && localStorage.getItem('ks_wx_lat')) tryAuto();
      });
    } else if (localStorage.getItem('ks_wx_lat')) tryAuto();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Camera Viewfinder Modal states
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Feature states
  const [landAcres, setLandAcres] = useState<number>(2.5);
  const [tankSizeLiters, setTankSizeLiters] = useState<number>(15);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('Kannada');

  // Crop & Land Details states
  const [pincode, setPincode] = useState<string>('');
  const [pincodeLocation, setPincodeLocation] = useState<string>('');
  const [pincodeLoading, setPincodeLoading] = useState<boolean>(false);
  const [pincodeError, setPincodeError] = useState<string>('');

  // Form field states (shared across tabs)
  const [cropType, setCropType] = useState<string>('');
  const [cropTypeLabel, setCropTypeLabel] = useState<string>('');
  const [growthStage, setGrowthStage] = useState<string>('');
  const [sowingDate, setSowingDate] = useState<string>('');
  const [sowingDD, setSowingDD] = useState<string>('');
  const [sowingMM, setSowingMM] = useState<string>('');
  const [sowingYYYY, setSowingYYYY] = useState<string>('');
  const [soilType, setSoilType] = useState<string>('');
  const [fieldLandAcres, setFieldLandAcres] = useState<string>('');
  const [riceVarietyDuration, setRiceVarietyDuration] = useState<string>('');
  const [soilOrganicCarbon, setSoilOrganicCarbon] = useState<string>('');

  // Saved / submitted context (drives calendar & analytics)
  const [savedCropContext, setSavedCropContext] = useState<{
    cropType: string; cropTypeLabel: string; growthStage: string;
    sowingDate: string; soilType: string; landAcres: string;
    location: string; riceVarietyDuration: string; soilOrganicCarbon: string;
  } | null>(null);
  const [cropDetailsSaved, setCropDetailsSaved] = useState<boolean>(false);
  const lookupPincode = async (pin: string) => {
    if (pin.length !== 6) { setPincodeLocation(''); setPincodeError(''); return; }
    setPincodeLoading(true);
    setPincodeError('');
    setPincodeLocation('');
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        setPincodeLocation(`${po.Block !== 'NA' ? po.Block + ', ' : ''}${po.District}, ${po.State}`);
      } else {
        setPincodeError('Pincode not found. Please check and try again.');
      }
    } catch {
      setPincodeError('Could not fetch location. Check your connection.');
    } finally {
      setPincodeLoading(false);
    }
  };

  const handleSaveCropDetails = () => {
    if (!cropType || !growthStage || !fieldLandAcres) {
      alert('Please fill in Crop Type, Growth Stage, and Land Area before saving.');
      return;
    }
    setSavedCropContext({
      cropType,
      cropTypeLabel,
      growthStage,
      sowingDate,
      soilType,
      landAcres: fieldLandAcres,
      location: pincodeLocation,
      riceVarietyDuration,
      soilOrganicCarbon,
    });
    setCropDetailsSaved(true);
    setActiveTab('calendar');
  };

  // ─── Date helpers ────────────────────────────────────────────────────────────
  const addDays = (base: Date, days: number): Date => { const d = new Date(base); d.setDate(d.getDate() + days); return d; };
  const fmtDate = (d: Date) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const fmtShort = (d: Date) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

  type CropEvent = { day: number; date: Date; type: 'sowing'|'sprout'|'water'|'fertiliser'|'spray'|'harvest'|'milestone'; title: string; detail: string; dotColor: string; textColor: string; };

  const getCropEvents = (ct: string, sowingDateStr: string, acres: number): CropEvent[] => {
    const base = sowingDateStr ? new Date(sowingDateStr) : new Date();
    const ev = (day: number, type: CropEvent['type'], title: string, detail: string, dot: string, tc: string): CropEvent =>
      ({ day, date: addDays(base, day), type, title, detail, dotColor: dot, textColor: tc });
    const millets = ['rice','finger_millet','sorghum','pearl_millet','foxtail_millet','little_millet','kodo_millet','barnyard_millet','proso_millet'];
    const pulses  = ['groundnut','soybean','chickpea','pigeon_pea','lentil','mung_bean','black_gram','cowpea'];
    const veggies = ['tomato','brinjal','chilli','capsicum','okra','onion','potato','cabbage','cauliflower','spinach'];
    if (millets.includes(ct)) {
      const u=(25*acres).toFixed(1), d=(20*acres).toFixed(1);
      return [
        ev(0,  'sowing',    'Sowing / Nursery Day',         `Pseudomonas fluorescens seed treatment — 10 g / kg seed`,       'bg-emerald-600','text-emerald-600'),
        ev(7,  'sprout',    'Seedling Emergence',           `Seedlings visible; apply light irrigation 3–4 cm`,              'bg-green-500',  'text-green-600'),
        ev(7,  'water',     'Irrigation #1',                `3–4 cm depth — nursery beds`,                                   'bg-sky-500',    'text-sky-600'),
        ev(10, 'fertiliser','Basal Fertiliser',             `DAP ${d} kg + MOP ${(10*acres).toFixed(1)} kg (total field)`,   'bg-amber-500',  'text-amber-600'),
        ev(14, 'water',     'Irrigation #2',                `4–5 cm; avoid waterlogging`,                                    'bg-sky-500',    'text-sky-600'),
        ev(21, 'milestone', 'Transplanting to Main Field',  `3-leaf stage; transplant in rows`,                              'bg-slate-400',  'text-slate-500'),
        ev(21, 'water',     'Irrigation #3 (Post-Transplant)','Irrigate immediately after transplanting',                   'bg-sky-500',    'text-sky-600'),
        ev(25, 'fertiliser','Urea Top-Dress #1',            `Urea ${u} kg for ${acres} acres`,                               'bg-amber-500',  'text-amber-600'),
        ev(28, 'water',     'Irrigation #4',                `Every 6–7 days at tillering`,                                   'bg-sky-500',    'text-sky-600'),
        ev(30, 'spray',     'Weed Control Spray',           `Bispyribac-sodium 10% SC — 100 ml / 15 L`,                     'bg-rose-500',   'text-rose-600'),
        ev(35, 'water',     'Irrigation #5',                `3–5 cm standing water`,                                         'bg-sky-500',    'text-sky-600'),
        ev(42, 'water',     'Irrigation #6',                `3–5 cm standing water`,                                         'bg-sky-500',    'text-sky-600'),
        ev(45, 'fertiliser','Urea Top-Dress #2',            `Urea ${u} kg for ${acres} acres`,                               'bg-amber-500',  'text-amber-600'),
        ev(45, 'spray',     'Blast Scout Spray',            `Tricyclazole 75% WP — 18 g / 15 L (if lesions found)`,         'bg-rose-500',   'text-rose-600'),
        ev(49, 'water',     'Irrigation #7',                `Field capacity during tillering peak`,                          'bg-sky-500',    'text-sky-600'),
        ev(56, 'water',     'Irrigation #8',                `Every 5 days during flowering`,                                 'bg-sky-500',    'text-sky-600'),
        ev(60, 'fertiliser','Potassium & ZnSO₄ Spray',     `MOP ${(10*acres).toFixed(1)} kg + ZnSO₄ ${(5*acres).toFixed(1)} kg`, 'bg-amber-500','text-amber-600'),
        ev(60, 'spray',     'Neck Blast Preventive Spray',  `Tricyclazole 75% WP — 18 g / 15 L`,                            'bg-rose-500',   'text-rose-600'),
        ev(63, 'water',     'Irrigation #9',                `Critical at panicle emergence`,                                 'bg-sky-500',    'text-sky-600'),
        ev(70, 'water',     'Irrigation #10',               `Last irrigation before grain fill`,                             'bg-sky-500',    'text-sky-600'),
        ev(75, 'spray',     'Grain Fill Protection',        `Propiconazole 25% EC — 10 ml / 15 L`,                          'bg-rose-500',   'text-rose-600'),
        ev(85, 'milestone', 'Withhold Irrigation',          `Stop irrigation 15 days before harvest`,                        'bg-slate-400',  'text-slate-500'),
        ev(100,'harvest',   '🌾 Expected Harvest',          `80% grains straw-yellow; dry to <12% moisture`,                 'bg-violet-600', 'text-violet-600'),
      ];
    }
    if (ct==='wheat'||ct==='barley'||ct==='oats') {
      const u=(30*acres).toFixed(1), d=(25*acres).toFixed(1);
      return [
        ev(0,  'sowing',    'Sowing Day',                   `Seed rate ${(100*acres).toFixed(0)} kg; Thiram 2 g/kg treatment`, 'bg-emerald-600','text-emerald-600'),
        ev(5,  'sprout',    'Germination',                  `Uniform emergence; check seed-soil contact`,                    'bg-green-500',  'text-green-600'),
        ev(10, 'fertiliser','Basal DAP',                    `DAP ${d} kg for ${acres} acres`,                                'bg-amber-500',  'text-amber-600'),
        ev(21, 'water',     'CRI Irrigation',               `Crown Root Initiation — 6 cm; critical`,                        'bg-sky-500',    'text-sky-600'),
        ev(25, 'fertiliser','Urea Top-Dress #1',            `Urea ${u} kg for ${acres} acres`,                               'bg-amber-500',  'text-amber-600'),
        ev(35, 'spray',     'Weed Control',                 `Isoproturon 75% WP — 400 g / acre`,                            'bg-rose-500',   'text-rose-600'),
        ev(42, 'water',     'Tillering Irrigation',         `5 cm at active tillering`,                                      'bg-sky-500',    'text-sky-600'),
        ev(55, 'water',     'Jointing Irrigation',          `5 cm — most critical stage`,                                    'bg-sky-500',    'text-sky-600'),
        ev(55, 'fertiliser','Urea Top-Dress #2',            `Urea ${(20*acres).toFixed(1)} kg for ${acres} acres`,           'bg-amber-500',  'text-amber-600'),
        ev(60, 'spray',     'Rust / Mildew Spray',          `Propiconazole 25% EC — 10 ml / 15 L`,                          'bg-rose-500',   'text-rose-600'),
        ev(70, 'water',     'Heading Irrigation',           `5 cm at panicle emergence`,                                     'bg-sky-500',    'text-sky-600'),
        ev(80, 'water',     'Grain Fill Irrigation',        `Last water — 4 cm at early grain fill`,                         'bg-sky-500',    'text-sky-600'),
        ev(90, 'spray',     'Aphid Scout Spray',            `Imidacloprid 17.8% SL — 5 ml / 15 L if >10 aphids/tiller`,    'bg-rose-500',   'text-rose-600'),
        ev(100,'milestone', 'Withhold Irrigation',          `Stop irrigation 15 days before harvest`,                        'bg-slate-400',  'text-slate-500'),
        ev(115,'harvest',   '🌾 Expected Harvest',          `<20% grain moisture; combine/manual harvesting`,                'bg-violet-600', 'text-violet-600'),
      ];
    }
    if (ct==='maize') {
      const u=(30*acres).toFixed(1);
      return [
        ev(0,  'sowing',    'Sowing Day',                   `Seed ${(8*acres).toFixed(0)} kg; primed 12 hrs in water`,       'bg-emerald-600','text-emerald-600'),
        ev(5,  'sprout',    'Germination',                  `80%+ germination expected; re-sow gaps`,                        'bg-green-500',  'text-green-600'),
        ev(7,  'fertiliser','Basal Fertiliser',             `DAP ${(25*acres).toFixed(1)} kg + MOP ${(10*acres).toFixed(1)} kg`, 'bg-amber-500','text-amber-600'),
        ev(10, 'water',     'Irrigation #1',                `Every 7 days at seedling stage`,                                'bg-sky-500',    'text-sky-600'),
        ev(20, 'milestone', 'Thinning at V3 Stage',         `1 plant per hill`,                                              'bg-slate-400',  'text-slate-500'),
        ev(25, 'fertiliser','Urea Top-Dress #1',            `Urea ${u} kg for ${acres} acres`,                               'bg-amber-500',  'text-amber-600'),
        ev(25, 'spray',     'FAW Scout Spray',              `Emamectin Benzoate 5% SG — 4 g / 15 L if FAW found`,           'bg-rose-500',   'text-rose-600'),
        ev(30, 'water',     'Irrigation #2',                `6 cm at knee-height stage`,                                     'bg-sky-500',    'text-sky-600'),
        ev(40, 'water',     'Irrigation #3',                `Every 6–7 days`,                                                'bg-sky-500',    'text-sky-600'),
        ev(45, 'fertiliser','Urea Top-Dress #2 + MOP',      `Urea ${(20*acres).toFixed(1)} kg + MOP ${(8*acres).toFixed(1)} kg`, 'bg-amber-500','text-amber-600'),
        ev(50, 'spray',     'Downy Mildew Spray',           `Metalaxyl 8% + Mancozeb 64% WP — 25 g / 15 L`,                'bg-rose-500',   'text-rose-600'),
        ev(55, 'water',     'Tasseling Irrigation',         `Critical — 6 cm at tasseling`,                                  'bg-sky-500',    'text-sky-600'),
        ev(62, 'water',     'Silking Irrigation',           `Critical — 6 cm at silking`,                                    'bg-sky-500',    'text-sky-600'),
        ev(65, 'spray',     'Cob Borer Spray',              `Chlorpyriphos 20% EC — 20 ml / 15 L`,                          'bg-rose-500',   'text-rose-600'),
        ev(75, 'water',     'Grain Fill Irrigation',        `Last water — 5 cm at early grain fill`,                         'bg-sky-500',    'text-sky-600'),
        ev(85, 'milestone', 'Withhold Irrigation',          `Stop water 10 days before harvest`,                             'bg-slate-400',  'text-slate-500'),
        ev(95, 'harvest',   '🌾 Expected Harvest',          `Husk papery brown; dry cobs to <14% moisture`,                  'bg-violet-600', 'text-violet-600'),
      ];
    }
    if (ct==='sugarcane') {
      const u=(50*acres).toFixed(1);
      return [
        ev(0,  'sowing',    'Planting Day',                 `3-budded setts; Carbendazim sett dip; ${acres} acres`,          'bg-emerald-600','text-emerald-600'),
        ev(10, 'sprout',    'Sett Sprouting',               `Check germination; fill gaps`,                                  'bg-green-500',  'text-green-600'),
        ev(14, 'water',     'Irrigation #1',                `Light irrigation to encourage sprouting`,                       'bg-sky-500',    'text-sky-600'),
        ev(30, 'fertiliser','Basal Fertiliser',             `DAP ${(30*acres).toFixed(1)} kg + MOP ${(25*acres).toFixed(1)} kg`, 'bg-amber-500','text-amber-600'),
        ev(30, 'milestone', 'Gap Filling',                  `Fill missing stands within 30 days`,                            'bg-slate-400',  'text-slate-500'),
        ev(45, 'water',     'Irrigation #2',                `Every 7–10 days during tillering`,                              'bg-sky-500',    'text-sky-600'),
        ev(60, 'fertiliser','Urea Top-Dress #1',            `Urea ${u} kg + earthing up rows`,                               'bg-amber-500',  'text-amber-600'),
        ev(90, 'fertiliser','Urea Top-Dress #2',            `Urea ${u} kg for ${acres} acres`,                               'bg-amber-500',  'text-amber-600'),
        ev(90, 'spray',     'Red Rot Preventive Spray',     `Propiconazole 25% EC — 10 ml / 15 L`,                          'bg-rose-500',   'text-rose-600'),
        ev(120,'water',     'Grand Growth Irrigation',      `Every 7 days; avoid stress`,                                    'bg-sky-500',    'text-sky-600'),
        ev(180,'spray',     'Borer Spray',                  `Chlorpyriphos 20% EC — 20 ml / 15 L`,                          'bg-rose-500',   'text-rose-600'),
        ev(300,'milestone', 'Withhold Irrigation',          `Stop water 30 days before harvest; ripening phase`,             'bg-slate-400',  'text-slate-500'),
        ev(330,'milestone', 'Brix Testing',                 `Confirm Brix >18% with refractometer`,                          'bg-slate-400',  'text-slate-500'),
        ev(360,'harvest',   '🌾 Expected Harvest',          `Cut at ground level; retain tops for ratoon`,                   'bg-violet-600', 'text-violet-600'),
      ];
    }
    if (ct==='cotton') {
      const u=(25*acres).toFixed(1);
      return [
        ev(0,  'sowing',    'Sowing Day',                   `Imidacloprid seed treatment; 90×60 cm spacing`,                 'bg-emerald-600','text-emerald-600'),
        ev(7,  'sprout',    'Germination',                  `Check germination; re-sow skips`,                               'bg-green-500',  'text-green-600'),
        ev(14, 'water',     'Irrigation #1',                `Light irrigation at seedling stage`,                            'bg-sky-500',    'text-sky-600'),
        ev(21, 'fertiliser','Basal Fertiliser',             `DAP ${(20*acres).toFixed(1)} kg + MOP ${(15*acres).toFixed(1)} kg`, 'bg-amber-500','text-amber-600'),
        ev(30, 'water',     'Squaring Irrigation',          `5 cm at squaring stage`,                                        'bg-sky-500',    'text-sky-600'),
        ev(35, 'fertiliser','Urea Top-Dress #1',            `Urea ${u} kg for ${acres} acres`,                               'bg-amber-500',  'text-amber-600'),
        ev(40, 'spray',     'Bollworm Scout Spray',         `Bt 1 kg/acre or NPV if egg mass found`,                        'bg-rose-500',   'text-rose-600'),
        ev(50, 'water',     'Flowering Irrigation',         `5 cm at first flower — critical`,                               'bg-sky-500',    'text-sky-600'),
        ev(60, 'spray',     'Whitefly Spray',               `Spiromesifen 22.9% SC — 10 ml / 15 L`,                         'bg-rose-500',   'text-rose-600'),
        ev(65, 'fertiliser','Urea Top-Dress #2',            `Urea ${(20*acres).toFixed(1)} kg for ${acres} acres`,           'bg-amber-500',  'text-amber-600'),
        ev(70, 'water',     'Boll Irrigation',              `5–6 cm every 7 days`,                                           'bg-sky-500',    'text-sky-600'),
        ev(90, 'spray',     'Boll Rot Preventive',          `Copper Oxychloride 50% WP — 30 g / 15 L`,                     'bg-rose-500',   'text-rose-600'),
        ev(110,'milestone', 'Defoliant Application',        `Apply defoliant 2 weeks before final picking`,                  'bg-slate-400',  'text-slate-500'),
        ev(130,'harvest',   '🌾 First Picking',             `Pick open bolls; 3 rounds expected`,                            'bg-violet-600', 'text-violet-600'),
        ev(150,'harvest',   '🌾 Second Picking',            `Second round picking`,                                          'bg-violet-600', 'text-violet-600'),
        ev(165,'harvest',   '🌾 Final Picking',             `Final picking; grade & store seed cotton`,                      'bg-violet-600', 'text-violet-600'),
      ];
    }
    if (veggies.includes(ct)) {
      const u=(15*acres).toFixed(1);
      return [
        ev(0,  'sowing',    'Nursery Sowing',               `Raised beds; Metalaxyl drench 2 g/L`,                           'bg-emerald-600','text-emerald-600'),
        ev(7,  'sprout',    'Seedling Emergence',           `50% shade net; keep nursery moist`,                             'bg-green-500',  'text-green-600'),
        ev(21, 'milestone', 'Transplanting',                `4-leaf stage; Carbendazim drench post-transplant`,              'bg-slate-400',  'text-slate-500'),
        ev(21, 'water',     'Post-Transplant Irrigation',   `Irrigate immediately after transplanting`,                      'bg-sky-500',    'text-sky-600'),
        ev(25, 'fertiliser','Basal Fertiliser',             `DAP ${(15*acres).toFixed(1)} kg + MOP ${(12*acres).toFixed(1)} kg`, 'bg-amber-500','text-amber-600'),
        ev(28, 'water',     'Irrigation #1',                `Drip / furrow every 4–5 days`,                                  'bg-sky-500',    'text-sky-600'),
        ev(35, 'spray',     'Thrips / Miner Spray',         `Spinosad 45% SC — 1 ml / 15 L`,                               'bg-rose-500',   'text-rose-600'),
        ev(35, 'fertiliser','Urea Top-Dress',               `Urea ${u} kg for ${acres} acres`,                               'bg-amber-500',  'text-amber-600'),
        ev(40, 'water',     'Irrigation #2',                `Every 4–5 days`,                                                'bg-sky-500',    'text-sky-600'),
        ev(45, 'spray',     'Boron Spray (Fruit Set)',      `Borax 0.1% — 150 ml / 15 L at first flower`,                  'bg-rose-500',   'text-rose-600'),
        ev(50, 'water',     'Irrigation #3 (Flowering)',    `Critical at flowering`,                                         'bg-sky-500',    'text-sky-600'),
        ev(55, 'spray',     'Blight / Mildew Spray',        `Mancozeb 75% WP — 25 g / 15 L`,                               'bg-rose-500',   'text-rose-600'),
        ev(60, 'fertiliser','Potassium Top-Up',             `MOP ${(10*acres).toFixed(1)} kg for fruit firmness`,            'bg-amber-500',  'text-amber-600'),
        ev(65, 'water',     'Irrigation #4',                `Every 4 days during fruit development`,                         'bg-sky-500',    'text-sky-600'),
        ev(80, 'harvest',   '🌾 First Harvest Window',      `Harvest early morning; grade & pack in crates`,                 'bg-violet-600', 'text-violet-600'),
        ev(90, 'harvest',   '🌾 Continued Harvest',         `Multiple picking cycles every 5–7 days`,                        'bg-violet-600', 'text-violet-600'),
      ];
    }
    if (pulses.includes(ct)) {
      const d=(12*acres).toFixed(1);
      return [
        ev(0,  'sowing',    'Sowing Day',                   `Rhizobium + Thiram seed treatment; ${acres} acres`,             'bg-emerald-600','text-emerald-600'),
        ev(5,  'sprout',    'Germination',                  `Expect emergence in 5–7 days`,                                  'bg-green-500',  'text-green-600'),
        ev(10, 'fertiliser','Basal DAP',                    `DAP ${d} kg — no Urea; Rhizobium provides N`,                  'bg-amber-500',  'text-amber-600'),
        ev(12, 'water',     'Irrigation #1',                `Light irrigation at seedling stage`,                            'bg-sky-500',    'text-sky-600'),
        ev(20, 'milestone', 'Intercultivation #1',          `Weed inter-culture at 15–20 DAS`,                               'bg-slate-400',  'text-slate-500'),
        ev(25, 'water',     'Irrigation #2',                `At branch development stage`,                                   'bg-sky-500',    'text-sky-600'),
        ev(30, 'spray',     'Stem Fly Spray',               `Dimethoate 30% EC — 10 ml / 15 L`,                            'bg-rose-500',   'text-rose-600'),
        ev(40, 'water',     'Flowering Irrigation',         `Critical — at 50% flowering`,                                   'bg-sky-500',    'text-sky-600'),
        ev(45, 'spray',     'Pod Borer Spray',              `Chlorpyriphos 20% EC — 20 ml / 15 L`,                         'bg-rose-500',   'text-rose-600'),
        ev(50, 'water',     'Pod Fill Irrigation',          `Last irrigation at pod fill`,                                   'bg-sky-500',    'text-sky-600'),
        ev(55, 'spray',     'Powdery Mildew Spray',         `Hexaconazole 5% EC — 15 ml / 15 L if needed`,                 'bg-rose-500',   'text-rose-600'),
        ev(65, 'milestone', 'Withhold Water',               `Stop irrigation when 75% pods yellow-brown`,                    'bg-slate-400',  'text-slate-500'),
        ev(75, 'harvest',   '🌾 Expected Harvest',          `Thresh & dry to 10% moisture; store with Aluminium Phosphide`,  'bg-violet-600', 'text-violet-600'),
      ];
    }
    return [
      ev(0,  'sowing',    'Planting Day',                 `Pit prep; FYM ${(8*acres).toFixed(0)} kg/acre`,                  'bg-emerald-600','text-emerald-600'),
      ev(10, 'sprout',    'Establishment',                `Check survival; replace dead plants`,                            'bg-green-500',  'text-green-600'),
      ev(14, 'water',     'Irrigation #1',                `Every 5–7 days`,                                                 'bg-sky-500',    'text-sky-600'),
      ev(21, 'fertiliser','Basal NPK',                    `NPK 10:26:26 — ${(20*acres).toFixed(1)} kg`,                     'bg-amber-500',  'text-amber-600'),
      ev(45, 'fertiliser','Nitrogen Top-Dress',           `Urea ${(15*acres).toFixed(1)} kg for ${acres} acres`,            'bg-amber-500',  'text-amber-600'),
      ev(45, 'spray',     'Pest Scout Spray',             `Apply recommended pesticide at first pest appearance`,           'bg-rose-500',   'text-rose-600'),
      ev(75, 'spray',     'Fungicide Spray',              `Mancozeb 75% WP — 25 g / 15 L`,                                'bg-rose-500',   'text-rose-600'),
      ev(90, 'fertiliser','Pre-Flower Fertiliser',        `MOP + Borax foliar spray before flowering`,                     'bg-amber-500',  'text-amber-600'),
      ev(120,'harvest',   '🌾 Harvest / First Flush',     `Harvest at crop-specific maturity index`,                        'bg-violet-600', 'text-violet-600'),
    ];
  };

  // ─── Resource input list ─────────────────────────────────────────────────────
  type ResourceItem = {
    category: 'seed'|'fertiliser'|'pesticide'|'water'|'labour'|'equipment';
    item: string; ratePerAcre: string; rateNum: number; unit: string; timing: string; purpose: string;
  };

  const getCropResources = (ct: string): ResourceItem[] => {
    const millets = ['rice','finger_millet','sorghum','pearl_millet','foxtail_millet','little_millet','kodo_millet','barnyard_millet','proso_millet'];
    const pulses  = ['groundnut','soybean','chickpea','pigeon_pea','lentil','mung_bean','black_gram','cowpea'];
    const veggies = ['tomato','brinjal','chilli','capsicum','okra','onion','potato','cabbage','cauliflower','spinach'];
    if (millets.includes(ct)) return [
      { category:'seed',       item:'Certified Seed',                   ratePerAcre:'8–10 kg',    rateNum:9,    unit:'kg',          timing:'Sowing day',           purpose:'Primary planting material' },
      { category:'fertiliser', item:'DAP (18:46:00)',                   ratePerAcre:'20 kg',      rateNum:20,   unit:'kg',          timing:'Basal at sowing',      purpose:'Phosphorus & Nitrogen base' },
      { category:'fertiliser', item:'MOP (0:0:60)',                     ratePerAcre:'10 kg',      rateNum:10,   unit:'kg',          timing:'Basal at sowing',      purpose:'Potassium for grain quality' },
      { category:'fertiliser', item:'Urea (46% N)',                     ratePerAcre:'50 kg',      rateNum:50,   unit:'kg',          timing:'Split: 25 DAS & 45 DAS','purpose':'Nitrogen top-dressing ×2' },
      { category:'fertiliser', item:'Zinc Sulphate (ZnSO₄ 21%)',        ratePerAcre:'5 kg',       rateNum:5,    unit:'kg',          timing:'At transplanting',     purpose:'Zinc deficiency correction' },
      { category:'pesticide',  item:'Pseudomonas fluorescens 1.15% WP', ratePerAcre:'90 g',       rateNum:90,   unit:'g',           timing:'Seed treatment',       purpose:'Blast biocontrol' },
      { category:'pesticide',  item:'Tricyclazole 75% WP',              ratePerAcre:'240 g',      rateNum:240,  unit:'g',           timing:'45 DAS & 60 DAS',      purpose:'Leaf & neck blast control' },
      { category:'pesticide',  item:'Bispyribac-sodium 10% SC',         ratePerAcre:'100 ml',     rateNum:100,  unit:'ml',          timing:'30 DAS',               purpose:'Weed control in paddy/millet' },
      { category:'water',      item:'Irrigation Water',                  ratePerAcre:'200 L/event',rateNum:200,  unit:'L/event',     timing:'Every 5–7 days (~10 events)','purpose':'Field moisture maintenance' },
      { category:'labour',     item:'Farm Labour (person-days)',          ratePerAcre:'30 days',    rateNum:30,   unit:'person-days', timing:'Sowing to harvest',    purpose:'Land prep, sowing, weeding, harvest' },
      { category:'equipment',  item:'Knapsack Sprayer fills (15 L)',      ratePerAcre:'4 tanks',    rateNum:4,    unit:'tanks/spray', timing:'Each spray event',     purpose:'Pesticide / fungicide application' },
    ];
    if (ct==='wheat'||ct==='barley'||ct==='oats') return [
      { category:'seed',       item:'Certified Seed',                   ratePerAcre:'100 kg',     rateNum:100,  unit:'kg',          timing:'Sowing day',           purpose:'Drill / broadcast sowing' },
      { category:'fertiliser', item:'DAP (18:46:00)',                   ratePerAcre:'25 kg',      rateNum:25,   unit:'kg',          timing:'Basal at sowing',      purpose:'Phosphorus base' },
      { category:'fertiliser', item:'Urea (46% N)',                     ratePerAcre:'50 kg',      rateNum:50,   unit:'kg',          timing:'CRI + Jointing split',  purpose:'Nitrogen in 2 splits' },
      { category:'fertiliser', item:'MOP (0:0:60)',                     ratePerAcre:'10 kg',      rateNum:10,   unit:'kg',          timing:'Basal',                purpose:'Potassium for grain fill' },
      { category:'pesticide',  item:'Thiram 75% WS',                    ratePerAcre:'200 g',      rateNum:200,  unit:'g',           timing:'Seed treatment',       purpose:'Smut & bunt control' },
      { category:'pesticide',  item:'Propiconazole 25% EC',             ratePerAcre:'100 ml',     rateNum:100,  unit:'ml',          timing:'60 DAS',               purpose:'Rust & mildew control' },
      { category:'pesticide',  item:'Isoproturon 75% WP',               ratePerAcre:'400 g',      rateNum:400,  unit:'g',           timing:'35 DAS',               purpose:'Weed control' },
      { category:'water',      item:'Irrigation Water',                  ratePerAcre:'150 L/event',rateNum:150,  unit:'L/event',     timing:'5 critical irrigations','purpose':'CRI, Tillering, Jointing, Heading, Grain' },
      { category:'labour',     item:'Farm Labour',                       ratePerAcre:'20 days',    rateNum:20,   unit:'person-days', timing:'Full season',          purpose:'Sowing, weeding, harvesting' },
      { category:'equipment',  item:'Knapsack Sprayer fills (15 L)',      ratePerAcre:'3 tanks',    rateNum:3,    unit:'tanks/spray', timing:'Each spray event',     purpose:'Fungicide / herbicide spray' },
    ];
    if (ct==='maize') return [
      { category:'seed',       item:'Hybrid Maize Seed',                ratePerAcre:'8 kg',       rateNum:8,    unit:'kg',          timing:'Sowing day',           purpose:'High-yielding hybrid' },
      { category:'fertiliser', item:'DAP (18:46:00)',                   ratePerAcre:'25 kg',      rateNum:25,   unit:'kg',          timing:'Basal at sowing',      purpose:'Phosphorus base' },
      { category:'fertiliser', item:'MOP (0:0:60)',                     ratePerAcre:'10 kg',      rateNum:10,   unit:'kg',          timing:'Basal',                purpose:'Potassium' },
      { category:'fertiliser', item:'Urea (46% N)',                     ratePerAcre:'50 kg',      rateNum:50,   unit:'kg',          timing:'Knee-height + Tasseling','purpose':'2 split applications' },
      { category:'pesticide',  item:'Metalaxyl 8% + Mancozeb 64% WP',  ratePerAcre:'300 g',      rateNum:300,  unit:'g',           timing:'Seedling & spray',     purpose:'Downy mildew control' },
      { category:'pesticide',  item:'Emamectin Benzoate 5% SG',         ratePerAcre:'50 g',       rateNum:50,   unit:'g',           timing:'25 DAS if FAW',        purpose:'Fall Armyworm control' },
      { category:'water',      item:'Irrigation Water',                  ratePerAcre:'250 L/event',rateNum:250,  unit:'L/event',     timing:'Every 6–7 days (~8 events)','purpose':'8–10 irrigations total' },
      { category:'labour',     item:'Farm Labour',                       ratePerAcre:'22 days',    rateNum:22,   unit:'person-days', timing:'Full season',          purpose:'Sowing, thinning, harvest' },
      { category:'equipment',  item:'Knapsack Sprayer fills (15 L)',      ratePerAcre:'4 tanks',    rateNum:4,    unit:'tanks/spray', timing:'Each spray event',     purpose:'Pesticide application' },
    ];
    if (ct==='sugarcane') return [
      { category:'seed',       item:'Sugarcane Setts (3-bud)',           ratePerAcre:'4000 setts', rateNum:4000, unit:'setts',       timing:'Planting day',         purpose:'Planting material' },
      { category:'fertiliser', item:'DAP (18:46:00)',                   ratePerAcre:'30 kg',      rateNum:30,   unit:'kg',          timing:'Basal at planting',    purpose:'Phosphorus base' },
      { category:'fertiliser', item:'MOP (0:0:60)',                     ratePerAcre:'25 kg',      rateNum:25,   unit:'kg',          timing:'Basal',                purpose:'Potassium for sucrose' },
      { category:'fertiliser', item:'Urea (46% N)',                     ratePerAcre:'100 kg',     rateNum:100,  unit:'kg',          timing:'3 splits: 60, 90, 120 DAS','purpose':'High nitrogen demand' },
      { category:'pesticide',  item:'Carbendazim 50% WP',               ratePerAcre:'100 g',      rateNum:100,  unit:'g',           timing:'Sett dip at planting', purpose:'Red rot prevention' },
      { category:'pesticide',  item:'Propiconazole 25% EC',             ratePerAcre:'150 ml',     rateNum:150,  unit:'ml',          timing:'90 DAS',               purpose:'Red rot systemic control' },
      { category:'water',      item:'Irrigation Water',                  ratePerAcre:'300 L/event',rateNum:300,  unit:'L/event',     timing:'Every 7–10 days',      purpose:'Long-season — ~35 events' },
      { category:'labour',     item:'Farm Labour',                       ratePerAcre:'60 days',    rateNum:60,   unit:'person-days', timing:'Full year',            purpose:'Planting, earthing, harvest' },
      { category:'equipment',  item:'Knapsack Sprayer fills (15 L)',      ratePerAcre:'5 tanks',    rateNum:5,    unit:'tanks/spray', timing:'Each spray event',     purpose:'Fungicide / pesticide application' },
    ];
    if (ct==='cotton') return [
      { category:'seed',       item:'Bt Cotton Hybrid Seed',            ratePerAcre:'1 packet (450 g)',rateNum:1,unit:'packet',     timing:'Sowing day',           purpose:'Bollworm-resistant hybrid' },
      { category:'fertiliser', item:'DAP (18:46:00)',                   ratePerAcre:'20 kg',      rateNum:20,   unit:'kg',          timing:'Basal',                purpose:'Phosphorus base' },
      { category:'fertiliser', item:'MOP (0:0:60)',                     ratePerAcre:'15 kg',      rateNum:15,   unit:'kg',          timing:'Basal',                purpose:'Potassium for boll quality' },
      { category:'fertiliser', item:'Urea (46% N)',                     ratePerAcre:'45 kg',      rateNum:45,   unit:'kg',          timing:'35 + 65 DAS split',    purpose:'Nitrogen in 2 splits' },
      { category:'pesticide',  item:'Imidacloprid 70% WS',              ratePerAcre:'5 g',        rateNum:5,    unit:'g',           timing:'Seed treatment',       purpose:'Sucking pest prevention' },
      { category:'pesticide',  item:'Spiromesifen 22.9% SC',            ratePerAcre:'120 ml',     rateNum:120,  unit:'ml',          timing:'60 DAS',               purpose:'Whitefly control' },
      { category:'pesticide',  item:'Copper Oxychloride 50% WP',        ratePerAcre:'300 g',      rateNum:300,  unit:'g',           timing:'90 DAS',               purpose:'Boll rot prevention' },
      { category:'water',      item:'Irrigation Water',                  ratePerAcre:'200 L/event',rateNum:200,  unit:'L/event',     timing:'Every 7 days (~8 events)','purpose':'8 critical irrigations' },
      { category:'labour',     item:'Farm Labour',                       ratePerAcre:'40 days',    rateNum:40,   unit:'person-days', timing:'Full season',          purpose:'Sowing, picking (3 rounds)' },
      { category:'equipment',  item:'Knapsack Sprayer fills (15 L)',      ratePerAcre:'4 tanks',    rateNum:4,    unit:'tanks/spray', timing:'Each spray event',     purpose:'Pesticide application' },
    ];
    if (veggies.includes(ct)) return [
      { category:'seed',       item:'Hybrid Vegetable Seed / Transplants',ratePerAcre:'3500 plants',rateNum:3500,unit:'plants',     timing:'Nursery / transplanting','purpose':'Primary planting' },
      { category:'fertiliser', item:'DAP (18:46:00)',                   ratePerAcre:'15 kg',      rateNum:15,   unit:'kg',          timing:'Basal at transplanting','purpose':'P base' },
      { category:'fertiliser', item:'MOP (0:0:60)',                     ratePerAcre:'12 kg',      rateNum:12,   unit:'kg',          timing:'Basal',                purpose:'Fruit quality / firmness' },
      { category:'fertiliser', item:'Urea (46% N)',                     ratePerAcre:'25 kg',      rateNum:25,   unit:'kg',          timing:'35 DAS top-dress',     purpose:'Vegetative growth' },
      { category:'fertiliser', item:'Calcium Nitrate',                  ratePerAcre:'5 kg',       rateNum:5,    unit:'kg',          timing:'At fruit set',         purpose:'Blossom-end rot prevention' },
      { category:'pesticide',  item:'Mancozeb 75% WP',                  ratePerAcre:'300 g',      rateNum:300,  unit:'g',           timing:'55 DAS & repeat',      purpose:'Blight / mildew control' },
      { category:'pesticide',  item:'Spinosad 45% SC',                  ratePerAcre:'15 ml',      rateNum:15,   unit:'ml',          timing:'35 DAS',               purpose:'Thrips / leaf miner control' },
      { category:'pesticide',  item:'Imidacloprid 17.8% SL',            ratePerAcre:'50 ml',      rateNum:50,   unit:'ml',          timing:'At pest incidence',    purpose:'Sucking pest control' },
      { category:'water',      item:'Irrigation (Drip / Furrow)',        ratePerAcre:'120 L/day',  rateNum:120,  unit:'L/day',       timing:'Daily / every 2 days', purpose:'Consistent moisture for fruit set' },
      { category:'labour',     item:'Farm Labour',                       ratePerAcre:'35 days',    rateNum:35,   unit:'person-days', timing:'Full season',          purpose:'Nursery, transplant, harvest' },
      { category:'equipment',  item:'Knapsack Sprayer fills (15 L)',      ratePerAcre:'4 tanks',    rateNum:4,    unit:'tanks/spray', timing:'Each spray event',     purpose:'Pesticide application' },
    ];
    if (pulses.includes(ct)) return [
      { category:'seed',       item:'Certified Pulse Seed',             ratePerAcre:'15 kg',      rateNum:15,   unit:'kg',          timing:'Sowing day',           purpose:'Primary planting' },
      { category:'fertiliser', item:'DAP (18:46:00)',                   ratePerAcre:'12 kg',      rateNum:12,   unit:'kg',          timing:'Basal — no Urea',      purpose:'P & initial N only' },
      { category:'fertiliser', item:'MOP (0:0:60)',                     ratePerAcre:'8 kg',       rateNum:8,    unit:'kg',          timing:'Basal',                purpose:'Potassium' },
      { category:'pesticide',  item:'Rhizobium Culture',                ratePerAcre:'600 g',      rateNum:600,  unit:'g',           timing:'Seed inoculation',     purpose:'Biological N fixation' },
      { category:'pesticide',  item:'Thiram + Carbendazim (2+1 g/kg)', ratePerAcre:'45 g',       rateNum:45,   unit:'g',           timing:'Seed treatment',       purpose:'Fungal seed-borne diseases' },
      { category:'pesticide',  item:'Chlorpyriphos 20% EC',             ratePerAcre:'250 ml',     rateNum:250,  unit:'ml',          timing:'45 DAS at flowering',  purpose:'Pod borer control' },
      { category:'pesticide',  item:'Hexaconazole 5% EC',               ratePerAcre:'200 ml',     rateNum:200,  unit:'ml',          timing:'55 DAS if needed',     purpose:'Powdery mildew control' },
      { category:'water',      item:'Irrigation Water',                  ratePerAcre:'100 L/event',rateNum:100,  unit:'L/event',     timing:'3 critical events',    purpose:'Sowing, flowering, pod fill' },
      { category:'labour',     item:'Farm Labour',                       ratePerAcre:'15 days',    rateNum:15,   unit:'person-days', timing:'Full season',          purpose:'Sowing, weeding, harvest' },
      { category:'equipment',  item:'Knapsack Sprayer fills (15 L)',      ratePerAcre:'3 tanks',    rateNum:3,    unit:'tanks/spray', timing:'Each spray event',     purpose:'Pesticide application' },
    ];
    return [
      { category:'seed',       item:'Planting Material',                ratePerAcre:'As per crop', rateNum:1,   unit:'lot',         timing:'Planting day',         purpose:'Crop establishment' },
      { category:'fertiliser', item:'NPK 10:26:26',                     ratePerAcre:'20 kg',      rateNum:20,   unit:'kg',          timing:'Basal',                purpose:'Balanced nutrition' },
      { category:'fertiliser', item:'Urea (46% N)',                     ratePerAcre:'15 kg',      rateNum:15,   unit:'kg',          timing:'Top-dress at growth',  purpose:'Nitrogen supplement' },
      { category:'pesticide',  item:'Mancozeb 75% WP',                  ratePerAcre:'250 g',      rateNum:250,  unit:'g',           timing:'At disease onset',     purpose:'Broad-spectrum fungicide' },
      { category:'water',      item:'Irrigation Water',                  ratePerAcre:'150 L/event',rateNum:150,  unit:'L/event',     timing:'Every 7 days',         purpose:'General crop irrigation' },
      { category:'labour',     item:'Farm Labour',                       ratePerAcre:'20 days',    rateNum:20,   unit:'person-days', timing:'Full season',          purpose:'General farm operations' },
    ];
  };

  // Returns crop-specific baseline yield (Quintals/Acre)
  const getCropBaselineYield = (ct: string): number => {
    const yields: Record<string, number> = {
      rice: 18, wheat: 16, maize: 22, sorghum: 10, pearl_millet: 9, finger_millet: 12.5,
      foxtail_millet: 8, little_millet: 6, kodo_millet: 6, barnyard_millet: 7, proso_millet: 7,
      barley: 14, oats: 12, sugarcane: 400, cotton: 8, groundnut: 10, soybean: 8,
      chickpea: 7, pigeon_pea: 6, lentil: 5, mung_bean: 4, black_gram: 4, tomato: 120,
      potato: 100, onion: 80, chilli: 18, turmeric: 30, ginger: 40, mustard: 7,
      sunflower: 8, sesame: 4, castor: 12, banana: 250, mango: 40, grapes: 80,
      default: 10,
    };
    return yields[ct] ?? yields.default;
  };

  // ─── Crop-specific helpers ──────────────────────────────────────────────────

  // Returns recommended fungicide/pesticide dosage info per crop for tank-mix calculator
  const getCropDosage = (ct: string): { chemical: string; dosePerTank: string; tankVol: string; waterPerAcre: number; pumpsPerAcre: number } => {
    const map: Record<string, { chemical: string; dosePerTank: string; tankVol: string; waterPerAcre: number; pumpsPerAcre: number }> = {
      finger_millet:   { chemical: 'Tricyclazole 75% WP',         dosePerTank: '18 g / 15 L',  tankVol: '15L', waterPerAcre: 200, pumpsPerAcre: 4 },
      rice:            { chemical: 'Carbendazim 50% WP',          dosePerTank: '20 g / 15 L',  tankVol: '15L', waterPerAcre: 250, pumpsPerAcre: 4 },
      wheat:           { chemical: 'Propiconazole 25% EC',        dosePerTank: '10 ml / 15 L', tankVol: '15L', waterPerAcre: 200, pumpsPerAcre: 4 },
      maize:           { chemical: 'Mancozeb 75% WP',             dosePerTank: '25 g / 15 L',  tankVol: '15L', waterPerAcre: 200, pumpsPerAcre: 4 },
      sorghum:         { chemical: 'Hexaconazole 5% EC',          dosePerTank: '15 ml / 15 L', tankVol: '15L', waterPerAcre: 200, pumpsPerAcre: 4 },
      pearl_millet:    { chemical: 'Metalaxyl 8% + Mancozeb 64%', dosePerTank: '25 g / 15 L',  tankVol: '15L', waterPerAcre: 200, pumpsPerAcre: 4 },
      cotton:          { chemical: 'Chlorpyriphos 20% EC',        dosePerTank: '20 ml / 15 L', tankVol: '15L', waterPerAcre: 200, pumpsPerAcre: 4 },
      sugarcane:       { chemical: 'Propiconazole 25% EC',        dosePerTank: '10 ml / 15 L', tankVol: '15L', waterPerAcre: 300, pumpsPerAcre: 6 },
      groundnut:       { chemical: 'Chlorothalonil 75% WP',       dosePerTank: '20 g / 15 L',  tankVol: '15L', waterPerAcre: 200, pumpsPerAcre: 4 },
      soybean:         { chemical: 'Carbendazim 50% WP',          dosePerTank: '20 g / 15 L',  tankVol: '15L', waterPerAcre: 200, pumpsPerAcre: 4 },
      chickpea:        { chemical: 'Hexaconazole 5% EC',          dosePerTank: '15 ml / 15 L', tankVol: '15L', waterPerAcre: 150, pumpsPerAcre: 3 },
      pigeon_pea:      { chemical: 'Chlorpyriphos 20% EC',        dosePerTank: '20 ml / 15 L', tankVol: '15L', waterPerAcre: 150, pumpsPerAcre: 3 },
      tomato:          { chemical: 'Mancozeb 75% WP + Cymoxanil', dosePerTank: '25 g / 15 L',  tankVol: '15L', waterPerAcre: 250, pumpsPerAcre: 5 },
      chilli:          { chemical: 'Copper Oxychloride 50% WP',   dosePerTank: '30 g / 15 L',  tankVol: '15L', waterPerAcre: 200, pumpsPerAcre: 4 },
      potato:          { chemical: 'Mancozeb 75% WP',             dosePerTank: '25 g / 15 L',  tankVol: '15L', waterPerAcre: 200, pumpsPerAcre: 4 },
      mustard:         { chemical: 'Iprodione 50% WP',            dosePerTank: '20 g / 15 L',  tankVol: '15L', waterPerAcre: 150, pumpsPerAcre: 3 },
      banana:          { chemical: 'Carbendazim 50% WP',          dosePerTank: '15 g / 15 L',  tankVol: '15L', waterPerAcre: 200, pumpsPerAcre: 4 },
      mango:           { chemical: 'Copper Hydroxide 77% WP',     dosePerTank: '30 g / 15 L',  tankVol: '15L', waterPerAcre: 200, pumpsPerAcre: 4 },
      grapes:          { chemical: 'Carbendazim + Mancozeb',      dosePerTank: '20 g / 15 L',  tankVol: '15L', waterPerAcre: 250, pumpsPerAcre: 5 },
      tea:             { chemical: 'Copper Oxychloride 50% WP',   dosePerTank: '30 g / 15 L',  tankVol: '15L', waterPerAcre: 300, pumpsPerAcre: 6 },
      coffee:          { chemical: 'Copper Hydroxide 77% WP',     dosePerTank: '30 g / 15 L',  tankVol: '15L', waterPerAcre: 300, pumpsPerAcre: 6 },
    };
    return map[ct] ?? { chemical: 'Mancozeb 75% WP (General)',   dosePerTank: '25 g / 15 L',  tankVol: '15L', waterPerAcre: 200, pumpsPerAcre: 4 };
  };

  // Returns crop-specific disease risk context for the weather tab
  const getCropWeatherRisk = (ct: string): {
    primaryDisease: string; humidityThreshold: number; wetnessTrigger: number;
    tempRangeMin: number; tempRangeMax: number; sprayAlert: string; riskNote: string;
  } => {
    const map: Record<string, ReturnType<typeof getCropWeatherRisk>> = {
      finger_millet: { primaryDisease: 'Leaf & Neck Blast (Magnaporthe grisea)', humidityThreshold: 85, wetnessTrigger: 10, tempRangeMin: 22, tempRangeMax: 30, sprayAlert: 'Spray Tricyclazole 75% WP immediately', riskNote: 'Blast spore germination peaks at 24–28 °C with >85% humidity' },
      rice:          { primaryDisease: 'Rice Blast & Sheath Blight', humidityThreshold: 80, wetnessTrigger: 8,  tempRangeMin: 24, tempRangeMax: 32, sprayAlert: 'Spray Carbendazim 50% WP at leaf wetness > 8 hrs', riskNote: 'Sheath blight thrives in warm, humid, densely planted fields' },
      wheat:         { primaryDisease: 'Yellow Rust & Powdery Mildew', humidityThreshold: 70, wetnessTrigger: 6,  tempRangeMin: 10, tempRangeMax: 22, sprayAlert: 'Apply Propiconazole 25% EC if rust pustules appear', riskNote: 'Yellow rust spreads fastest at 10–15 °C with free moisture' },
      maize:         { primaryDisease: 'Northern Leaf Blight & Downy Mildew', humidityThreshold: 80, wetnessTrigger: 8,  tempRangeMin: 20, tempRangeMax: 30, sprayAlert: 'Apply Mancozeb at first lesion appearance', riskNote: 'Downy mildew spreads rapidly during warm, wet nights' },
      sorghum:       { primaryDisease: 'Anthracnose & Downy Mildew', humidityThreshold: 78, wetnessTrigger: 8,  tempRangeMin: 24, tempRangeMax: 34, sprayAlert: 'Apply Hexaconazole 5% EC preventively', riskNote: 'Anthracnose favoured by warm, moist conditions at grain fill' },
      pearl_millet:  { primaryDisease: 'Downy Mildew (Sclerospora graminicola)', humidityThreshold: 80, wetnessTrigger: 7,  tempRangeMin: 20, tempRangeMax: 28, sprayAlert: 'Spray Metalaxyl + Mancozeb at seedling stage', riskNote: 'Downy mildew most severe when cool rains follow hot days' },
      cotton:        { primaryDisease: 'Boll Rot & Grey Mildew', humidityThreshold: 75, wetnessTrigger: 9,  tempRangeMin: 26, tempRangeMax: 36, sprayAlert: 'Apply Copper Oxychloride at boll opening if humidity high', riskNote: 'Grey mildew causes leaf necrosis in humid, crowded canopies' },
      sugarcane:     { primaryDisease: 'Red Rot (Colletotrichum falcatum)', humidityThreshold: 82, wetnessTrigger: 10, tempRangeMin: 26, tempRangeMax: 35, sprayAlert: 'Apply Propiconazole 25% EC at early stalk formation', riskNote: 'Red rot infection peak during rainy season with waterlogging' },
      groundnut:     { primaryDisease: 'Early & Late Leaf Spot', humidityThreshold: 80, wetnessTrigger: 8,  tempRangeMin: 22, tempRangeMax: 30, sprayAlert: 'Spray Chlorothalonil 75% WP every 10 days from 30 DAS', riskNote: 'Leaf spots cause significant defoliation reducing yield by 50%' },
      tomato:        { primaryDisease: 'Early Blight & Late Blight (Phytophthora)', humidityThreshold: 85, wetnessTrigger: 8,  tempRangeMin: 18, tempRangeMax: 26, sprayAlert: 'Emergency spray Mancozeb + Cymoxanil if late blight detected', riskNote: 'Late blight can destroy a crop in 3–5 days under cool, wet conditions' },
      potato:        { primaryDisease: 'Late Blight (Phytophthora infestans)', humidityThreshold: 90, wetnessTrigger: 7,  tempRangeMin: 10, tempRangeMax: 24, sprayAlert: 'Preventive spray Mancozeb 75% WP every 7 days in blight season', riskNote: 'Late blight spreads explosively above 90% RH; act before symptoms' },
      chilli:        { primaryDisease: 'Anthracnose & Fruit Rot', humidityThreshold: 80, wetnessTrigger: 8,  tempRangeMin: 22, tempRangeMax: 30, sprayAlert: 'Apply Copper Oxychloride 50% WP at first sign of anthracnose', riskNote: 'Fruit rot post-rain can wipe out 30–40% of marketable yield' },
      mustard:       { primaryDisease: 'Alternaria Blight & White Rust', humidityThreshold: 75, wetnessTrigger: 6,  tempRangeMin: 10, tempRangeMax: 22, sprayAlert: 'Spray Iprodione 50% WP at first disease appearance', riskNote: 'Alternaria blight causes significant seed shrivelling at pod stage' },
    };
    return map[ct] ?? {
      primaryDisease: 'Fungal Leaf Disease', humidityThreshold: 80, wetnessTrigger: 8,
      tempRangeMin: 20, tempRangeMax: 30, sprayAlert: 'Apply recommended fungicide at first symptoms',
      riskNote: 'Monitor humidity and leaf wetness closely during crop growth stages',
    };
  };

  // Returns crop-specific CIBRC-approved product cards
  const getCropProducts = (ct: string): Array<{ badge: string; name: string; desc: string; dosage: string; type: 'bio' | 'systemic' | 'contact'; price: string; buyUrl: string; brand: string }> => {
    const map: Record<string, ReturnType<typeof getCropProducts>> = {
      finger_millet: [
        { badge: 'Bio-Control', name: 'Pseudomonas fluorescens 1.15% WP', brand: 'Biofit / Multiplex', desc: 'Seed treatment & foliar spray against Blast pathogens. Promotes plant immunity.', dosage: '10 g / kg seed or 2.5 kg / ha foliar', type: 'bio', price: '₹320 / kg', buyUrl: 'https://www.bigbasket.com/ps/?q=pseudomonas+fluorescens' },
        { badge: 'Systemic Fungicide', name: 'Tricyclazole 75% WP', brand: 'Bayer / Dhanuka', desc: 'Systemic protection against Leaf Blast, Neck Blast, and Finger Blast in ragi.', dosage: '18 g / 15 L knapsack pump', type: 'systemic', price: '₹480 / 100 g', buyUrl: 'https://www.amazon.in/s?k=tricyclazole+75+wp+fungicide' },
        { badge: 'Contact Fungicide', name: 'Mancozeb 75% WP', brand: 'Indofil / UPL', desc: 'Broad-spectrum protectant for early-stage disease management in finger millet.', dosage: '25 g / 15 L water', type: 'contact', price: '₹210 / 500 g', buyUrl: 'https://www.amazon.in/s?k=mancozeb+75+wp' },
      ],
      rice: [
        { badge: 'Bio-Control', name: 'Trichoderma viride 1% WP', brand: 'T-Stanes / Agri Gold', desc: 'Soil and seed treatment against sheath blight and bakanae disease.', dosage: '4 g / kg seed', type: 'bio', price: '₹280 / kg', buyUrl: 'https://www.amazon.in/s?k=trichoderma+viride+wp' },
        { badge: 'Systemic Fungicide', name: 'Carbendazim 50% WP', brand: 'BASF / Dhanuka', desc: 'Controls sheath blight, brown spot, and neck rot in rice.', dosage: '20 g / 15 L water', type: 'systemic', price: '₹190 / 250 g', buyUrl: 'https://www.amazon.in/s?k=carbendazim+50+wp' },
        { badge: 'Contact Fungicide', name: 'Copper Oxychloride 50% WP', brand: 'Coromandel / Multiplex', desc: 'Protects against bacterial leaf blight and leaf scald in rice.', dosage: '30 g / 15 L water', type: 'contact', price: '₹160 / 500 g', buyUrl: 'https://www.amazon.in/s?k=copper+oxychloride+50+wp' },
      ],
      wheat: [
        { badge: 'Bio-Control', name: 'Trichoderma harzianum 2% WP', brand: 'Biofit / Kan Biosys', desc: 'Seed treatment for Karnal bunt and foot rot suppression.', dosage: '4 g / kg seed', type: 'bio', price: '₹300 / kg', buyUrl: 'https://www.amazon.in/s?k=trichoderma+harzianum' },
        { badge: 'Systemic Fungicide', name: 'Propiconazole 25% EC', brand: 'Syngenta Tilt / Dow', desc: 'Highly effective against yellow rust, brown rust and powdery mildew in wheat.', dosage: '10 ml / 15 L water', type: 'systemic', price: '₹540 / 250 ml', buyUrl: 'https://www.amazon.in/s?k=propiconazole+25+ec+tilt' },
        { badge: 'Systemic Fungicide', name: 'Tebuconazole 25.9% EC', brand: 'Bayer Folicur / Indofil', desc: 'Controls head scab (Fusarium) and loose smut at grain fill stage.', dosage: '8 ml / 15 L water', type: 'systemic', price: '₹620 / 250 ml', buyUrl: 'https://www.amazon.in/s?k=tebuconazole+fungicide' },
      ],
      maize: [
        { badge: 'Bio-Control', name: 'Pseudomonas fluorescens 1% WP', brand: 'Biofit / T-Stanes', desc: 'Suppresses downy mildew and stalk rot pathogens in soil.', dosage: '10 g / kg seed', type: 'bio', price: '₹320 / kg', buyUrl: 'https://www.amazon.in/s?k=pseudomonas+fluorescens' },
        { badge: 'Contact Fungicide', name: 'Mancozeb 75% WP', brand: 'Indofil M-45', desc: 'Preventive spray for Northern Leaf Blight and Turcicum blight.', dosage: '25 g / 15 L water', type: 'contact', price: '₹210 / 500 g', buyUrl: 'https://www.amazon.in/s?k=mancozeb+75+wp+indofil' },
        { badge: 'Systemic Fungicide', name: 'Metalaxyl 8% + Mancozeb 64%', brand: 'Ridomil Gold / Syngenta', desc: 'Controls downy mildew and collar rot in maize seedlings.', dosage: '25 g / 15 L water', type: 'systemic', price: '₹780 / 500 g', buyUrl: 'https://www.amazon.in/s?k=ridomil+gold+metalaxyl+mancozeb' },
      ],
      tomato: [
        { badge: 'Bio-Control', name: 'Bacillus subtilis 1.34% WP', brand: 'Serenade / Bayer', desc: 'Broad spectrum bio-fungicide against early blight and damping off.', dosage: '2.5 kg / ha', type: 'bio', price: '₹850 / 500 g', buyUrl: 'https://www.amazon.in/s?k=bacillus+subtilis+fungicide' },
        { badge: 'Contact Fungicide', name: 'Mancozeb 75% WP + Cymoxanil', brand: 'Curzate / DuPont', desc: 'Emergency spray against late blight (Phytophthora) in tomato.', dosage: '25 g / 15 L water', type: 'contact', price: '₹490 / 200 g', buyUrl: 'https://www.amazon.in/s?k=cymoxanil+mancozeb+curzate' },
        { badge: 'Systemic Fungicide', name: 'Fenamidone 10% + Mancozeb 50% WG', brand: 'Sectin / Bayer', desc: 'Systemic + contact action against blight and downy mildew.', dosage: '20 g / 15 L water', type: 'systemic', price: '₹720 / 250 g', buyUrl: 'https://www.amazon.in/s?k=fenamidone+mancozeb+sectin' },
      ],
      potato: [
        { badge: 'Contact Fungicide', name: 'Mancozeb 75% WP', brand: 'Indofil M-45', desc: 'Preventive spray every 7 days during blight season for potato.', dosage: '25 g / 15 L water', type: 'contact', price: '₹210 / 500 g', buyUrl: 'https://www.amazon.in/s?k=mancozeb+75+wp' },
        { badge: 'Systemic Fungicide', name: 'Cymoxanil 8% + Mancozeb 64%', brand: 'Curzate / DuPont', desc: 'Fast-acting against late blight even after infection has begun.', dosage: '30 g / 15 L water', type: 'systemic', price: '₹510 / 250 g', buyUrl: 'https://www.amazon.in/s?k=cymoxanil+mancozeb' },
        { badge: 'Systemic Fungicide', name: 'Propamocarb 72.2% SL', brand: 'Previcur / Bayer', desc: 'Systemic action against Phytophthora and downy mildew at all stages.', dosage: '15 ml / 15 L water', type: 'systemic', price: '₹890 / 500 ml', buyUrl: 'https://www.amazon.in/s?k=propamocarb+previcur' },
      ],
      cotton: [
        { badge: 'Bio-Control', name: 'Trichoderma viride 1% WP', brand: 'T-Stanes', desc: 'Soil application for root rot and damping off in cotton.', dosage: '5 g / kg seed', type: 'bio', price: '₹280 / kg', buyUrl: 'https://www.amazon.in/s?k=trichoderma+viride' },
        { badge: 'Contact Fungicide', name: 'Copper Oxychloride 50% WP', brand: 'Blitox / Tata Rallis', desc: 'Protects against grey mildew, bacterial blight and leaf curl complex.', dosage: '30 g / 15 L water', type: 'contact', price: '₹160 / 500 g', buyUrl: 'https://www.amazon.in/s?k=copper+oxychloride+blitox' },
        { badge: 'Systemic Fungicide', name: 'Hexaconazole 5% EC', brand: 'Contaf Plus / Bayer', desc: 'Controls Alternaria leaf spot and Fusarium wilt in cotton.', dosage: '15 ml / 15 L water', type: 'systemic', price: '₹420 / 500 ml', buyUrl: 'https://www.amazon.in/s?k=hexaconazole+5+ec+contaf' },
      ],
      chilli: [
        { badge: 'Bio-Control', name: 'Pseudomonas fluorescens 1% WP', brand: 'Multiplex / Agri Gold', desc: 'Suppresses Phytophthora root rot and damping off in chilli.', dosage: '10 g / kg seed', type: 'bio', price: '₹320 / kg', buyUrl: 'https://www.amazon.in/s?k=pseudomonas+fluorescens+bio' },
        { badge: 'Contact Fungicide', name: 'Copper Oxychloride 50% WP', brand: 'Blitox / Coromandel', desc: 'Protects against anthracnose and fruit rot post-rain in chilli.', dosage: '30 g / 15 L water', type: 'contact', price: '₹165 / 500 g', buyUrl: 'https://www.amazon.in/s?k=copper+oxychloride+50wp' },
        { badge: 'Systemic Fungicide', name: 'Difenoconazole 25% EC', brand: 'Score / Syngenta', desc: 'Systemic control of anthracnose, powdery mildew and leaf spot.', dosage: '8 ml / 15 L water', type: 'systemic', price: '₹680 / 250 ml', buyUrl: 'https://www.amazon.in/s?k=difenoconazole+score+syngenta' },
      ],
      groundnut: [
        { badge: 'Bio-Control', name: 'Trichoderma harzianum 2% WP', brand: 'Kan Biosys / Biofit', desc: 'Seed treatment against collar rot and stem rot in groundnut.', dosage: '4 g / kg seed', type: 'bio', price: '₹300 / kg', buyUrl: 'https://www.amazon.in/s?k=trichoderma+harzianum+seed+treatment' },
        { badge: 'Contact Fungicide', name: 'Chlorothalonil 75% WP', brand: 'Kavach / Syngenta', desc: 'Controls early and late leaf spot in groundnut effectively.', dosage: '20 g / 15 L water', type: 'contact', price: '₹340 / 500 g', buyUrl: 'https://www.amazon.in/s?k=chlorothalonil+75+wp+kavach' },
        { badge: 'Systemic Fungicide', name: 'Tebuconazole 25.9% EC', brand: 'Folicur / Bayer', desc: 'Systemic control of rust, collar rot and pod rot in groundnut.', dosage: '8 ml / 15 L water', type: 'systemic', price: '₹620 / 250 ml', buyUrl: 'https://www.amazon.in/s?k=tebuconazole+folicur+bayer' },
      ],
      mustard: [
        { badge: 'Bio-Control', name: 'Trichoderma viride 1% WP', brand: 'T-Stanes', desc: 'Seed and soil treatment against Sclerotinia stem rot.', dosage: '4 g / kg seed', type: 'bio', price: '₹280 / kg', buyUrl: 'https://www.amazon.in/s?k=trichoderma+viride' },
        { badge: 'Contact Fungicide', name: 'Mancozeb 75% WP', brand: 'Indofil M-45', desc: 'Controls Alternaria blight and white rust in mustard.', dosage: '25 g / 15 L water', type: 'contact', price: '₹210 / 500 g', buyUrl: 'https://www.amazon.in/s?k=mancozeb+75+wp' },
        { badge: 'Systemic Fungicide', name: 'Iprodione 50% WP', brand: 'Rovral / Bayer', desc: 'Specific action against Sclerotinia stem rot and Alternaria.', dosage: '20 g / 15 L water', type: 'systemic', price: '₹580 / 250 g', buyUrl: 'https://www.amazon.in/s?k=iprodione+rovral' },
      ],
    };
    // Default fallback products
    return map[ct] ?? [
      { badge: 'Bio-Control', name: 'Trichoderma viride 1% WP', brand: 'T-Stanes / Agri Gold', desc: 'Universal bio-fungicide for soil-borne disease suppression.', dosage: '4 g / kg seed', type: 'bio', price: '₹280 / kg', buyUrl: 'https://www.amazon.in/s?k=trichoderma+viride+wp' },
      { badge: 'Contact Fungicide', name: 'Mancozeb 75% WP', brand: 'Indofil M-45', desc: 'Broad-spectrum protectant fungicide for all major foliar diseases.', dosage: '25 g / 15 L water', type: 'contact', price: '₹210 / 500 g', buyUrl: 'https://www.amazon.in/s?k=mancozeb+75+wp' },
      { badge: 'Systemic Fungicide', name: 'Carbendazim 50% WP', brand: 'BASF / Dhanuka', desc: 'Systemic fungicide for wilt and foliar diseases across crops.', dosage: '20 g / 15 L water', type: 'systemic', price: '₹190 / 250 g', buyUrl: 'https://www.amazon.in/s?k=carbendazim+50+wp' },
    ];
  };
  const menuItems = [
    { id: 'cropdetails', label: 'Share Crop & Land Details', icon: ClipboardList, badge: 'Setup' },
    { id: 'detection', label: 'Crop Disease Detection', icon: Camera, badge: 'Phase 2' },
    { id: 'calendar', label: 'Smart Agriculture Calendar', icon: Calendar, badge: 'Planning' },
    { id: 'resources', label: 'Resource Management', icon: Layers, badge: 'Tank-Mix' },
    { id: 'weather', label: 'Weather Forecasting', icon: CloudSun, badge: '72h Risk' },
    { id: 'analytics', label: 'Predictive Yield Analytics', icon: TrendingUp, badge: 'Yield AI' },
    { id: 'products', label: 'Disease Based Products', icon: PackageCheck, badge: 'CIBRC Safe' },
  ];

  const quickPrompts = [
    'How do I identify and treat Leaf Blast in Finger Millet?',
    'What is the recommended CIBRC dosage for Tricyclazole 75% WP?',
    'Check 72-hour humidity & weather risk for Neck Blast',
    'Symptoms of Foot Rot and Brown Spot in early growth',
  ];

  useEffect(() => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === '1' ? { ...msg, time: getTime() } : msg))
    );
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Camera Viewfinder Modal
  const openLiveCamera = async () => {
    setShowCameraModal(true);
    setCameraError(null);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } else {
        setCameraError('Camera access not supported on this browser. Use file attachment or system camera.');
      }
    } catch (err: any) {
      console.warn('getUserMedia camera error:', err);
      setCameraError('Unable to access camera stream directly. Please use system camera or grant permissions.');
    }
  };

  const closeLiveCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setShowCameraModal(false);
    setCameraError(null);
  };

  const capturePhotoFromCamera = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setSelectedImage(dataUrl);
        closeLiveCamera();
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() && !selectedImage) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      image: selectedImage || undefined,
      time: getTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setSelectedImage(null);
    setIsBotTyping(true);

    try {
      const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';
      const ctx = savedCropContext;
      const cropInfo = ctx
        ? `Farmer's crop: ${ctx.cropTypeLabel}${ctx.growthStage ? `, at ${ctx.growthStage} stage` : ''}${ctx.landAcres ? `, ${ctx.landAcres} acres` : ''}${ctx.location ? `, located in ${ctx.location}` : ''}.`
        : 'Crop: Finger Millet (Ragi) — general advisory.';

      const systemPrompt = `You are KisanMitra, an expert AI crop disease advisor for Indian farmers specialising in finger millet (ragi) and other Indian crops.
${cropInfo}
Your job:
1. DETECT diseases from described or photographed symptoms — give a confident diagnosis with the disease name, causative organism, and severity.
2. RECOMMEND specific CIBRC-approved products with exact dosages (Tricyclazole 75% WP, Pseudomonas fluorescens, Mancozeb 75% WP, Carbendazim 50% WP, etc.).
3. SUGGEST when and how to spray (timing, water volume, knapsack pump calculations).
4. WARN about weather-based risk (high humidity >85%, leaf wetness >10 hrs = spray immediately).
5. Keep responses concise, practical, and farmer-friendly. Use bullet points for recommendations.
6. Always mention 1–2 specific product names and dosages in every disease-related answer.`;

      const userContent = selectedImage
        ? `${text.trim()}\n\n[Farmer has attached a leaf photo for disease diagnosis. Analyse symptoms described and suggest treatment.]`
        : text.trim();

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'KisanMitra',
        },
        body: JSON.stringify({
          model: 'google/gemma-4-26b-a4b-it:free',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({})) as { error?: { message?: string } };
        throw new Error(errData?.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json() as { choices?: { message?: { content?: string } }[] };
      const botResponse = data.choices?.[0]?.message?.content || 'No response received.';

      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botResponse,
        time: getTime(),
      }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: `Sorry, I couldn't reach the AI service. Please try again. (${msg})`,
        time: getTime(),
      }]);
    } finally {
      setIsBotTyping(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSpeechRecognition = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = selectedLanguage === 'Kannada' ? 'kn-IN' : selectedLanguage === 'Telugu' ? 'te-IN' : selectedLanguage === 'Tamil' ? 'ta-IN' : selectedLanguage === 'Hindi' ? 'hi-IN' : 'en-US';

      setIsRecording(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? prev + ' ' + transcript : transcript));
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } else {
      setIsRecording(true);
      setTimeout(() => {
        setInputText('Is my crop at risk of Leaf Blast due to current weather humidity?');
        setIsRecording(false);
      }, 2000);
    }
  };

  return (
    <div className="dashboard-root min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors"
            aria-label="Toggle Menu"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-green-700 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              🌾
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-emerald-950 tracking-tight leading-none flex items-center gap-2">
                KisanMitra
              </h1>
              <span className="text-[11px] text-emerald-700 font-mono font-medium">Smart Agriculture Dashboard</span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="hidden xs:inline-flex items-center gap-1.5 text-xs text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-1.5 rounded-full font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Landing Page</span>
          </Link>
          <div className="text-xs bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-full font-mono font-bold shadow-xs">
            Persona: Farmer
          </div>
        </div>
      </header>

      <div className="flex-1 flex relative">
        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-20 md:hidden"
          />
        )}

        {/* Left Sidebar Menu */}
        <aside
          className={`fixed md:static top-[61px] bottom-0 left-0 z-30 w-72 bg-emerald-50/80 backdrop-blur-md border-r border-emerald-100 p-4 flex flex-col gap-4 transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="px-2 pt-1">
            <h2 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Dashboard Navigation</h2>
            <p className="text-[11px] text-emerald-700">Finger Millet Protection Suite</p>
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
                      ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-600/25 border border-emerald-500'
                      : 'text-slate-700 hover:bg-emerald-100/70 hover:text-emerald-950 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-xs font-mono w-4 font-bold ${isActive ? 'text-emerald-100' : 'text-emerald-700'}`}>
                      0{idx + 1}
                    </span>
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-emerald-600'}`} />
                    <span className="text-xs truncate">{item.label}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Workspace */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 bg-slate-50/60 overflow-y-auto w-full max-w-none flex flex-col">
          {/* TAB 1: Share Crop & Land Details */}
          {activeTab === 'cropdetails' && (
            <div className="flex-1 flex flex-col gap-4 max-w-3xl mx-auto w-full">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-green-800 border border-emerald-600 text-white rounded-2xl p-5 shadow-md">
                <div className="inline-flex items-center gap-1.5 bg-emerald-900/40 text-emerald-200 text-xs px-3 py-1 rounded-full border border-emerald-500/30 font-mono mb-1.5">
                  <ClipboardList className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Field Setup</span>
                </div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">Share Crop &amp; Land Details</h2>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Tell us about your crop type, growth stage, and field location so we can tailor diagnostic models and local advisories.
                </p>
              </div>

              {/* Form Card */}
              <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6 flex flex-col gap-5">

                {/* Saved confirmation banner */}
                {cropDetailsSaved && savedCropContext && (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-xs text-emerald-800 font-medium">
                      Details saved — Calendar &amp; Analytics are now personalised for <strong>{savedCropContext.cropTypeLabel}</strong>.
                    </span>
                  </div>
                )}

                {/* Crop Type */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-emerald-950 uppercase tracking-wide">Crop Type</label>
                  <select
                    value={cropType}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCropType(val);
                      setCropTypeLabel(e.target.options[e.target.selectedIndex].text);
                      // Reset rice-specific field when switching to a non-rice crop
                      if (val !== 'rice') setRiceVarietyDuration('');
                    }}
                    className="w-full border border-emerald-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 bg-emerald-50/40 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Select crop type…</option>
                    {/* Cereals & Millets */}
                    <optgroup label="Cereals &amp; Millets">
                      <option value="rice">Rice (Paddy / Dhan)</option>
                      <option value="wheat">Wheat (Gehun)</option>
                      <option value="maize">Maize (Makka / Corn)</option>
                      <option value="sorghum">Sorghum (Jowar)</option>
                      <option value="pearl_millet">Pearl Millet (Bajra)</option>
                      <option value="finger_millet">Finger Millet (Ragi / Nachni)</option>
                      <option value="foxtail_millet">Foxtail Millet (Kangni / Kakum)</option>
                      <option value="little_millet">Little Millet (Kutki / Samai)</option>
                      <option value="kodo_millet">Kodo Millet (Kodon)</option>
                      <option value="barnyard_millet">Barnyard Millet (Sanwa)</option>
                      <option value="proso_millet">Proso Millet (Chena)</option>
                      <option value="barley">Barley (Jau)</option>
                      <option value="oats">Oats (Jai)</option>
                    </optgroup>
                    {/* Pulses */}
                    <optgroup label="Pulses (Legumes)">
                      <option value="chickpea">Chickpea (Chana / Bengal Gram)</option>
                      <option value="pigeon_pea">Pigeon Pea (Tur / Arhar Dal)</option>
                      <option value="lentil">Lentil (Masoor Dal)</option>
                      <option value="mung_bean">Mung Bean (Moong Dal)</option>
                      <option value="black_gram">Black Gram (Urad Dal)</option>
                      <option value="kidney_bean">Kidney Bean (Rajma)</option>
                      <option value="cowpea">Cowpea (Lobia / Chawli)</option>
                      <option value="moth_bean">Moth Bean (Matki)</option>
                      <option value="horse_gram">Horse Gram (Kulthi / Gahat)</option>
                      <option value="field_pea">Field Pea (Matar)</option>
                      <option value="flat_bean">Flat Bean (Sem / Valor)</option>
                      <option value="cluster_bean">Cluster Bean (Guar)</option>
                    </optgroup>
                    {/* Oilseeds */}
                    <optgroup label="Oilseeds">
                      <option value="groundnut">Groundnut (Peanut / Moongphali)</option>
                      <option value="mustard">Mustard / Rapeseed (Sarson)</option>
                      <option value="soybean">Soybean (Soya)</option>
                      <option value="sunflower">Sunflower (Surajmukhi)</option>
                      <option value="sesame">Sesame (Til / Gingelly)</option>
                      <option value="castor">Castor (Arandi / Erand)</option>
                      <option value="linseed">Linseed / Flaxseed (Alsi)</option>
                      <option value="safflower">Safflower (Kusum)</option>
                      <option value="niger">Niger Seed (Ramtil)</option>
                    </optgroup>
                    {/* Cash & Fibre Crops */}
                    <optgroup label="Cash &amp; Fibre Crops">
                      <option value="cotton">Cotton (Kapas)</option>
                      <option value="sugarcane">Sugarcane (Ganna)</option>
                      <option value="jute">Jute (Pat)</option>
                      <option value="tobacco">Tobacco (Tambaku)</option>
                      <option value="rubber">Rubber (Raber)</option>
                      <option value="hemp">Hemp (Bhang / Ganja fibre)</option>
                    </optgroup>
                    {/* Spices & Condiments */}
                    <optgroup label="Spices &amp; Condiments">
                      <option value="chilli">Chilli / Red Pepper (Mirch)</option>
                      <option value="turmeric">Turmeric (Haldi)</option>
                      <option value="ginger">Ginger (Adrak)</option>
                      <option value="garlic">Garlic (Lahsun)</option>
                      <option value="onion">Onion (Pyaz)</option>
                      <option value="coriander">Coriander (Dhaniya)</option>
                      <option value="cumin">Cumin (Jeera / Zeera)</option>
                      <option value="fenugreek">Fenugreek (Methi)</option>
                      <option value="fennel">Fennel (Saunf)</option>
                      <option value="ajwain">Ajwain (Carom Seeds)</option>
                      <option value="black_pepper">Black Pepper (Kali Mirch)</option>
                      <option value="cardamom">Cardamom (Elaichi)</option>
                      <option value="clove">Clove (Laung)</option>
                      <option value="nutmeg">Nutmeg (Jaiphal)</option>
                      <option value="cinnamon">Cinnamon (Dalchini)</option>
                      <option value="vanilla">Vanilla</option>
                    </optgroup>
                    {/* Vegetables */}
                    <optgroup label="Vegetables">
                      <option value="tomato">Tomato (Tamatar)</option>
                      <option value="potato">Potato (Aloo)</option>
                      <option value="brinjal">Brinjal / Eggplant (Baingan)</option>
                      <option value="okra">Okra / Lady&apos;s Finger (Bhindi)</option>
                      <option value="cabbage">Cabbage (Patta Gobhi)</option>
                      <option value="cauliflower">Cauliflower (Phool Gobhi)</option>
                      <option value="pumpkin">Pumpkin (Kaddu)</option>
                      <option value="bitter_gourd">Bitter Gourd (Karela)</option>
                      <option value="bottle_gourd">Bottle Gourd (Lauki / Ghiya)</option>
                      <option value="ridge_gourd">Ridge Gourd (Turai)</option>
                      <option value="snake_gourd">Snake Gourd (Chichinda)</option>
                      <option value="cucumber">Cucumber (Kheera)</option>
                      <option value="watermelon">Watermelon (Tarbuj)</option>
                      <option value="muskmelon">Muskmelon (Kharbooja)</option>
                      <option value="spinach">Spinach (Palak)</option>
                      <option value="amaranth">Amaranth Leafy (Chaulai)</option>
                      <option value="radish">Radish (Mooli)</option>
                      <option value="carrot">Carrot (Gajar)</option>
                      <option value="beetroot">Beetroot (Chukandar)</option>
                      <option value="sweet_potato">Sweet Potato (Shakarkand)</option>
                      <option value="colocasia">Colocasia / Taro (Arbi)</option>
                      <option value="yam">Yam (Suran / Jimikand)</option>
                      <option value="drumstick">Drumstick (Moringa / Sahjan)</option>
                      <option value="capsicum">Capsicum / Bell Pepper (Shimla Mirch)</option>
                    </optgroup>
                    {/* Fruits */}
                    <optgroup label="Fruits">
                      <option value="mango">Mango (Aam)</option>
                      <option value="banana">Banana (Kela)</option>
                      <option value="coconut">Coconut (Nariyal)</option>
                      <option value="papaya">Papaya (Papita)</option>
                      <option value="guava">Guava (Amrood)</option>
                      <option value="pomegranate">Pomegranate (Anar)</option>
                      <option value="citrus_orange">Orange (Santra / Nagpur Orange)</option>
                      <option value="citrus_lemon">Lemon / Lime (Nimbu)</option>
                      <option value="citrus_mandarin">Mandarin / Kinnow (Kinnu)</option>
                      <option value="grapes">Grapes (Angoor)</option>
                      <option value="apple">Apple (Seb)</option>
                      <option value="pear">Pear (Nashpati)</option>
                      <option value="plum">Plum (Aloo Bukhara)</option>
                      <option value="peach">Peach (Aadoo)</option>
                      <option value="apricot">Apricot (Khumani / Khubani)</option>
                      <option value="walnut">Walnut (Akhrot)</option>
                      <option value="strawberry">Strawberry</option>
                      <option value="pineapple">Pineapple (Ananas)</option>
                      <option value="jackfruit">Jackfruit (Kathal)</option>
                      <option value="litchi">Litchi (Lychee)</option>
                      <option value="sapota">Sapota (Chiku)</option>
                      <option value="custard_apple">Custard Apple (Sitaphal / Sharifa)</option>
                      <option value="ber">Ber / Indian Jujube (Bor)</option>
                      <option value="fig">Fig (Anjeer)</option>
                      <option value="tamarind">Tamarind (Imli)</option>
                      <option value="amla">Amla / Indian Gooseberry</option>
                      <option value="jamun">Jamun / Black Plum</option>
                      <option value="avocado">Avocado</option>
                      <option value="dragon_fruit">Dragon Fruit</option>
                    </optgroup>
                    {/* Plantation Crops */}
                    <optgroup label="Plantation Crops">
                      <option value="tea">Tea (Chai)</option>
                      <option value="coffee">Coffee (Kaphi)</option>
                      <option value="cocoa">Cocoa</option>
                      <option value="arecanut">Arecanut / Betel Nut (Supari)</option>
                      <option value="cashew">Cashew (Kaju)</option>
                      <option value="oil_palm">Oil Palm</option>
                    </optgroup>
                    {/* Fodder & Green Manure */}
                    <optgroup label="Fodder &amp; Green Manure">
                      <option value="napier_grass">Napier Grass</option>
                      <option value="berseem">Berseem (Egyptian Clover)</option>
                      <option value="lucerne">Lucerne / Alfalfa (Rijka)</option>
                      <option value="cowpea_fodder">Cowpea (Fodder)</option>
                      <option value="maize_fodder">Maize (Fodder / Green)</option>
                      <option value="sorghum_fodder">Sorghum (Fodder / Sudan Grass)</option>
                      <option value="sunhemp">Sunhemp (Sunn Hemp / Sana)</option>
                    </optgroup>
                  </select>
                </div>

                {/* Growth Stage */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-emerald-950 uppercase tracking-wide">Growth Stage</label>
                  <select
                    value={growthStage}
                    onChange={(e) => setGrowthStage(e.target.value)}
                    className="w-full border border-emerald-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 bg-emerald-50/40 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Select growth stage…</option>
                    <option value="nursery">Nursery &amp; Sowing (Days 0–20)</option>
                    <option value="tillering">Tillering &amp; Blast Scouting (Days 21–50)</option>
                    <option value="flowering">Flowering &amp; Grain Filling (Days 51–90)</option>
                    <option value="harvest">Harvest Ready (Days 90+)</option>
                  </select>
                </div>

                {/* Sowing Date */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-emerald-950 uppercase tracking-wide">Sowing Date <span className="text-slate-400 font-normal normal-case">(optional)</span></label>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Day */}
                    <select
                      value={sowingDD}
                      onChange={(e) => {
                        const dd = e.target.value;
                        setSowingDD(dd);
                        if (dd && sowingMM && sowingYYYY) setSowingDate(`${sowingYYYY}-${sowingMM}-${dd}`);
                        else setSowingDate('');
                      }}
                      className="border border-emerald-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 bg-emerald-50/40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">DD</option>
                      {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    {/* Month */}
                    <select
                      value={sowingMM}
                      onChange={(e) => {
                        const mm = e.target.value;
                        setSowingMM(mm);
                        if (sowingDD && mm && sowingYYYY) setSowingDate(`${sowingYYYY}-${mm}-${sowingDD}`);
                        else setSowingDate('');
                      }}
                      className="border border-emerald-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 bg-emerald-50/40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">MM</option>
                      {[
                        ['01','Jan'],['02','Feb'],['03','Mar'],['04','Apr'],
                        ['05','May'],['06','Jun'],['07','Jul'],['08','Aug'],
                        ['09','Sep'],['10','Oct'],['11','Nov'],['12','Dec'],
                      ].map(([val, label]) => (
                        <option key={val} value={val}>{val} — {label}</option>
                      ))}
                    </select>
                    {/* Year */}
                    <select
                      value={sowingYYYY}
                      onChange={(e) => {
                        const yyyy = e.target.value;
                        setSowingYYYY(yyyy);
                        if (sowingDD && sowingMM && yyyy) setSowingDate(`${yyyy}-${sowingMM}-${sowingDD}`);
                        else setSowingDate('');
                      }}
                      className="border border-emerald-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 bg-emerald-50/40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">YYYY</option>
                      {Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - 1 + i)).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  {sowingDate && (
                    <p className="text-xs text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      {sowingDD}/{sowingMM}/{sowingYYYY}
                    </p>
                  )}
                </div>

                {/* Land Area */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-emerald-950 uppercase tracking-wide">Land Area (Acres)</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={fieldLandAcres}
                    onChange={(e) => { setFieldLandAcres(e.target.value); setLandAcres(Number(e.target.value)); }}
                    placeholder="e.g. 2.5"
                    className="w-full border border-emerald-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 bg-emerald-50/40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Pincode */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-emerald-950 uppercase tracking-wide">Pincode</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setPincode(val);
                        lookupPincode(val);
                      }}
                      placeholder="Enter 6-digit pincode"
                      className="w-full border border-emerald-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 bg-emerald-50/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10"
                    />
                    {pincodeLoading && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 text-xs animate-spin">⟳</span>
                    )}
                  </div>
                  {pincodeLocation && (
                    <p className="text-xs text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {pincodeLocation}
                    </p>
                  )}
                  {pincodeError && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3.5 h-3.5" /> {pincodeError}
                    </p>
                  )}
                </div>

                {/* Field Location */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-emerald-950 uppercase tracking-wide">Field Location</label>
                  <input
                    type="text"
                    value={pincodeLocation}
                    onChange={(e) => setPincodeLocation(e.target.value)}
                    placeholder="Village / Taluk / District (auto-filled from pincode)"
                    className="w-full border border-emerald-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 bg-emerald-50/40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Soil Type */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-emerald-950 uppercase tracking-wide">Soil Type <span className="text-slate-400 font-normal normal-case">(optional)</span></label>
                  <select
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                    className="w-full border border-emerald-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 bg-emerald-50/40 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Select soil type…</option>
                    {/* Major Indian Soil Orders */}
                    <optgroup label="Alluvial Soils">
                      <option value="alluvial_khadar">Khadar (New Alluvial) — River flood plains, very fertile</option>
                      <option value="alluvial_bhangar">Bhangar (Old Alluvial) — Older terraces, slightly less fertile</option>
                      <option value="alluvial_terai">Terai Alluvial — Moist, organic-rich, foothills of Himalayas</option>
                      <option value="alluvial_deltaic">Deltaic Alluvial — Coastal deltas (Ganga, Krishna, Godavari)</option>
                    </optgroup>
                    <optgroup label="Black / Regur Soils (Vertisols)">
                      <option value="deep_black">Deep Black (Regur) — Deccan Plateau, excellent for cotton</option>
                      <option value="medium_black">Medium Black — Moderate depth, Madhya Pradesh &amp; Maharashtra</option>
                      <option value="shallow_black">Shallow Black — Thin horizon, Karnataka &amp; Tamil Nadu uplands</option>
                    </optgroup>
                    <optgroup label="Red &amp; Laterite Soils">
                      <option value="red_loamy">Red Loamy — Well-drained, peninsular India, groundnut &amp; millets</option>
                      <option value="red_sandy">Red Sandy — Low fertility, Eastern Ghats fringe</option>
                      <option value="laterite_hard">Laterite (Hardened) — Kerala, Karnataka hills, cashew &amp; rubber</option>
                      <option value="laterite_soft">Laterite (Soft / Plinthite) — Assam &amp; Odisha uplands, tea</option>
                    </optgroup>
                    <optgroup label="Arid &amp; Desert Soils">
                      <option value="desert_sandy">Desert Sandy (Aridisol) — Rajasthan &amp; Gujarat drylands</option>
                      <option value="saline_alkaline">Saline / Alkaline (Usar / Reh) — Salt-affected, NW plains</option>
                      <option value="calcareous_kankar">Calcareous (Kankar) — Calcium-rich, semi-arid zones</option>
                    </optgroup>
                    <optgroup label="Forest &amp; Mountain Soils">
                      <option value="mountain_loam">Mountain Loam — Himalayan foothills, apple &amp; horticulture</option>
                      <option value="forest_brown">Brown Forest Soil — Shivalik range, temperate fruits</option>
                      <option value="podzolic">Podzolic — North-east hills, tea &amp; cardamom</option>
                    </optgroup>
                    <optgroup label="Peaty &amp; Marshy Soils">
                      <option value="peaty_bog">Peaty / Bog Soil — Kerala kuttanad &amp; mangrove coasts, paddy</option>
                      <option value="marshy">Marshy Soil — Sundarbans &amp; coastal wetlands</option>
                    </optgroup>
                    <optgroup label="Mixed &amp; Textural Classes">
                      <option value="sandy_loam">Sandy Loam — Light, free-draining, wide suitability</option>
                      <option value="loam">Loam — Balanced texture, highly versatile</option>
                      <option value="clay_loam">Clay Loam — Moderate drainage, good nutrient retention</option>
                      <option value="silty_loam">Silty Loam — Smooth texture, fertile river banks</option>
                      <option value="sandy_clay">Sandy Clay — Warm, quick-draining, coarse crops</option>
                      <option value="heavy_clay">Heavy Clay — Waterlogging prone, paddy-suited</option>
                    </optgroup>
                  </select>
                </div>

                {/* Rice Variety Duration — only shown when crop is Rice */}
                {cropType === 'rice' && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                      Rice Variety Duration
                    </label>
                    <p className="text-[11px] text-slate-500 -mt-1">Are you using short, medium, or long-duration rice varieties?</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { value: 'short',  label: 'Short Duration',  sub: '> 2 months (60–120 days)' },
                        { value: 'medium', label: 'Medium Duration', sub: '> 4 months (120–150 days)' },
                        { value: 'long',   label: 'Long Duration',   sub: '> 5 months (150+ days)' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setRiceVarietyDuration(opt.value)}
                          className={`flex flex-col items-start px-4 py-3 rounded-xl border text-left transition-all ${
                            riceVarietyDuration === opt.value
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                              : 'bg-emerald-50/40 border-emerald-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-400'
                          }`}
                        >
                          <span className="text-xs font-bold">{opt.label}</span>
                          <span className={`text-[10px] mt-0.5 ${riceVarietyDuration === opt.value ? 'text-emerald-100' : 'text-slate-400'}`}>{opt.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Soil Organic Carbon Status */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-emerald-950 uppercase tracking-wide">Soil Organic Carbon Status</label>
                  <p className="text-[11px] text-slate-500 -mt-1">Do you have a soil health card report indicating any specific organic carbon deficiencies?</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { value: 'deficient', label: 'Yes (Deficient)', sub: 'Soil health card shows low OC', icon: '⚠️' },
                      { value: 'no_deficiency', label: 'No (No Deficiency)', sub: 'OC levels are adequate', icon: '✅' },
                      { value: 'no_card', label: 'No Soil Health Card', sub: 'Card not available', icon: '📋' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSoilOrganicCarbon(opt.value)}
                        className={`flex flex-col items-start px-4 py-3 rounded-xl border text-left transition-all ${
                          soilOrganicCarbon === opt.value
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                            : 'bg-emerald-50/40 border-emerald-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-400'
                        }`}
                      >
                        <span className="text-sm mb-0.5">{opt.icon}</span>
                        <span className="text-xs font-bold">{opt.label}</span>
                        <span className={`text-[10px] mt-0.5 ${soilOrganicCarbon === opt.value ? 'text-emerald-100' : 'text-slate-400'}`}>{opt.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <button
                  onClick={handleSaveCropDetails}
                  className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm py-3 rounded-xl transition-all shadow-sm shadow-emerald-600/25 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Save &amp; Continue →
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: AI Agriculture Chatbot */}
          {activeTab === 'detection' && (
            <div className="flex-1 flex flex-col gap-4 max-w-5xl mx-auto w-full h-full">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-green-800 border border-emerald-600 text-white rounded-2xl p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-emerald-900/40 text-emerald-200 text-xs px-3 py-1 rounded-full border border-emerald-500/30 font-mono mb-1.5">
                    <Bot className="w-3.5 h-3.5 text-emerald-300" />
                    <span>AI Crop Advisor</span>
                  </div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight">KisanMitra Crop AI Advisor</h2>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    Ask questions, capture/upload leaf images, or use voice input for real-time crop disease diagnosis &amp; treatment.
                  </p>
                </div>
              </div>

              {/* Chat Message Window */}
              <div className="bg-white border border-emerald-100 rounded-2xl p-4 sm:p-5 shadow-sm flex-1 flex flex-col justify-between min-h-[440px]">
                {/* Messages List */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[460px]">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.sender === 'bot' && (
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-emerald-600 text-white rounded-br-none shadow-sm'
                          : 'bg-emerald-50/80 border border-emerald-100 text-slate-800 rounded-bl-none'
                      }`}>
                        {msg.image && (
                          <div className="mb-2.5 rounded-xl overflow-hidden border border-emerald-200 max-w-xs">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={msg.image} alt="Uploaded leaf" className="w-full h-auto object-cover max-h-48" />
                          </div>
                        )}
                        <p>{msg.text}</p>
                        <span className={`block text-[9px] mt-1.5 text-right font-mono ${
                          msg.sender === 'user' ? 'text-emerald-200' : 'text-slate-400'
                        }`}>
                          {msg.time}
                        </span>
                      </div>

                      {msg.sender === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isBotTyping && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-emerald-50/80 border border-emerald-100 text-slate-800 rounded-2xl rounded-bl-none p-4 flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Quick Prompts */}
                <div className="pt-3 border-t border-slate-100 my-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Suggested Quick Questions:</span>
                  <div className="flex flex-wrap gap-2">
                    {quickPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(prompt)}
                        className="text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 px-3 py-1.5 rounded-full text-left transition-colors font-medium"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image Upload Preview */}
                {selectedImage && (
                  <div className="mb-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between max-w-xs">
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={selectedImage} alt="Preview" className="w-8 h-8 rounded-lg object-cover" />
                      <span className="text-xs text-emerald-900 font-medium">Leaf Photo Attached</span>
                    </div>
                    <button
                      onClick={() => setSelectedImage(null)}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Chat Input Bar with Open Live Camera & Mic Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  {/* File Upload Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 rounded-xl bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800 transition-colors"
                    title="Upload File Attachment"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  {/* Native Shutter Camera Fallback Input */}
                  <input
                    type="file"
                    ref={cameraInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                  />

                  {/* Open Live Camera Viewfinder Button */}
                  <button
                    onClick={openLiveCamera}
                    className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 transition-transform hover:scale-105"
                    title="Open Camera Viewfinder"
                  >
                    <Camera className="w-4 h-4" />
                  </button>

                  {/* Mic Voice Input Button */}
                  <button
                    onClick={toggleSpeechRecognition}
                    className={`p-3 rounded-xl transition-all ${
                      isRecording
                        ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30'
                        : 'bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800'
                    }`}
                    title={isRecording ? 'Listening to voice...' : 'Voice Input (Mic)'}
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  {/* Text Input */}
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={isRecording ? 'Listening... Speak now...' : 'Ask about crop diseases, symptoms, or remedies...'}
                    className={`flex-1 border rounded-xl px-4 py-3 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors ${
                      isRecording
                        ? 'bg-red-50/50 border-red-300 text-red-900 placeholder-red-400'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />

                  {/* Send Button */}
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={(!inputText.trim() && !selectedImage) || isBotTyping}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold p-3 rounded-xl shadow-md shadow-emerald-600/20 transition-transform hover:scale-105 flex items-center justify-center"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Smart Agriculture Calendar */}
          {activeTab === 'calendar' && (() => {
            const ctx = savedCropContext;
            const acres = ctx ? (parseFloat(ctx.landAcres) || 1) : 1;
            const events = ctx ? getCropEvents(ctx.cropType, ctx.sowingDate, acres) : [];
            const base   = ctx?.sowingDate ? new Date(ctx.sowingDate) : null;

            // Build a month-grid map: key = "YYYY-MM-DD" → events[]
            const eventMap = new Map<string, CropEvent[]>();
            events.forEach(ev => {
              const key = ev.date.toISOString().slice(0, 10);
              if (!eventMap.has(key)) eventMap.set(key, []);
              eventMap.get(key)!.push(ev);
            });

            // Figure out which months to render (all months that contain events, plus the sowing month)
            const months: Date[] = [];
            if (base) {
              const seen = new Set<string>();
              events.forEach(ev => {
                const mk = `${ev.date.getFullYear()}-${ev.date.getMonth()}`;
                if (!seen.has(mk)) { seen.add(mk); months.push(new Date(ev.date.getFullYear(), ev.date.getMonth(), 1)); }
              });
              // ensure sowing month first
              const sowMk = `${base.getFullYear()}-${base.getMonth()}`;
              if (!months.find(m => `${m.getFullYear()}-${m.getMonth()}` === sowMk))
                months.unshift(new Date(base.getFullYear(), base.getMonth(), 1));
              months.sort((a, b) => a.getTime() - b.getTime());
            }

            const typeIcon: Record<CropEvent['type'], string> = {
              sowing: '🌱', sprout: '🌿', water: '💧', fertiliser: '🌾', spray: '🧪', harvest: '🌾', milestone: '📌',
            };
            const typeBg: Record<CropEvent['type'], string> = {
              sowing: 'bg-emerald-600', sprout: 'bg-green-500', water: 'bg-sky-500',
              fertiliser: 'bg-amber-500', spray: 'bg-rose-500', harvest: 'bg-violet-600', milestone: 'bg-slate-400',
            };
            const typeBadge: Record<CropEvent['type'], string> = {
              sowing: 'bg-emerald-100 text-emerald-800', sprout: 'bg-green-100 text-green-800',
              water: 'bg-sky-100 text-sky-800', fertiliser: 'bg-amber-100 text-amber-800',
              spray: 'bg-rose-100 text-rose-800', harvest: 'bg-violet-100 text-violet-800',
              milestone: 'bg-slate-100 text-slate-700',
            };

            const today = new Date(); today.setHours(0,0,0,0);

            return (
              <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-green-800 border border-emerald-600 text-white rounded-2xl p-6 shadow-md">
                  <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-1">
                    <Calendar className="w-4 h-4" />
                    <span>{ctx ? ctx.cropTypeLabel : 'Crop'} Calendar</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">Smart Agriculture Calendar</h2>
                  <p className="text-xs text-emerald-100 mt-1 max-w-2xl leading-relaxed">
                    {ctx
                      ? `Date-stamped schedule for ${ctx.cropTypeLabel}${ctx.location ? ` · ${ctx.location}` : ''}${ctx.landAcres ? ` · ${ctx.landAcres} acres` : ''}.`
                      : 'Fill crop details to generate a personalised calendar with exact dates.'}
                  </p>
                  {base && (
                    <p className="text-xs text-emerald-200 mt-1.5 font-mono">
                      🌱 Sowing: {fmtDate(base)} &nbsp;·&nbsp; 🌾 Est. Harvest: {fmtDate(events.filter(e => e.type === 'harvest').at(-1)?.date ?? base)}
                    </p>
                  )}
                </div>

                {/* No context prompt */}
                {!ctx && (
                  <div className="bg-white border border-amber-200 rounded-2xl p-6 text-center space-y-3">
                    <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">No crop details saved yet</p>
                    <p className="text-xs text-slate-500">Go to <strong>Share Crop &amp; Land Details</strong> (Tab 01), fill in your crop info including sowing date, and click Save &amp; Continue.</p>
                    <button onClick={() => setActiveTab('cropdetails')} className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">
                      <ClipboardList className="w-3.5 h-3.5" /> Fill Crop Details
                    </button>
                  </div>
                )}

                {ctx && (
                  <>
                    {/* Legend */}
                    <div className="flex flex-wrap gap-2">
                      {(['sowing','sprout','water','fertiliser','spray','harvest','milestone'] as CropEvent['type'][]).map(t => (
                        <span key={t} className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${typeBadge[t]}`}>
                          <span>{typeIcon[t]}</span>{t.charAt(0).toUpperCase()+t.slice(1)}
                        </span>
                      ))}
                    </div>

                    {/* Month calendars */}
                    {months.map((monthStart, mi) => {
                      const year = monthStart.getFullYear();
                      const month = monthStart.getMonth();
                      const daysInMonth = new Date(year, month + 1, 0).getDate();
                      const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
                      const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({length: daysInMonth}, (_, i) => i + 1)];
                      const monthLabel = monthStart.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

                      return (
                        <div key={mi} className="bg-white border border-emerald-100 rounded-2xl shadow-sm overflow-hidden">
                          {/* Month header */}
                          <div className="bg-emerald-50 border-b border-emerald-100 px-5 py-3 flex items-center justify-between">
                            <h3 className="text-sm font-extrabold text-emerald-950">{monthLabel}</h3>
                            <span className="text-[10px] text-emerald-600 font-mono">{events.filter(e => e.date.getFullYear()===year && e.date.getMonth()===month).length} events</span>
                          </div>
                          {/* Day-of-week headers */}
                          <div className="grid grid-cols-7 border-b border-slate-100">
                            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                              <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1.5">{d}</div>
                            ))}
                          </div>
                          {/* Date cells */}
                          <div className="grid grid-cols-7">
                            {cells.map((day, ci) => {
                              if (!day) return <div key={ci} className="min-h-[52px] border-r border-b border-slate-50 last:border-r-0" />;
                              const dateKey = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                              const dayEvents = eventMap.get(dateKey) ?? [];
                              const cellDate = new Date(year, month, day);
                              const isToday = cellDate.toISOString().slice(0,10) === today.toISOString().slice(0,10);
                              return (
                                <div key={ci} className={`min-h-[52px] border-r border-b border-slate-50 last:border-r-0 p-1 flex flex-col gap-0.5 ${isToday ? 'bg-emerald-50' : ''}`}>
                                  <span className={`text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}>{day}</span>
                                  {dayEvents.slice(0,3).map((ev, ei) => (
                                    <div key={ei} title={`${ev.title} — ${ev.detail}`}
                                      className={`text-[9px] font-bold text-white rounded px-1 py-0.5 truncate leading-tight ${typeBg[ev.type]}`}>
                                      {typeIcon[ev.type]} {ev.title.split(' ').slice(0,2).join(' ')}
                                    </div>
                                  ))}
                                  {dayEvents.length > 3 && <span className="text-[8px] text-slate-400 font-mono">+{dayEvents.length-3} more</span>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {/* Timeline list — all events sorted by date */}
                    <div className="bg-white border border-emerald-100 rounded-2xl shadow-sm overflow-hidden">
                      <div className="bg-emerald-50 border-b border-emerald-100 px-5 py-3">
                        <h3 className="text-sm font-extrabold text-emerald-950">Full Season Timeline</h3>
                        <p className="text-xs text-emerald-700 mt-0.5">{events.length} scheduled events · {ctx.cropTypeLabel}</p>
                      </div>
                      <div className="divide-y divide-slate-50">
                        {events.map((ev, i) => {
                          const isPast = ev.date < today;
                          const isUpcoming = !isPast && ev.date.getTime() - today.getTime() < 7*24*60*60*1000;
                          return (
                            <div key={i} className={`flex items-start gap-3 px-5 py-3 transition-colors ${isUpcoming ? 'bg-amber-50/60' : isPast ? 'opacity-60' : ''}`}>
                              {/* Date column */}
                              <div className="flex-shrink-0 w-16 text-right">
                                <p className="text-[10px] font-bold text-slate-700">{fmtShort(ev.date)}</p>
                                <p className="text-[9px] text-slate-400 font-mono">Day {ev.day}</p>
                              </div>
                              {/* Dot */}
                              <div className="flex-shrink-0 flex flex-col items-center pt-1">
                                <span className={`w-3 h-3 rounded-full flex-shrink-0 ${typeBg[ev.type]}`} />
                                {i < events.length-1 && <span className="w-px flex-1 min-h-[20px] bg-slate-100 mt-0.5" />}
                              </div>
                              {/* Content */}
                              <div className="flex-1 min-w-0 pb-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${typeBadge[ev.type]}`}>
                                    {typeIcon[ev.type]} {ev.type.toUpperCase()}
                                  </span>
                                  {isUpcoming && <span className="text-[9px] bg-amber-400 text-amber-950 font-bold px-2 py-0.5 rounded-full">DUE SOON</span>}
                                  {isPast && <span className="text-[9px] bg-slate-200 text-slate-500 font-bold px-2 py-0.5 rounded-full">DONE</span>}
                                </div>
                                <p className="text-xs font-bold text-slate-800 mt-1 leading-snug">{ev.title}</p>
                                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{ev.detail}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })()}

          {/* TAB 4: Resource Management */}
          {activeTab === 'resources' && (() => {
            const ctx = savedCropContext;
            const acres = ctx ? (parseFloat(ctx.landAcres) || landAcres) : landAcres;
            const resources = getCropResources(ctx?.cropType ?? '');
            const dosage = getCropDosage(ctx?.cropType ?? '');
            const totalPumps = Math.ceil(acres * dosage.pumpsPerAcre);
            const totalWater = acres * dosage.waterPerAcre;

            const catLabel: Record<ResourceItem['category'], string> = {
              seed: '🌱 Seed', fertiliser: '🌾 Fertiliser', pesticide: '🧪 Pesticide / Bio-input',
              water: '💧 Water', labour: '👷 Labour', equipment: '🛠 Equipment',
            };
            const catBg: Record<ResourceItem['category'], string> = {
              seed: 'bg-emerald-100 text-emerald-800', fertiliser: 'bg-amber-100 text-amber-800',
              pesticide: 'bg-rose-100 text-rose-800', water: 'bg-sky-100 text-sky-800',
              labour: 'bg-slate-100 text-slate-700', equipment: 'bg-violet-100 text-violet-800',
            };
            const categories = ['seed','fertiliser','pesticide','water','labour','equipment'] as ResourceItem['category'][];

            return (
              <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-green-800 border border-emerald-600 text-white rounded-2xl p-6 shadow-md">
                  <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-1">
                    <Layers className="w-4 h-4" />
                    <span>Full Season Input Planning</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">Resource Management</h2>
                  <p className="text-xs text-emerald-100 mt-1 max-w-2xl leading-relaxed">
                    {ctx
                      ? `All inputs required for ${ctx.cropTypeLabel} · ${acres} acres — with per-acre rates & total quantities.`
                      : 'Save crop details in Tab 01 to see crop-specific resource requirements.'}
                  </p>
                </div>

                {!ctx && (
                  <div className="bg-white border border-amber-200 rounded-2xl p-5 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700">Showing generic resource plan.</p>
                      <p className="text-xs text-slate-500 mt-0.5">Save crop details in Tab 01 for a crop-specific input schedule.</p>
                    </div>
                    <button onClick={() => setActiveTab('cropdetails')} className="flex-shrink-0 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl transition-colors">Fill Details</button>
                  </div>
                )}

                {ctx && (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-xs text-emerald-800 font-medium">
                      Showing full input plan for <strong>{ctx.cropTypeLabel}</strong> · {acres} acres
                      {ctx.soilType ? ` · ${ctx.soilType.replace(/_/g,' ')}` : ''}.
                    </span>
                  </div>
                )}

                {/* Resource table — grouped by category */}
                {categories.map(cat => {
                  const items = resources.filter(r => r.category === cat);
                  if (!items.length) return null;
                  return (
                    <div key={cat} className="bg-white border border-emerald-100 rounded-2xl shadow-sm overflow-hidden">
                      <div className={`px-5 py-2.5 border-b border-slate-100 flex items-center gap-2`}>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${catBg[cat]}`}>{catLabel[cat]}</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/60">
                              <th className="text-left px-4 py-2 font-bold text-slate-600 w-[38%]">Item</th>
                              <th className="text-right px-3 py-2 font-bold text-slate-600">Rate / Acre</th>
                              <th className="text-right px-3 py-2 font-bold text-slate-600">Total ({acres} acres)</th>
                              <th className="text-left px-3 py-2 font-bold text-slate-600 hidden sm:table-cell">Timing</th>
                              <th className="text-left px-3 py-2 font-bold text-slate-600 hidden md:table-cell">Purpose</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {items.map((r, i) => {
                              const totalQty = r.unit === 'lot' || r.unit === 'packet'
                                ? r.ratePerAcre
                                : `${(r.rateNum * acres).toLocaleString('en-IN', {maximumFractionDigits:1})} ${r.unit.replace('/event','').replace('/day','').replace('/spray','')}`;
                              return (
                                <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                                  <td className="px-4 py-2.5 font-medium text-slate-800 leading-snug">{r.item}</td>
                                  <td className="px-3 py-2.5 text-right font-bold text-slate-700 whitespace-nowrap">{r.ratePerAcre}</td>
                                  <td className="px-3 py-2.5 text-right font-extrabold text-emerald-700 whitespace-nowrap">{totalQty}</td>
                                  <td className="px-3 py-2.5 text-slate-500 hidden sm:table-cell leading-snug">{r.timing}</td>
                                  <td className="px-3 py-2.5 text-slate-400 hidden md:table-cell leading-snug">{r.purpose}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}

                {/* Tank-Mix Calculator */}
                <div className="bg-white border border-emerald-100 rounded-2xl shadow-sm overflow-hidden">
                  <div className="bg-emerald-50 border-b border-emerald-100 px-5 py-3 flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-extrabold text-emerald-950">Knapsack Tank-Mix Calculator</h3>
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Inputs */}
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1.5">Land Size (Acres)</label>
                        <input type="number" step="0.5" value={landAcres}
                          onChange={e => setLandAcres(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1.5">Knapsack Pump Size (Liters)</label>
                        <input type="number" value={tankSizeLiters}
                          onChange={e => setTankSizeLiters(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                      </div>
                      {ctx?.soilType && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-600">
                          <span className="font-bold text-slate-700">Soil:</span> {ctx.soilType.replace(/_/g,' ')}
                        </div>
                      )}
                    </div>
                    {/* Computed output */}
                    <div className="bg-emerald-900 text-white p-5 rounded-2xl flex flex-col gap-3">
                      <div>
                        <span className="text-[10px] bg-emerald-700 text-emerald-100 px-2.5 py-0.5 rounded-full font-mono font-bold">Spray Mix Output</span>
                        <h4 className="font-extrabold text-base text-white mt-2">{ctx?.cropTypeLabel ?? 'Generic'} Spray Plan</h4>
                        <p className="text-xs text-emerald-200 mt-0.5">For {landAcres} acres · {tankSizeLiters} L pump</p>
                      </div>
                      <div className="bg-emerald-800/70 border border-emerald-700 rounded-xl p-3 space-y-2 text-xs">
                        <div className="flex justify-between"><span className="text-emerald-300">Primary Chemical</span><span className="font-bold text-white text-right max-w-[55%]">{dosage.chemical}</span></div>
                        <div className="flex justify-between"><span className="text-emerald-300">Dose / Tank</span><span className="font-bold text-emerald-200">{dosage.dosePerTank}</span></div>
                        <div className="flex justify-between"><span className="text-emerald-300">Tanks per Event</span><span className="font-bold text-white">{totalPumps} pumps</span></div>
                        <div className="flex justify-between border-t border-emerald-700 pt-2"><span className="text-emerald-300">Water / Event</span><span className="font-bold text-white">{totalWater} L</span></div>
                      </div>
                      <p className="text-[10px] text-emerald-400">✓ CIBRC Guardrail Validated</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB 5: Weather Forecasting */}
          {activeTab === 'weather' && (() => {
            const ctx = savedCropContext;
            const cropRisk = getCropWeatherRisk(ctx?.cropType ?? '');

            // Helper functions
            const windDir = (deg: number) => ['N','NE','E','SE','S','SW','W','NW'][Math.round(deg / 45) % 8];
            const fmtTime = (unix: number, tz: number) => {
              const d = new Date((unix + tz) * 1000);
              return `${d.getUTCHours().toString().padStart(2,'0')}:${d.getUTCMinutes().toString().padStart(2,'0')}`;
            };
            const blastRisk = (humidity: number, temp: number, pop: number) => {
              const score = (humidity >= cropRisk.humidityThreshold ? 3 : humidity >= 70 ? 2 : 1)
                + (temp >= cropRisk.tempRangeMin && temp <= cropRisk.tempRangeMax ? 2 : 1)
                + (pop >= 0.6 ? 2 : pop >= 0.3 ? 1 : 0);
              if (score >= 6) return { label: 'CRITICAL', color: 'text-red-700', bg: 'bg-red-100 border-red-300' };
              if (score >= 4) return { label: 'HIGH', color: 'text-amber-700', bg: 'bg-amber-100 border-amber-300' };
              if (score >= 3) return { label: 'MODERATE', color: 'text-yellow-700', bg: 'bg-yellow-100 border-yellow-300' };
              return { label: 'LOW', color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-300' };
            };

            // Build 5-day daily forecast
            const daily: typeof wxForecast = [];
            const seen = new Set<string>();
            for (const s of wxForecast) {
              const d = new Date((s.dt + wxTz) * 1000);
              const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
              const h = d.getUTCHours();
              if (!seen.has(key) && h >= 10 && h <= 15) { seen.add(key); daily.push(s); }
            }
            if (daily.length < 5) {
              for (const s of wxForecast) {
                if (daily.length >= 5) break;
                const d = new Date((s.dt + wxTz) * 1000);
                const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
                if (!seen.has(key)) { seen.add(key); daily.push(s); }
              }
            }
            const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

            const risk = wxCurrent ? blastRisk(wxCurrent.humidity, wxCurrent.temp, wxForecast[0]?.pop ?? 0) : null;

            return (
              <div className="space-y-5">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-green-800 border border-emerald-600 text-white rounded-2xl p-6 shadow-md">
                  <div className="flex items-center gap-2 text-sky-200 text-xs font-bold uppercase tracking-wider mb-1">
                    <CloudSun className="w-4 h-4" /><span>OpenWeatherMap — Live Location</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">Real-Time Weather & Crop Disease Risk</h2>
                  <p className="text-xs text-emerald-100 mt-1 max-w-2xl leading-relaxed">
                    {ctx ? `Live weather data for ${ctx.cropTypeLabel}${ctx.location ? ` · ${ctx.location}` : ''} with ${cropRisk.primaryDisease} risk index.`
                      : 'Live temperature, humidity, wind, rain probability and 5-day forecast with blast spore proliferation risk.'}
                  </p>
                </div>

                {/* Search bar — always visible */}
                <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                      </svg>
                      <input
                        type="text"
                        value={wxSearchQuery}
                        onChange={e => setWxSearchQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && wxSearchLocation(wxSearchQuery)}
                        placeholder="Search city, district or village… e.g. Bengaluru, Warangal"
                        className="w-full pl-9 pr-4 py-2.5 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900 placeholder-slate-400"
                      />
                    </div>
                    <button
                      onClick={() => wxSearchLocation(wxSearchQuery)}
                      disabled={!wxSearchQuery.trim() || wxSearching}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
                    >
                      {wxSearching
                        ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg>
                      }
                      {wxSearching ? 'Searching…' : 'Search'}
                    </button>
                    <button
                      onClick={() => { setWxSearchQuery(''); wxAcquireLocation(); }}
                      title="Use my current location"
                      className="flex items-center gap-1.5 bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800 text-xs font-semibold px-3 py-2.5 rounded-xl transition-colors border border-slate-200"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      My Location
                    </button>
                  </div>
                  {wxLocationLabel && (
                    <p className="text-[11px] text-emerald-700 font-medium mt-2 pl-1">📍 Showing weather for: <strong>{wxLocationLabel}</strong></p>
                  )}
                </div>

                {/* IDLE — ask for location */}
                {wxStatus === 'idle' && (
                  <div className="bg-white border border-emerald-100 rounded-2xl p-10 flex flex-col items-center gap-5 shadow-sm text-center">
                    <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
                      <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-emerald-950">Enable Location for Accurate Forecast</h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">We need your location to fetch real-time weather, humidity levels, and crop disease risk specific to your farm.</p>
                    </div>
                    <button onClick={wxAcquireLocation} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-xl shadow-md transition-transform hover:scale-105 text-sm">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                      Turn On Location
                    </button>
                    <p className="text-[11px] text-slate-400">Your location is only used to fetch weather and is never stored.</p>
                  </div>
                )}

                {/* LOCATING */}
                {wxStatus === 'locating' && (
                  <div className="bg-white border border-emerald-100 rounded-2xl p-10 flex flex-col items-center gap-4 shadow-sm">
                    <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
                    <p className="text-sm font-semibold text-emerald-900">Detecting your location...</p>
                    <p className="text-xs text-slate-400">Please allow location access when prompted by your browser.</p>
                  </div>
                )}

                {/* LOADING */}
                {wxStatus === 'loading' && (
                  <div className="bg-white border border-emerald-100 rounded-2xl p-10 flex flex-col items-center gap-4 shadow-sm">
                    <RefreshCw className="w-10 h-10 text-sky-600 animate-spin" />
                    <p className="text-sm font-semibold text-slate-700">Fetching live weather data...</p>
                  </div>
                )}

                {/* ERROR */}
                {wxStatus === 'error' && (
                  <div className="bg-white border border-red-200 rounded-2xl p-8 flex flex-col items-center gap-4 shadow-sm text-center">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                    <p className="text-sm font-semibold text-red-700">{wxError}</p>
                    <button onClick={wxAcquireLocation} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition-transform hover:scale-105">
                      <RefreshCw className="w-3.5 h-3.5" /> Try Again
                    </button>
                  </div>
                )}

                {/* OK — full live weather display */}
                {wxStatus === 'ok' && wxCurrent && (
                  <>
                    {/* Current conditions hero */}
                    <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <img src={`https://openweathermap.org/img/wn/${wxCurrent.icon}@2x.png`} alt={wxCurrent.description} className="w-20 h-20 drop-shadow" />
                          <div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-0.5">
                              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                              {wxCurrent.city}, {wxCurrent.country}
                              {wxCoords && <span className="text-slate-400 font-mono text-[10px]">({wxCoords.lat.toFixed(3)}, {wxCoords.lon.toFixed(3)})</span>}
                            </div>
                            <div className="text-5xl font-extrabold text-slate-900">{wxCurrent.temp}°C</div>
                            <div className="text-sm text-slate-500 capitalize mt-0.5">{wxCurrent.description} · Feels like {wxCurrent.feelsLike}°C</div>
                          </div>
                        </div>
                        {risk && (
                          <div className={`px-5 py-3 rounded-2xl border ${risk.bg} flex flex-col items-center gap-1 min-w-[140px]`}>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{cropRisk.primaryDisease.split('(')[0].trim()} Risk</span>
                            <span className={`text-xl font-extrabold ${risk.color}`}>{risk.label}</span>
                            {risk.label !== 'LOW' && <span className="text-[10px] text-center font-semibold text-slate-600">{cropRisk.sprayAlert}</span>}
                          </div>
                        )}
                        <button onClick={() => wxFetchWeather(wxCoords!.lat, wxCoords!.lon)} className="flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-full font-medium transition-colors self-start sm:self-center">
                          <RefreshCw className="w-3.5 h-3.5" /> Refresh
                        </button>
                      </div>
                    </div>

                    {/* 8-metric grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { label: 'Humidity', value: `${wxCurrent.humidity}%`, sub: wxCurrent.humidity >= cropRisk.humidityThreshold ? `⚠ Above ${cropRisk.humidityThreshold}% risk` : 'Normal', icon: '💧', color: wxCurrent.humidity >= cropRisk.humidityThreshold ? 'text-amber-600' : 'text-sky-600' },
                        { label: 'Wind', value: `${wxCurrent.windSpeed} m/s`, sub: `${windDir(wxCurrent.windDeg)} · ${wxCurrent.windDeg}°`, icon: '🌬️', color: 'text-slate-600' },
                        { label: 'Pressure', value: `${wxCurrent.pressure} hPa`, sub: wxCurrent.pressure < 1005 ? 'Low — storm possible' : 'Stable', icon: '📊', color: 'text-indigo-600' },
                        { label: 'Visibility', value: `${wxCurrent.visibility} km`, sub: wxCurrent.visibility < 5 ? 'Poor' : 'Good', icon: '👁️', color: 'text-emerald-600' },
                        { label: 'Cloud Cover', value: `${wxCurrent.clouds}%`, sub: wxCurrent.clouds >= 80 ? 'Overcast' : wxCurrent.clouds >= 40 ? 'Partly cloudy' : 'Clear', icon: '☁️', color: 'text-slate-500' },
                        { label: 'Rain (1h)', value: `${wxCurrent.rain1h} mm`, sub: wxCurrent.rain1h > 0 ? '⚠ Leaf wetness risk' : 'Dry', icon: '🌧️', color: wxCurrent.rain1h > 0 ? 'text-amber-600' : 'text-blue-600' },
                        { label: 'Sunrise', value: fmtTime(wxCurrent.sunrise, wxTz), sub: 'Local time', icon: '🌅', color: 'text-amber-600' },
                        { label: 'Sunset', value: fmtTime(wxCurrent.sunset, wxTz), sub: 'Local time', icon: '🌇', color: 'text-orange-600' },
                      ].map(m => (
                        <div key={m.label} className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm flex flex-col gap-1">
                          <span className="text-lg">{m.icon}</span>
                          <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">{m.label}</span>
                          <span className={`text-xl font-extrabold ${m.color}`}>{m.value}</span>
                          <span className="text-[11px] text-slate-500">{m.sub}</span>
                        </div>
                      ))}
                    </div>

                    {/* 5-day forecast */}
                    {daily.length > 0 && (
                      <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">5-Day Forecast</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          {daily.slice(0, 5).map(slot => {
                            const d = new Date((slot.dt + wxTz) * 1000);
                            const sr = blastRisk(slot.humidity, slot.temp, slot.pop);
                            return (
                              <div key={slot.dt} className={`border rounded-2xl p-4 flex flex-col items-center gap-2 ${sr.bg}`}>
                                <span className="text-xs font-bold text-slate-700">{dayNames[d.getUTCDay()]}</span>
                                <img src={`https://openweathermap.org/img/wn/${slot.icon}@2x.png`} alt={slot.description} className="w-12 h-12 drop-shadow" />
                                <span className="text-lg font-extrabold text-slate-900">{slot.temp}°C</span>
                                <span className="text-[10px] text-slate-500 capitalize text-center leading-tight">{slot.description}</span>
                                <div className="flex justify-between w-full text-[10px] text-slate-500">
                                  <span>💧 {slot.humidity}%</span>
                                  <span>🌧 {Math.round(slot.pop * 100)}%</span>
                                </div>
                                <span className={`text-[10px] font-bold ${sr.color} text-center`}>{sr.label} Risk</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Crop advisory */}
                    <div className="bg-emerald-900 text-white rounded-2xl p-5 shadow-md">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300 mb-3">
                        Crop Advisory — {ctx ? cropRisk.primaryDisease : 'General'} · Live Conditions
                      </h3>
                      <div className="text-xs leading-relaxed text-emerald-100 space-y-2">
                        {wxCurrent.humidity >= cropRisk.humidityThreshold && (
                          <p>⚠ <strong>Humidity {wxCurrent.humidity}% — above {cropRisk.humidityThreshold}% threshold.</strong> {cropRisk.sprayAlert}.</p>
                        )}
                        {wxCurrent.rain1h > 0 && (
                          <p>🌧 <strong>Active rainfall {wxCurrent.rain1h} mm/hr.</strong> Delay spray. Schedule treatment 6–8 hrs after rain stops.</p>
                        )}
                        {wxCurrent.temp >= cropRisk.tempRangeMin && wxCurrent.temp <= cropRisk.tempRangeMax && (
                          <p>🌡 <strong>Temp {wxCurrent.temp}°C is in the {cropRisk.tempRangeMin}–{cropRisk.tempRangeMax}°C fungal growth range.</strong> {cropRisk.riskNote}.</p>
                        )}
                        {wxCurrent.humidity < cropRisk.humidityThreshold && wxCurrent.rain1h === 0 && (
                          <p>✅ <strong>Low disease pressure today.</strong> Humidity ({wxCurrent.humidity}%) below risk threshold. Continue regular scouting.</p>
                        )}
                        {wxCurrent.windSpeed > 5 && (
                          <p>💨 <strong>Wind {wxCurrent.windSpeed} m/s — avoid spraying.</strong> Wait for below 3 m/s to prevent spray drift.</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })()}

          {/* TAB 6: Predictive Yield Analytics */}
          {activeTab === 'analytics' && (() => {
            const ctx = savedCropContext;
            const acres = ctx ? (parseFloat(ctx.landAcres) || 1) : 1;
            const baselinePerAcre = getCropBaselineYield(ctx?.cropType ?? '');
            const totalBaseline = (baselinePerAcre * acres);
            const unit = ctx?.cropType === 'sugarcane' ? 'Tonnes' : ['banana','tomato','potato','onion','cabbage','cauliflower','pumpkin','watermelon'].includes(ctx?.cropType ?? '') ? 'Quintals' : 'Quintals';

            // Stage-aware loss % — refined per crop group
            const millets = ['rice','finger_millet','sorghum','pearl_millet','foxtail_millet','little_millet','kodo_millet','barnyard_millet','proso_millet'];
            const stageLoss = () => {
              const s = ctx?.growthStage ?? '';
              if (millets.includes(ctx?.cropType ?? '')) {
                return s==='nursery'?5 : s==='tillering'?14 : s==='flowering'?22 : s==='harvest'?8 : 5;
              }
              if (ctx?.cropType==='wheat'||ctx?.cropType==='barley'||ctx?.cropType==='oats') {
                return s==='nursery'?3 : s==='tillering'?10 : s==='flowering'?18 : s==='harvest'?6 : 3;
              }
              if (ctx?.cropType==='maize') {
                return s==='nursery'?4 : s==='tillering'?12 : s==='flowering'?20 : s==='harvest'?7 : 4;
              }
              if (ctx?.cropType==='sugarcane') {
                return s==='nursery'?5 : s==='tillering'?8 : s==='flowering'?15 : s==='harvest'?5 : 5;
              }
              if (ctx?.cropType==='cotton') {
                return s==='nursery'?6 : s==='tillering'?15 : s==='flowering'?25 : s==='harvest'?10 : 6;
              }
              return s==='nursery'?5 : s==='tillering'?12 : s==='flowering'?18 : s==='harvest'?8 : 5;
            };
            const lossPercent = stageLoss();
            const lossQty = totalBaseline * lossPercent / 100;
            const protectedYield = totalBaseline - lossQty;
            const withoutAdvisory = totalBaseline * 0.65; // typical unmanaged field loses ~35%
            const advisoryGain = protectedYield - withoutAdvisory;

            // Harvest date from getCropEvents
            const events = ctx ? getCropEvents(ctx.cropType, ctx.sowingDate, acres) : [];
            const harvestEvent = events.filter(e => e.type === 'harvest').at(-1);
            const sprayCount = events.filter(e => e.type === 'spray').length;
            const waterCount = events.filter(e => e.type === 'water').length;

            // Resources summary
            const resources = ctx ? getCropResources(ctx.cropType) : [];
            const fertItems  = resources.filter(r => r.category === 'fertiliser');
            const pestiItems = resources.filter(r => r.category === 'pesticide');

            // Progress bar width for yield comparison
            const maxVal = Math.max(totalBaseline, protectedYield, withoutAdvisory, 0.01);
            const pct = (v: number) => Math.round((v / maxVal) * 100);

            return (
              <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-green-800 border border-emerald-600 text-white rounded-2xl p-6 shadow-md">
                  <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>Harvest Loss &amp; Yield Forecasting</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">Predictive Yield Analytics</h2>
                  <p className="text-xs text-emerald-100 mt-1 max-w-2xl leading-relaxed">
                    {ctx
                      ? `Yield estimates for ${ctx.cropTypeLabel} · ${acres} ${acres===1?'acre':'acres'}${ctx.location ? ` · ${ctx.location}` : ''}.`
                      : 'Save crop & land details in Tab 01 to generate personalised yield forecasts.'}
                  </p>
                  {ctx?.sowingDate && harvestEvent && (
                    <p className="text-xs text-emerald-200 mt-1.5 font-mono">
                      🌱 Sowing: {fmtDate(new Date(ctx.sowingDate))} &nbsp;·&nbsp; 🌾 Est. Harvest: {fmtDate(harvestEvent.date)}
                    </p>
                  )}
                </div>

                {/* No context prompt */}
                {!ctx && (
                  <div className="bg-white border border-amber-200 rounded-2xl p-6 text-center space-y-3">
                    <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">No crop details saved yet</p>
                    <p className="text-xs text-slate-500">Go to <strong>Share Crop &amp; Land Details</strong> (Tab 01) and click Save &amp; Continue to generate your yield forecast.</p>
                    <button onClick={() => setActiveTab('cropdetails')} className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">
                      <ClipboardList className="w-3.5 h-3.5" /> Fill Crop Details
                    </button>
                  </div>
                )}

                {ctx && (
                  <>
                    {/* 3 key metric cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-white border border-emerald-100 p-5 rounded-2xl shadow-sm text-center space-y-1.5">
                        <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wide">Baseline Yield / Acre</p>
                        <p className="text-3xl font-extrabold text-slate-800">{baselinePerAcre}</p>
                        <p className="text-xs text-slate-500">{unit} / Acre · uninfected field</p>
                      </div>
                      <div className="bg-white border border-amber-200 p-5 rounded-2xl shadow-sm text-center space-y-1.5">
                        <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wide">Disease Loss at {ctx.growthStage || 'current'} stage</p>
                        <p className="text-3xl font-extrabold text-amber-600">−{lossPercent}%</p>
                        <p className="text-xs text-slate-500">−{lossQty.toFixed(2)} {unit} on {acres} {acres===1?'acre':'acres'}</p>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-300 p-5 rounded-2xl shadow-sm text-center space-y-1.5">
                        <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wide">Protected Harvest Forecast</p>
                        <p className="text-3xl font-extrabold text-emerald-700">{protectedYield.toFixed(2)}</p>
                        <p className="text-xs text-slate-500">{unit} · post-advisory intervention</p>
                      </div>
                    </div>

                    {/* Yield comparison bar chart */}
                    <div className="bg-white border border-emerald-100 rounded-2xl shadow-sm p-6 space-y-4">
                      <h3 className="text-sm font-extrabold text-emerald-950">Yield Comparison</h3>
                      {[
                        { label: 'Baseline (No disease)', val: totalBaseline, color: 'bg-emerald-500', textColor: 'text-emerald-700' },
                        { label: 'With Disease (No advisory)', val: withoutAdvisory, color: 'bg-red-400',    textColor: 'text-red-600' },
                        { label: 'Protected (With KisanMitra advisory)', val: protectedYield, color: 'bg-emerald-600', textColor: 'text-emerald-700' },
                      ].map((row, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 font-medium">{row.label}</span>
                            <span className={`font-extrabold ${row.textColor}`}>{row.val.toFixed(2)} {unit}</span>
                          </div>
                          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${row.color}`} style={{ width: `${pct(row.val)}%` }} />
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 mt-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="text-xs text-emerald-800 font-medium">
                          Advisory saves <strong>{advisoryGain.toFixed(2)} {unit}</strong> compared to an unmanaged field — a {((advisoryGain/withoutAdvisory)*100).toFixed(1)}% improvement.
                        </span>
                      </div>
                    </div>

                    {/* Full field breakdown table */}
                    <div className="bg-white border border-emerald-100 rounded-2xl shadow-sm overflow-hidden">
                      <div className="bg-emerald-50 border-b border-emerald-100 px-5 py-3">
                        <h3 className="text-sm font-extrabold text-emerald-950">Full Field Breakdown</h3>
                        <p className="text-xs text-emerald-700 mt-0.5">{ctx.cropTypeLabel} · {acres} {acres===1?'acre':'acres'}</p>
                      </div>
                      <div className="divide-y divide-slate-50 text-xs">
                        {[
                          { label: 'Crop', value: ctx.cropTypeLabel, bold: false },
                          { label: 'Growth Stage', value: ctx.growthStage || '—', bold: false },
                          { label: ctx.sowingDate ? 'Sowing Date' : null, value: ctx.sowingDate ? fmtDate(new Date(ctx.sowingDate)) : '', bold: false },
                          { label: harvestEvent ? 'Estimated Harvest Date' : null, value: harvestEvent ? fmtDate(harvestEvent.date) : '', bold: false },
                          { label: ctx.location ? 'Field Location' : null, value: ctx.location, bold: false },
                          { label: ctx.soilType ? 'Soil Type' : null, value: ctx.soilType ? ctx.soilType.replace(/_/g,' ') : '', bold: false },
                          { label: 'Land Area', value: `${acres} ${acres===1?'acre':'acres'}`, bold: false },
                          { label: `Baseline Yield (${acres} acres)`, value: `${totalBaseline.toFixed(2)} ${unit}`, bold: false },
                          { label: `Disease Loss (${lossPercent}%)`, value: `−${lossQty.toFixed(2)} ${unit}`, bold: false },
                          { label: 'Scheduled Spray Events', value: `${sprayCount} sprays (from calendar)`, bold: false },
                          { label: 'Scheduled Irrigation Events', value: `${waterCount} irrigations (from calendar)`, bold: false },
                          { label: 'Fertiliser Inputs', value: `${fertItems.length} products scheduled`, bold: false },
                          { label: 'Pesticide / Bio Inputs', value: `${pestiItems.length} products scheduled`, bold: false },
                          { label: 'Protected Harvest (Post-Advisory)', value: `${protectedYield.toFixed(2)} ${unit}`, bold: true },
                        ].filter(r => r.label).map((row, i) => (
                          <div key={i} className={`flex items-center justify-between px-5 py-3 ${row.bold ? 'bg-emerald-50' : ''}`}>
                            <span className={`${row.bold ? 'font-bold text-emerald-950 text-sm' : 'font-medium text-slate-600'}`}>{row.label}</span>
                            <span className={`text-right ${row.bold ? 'font-extrabold text-emerald-600 text-base' : 'font-bold text-slate-900'}`}>{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Soil-based advisory note */}
                    {ctx.soilType && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-900 leading-relaxed">
                          <span className="font-bold">Soil note:</span> {
                            ctx.soilType.includes('black') ? 'Black/Regur soils retain moisture well — reduce irrigation frequency by 20% and watch for waterlogging during heavy rain.' :
                            ctx.soilType.includes('laterite') || ctx.soilType.includes('red') ? 'Red/Laterite soils are low in organic matter — incorporate FYM 5 t/acre before sowing and split fertiliser doses to reduce leaching.' :
                            ctx.soilType.includes('alluvial') ? 'Alluvial soils are highly fertile — baseline yield estimates may be conservative; optimal irrigation can push yields 10–15% higher.' :
                            ctx.soilType.includes('sandy') || ctx.soilType.includes('desert') ? 'Sandy soils drain quickly — increase irrigation frequency and use drip if possible. Add organic mulch to conserve moisture.' :
                            ctx.soilType.includes('peaty') || ctx.soilType.includes('marshy') ? 'Peaty/marshy soils suit paddy well but ensure drainage channels are open to prevent root rot in other crops.' :
                            'Maintain organic matter by incorporating crop residues and apply micronutrients as per soil test recommendations.'
                          }
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })()}

          {/* TAB 7: Disease Based Products */}
          {activeTab === 'products' && (() => {
            const ctx = savedCropContext;
            const products = getCropProducts(ctx?.cropType ?? '');
            const badgeStyle = (type: string) =>
              type === 'bio'      ? 'bg-emerald-100 text-emerald-800' :
              type === 'systemic' ? 'bg-sky-100 text-sky-800' :
                                    'bg-amber-100 text-amber-800';
            return (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-green-800 border border-emerald-600 text-white rounded-2xl p-6 shadow-md">
                  <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-1">
                    <PackageCheck className="w-4 h-4" />
                    <span>Deterministic CIBRC Safety Gate</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">CIBRC Approved Products</h2>
                  <p className="text-xs text-emerald-100 mt-1 max-w-2xl leading-relaxed">
                    {ctx
                      ? `Pre-approved chemical & bio-fungicide treatments validated for ${ctx.cropTypeLabel}.`
                      : 'Pre-approved chemical & bio-fungicide treatments validated by rule-based food-safety guardrails.'}
                  </p>
                </div>

                {!ctx && (
                  <div className="bg-white border border-amber-200 rounded-2xl p-5 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700">Showing generic CIBRC products.</p>
                      <p className="text-xs text-slate-500 mt-0.5">Save your crop details in Tab 01 for crop-specific product recommendations.</p>
                    </div>
                    <button onClick={() => setActiveTab('cropdetails')} className="flex-shrink-0 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl transition-colors">Fill Details</button>
                  </div>
                )}

                {ctx && (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-xs text-emerald-800 font-medium">
                      Showing CIBRC-validated products for <strong>{ctx.cropTypeLabel}</strong>
                      {ctx.growthStage ? ` at ${ctx.growthStage} stage` : ''}.
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {products.map((p, i) => (
                    <div key={i} className="bg-white border border-emerald-100 p-5 rounded-2xl shadow-sm flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold ${badgeStyle(p.type)}`}>
                          {p.badge}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 flex-shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" /> CIBRC Passed
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-emerald-950 leading-snug">{p.name}</h3>
                      <p className="text-[11px] text-slate-500 font-medium">Brand: {p.brand}</p>
                      <p className="text-xs text-slate-600 leading-relaxed flex-1">{p.desc}</p>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
                        <span className="text-slate-500 font-medium">Dosage: </span>
                        <span className="font-bold text-slate-800">{p.dosage}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-sm font-extrabold text-emerald-700">{p.price}</span>
                        <a
                          href={p.buyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-sm"
                        >
                          Buy Now →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </main>
      </div>

      {/* Live Camera Viewfinder Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Camera className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-sm tracking-tight">Leaf Camera Viewfinder</h3>
              </div>
              <button
                onClick={closeLiveCamera}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative bg-black min-h-[320px] flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover max-h-[420px]"
              />

              {cameraError && (
                <div className="absolute inset-0 p-6 bg-slate-900/95 text-center flex flex-col items-center justify-center gap-3">
                  <AlertCircle className="w-10 h-10 text-amber-400" />
                  <p className="text-xs text-slate-200">{cameraError}</p>
                  <button
                    onClick={() => {
                      closeLiveCamera();
                      cameraInputRef.current?.click();
                    }}
                    className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md"
                  >
                    Open System Camera Shutter
                  </button>
                </div>
              )}

              {/* Viewfinder Bounding Guide Overlay */}
              {!cameraError && (
                <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-emerald-400/50 m-8 rounded-2xl flex items-center justify-center">
                  <span className="text-[11px] bg-slate-950/70 text-emerald-300 font-mono px-3 py-1.5 rounded-full backdrop-blur-xs">
                    Align leaf inside frame
                  </span>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-4">
              <button
                onClick={closeLiveCamera}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={capturePhotoFromCamera}
                disabled={!!cameraError}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-6 py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-transform hover:scale-105 flex items-center gap-2 disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                <span>Snap Photo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
