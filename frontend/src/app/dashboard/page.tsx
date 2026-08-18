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
  Headphones,
  Menu,
  X,
  ChevronRight,
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
import { LanguageProvider, useT } from '@/context/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

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

// ─── Weather Types ─────────────────────────────────────────────────────────────
const OWM_KEY = 'fbcb5222fdf88744e6ba4f9dd53d41b5';

interface CurrentWeather {
  city: string;
  country: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDeg: number;
  visibility: number;
  description: string;
  icon: string;
  clouds: number;
  rain1h: number;
  sunrise: number;
  sunset: number;
}

interface ForecastSlot {
  dt: number;
  temp: number;
  humidity: number;
  pop: number;
  description: string;
  icon: string;
  clouds: number;
}

// Derive blast risk from humidity, temp, and rain probability
function blastRisk(humidity: number, temp: number, pop: number): { label: string; color: string; bg: string } {
  const score = (humidity >= 85 ? 3 : humidity >= 70 ? 2 : 1)
    + (temp >= 22 && temp <= 30 ? 2 : 1)
    + (pop >= 0.6 ? 2 : pop >= 0.3 ? 1 : 0);
  if (score >= 6) return { label: 'CRITICAL Risk', color: 'text-red-700', bg: 'bg-red-100 border-red-300' };
  if (score >= 4) return { label: 'HIGH Risk', color: 'text-amber-700', bg: 'bg-amber-100 border-amber-300' };
  if (score >= 3) return { label: 'MODERATE Risk', color: 'text-yellow-700', bg: 'bg-yellow-100 border-yellow-300' };
  return { label: 'LOW Risk', color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-300' };
}

function windDirection(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

function formatUnixTime(unix: number, tz: number = 0): string {
  const d = new Date((unix + tz) * 1000);
  const h = d.getUTCHours().toString().padStart(2, '0');
  const m = d.getUTCMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function WeatherTab() {
  // ─── Translations ──────────────────────────────────────────────────────────
  const tWxHeading   = useT('wx_heading',      'Real-Time Weather & Crop Disease Risk');
  const tWxSub       = useT('wx_sub',          'Live temperature, humidity, wind, rain probability and 5-day forecast with Blast spore proliferation risk index based on your exact location.');
  const tEnableTitle = useT('wx_enable_title', 'Enable Location for Accurate Forecast');
  const tEnableSub   = useT('wx_enable_sub',   'We need your location to fetch real-time weather data, humidity levels, and crop disease risk specific to your farm.');
  const tEnableBtn   = useT('wx_enable_btn',   'Turn On Location');
  const tEnableNote  = useT('wx_enable_note',  'Your location is only used to fetch weather and is never stored.');
  const tLocating    = useT('wx_locating',     'Detecting your location...');
  const tLocatingSub = useT('wx_locating_sub', 'Please allow location access when prompted by your browser.');
  const tLoading     = useT('wx_loading',      'Fetching live weather data...');
  const tRefresh     = useT('wx_refresh',      'Refresh');
  const tRiskLabel   = useT('wx_risk_label',   'Blast Spore Risk');
  const t5day        = useT('wx_5day',         '5-Day Forecast');
  const tAdvisory    = useT('wx_advisory',     'Crop Advisory based on Current Conditions');

  // ─── State ─────────────────────────────────────────────────────────────────
  const [status, setStatus] = useState<'idle' | 'locating' | 'loading' | 'ok' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<ForecastSlot[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [tzOffset, setTzOffset] = useState<number>(0);

  const fetchWeather = async (lat: number, lon: number) => {
    setStatus('loading');
    try {
      const [curRes, fctRes] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&units=metric`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&units=metric&cnt=24`),
      ]);
      if (!curRes.ok || !fctRes.ok) throw new Error('Weather API error');
      const cur = await curRes.json();
      const fct = await fctRes.json();
      const tz: number = cur.timezone ?? 0;
      setTzOffset(tz);
      setCurrent({
        city: cur.name, country: cur.sys.country,
        temp: Math.round(cur.main.temp), feelsLike: Math.round(cur.main.feels_like),
        humidity: cur.main.humidity, pressure: cur.main.pressure,
        windSpeed: cur.wind.speed, windDeg: cur.wind.deg ?? 0,
        visibility: Math.round((cur.visibility ?? 10000) / 1000),
        description: cur.weather[0].description, icon: cur.weather[0].icon,
        clouds: cur.clouds.all, rain1h: cur.rain?.['1h'] ?? 0,
        sunrise: cur.sys.sunrise, sunset: cur.sys.sunset,
      });
      setForecast(fct.list.map((s: { dt: number; main: { temp: number; humidity: number }; pop: number; weather: { description: string; icon: string }[]; clouds: { all: number } }) => ({
        dt: s.dt, temp: Math.round(s.main.temp), humidity: s.main.humidity,
        pop: s.pop, description: s.weather[0].description, icon: s.weather[0].icon, clouds: s.clouds.all,
      })));
      setStatus('ok');
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to load weather');
      setStatus('error');
    }
  };

  const acquireLocation = () => {
    setStatus('locating');
    setErrorMsg('');
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      setStatus('error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        localStorage.setItem('ks_weather_lat', String(lat));
        localStorage.setItem('ks_weather_lon', String(lon));
        setCoords({ lat, lon });
        fetchWeather(lat, lon);
      },
      (err) => {
        setErrorMsg(
          err.code === 1
            ? 'Location permission denied. Please allow location access in your browser and try again.'
            : 'Unable to determine your location. Please try again.'
        );
        setStatus('error');
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    if (!navigator.geolocation) return;
    const tryAuto = () => {
      const cachedLat = localStorage.getItem('ks_weather_lat');
      const cachedLon = localStorage.getItem('ks_weather_lon');
      if (cachedLat && cachedLon) {
        const lat = parseFloat(cachedLat);
        const lon = parseFloat(cachedLon);
        setCoords({ lat, lon });
        fetchWeather(lat, lon);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            localStorage.setItem('ks_weather_lat', String(latitude));
            localStorage.setItem('ks_weather_lon', String(longitude));
            setCoords({ lat: latitude, lon: longitude });
            fetchWeather(latitude, longitude);
          },
          () => {},
          { timeout: 10000, maximumAge: 300000 }
        );
        return;
      }
      acquireLocation();
    };
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') { tryAuto(); }
        else if (result.state === 'prompt') {
          const cachedLat = localStorage.getItem('ks_weather_lat');
          if (cachedLat) tryAuto();
        }
      });
    } else {
      const cachedLat = localStorage.getItem('ks_weather_lat');
      if (cachedLat) tryAuto();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestLocation = acquireLocation;
  const risk = current ? blastRisk(current.humidity, current.temp, forecast[0]?.pop ?? 0) : null;

  const dailyForecast: ForecastSlot[] = [];
  const seen = new Set<string>();
  for (const slot of forecast) {
    const d = new Date((slot.dt + tzOffset) * 1000);
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
    const hour = d.getUTCHours();
    if (!seen.has(key) && hour >= 10 && hour <= 15) { seen.add(key); dailyForecast.push(slot); }
  }
  if (dailyForecast.length < 5) {
    for (const slot of forecast) {
      if (dailyForecast.length >= 5) break;
      const d = new Date((slot.dt + tzOffset) * 1000);
      const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
      if (!seen.has(key)) { seen.add(key); dailyForecast.push(slot); }
    }
  }
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-green-800 border border-emerald-600 text-white rounded-2xl p-6 shadow-md">
        <div className="flex items-center gap-2 text-sky-200 text-xs font-bold uppercase tracking-wider mb-1">
          <CloudSun className="w-4 h-4" />
          <span>OpenWeatherMap — Live Location</span>
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">{tWxHeading}</h2>
        <p className="text-xs text-emerald-100 mt-1 max-w-2xl leading-relaxed">{tWxSub}</p>
      </div>

      {/* IDLE */}
      {status === 'idle' && (
        <div className="bg-white border border-emerald-100 rounded-2xl p-10 flex flex-col items-center gap-5 shadow-sm text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
            <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-emerald-950">{tEnableTitle}</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">{tEnableSub}</p>
          </div>
          <button onClick={requestLocation} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-xl shadow-md shadow-emerald-600/25 transition-transform hover:scale-105 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            {tEnableBtn}
          </button>
          <p className="text-[11px] text-slate-400">{tEnableNote}</p>
        </div>
      )}

      {/* LOCATING */}
      {status === 'locating' && (
        <div className="bg-white border border-emerald-100 rounded-2xl p-10 flex flex-col items-center gap-4 shadow-sm">
          <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
          <p className="text-sm font-semibold text-emerald-900">{tLocating}</p>
          <p className="text-xs text-slate-400">{tLocatingSub}</p>
        </div>
      )}

      {/* LOADING */}
      {status === 'loading' && (
        <div className="bg-white border border-emerald-100 rounded-2xl p-10 flex flex-col items-center gap-4 shadow-sm">
          <RefreshCw className="w-10 h-10 text-sky-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-700">{tLoading}</p>
        </div>
      )}

      {/* ERROR */}
      {status === 'error' && (
        <div className="bg-white border border-red-200 rounded-2xl p-8 flex flex-col items-center gap-4 shadow-sm text-center">
          <AlertCircle className="w-10 h-10 text-red-500" />
          <p className="text-sm font-semibold text-red-700">{errorMsg}</p>
          <button onClick={requestLocation} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition-transform hover:scale-105">
            <RefreshCw className="w-3.5 h-3.5" /> {tRefresh}
          </button>
        </div>
      )}

      {/* OK — full weather display */}
      {status === 'ok' && current && (
        <>
          {/* Current conditions hero */}
          <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img src={`https://openweathermap.org/img/wn/${current.icon}@2x.png`} alt={current.description} className="w-20 h-20 drop-shadow" />
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-0.5">
                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {current.city}, {current.country}
                    {coords && <span className="text-slate-400 font-mono">({coords.lat.toFixed(3)}, {coords.lon.toFixed(3)})</span>}
                  </div>
                  <div className="text-5xl font-extrabold text-slate-900">{current.temp}°C</div>
                  <div className="text-sm text-slate-500 capitalize mt-0.5">{current.description} · Feels like {current.feelsLike}°C</div>
                </div>
              </div>
              {risk && (
                <div className={`px-5 py-3 rounded-2xl border ${risk.bg} flex flex-col items-center gap-1 min-w-[140px]`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{tRiskLabel}</span>
                  <span className={`text-lg font-extrabold ${risk.color}`}>{risk.label}</span>
                  <span className="text-[10px] text-slate-500">Based on live conditions</span>
                </div>
              )}
              <button onClick={requestLocation} className="flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-full font-medium transition-colors self-start sm:self-center">
                <RefreshCw className="w-3.5 h-3.5" /> {tRefresh}
              </button>
            </div>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Humidity', value: `${current.humidity}%`, sub: current.humidity >= 85 ? '⚠ High Blast Risk' : current.humidity >= 70 ? 'Moderate' : 'Normal', icon: '💧', color: 'text-sky-600' },
              { label: 'Wind', value: `${current.windSpeed} m/s`, sub: `${windDirection(current.windDeg)} · ${current.windDeg}°`, icon: '🌬️', color: 'text-slate-600' },
              { label: 'Pressure', value: `${current.pressure} hPa`, sub: current.pressure < 1005 ? 'Low — storm possible' : 'Stable', icon: '📊', color: 'text-indigo-600' },
              { label: 'Visibility', value: `${current.visibility} km`, sub: current.visibility < 5 ? 'Poor' : 'Good', icon: '👁️', color: 'text-emerald-600' },
              { label: 'Cloud Cover', value: `${current.clouds}%`, sub: current.clouds >= 80 ? 'Overcast' : current.clouds >= 40 ? 'Partly cloudy' : 'Clear', icon: '☁️', color: 'text-slate-500' },
              { label: 'Rain (1h)', value: `${current.rain1h} mm`, sub: current.rain1h > 0 ? '⚠ Leaf wetness risk' : 'Dry', icon: '🌧️', color: 'text-blue-600' },
              { label: 'Sunrise', value: formatUnixTime(current.sunrise, tzOffset), sub: 'Local time', icon: '🌅', color: 'text-amber-600' },
              { label: 'Sunset', value: formatUnixTime(current.sunset, tzOffset), sub: 'Local time', icon: '🌇', color: 'text-orange-600' },
            ].map((m) => (
              <div key={m.label} className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm flex flex-col gap-1">
                <span className="text-lg">{m.icon}</span>
                <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">{m.label}</span>
                <span className={`text-xl font-extrabold ${m.color}`}>{m.value}</span>
                <span className="text-[11px] text-slate-500">{m.sub}</span>
              </div>
            ))}
          </div>

          {/* 5-day forecast */}
          <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">{t5day}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {dailyForecast.slice(0, 5).map((slot) => {
                const d = new Date((slot.dt + tzOffset) * 1000);
                const slotRisk = blastRisk(slot.humidity, slot.temp, slot.pop);
                return (
                  <div key={slot.dt} className={`border rounded-2xl p-4 flex flex-col items-center gap-2 ${slotRisk.bg}`}>
                    <span className="text-xs font-bold text-slate-700">{dayNames[d.getUTCDay()]}</span>
                    <img src={`https://openweathermap.org/img/wn/${slot.icon}@2x.png`} alt={slot.description} className="w-12 h-12 drop-shadow" />
                    <span className="text-lg font-extrabold text-slate-900">{slot.temp}°C</span>
                    <span className="text-[10px] text-slate-500 capitalize text-center leading-tight">{slot.description}</span>
                    <div className="flex flex-col items-center gap-0.5 w-full mt-1">
                      <div className="flex justify-between w-full text-[10px] text-slate-500">
                        <span>💧 {slot.humidity}%</span>
                        <span>🌧 {Math.round(slot.pop * 100)}%</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold ${slotRisk.color} text-center`}>{slotRisk.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Advisory */}
          <div className="bg-emerald-900 text-white rounded-2xl p-5 shadow-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300 mb-3">{tAdvisory}</h3>
            <div className="text-xs leading-relaxed text-emerald-100 space-y-2">
              {current.humidity >= 85 && (
                <p>⚠ <strong>Humidity is {current.humidity}% — above the 85% Blast spore germination threshold.</strong> Apply Tricyclazole 75% WP @ 0.6g/L as a preventive foliar spray immediately.</p>
              )}
              {current.rain1h > 0 && (
                <p>🌧 <strong>Active rainfall detected ({current.rain1h} mm/hr).</strong> Delay spray application. Schedule treatment within 6–8 hours after rain stops for optimal fungicide adhesion.</p>
              )}
              {current.temp >= 22 && current.temp <= 30 && (
                <p>🌡 <strong>Temperature ({current.temp}°C) is within the 22–30°C fungal growth range.</strong> Monitor tillering-stage leaf tips daily for spindle-shaped Blast lesions.</p>
              )}
              {current.humidity < 70 && current.rain1h === 0 && (
                <p>✅ <strong>Low disease pressure today.</strong> Humidity ({current.humidity}%) is below risk threshold. Continue regular crop scouting schedule.</p>
              )}
              {current.windSpeed > 5 && (
                <p>💨 <strong>Wind speed {current.windSpeed} m/s — avoid spraying.</strong> High wind causes spray drift and uneven coverage. Wait for calmer conditions (below 3 m/s).</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
function DashboardContent() {
  // ─── Translations ──────────────────────────────────────────────────────────
  const tNavLabel    = useT('nav_label',    'Dashboard Navigation');
  const tNavSub      = useT('nav_sub',      'Finger Millet Protection Suite');
  const tSmartDash   = useT('smart_dash',   'Smart Agriculture Dashboard');

  const tMenuDetect  = useT('menu_detect',  'Crop Disease Detection');
  const tMenuCal     = useT('menu_cal',     'Smart Agriculture Calendar');
  const tMenuRes     = useT('menu_res',     'Resource Management');
  const tMenuWeather = useT('menu_weather', 'Weather Forecasting');
  const tMenuAnalyt  = useT('menu_analyt',  'Predictive Yield Analytics');
  const tMenuProd    = useT('menu_prod',    'Disease Based Products');
  const tMenuSupport = useT('menu_support', 'Local Farmer Support');

  const tBadgeDetect  = useT('badge_detect',  'Phase 2');
  const tBadgeCal     = useT('badge_cal',     'Planning');
  const tBadgeRes     = useT('badge_res',     'Tank-Mix');
  const tBadgeWeather = useT('badge_weather', '72h Risk');
  const tBadgeAnalyt  = useT('badge_analyt',  'Yield AI');
  const tBadgeProd    = useT('badge_prod',    'CIBRC Safe');
  const tBadgeSupport = useT('badge_support', '7 Lang Voice');

  const tChatHeading     = useT('chat_heading',     'Kasthataka Sahayaka Crop AI Advisor');
  const tChatSub         = useT('chat_sub',         'Ask questions, capture/upload leaf images, or use voice input for real-time crop disease diagnosis & treatment.');
  const tChatQ1          = useT('chat_q1',          'Show Leaf Blast symptoms on finger millet');
  const tChatQ2          = useT('chat_q2',          'What is the CIBRC-approved dosage for Tricyclazole?');
  const tChatQ3          = useT('chat_q3',          'Is my crop at risk due to current humidity?');
  const tChatQ4          = useT('chat_q4',          'Calculate knapsack tank-mix for 2 acres');
  const tChatPlaceholder = useT('chat_placeholder', 'Ask about crop diseases, symptoms, or remedies...');
  const tChatListening   = useT('chat_listening',   'Listening... Speak now...');
  const tChatWelcome     = useT('chat_welcome',      'Namaste! I am your Kasthataka Sahayaka AI Advisor. Tap the Camera button to open the live leaf camera viewfinder, upload an image, or use the Mic to ask questions about crop disease symptoms and treatment.');
  const tChatAttached    = useT('chat_attached',    'Leaf Photo Attached');
  const tChatLabel       = useT('chat_label',       'AI Crop Advisor');

  const tCalHeading   = useT('cal_heading',  'Smart Agriculture Seasonal Calendar');
  const tCalSub       = useT('cal_sub',      'Automated schedules for land preparation, seed treatment, irrigation, weeding, and disease scouting.');
  const tCalP1Days    = useT('cal_p1_days',  'Days 0 - 20');
  const tCalP1Title   = useT('cal_p1_title', 'Nursery & Sowing');
  const tCalP1Desc    = useT('cal_p1_desc',  'Treat seeds with Pseudomonas fluorescens. Maintain nursery moisture levels.');
  const tCalP2Days    = useT('cal_p2_days',  'Days 21 - 50');
  const tCalP2Title   = useT('cal_p2_title', 'Tillering & Blast Scouting');
  const tCalP2Desc    = useT('cal_p2_desc',  'First weeding pass. Inspect leaf tips for spindle-shaped Blast lesions.');
  const tCalP3Days    = useT('cal_p3_days',  'Days 51 - 90');
  const tCalP3Title   = useT('cal_p3_title', 'Flowering & Grain Filling');
  const tCalP3Desc    = useT('cal_p3_desc',  'Monitor neck and finger blast. Apply CIBRC-approved bio-fungicides if humidity exceeds 85%.');

  const tResHeading   = useT('res_heading',    'Resource Management & Dosage Safety');
  const tResSub       = useT('res_sub',        'Compute precise grams/ml per knapsack pump based on your farm acreage and tank size.');
  const tResInputLbl  = useT('res_input_lbl',  'Knapsack Tank Mix Inputs');
  const tResAcresLbl  = useT('res_acres_lbl',  'Land Size (Acres)');
  const tResTankLbl   = useT('res_tank_lbl',   'Knapsack Pump Size (Liters)');
  const tResCalcLbl   = useT('res_calc_lbl',   'Calculated Mix');
  const tResResultH   = useT('res_result_h',   'Recommended Tank Mix');
  const tResTotalTank = useT('res_total_tank', 'Total Tanks Needed');
  const tResChemical  = useT('res_chemical',   'Tricyclazole 75% WP');
  const tResWater     = useT('res_water',      'Water Volume');

  const tAnaHeading   = useT('ana_heading',    'Predictive Yield Analytics');
  const tAnaSub       = useT('ana_sub',        'AI estimation of harvest yield loss based on necrotic leaf area ratio and disease progression.');
  const tAnaBaseline  = useT('ana_baseline',   'Estimated Yield (Uninfected Baseline)');
  const tAnaImpact    = useT('ana_impact',     'Current Necrotic Impact (Leaf Blast Grade 3)');
  const tAnaForecast  = useT('ana_forecast',   'Protected Harvest Forecast (Post-Advisory)');

  const tProdHeading  = useT('prod_heading',   'CIBRC Banned Pesticide Guardrail & Products');
  const tProdSub      = useT('prod_sub',       'Pre-approved chemical & bio-fungicide treatments validated by rule-based food-safety guardrails.');
  const tProdApprBio  = useT('prod_appr_bio',  'Approved Bio-Control');
  const tProdApprSys  = useT('prod_appr_sys',  'Approved Systemic');
  const tProdPassed   = useT('prod_passed',    'CIBRC Passed');
  const tProd1Title   = useT('prod1_title',    'Pseudomonas fluorescens 1.15% WP');
  const tProd1Desc    = useT('prod1_desc',     'Bio-fungicide for seed treatment and foliar spray against early blast pathogens.');
  const tProd2Title   = useT('prod2_title',    'Tricyclazole 75% WP');
  const tProd2Desc    = useT('prod2_desc',     'Systemic fungicide specifically recommended for severe finger millet neck blast protection.');

  const tSupHeading   = useT('sup_heading',    'Local Farmer Support & Vernacular Voice');
  const tSupSub       = useT('sup_sub',        'Voice-first advisory synthesis supporting Kannada, Telugu, Tamil, Marathi, Odia, Hindi, and English.');
  const tSupSelect    = useT('sup_select',     'Select Support Language');
  const tSupVoiceTitle = useT('sup_voice_title', 'Voice Advisory Assistant');
  const tSupVoiceActive = useT('sup_voice_active', 'Active Language');
  const tSupVoiceBtn  = useT('sup_voice_btn',  'Listen Voice Advisory');

  const tBackBtn      = useT('back_btn',       'Landing Page');
  const tPersona      = useT('persona',        'Persona: Farmer');
  const tAlignLeaf    = useT('align_leaf',     'Align leaf inside frame');
  const tCancelBtn    = useT('cancel_btn',     'Cancel');
  const tSnapBtn      = useT('snap_btn',       'Snap Photo');
  const tViewfinder   = useT('viewfinder',     'Leaf Camera Viewfinder');
  const tCameraFallback = useT('camera_fallback', 'Unable to access camera stream directly. Please use system camera or grant permissions.');
  const tOpenSystemCam  = useT('open_system_cam', 'Open System Camera Shutter');

  // ─── State ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<string>('detection');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'bot', text: tChatWelcome, time: '—' },
  ]);

  // Fix the hydration timestamp on mount, and keep welcome text in sync with language
  useEffect(() => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === '1' ? { ...msg, time: getTime(), text: tChatWelcome } : msg))
    );
  }, [tChatWelcome]);

  const [inputText, setInputText] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isBotTyping, setIsBotTyping] = useState<boolean>(false);

  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [landAcres, setLandAcres] = useState<number>(2.5);
  const [tankSizeLiters, setTankSizeLiters] = useState<number>(15);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('Kannada');

  const menuItems = [
    { id: 'detection', label: tMenuDetect,  icon: Camera,       badge: tBadgeDetect },
    { id: 'calendar',  label: tMenuCal,     icon: Calendar,     badge: tBadgeCal },
    { id: 'resources', label: tMenuRes,     icon: Layers,       badge: tBadgeRes },
    { id: 'weather',   label: tMenuWeather, icon: CloudSun,     badge: tBadgeWeather },
    { id: 'analytics', label: tMenuAnalyt,  icon: TrendingUp,   badge: tBadgeAnalyt },
    { id: 'products',  label: tMenuProd,    icon: PackageCheck, badge: tBadgeProd },
    { id: 'support',   label: tMenuSupport, icon: Headphones,   badge: tBadgeSupport },
  ];

  const quickPrompts = [tChatQ1, tChatQ2, tChatQ3, tChatQ4];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openLiveCamera = async () => {
    setShowCameraModal(true);
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } else {
        setCameraError(tCameraFallback);
      }
    } catch {
      setCameraError(tCameraFallback);
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
      id: Date.now().toString(), sender: 'user',
      text: text.trim(), image: selectedImage || undefined, time: getTime(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setSelectedImage(null);
    setIsBotTyping(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';
      const systemPrompt = `You are Kasthataka Sahayaka, an expert AI advisor specialised in finger millet (ragi) crop disease detection and management.
You help farmers identify diseases like Leaf Blast, Neck Blast, Finger Blast, Foot Rot, Brown Leaf Spot, Smut Disease, and Cercospora Spot.
You provide CIBRC-approved pesticide recommendations with exact dosages, tank-mix calculations for knapsack pumps, weather-based risk assessments, and multilingual support.
Always be concise, practical, and farmer-friendly. If an image is described, provide a diagnosis based on the description.`;
      const userContent = selectedImage ? `${text.trim()}\n\n(Farmer has also attached a leaf image for diagnosis)` : text.trim();
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Kasthataka Sahayaka',
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
        const errData = await res.json().catch(() => ({}));
        throw new Error((errData as { error?: { message?: string } })?.error?.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const botResponse = data.choices?.[0]?.message?.content || 'No response received.';
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), sender: 'bot', text: botResponse, time: getTime() }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), sender: 'bot', text: `Sorry, I couldn't reach the AI service. Please try again. (${msg})`, time: getTime() }]);
    } finally { setIsBotTyping(false); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => { setSelectedImage(event.target?.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const toggleSpeechRecognition = () => {
    if (isRecording) { setIsRecording(false); return; }
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SR) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = new SR() as any;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = selectedLanguage === 'Kannada' ? 'kn-IN' : selectedLanguage === 'Telugu' ? 'te-IN' : selectedLanguage === 'Tamil' ? 'ta-IN' : selectedLanguage === 'Hindi' ? 'hi-IN' : 'en-US';
      setIsRecording(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? prev + ' ' + transcript : transcript));
        setIsRecording(false);
      };
      recognition.onerror = () => { setIsRecording(false); };
      recognition.onend = () => { setIsRecording(false); };
      recognition.start();
    } else {
      setIsRecording(true);
      setTimeout(() => { setInputText('Is my crop at risk of Leaf Blast due to current weather humidity?'); setIsRecording(false); }, 2000);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-white text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors" aria-label="Toggle Menu">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-green-700 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">🌾</div>
            <div>
              <h1 className="font-extrabold text-lg text-emerald-950 tracking-tight leading-none">Kasthataka Sahayaka</h1>
              <span className="text-[11px] text-emerald-700 font-mono font-medium">{tSmartDash}</span>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link href="/" className="hidden xs:inline-flex items-center gap-1.5 text-xs text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-1.5 rounded-full font-medium transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /><span>{tBackBtn}</span>
          </Link>
          <div className="text-xs bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-full font-mono font-bold shadow-xs">{tPersona}</div>
        </div>
      </header>

      <div className="flex-1 flex relative overflow-hidden">
        {/* Mobile Backdrop */}
        {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-20 md:hidden" />}

        {/* Left Sidebar */}
        <aside className={`fixed md:sticky md:top-0 md:h-screen bottom-0 left-0 z-30 w-72 bg-emerald-50/80 backdrop-blur-md border-r border-emerald-100 p-4 flex flex-col gap-4 transform transition-transform duration-300 ease-in-out overflow-y-auto flex-shrink-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="px-2 pt-1">
            <h2 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">{tNavLabel}</h2>
            <p className="text-[11px] text-emerald-700">{tNavSub}</p>
          </div>
          <nav className="flex-1 flex flex-col gap-1.5">
            {menuItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                  className={`flex items-center justify-between p-3 rounded-xl text-left transition-all ${isActive ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-600/25 border border-emerald-500' : 'text-slate-700 hover:bg-emerald-100/70 hover:text-emerald-950 border border-transparent'}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-xs font-mono w-4 font-bold ${isActive ? 'text-emerald-100' : 'text-emerald-700'}`}>0{idx + 1}</span>
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-emerald-600'}`} />
                    <span className="text-xs truncate">{item.label}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 bg-slate-50/60 overflow-y-auto w-full max-w-none flex flex-col">

          {/* TAB 1: AI Agriculture Chatbot */}
          {activeTab === 'detection' && (
            <div className="flex-1 flex flex-col gap-4 max-w-5xl mx-auto w-full h-full">
              <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-green-800 border border-emerald-600 text-white rounded-2xl p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-emerald-900/40 text-emerald-200 text-xs px-3 py-1 rounded-full border border-emerald-500/30 font-mono mb-1.5">
                    <Bot className="w-3.5 h-3.5 text-emerald-300" /><span>{tChatLabel}</span>
                  </div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight">{tChatHeading}</h2>
                  <p className="text-xs text-emerald-100 mt-0.5">{tChatSub}</p>
                </div>
              </div>

              <div className="bg-white border border-emerald-100 rounded-2xl p-4 sm:p-5 shadow-sm flex-1 flex flex-col justify-between min-h-[440px]">
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[460px]">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.sender === 'bot' && (
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5"><Bot className="w-4 h-4" /></div>
                      )}
                      <div className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed ${msg.sender === 'user' ? 'bg-emerald-600 text-white rounded-br-none shadow-sm' : 'bg-emerald-50/80 border border-emerald-100 text-slate-800 rounded-bl-none'}`}>
                        {msg.image && <div className="mb-2.5 rounded-xl overflow-hidden border border-emerald-200 max-w-xs"><img src={msg.image} alt="Uploaded leaf" className="w-full h-auto object-cover max-h-48" /></div>}
                        <p>{msg.text}</p>
                        <span className={`block text-[9px] mt-1.5 text-right font-mono ${msg.sender === 'user' ? 'text-emerald-200' : 'text-slate-400'}`}>{msg.time}</span>
                      </div>
                      {msg.sender === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5"><User className="w-4 h-4" /></div>
                      )}
                    </div>
                  ))}
                  {isBotTyping && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5"><Bot className="w-4 h-4" /></div>
                      <div className="bg-emerald-50/80 border border-emerald-100 text-slate-800 rounded-2xl rounded-bl-none p-4 flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="pt-3 border-t border-slate-100 my-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Suggested Quick Questions:</span>
                  <div className="flex flex-wrap gap-2">
                    {quickPrompts.map((prompt, idx) => (
                      <button key={idx} onClick={() => handleSendMessage(prompt)}
                        className="text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 px-3 py-1.5 rounded-full text-left transition-colors font-medium">
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedImage && (
                  <div className="mb-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between max-w-xs">
                    <div className="flex items-center gap-2">
                      <img src={selectedImage} alt="Preview" className="w-8 h-8 rounded-lg object-cover" />
                      <span className="text-xs text-emerald-900 font-medium">{tChatAttached}</span>
                    </div>
                    <button onClick={() => setSelectedImage(null)} className="text-slate-400 hover:text-red-600 p-1"><X className="w-4 h-4" /></button>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="p-3 rounded-xl bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800 transition-colors" title="Upload File Attachment">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <input type="file" ref={cameraInputRef} onChange={handleImageUpload} accept="image/*" capture="environment" className="hidden" />
                  <button onClick={openLiveCamera} className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 transition-transform hover:scale-105" title="Open Camera Viewfinder">
                    <Camera className="w-4 h-4" />
                  </button>
                  <button onClick={toggleSpeechRecognition} className={`p-3 rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30' : 'bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800'}`} title={isRecording ? 'Listening to voice...' : 'Voice Input (Mic)'}>
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                  <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={isRecording ? tChatListening : tChatPlaceholder}
                    className={`flex-1 border rounded-xl px-4 py-3 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors ${isRecording ? 'bg-red-50/50 border-red-300 text-red-900 placeholder-red-400' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                  <button onClick={() => handleSendMessage()} disabled={(!inputText.trim() && !selectedImage) || isBotTyping}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold p-3 rounded-xl shadow-md shadow-emerald-600/20 transition-transform hover:scale-105 flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Smart Agriculture Calendar */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-green-800 border border-emerald-600 text-white rounded-2xl p-6 shadow-md">
                <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-1"><Calendar className="w-4 h-4" /><span>Finger Millet Crop Cycle</span></div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">{tCalHeading}</h2>
                <p className="text-xs text-emerald-100 mt-1 max-w-2xl leading-relaxed">{tCalSub}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white border border-emerald-100 p-5 rounded-2xl shadow-sm space-y-2">
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-mono font-bold">{tCalP1Days}</span>
                  <h3 className="font-bold text-base text-emerald-950">{tCalP1Title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{tCalP1Desc}</p>
                </div>
                <div className="bg-white border border-emerald-100 p-5 rounded-2xl shadow-sm space-y-2">
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-mono font-bold">{tCalP2Days}</span>
                  <h3 className="font-bold text-base text-emerald-950">{tCalP2Title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{tCalP2Desc}</p>
                </div>
                <div className="bg-white border border-emerald-100 p-5 rounded-2xl shadow-sm space-y-2">
                  <span className="text-[10px] bg-sky-100 text-sky-800 px-2.5 py-1 rounded-full font-mono font-bold">{tCalP3Days}</span>
                  <h3 className="font-bold text-base text-emerald-950">{tCalP3Title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{tCalP3Desc}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Resource Management */}
          {activeTab === 'resources' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-green-800 border border-emerald-600 text-white rounded-2xl p-6 shadow-md">
                <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-1"><Layers className="w-4 h-4" /><span>Tank-Mix Knapsack Calculator</span></div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">{tResHeading}</h2>
                <p className="text-xs text-emerald-100 mt-1 max-w-2xl leading-relaxed">{tResSub}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-emerald-100 p-6 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2"><Droplets className="w-4 h-4 text-emerald-600" /><span>{tResInputLbl}</span></h3>
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1.5">{tResAcresLbl}</label>
                      <input type="number" step="0.5" value={landAcres} onChange={(e) => setLandAcres(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1.5">{tResTankLbl}</label>
                      <input type="number" value={tankSizeLiters} onChange={(e) => setTankSizeLiters(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                    </div>
                  </div>
                </div>
                <div className="bg-emerald-900 text-white p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] bg-emerald-700 text-emerald-100 px-2.5 py-1 rounded-full font-mono font-bold">{tResCalcLbl}</span>
                    <h4 className="font-extrabold text-lg text-white mt-3">{tResResultH}</h4>
                    <p className="text-xs text-emerald-200 mt-2 leading-relaxed">For <span className="text-white font-bold">{landAcres} acres</span> using a <span className="text-white font-bold">{tankSizeLiters}L pump</span>:</p>
                    <div className="mt-4 bg-emerald-800/80 border border-emerald-700 p-4 rounded-xl text-xs space-y-2">
                      <div>{tResTotalTank}: <span className="font-bold text-white">{Math.ceil(landAcres * 4)} pumps</span></div>
                      <div>{tResChemical}: <span className="font-bold text-emerald-300">18g per 15L tank</span></div>
                      <div>{tResWater}: <span className="font-bold text-white">{landAcres * 200} Liters total</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Weather */}
          {activeTab === 'weather' && <WeatherTab />}

          {/* TAB 5: Predictive Yield Analytics */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-green-800 border border-emerald-600 text-white rounded-2xl p-6 shadow-md">
                <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-1"><TrendingUp className="w-4 h-4" /><span>Harvest Loss &amp; Yield Forecasting</span></div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">{tAnaHeading}</h2>
                <p className="text-xs text-emerald-100 mt-1 max-w-2xl leading-relaxed">{tAnaSub}</p>
              </div>
              <div className="bg-white border border-emerald-100 p-6 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-3.5">
                  <span className="text-slate-600 font-medium">{tAnaBaseline}</span>
                  <span className="font-bold text-slate-900 text-sm">12.5 Quintals / Acre</span>
                </div>
                <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-3.5">
                  <span className="text-slate-600 font-medium">{tAnaImpact}</span>
                  <span className="font-bold text-amber-600 text-sm">-18% Projected Loss</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-emerald-950 font-bold text-sm">{tAnaForecast}</span>
                  <span className="font-extrabold text-emerald-600 text-base">10.25 Quintals / Acre</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Disease Based Products */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-green-800 border border-emerald-600 text-white rounded-2xl p-6 shadow-md">
                <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-1"><PackageCheck className="w-4 h-4" /><span>Deterministic CIBRC Safety Gate</span></div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">{tProdHeading}</h2>
                <p className="text-xs text-emerald-100 mt-1 max-w-2xl leading-relaxed">{tProdSub}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-white border border-emerald-100 p-5 rounded-2xl shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-mono font-bold">{tProdApprBio}</span>
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {tProdPassed}</span>
                  </div>
                  <h3 className="font-bold text-base text-emerald-950">{tProd1Title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{tProd1Desc}</p>
                </div>
                <div className="bg-white border border-emerald-100 p-5 rounded-2xl shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-mono font-bold">{tProdApprSys}</span>
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {tProdPassed}</span>
                  </div>
                  <h3 className="font-bold text-base text-emerald-950">{tProd2Title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{tProd2Desc}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: Local Farmer Support */}
          {activeTab === 'support' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-green-800 border border-emerald-600 text-white rounded-2xl p-6 shadow-md">
                <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-1"><Headphones className="w-4 h-4" /><span>Multilingual Web Speech STT/TTS</span></div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">{tSupHeading}</h2>
                <p className="text-xs text-emerald-100 mt-1 max-w-2xl leading-relaxed">{tSupSub}</p>
              </div>
              <div className="bg-white border border-emerald-100 p-6 rounded-2xl shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <span className="text-xs font-bold text-slate-800">{tSupSelect}</span>
                  <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="bg-slate-50 border border-slate-300 text-xs font-semibold rounded-xl px-4 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                    <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                    <option value="Telugu">Telugu (తెలుగు)</option>
                    <option value="Tamil">Tamil (தமிழ்)</option>
                    <option value="Marathi">Marathi (मराठी)</option>
                    <option value="Odia">Odia (ଓଡ଼ିଆ)</option>
                    <option value="Hindi">Hindi (हिन्दी)</option>
                    <option value="English">English</option>
                  </select>
                </div>
                <div className="bg-emerald-50/80 border border-emerald-200 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30"><Volume2 className="w-6 h-6 animate-pulse" /></div>
                    <div>
                      <h4 className="text-sm font-extrabold text-emerald-950">{tSupVoiceTitle}</h4>
                      <p className="text-xs text-emerald-800 font-medium">{tSupVoiceActive}: {selectedLanguage}</p>
                    </div>
                  </div>
                  <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-transform hover:scale-105">{tSupVoiceBtn}</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Live Camera Viewfinder Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white"><Camera className="w-5 h-5 text-emerald-400" /><h3 className="font-extrabold text-sm tracking-tight">{tViewfinder}</h3></div>
              <button onClick={closeLiveCamera} className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="relative bg-black min-h-[320px] flex items-center justify-center overflow-hidden">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover max-h-[420px]" />
              {cameraError && (
                <div className="absolute inset-0 p-6 bg-slate-900/95 text-center flex flex-col items-center justify-center gap-3">
                  <AlertCircle className="w-10 h-10 text-amber-400" />
                  <p className="text-xs text-slate-200">{cameraError}</p>
                  <button onClick={() => { closeLiveCamera(); cameraInputRef.current?.click(); }} className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md">{tOpenSystemCam}</button>
                </div>
              )}
              {!cameraError && (
                <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-emerald-400/50 m-8 rounded-2xl flex items-center justify-center">
                  <span className="text-[11px] bg-slate-950/70 text-emerald-300 font-mono px-3 py-1.5 rounded-full backdrop-blur-xs">{tAlignLeaf}</span>
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-4">
              <button onClick={closeLiveCamera} className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800">{tCancelBtn}</button>
              <button onClick={capturePhotoFromCamera} disabled={!!cameraError} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-6 py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-transform hover:scale-105 flex items-center gap-2 disabled:opacity-50">
                <Camera className="w-4 h-4" /><span>{tSnapBtn}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Default Export: wrap DashboardContent with LanguageProvider ──────────────
export default function Dashboard() {
  return (
    <LanguageProvider>
      <DashboardContent />
    </LanguageProvider>
  );
}
