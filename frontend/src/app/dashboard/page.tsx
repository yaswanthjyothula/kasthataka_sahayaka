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

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<string>('detection');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Chatbot states
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Namaste! I am your Kasthataka Sahayaka AI Advisor. Tap the Camera button to open the live leaf camera viewfinder, upload an image, or use the Mic to ask questions about crop disease symptoms and treatment.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);

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

  const menuItems = [
    { id: 'detection', label: 'Crop Disease Detection', icon: Camera, badge: 'Phase 2' },
    { id: 'calendar', label: 'Smart Agriculture Calendar', icon: Calendar, badge: 'Planning' },
    { id: 'resources', label: 'Resource Management', icon: Layers, badge: 'Tank-Mix' },
    { id: 'weather', label: 'Weather Forecasting', icon: CloudSun, badge: '72h Risk' },
    { id: 'analytics', label: 'Predictive Yield Analytics', icon: TrendingUp, badge: 'Yield AI' },
    { id: 'products', label: 'Disease Based Products', icon: PackageCheck, badge: 'CIBRC Safe' },
    { id: 'support', label: 'Local Farmer Support', icon: Headphones, badge: '7 Lang Voice' },
  ];

  const quickPrompts = [
    'How do I identify and treat Leaf Blast in Finger Millet?',
    'What is the recommended CIBRC dosage for Tricyclazole 75% WP?',
    'Check 72-hour humidity & weather risk for Neck Blast',
    'Symptoms of Foot Rot and Brown Spot in early growth',
  ];

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

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() && !selectedImage) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      image: selectedImage || undefined,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setSelectedImage(null);

    // Simulate AI response
    setTimeout(() => {
      let botResponse = 'Thank you for your query. ';
      const queryLower = text.toLowerCase();

      if (queryLower.includes('blast') || queryLower.includes('leaf')) {
        botResponse += 'Leaf Blast in Finger Millet presents spindle-shaped necrotic lesions with grey centers. Recommended treatment: Foliar spray of Tricyclazole 75% WP @ 0.6g/L or Pseudomonas fluorescens bio-fungicide @ 10g/L.';
      } else if (queryLower.includes('dosage') || queryLower.includes('cibrc') || queryLower.includes('tank')) {
        botResponse += 'Per CIBRC safety guidelines, apply 18g of Tricyclazole 75% WP per 15-liter knapsack pump. Ensure complete canopy coverage with a 200L/acre water volume.';
      } else if (queryLower.includes('weather') || queryLower.includes('humidity') || queryLower.includes('risk')) {
        botResponse += 'Current 72-hour forecast indicates 88% Relative Humidity and 11.5 hours of leaf wetness. Spore germination vulnerability is HIGH. Immediate preventive spray recommended.';
      } else {
        botResponse += 'I have recorded your crop parameters. Our diagnostic engine suggests monitoring tillering stage leaf tips. Would you like to check the CIBRC pesticide safety rules or compute your knapsack tank-mix?';
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botResponse,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    }, 700);
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
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
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
                Kasthataka Sahayaka
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
          {/* TAB 1: AI Agriculture Chatbot */}
          {activeTab === 'detection' && (
            <div className="flex-1 flex flex-col gap-4 max-w-5xl mx-auto w-full h-full">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-green-800 border border-emerald-600 text-white rounded-2xl p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-emerald-900/40 text-emerald-200 text-xs px-3 py-1 rounded-full border border-emerald-500/30 font-mono mb-1.5">
                    <Bot className="w-3.5 h-3.5 text-emerald-300" />
                    <span>AI Crop Advisor</span>
                  </div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight">Kasthataka Sahayaka Crop AI Advisor</h2>
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
                    disabled={!inputText.trim() && !selectedImage}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold p-3 rounded-xl shadow-md shadow-emerald-600/20 transition-transform hover:scale-105 flex items-center justify-center"
                  >
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
                <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-1">
                  <Calendar className="w-4 h-4" />
                  <span>Finger Millet Crop Cycle</span>
                </div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">Smart Agriculture Seasonal Calendar</h2>
                <p className="text-xs text-emerald-100 mt-1 max-w-2xl leading-relaxed">
                  Automated schedules for land preparation, seed treatment, irrigation, weeding, and disease scouting.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white border border-emerald-100 p-5 rounded-2xl shadow-sm space-y-2">
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-mono font-bold">Days 0 - 20</span>
                  <h3 className="font-bold text-base text-emerald-950">Nursery &amp; Sowing</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">Treat seeds with Pseudomonas fluorescens. Maintain nursery moisture levels.</p>
                </div>
                <div className="bg-white border border-emerald-100 p-5 rounded-2xl shadow-sm space-y-2">
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-mono font-bold">Days 21 - 50</span>
                  <h3 className="font-bold text-base text-emerald-950">Tillering &amp; Blast Scouting</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">First weeding pass. Inspect leaf tips for spindle-shaped Blast lesions.</p>
                </div>
                <div className="bg-white border border-emerald-100 p-5 rounded-2xl shadow-sm space-y-2">
                  <span className="text-[10px] bg-sky-100 text-sky-800 px-2.5 py-1 rounded-full font-mono font-bold">Days 51 - 90</span>
                  <h3 className="font-bold text-base text-emerald-950">Flowering &amp; Grain Filling</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">Monitor neck and finger blast. Apply CIBRC-approved bio-fungicides if humidity exceeds 85%.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Resource Management */}
          {activeTab === 'resources' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-green-800 border border-emerald-600 text-white rounded-2xl p-6 shadow-md">
                <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-1">
                  <Layers className="w-4 h-4" />
                  <span>Tank-Mix Knapsack Calculator</span>
                </div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">Resource Management &amp; Dosage Safety</h2>
                <p className="text-xs text-emerald-100 mt-1 max-w-2xl leading-relaxed">
                  Compute precise grams/ml per knapsack pump based on your farm acreage and tank size.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-emerald-100 p-6 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-emerald-600" />
                    <span>Knapsack Tank Mix Inputs</span>
                  </h3>
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1.5">Land Size (Acres)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={landAcres}
                        onChange={(e) => setLandAcres(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1.5">Knapsack Pump Size (Liters)</label>
                      <input
                        type="number"
                        value={tankSizeLiters}
                        onChange={(e) => setTankSizeLiters(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-900 text-white p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] bg-emerald-700 text-emerald-100 px-2.5 py-1 rounded-full font-mono font-bold">Calculated Mix</span>
                    <h4 className="font-extrabold text-lg text-white mt-3">Recommended Tank Mix</h4>
                    <p className="text-xs text-emerald-200 mt-2 leading-relaxed">
                      For <span className="text-white font-bold">{landAcres} acres</span> using a{' '}
                      <span className="text-white font-bold">{tankSizeLiters}L pump</span>:
                    </p>
                    <div className="mt-4 bg-emerald-800/80 border border-emerald-700 p-4 rounded-xl text-xs space-y-2">
                      <div>Total Tanks Needed: <span className="font-bold text-white">{Math.ceil(landAcres * 4)} pumps</span></div>
                      <div>Tricyclazole 75% WP: <span className="font-bold text-emerald-300">18g per 15L tank</span></div>
                      <div>Water Volume: <span className="font-bold text-white">{landAcres * 200} Liters total</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Weather Forecasting */}
          {activeTab === 'weather' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-green-800 border border-emerald-600 text-white rounded-2xl p-6 shadow-md">
                <div className="flex items-center gap-2 text-sky-200 text-xs font-bold uppercase tracking-wider mb-1">
                  <CloudSun className="w-4 h-4" />
                  <span>Tomorrow.io / OpenWeather Fusion</span>
                </div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">72-Hour Pathogen Proliferation Vulnerability</h2>
                <p className="text-xs text-emerald-100 mt-1 max-w-2xl leading-relaxed">
                  Real-time relative humidity, leaf wetness hours, and temperature forecasting for spore germination risk.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white border border-emerald-100 p-5 rounded-2xl text-center space-y-1.5 shadow-sm">
                  <span className="text-xs text-slate-500 font-medium">Relative Humidity</span>
                  <div className="text-3xl font-extrabold text-sky-600">88%</div>
                  <span className="text-[11px] bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-bold inline-block">High Blast Spore Risk</span>
                </div>
                <div className="bg-white border border-emerald-100 p-5 rounded-2xl text-center space-y-1.5 shadow-sm">
                  <span className="text-xs text-slate-500 font-medium">Leaf Wetness Duration</span>
                  <div className="text-3xl font-extrabold text-emerald-700">11.5 hrs</div>
                  <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold inline-block">Dew Point Favorable</span>
                </div>
                <div className="bg-white border border-emerald-100 p-5 rounded-2xl text-center space-y-1.5 shadow-sm">
                  <span className="text-xs text-slate-500 font-medium">Avg Temperature</span>
                  <div className="text-3xl font-extrabold text-amber-600">26.4°C</div>
                  <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold inline-block">Fungal Growth Range</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Predictive Yield Analytics */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-green-800 border border-emerald-600 text-white rounded-2xl p-6 shadow-md">
                <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>Harvest Loss &amp; Yield Forecasting</span>
                </div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">Predictive Yield Analytics</h2>
                <p className="text-xs text-emerald-100 mt-1 max-w-2xl leading-relaxed">
                  AI estimation of harvest yield loss based on necrotic leaf area ratio and disease progression.
                </p>
              </div>

              <div className="bg-white border border-emerald-100 p-6 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-3.5">
                  <span className="text-slate-600 font-medium">Estimated Yield (Uninfected Baseline)</span>
                  <span className="font-bold text-slate-900 text-sm">12.5 Quintals / Acre</span>
                </div>
                <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-3.5">
                  <span className="text-slate-600 font-medium">Current Necrotic Impact (Leaf Blast Grade 3)</span>
                  <span className="font-bold text-amber-600 text-sm">-18% Projected Loss</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-emerald-950 font-bold text-sm">Protected Harvest Forecast (Post-Advisory)</span>
                  <span className="font-extrabold text-emerald-600 text-base">10.25 Quintals / Acre</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Disease Based Products */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-green-800 border border-emerald-600 text-white rounded-2xl p-6 shadow-md">
                <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-1">
                  <PackageCheck className="w-4 h-4" />
                  <span>Deterministic CIBRC Safety Gate</span>
                </div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">CIBRC Banned Pesticide Guardrail &amp; Products</h2>
                <p className="text-xs text-emerald-100 mt-1 max-w-2xl leading-relaxed">
                  Pre-approved chemical &amp; bio-fungicide treatments validated by rule-based food-safety guardrails.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-white border border-emerald-100 p-5 rounded-2xl shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-mono font-bold">Approved Bio-Control</span>
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> CIBRC Passed
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-emerald-950">Pseudomonas fluorescens 1.15% WP</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">Bio-fungicide for seed treatment and foliar spray against early blast pathogens.</p>
                </div>

                <div className="bg-white border border-emerald-100 p-5 rounded-2xl shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-mono font-bold">Approved Systemic</span>
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> CIBRC Passed
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-emerald-950">Tricyclazole 75% WP</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">Systemic fungicide specifically recommended for severe finger millet neck blast protection.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: Local Farmer Support */}
          {activeTab === 'support' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-green-800 border border-emerald-600 text-white rounded-2xl p-6 shadow-md">
                <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-1">
                  <Headphones className="w-4 h-4" />
                  <span>Multilingual Web Speech STT/TTS</span>
                </div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">Local Farmer Support &amp; Vernacular Voice</h2>
                <p className="text-xs text-emerald-100 mt-1 max-w-2xl leading-relaxed">
                  Voice-first advisory synthesis supporting Kannada, Telugu, Tamil, Marathi, Odia, Hindi, and English.
                </p>
              </div>

              <div className="bg-white border border-emerald-100 p-6 rounded-2xl shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <span className="text-xs font-bold text-slate-800">Select Support Language</span>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="bg-slate-50 border border-slate-300 text-xs font-semibold rounded-xl px-4 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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

                <div className="bg-emerald-50/80 border border-emerald-200 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
                      <Volume2 className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-emerald-950">Voice Advisory Assistant</h4>
                      <p className="text-xs text-emerald-800 font-medium">Active Language: {selectedLanguage}</p>
                    </div>
                  </div>
                  <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-transform hover:scale-105">
                    Listen Voice Advisory
                  </button>
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
