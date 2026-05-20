import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Link2,
  FileText,
  Phone,
  Mail,
  Wifi,
  MessageSquare,
  Globe,
  Share2,
  Copy,
  Download,
  Trash2,
  History,
  Sparkles,
  RefreshCw,
  Sliders,
  Palette,
  Image as ImageIcon,
  Check,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Upload,
  Info
} from 'lucide-react';

import { QRType, QRState, QRDesign, HistoryItem, ToastMessage } from './types';
import { generateQRCanvas, generateQRSVG } from './utils/qrHelper';
import { LOGO_PRESETS } from './utils/logoPresets';
import ParticleBackground from './components/ParticleBackground';
import TypingAnimation from './components/TypingAnimation';
import FeaturesSection from './components/Features';
import Toaster from './components/Toaster';

const COLOR_PRESETS = [
  { name: 'Cosmic Slate', fg: '#7F5AF0', bg: '#0F172A', label: 'Indigo / Pure Slate' },
  { name: 'Electric Cyan', fg: '#22D3EE', bg: '#0F172A', label: 'Cyan / Deep Dark' },
  { name: 'Emerald Mint', fg: '#10B981', bg: '#111827', label: 'Green / Charcoal' },
  { name: 'Cyberpunk Purple', fg: '#A855F7', bg: '#111827', label: 'Violet / Jet Black' },
  { name: 'Classic Tech', fg: '#3B82F6', bg: '#ffffff', label: 'Blue / Classic White' },
  { name: 'Sunset Orange', fg: '#F97316', bg: '#ffffff', label: 'Orange / Classic White' },
  { name: 'Stealth Dark', fg: '#F8FAFC', bg: '#0F172A', label: 'Slate White / Dark' },
  { name: 'Clean Ink', fg: '#0F172A', bg: '#ffffff', label: 'Black / Clean White' },
];

const DEFAULT_STATE: QRState = {
  type: 'url',
  value: 'https://ai.studio/build',
  urlValue: 'https://ai.studio/build',
  textValue: '',
  phoneValue: '',
  emailConfig: { address: '', subject: '', body: '' },
  wifiConfig: { ssid: '', password: '', encryption: 'WPA', hidden: false },
  smsConfig: { phone: '', message: '' },
  socialConfig: { platform: 'twitter', username: '' },
};

const DEFAULT_DESIGN: QRDesign = {
  fgColor: '#7F5AF0',
  bgColor: '#ffffff',
  size: 300,
  margin: 4,
  logoUrl: null,
  logoScale: 0.18,
  errorCorrectionLevel: 'H',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<QRType>('url');
  const [formState, setFormState] = useState<QRState>(DEFAULT_STATE);
  const [designState, setDesignState] = useState<QRDesign>(DEFAULT_DESIGN);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isCoping, setIsCopying] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic typing state titles
  const phraseRotation = [
    'Websites & Custom Links.',
    'Plain Text & Notes.',
    'WiFi Network Tokens.',
    'Secure Emails & Drafts.',
    'Dial Codes & Phones.',
    'Social Media Handles.'
  ];

  // Fetch local history logs
  useEffect(() => {
    const saved = localStorage.getItem('genqr_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (err) {
        console.error('Failed to parse history from localStorage:', err);
      }
    }
  }, []);

  // Sync to local storage
  const saveHistoryToStorage = (updatedList: HistoryItem[]) => {
    setHistory(updatedList);
    localStorage.setItem('genqr_history', JSON.stringify(updatedList));
  };

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const newToast: ToastMessage = {
      id: Date.now().toString(),
      type,
      message,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Compile individual elements into standard QR Protocol
  const getCompiledValue = (type: QRType, state: QRState): string => {
    switch (type) {
      case 'url':
        let url = state.urlValue.trim();
        if (!url) return '';
        if (!/^https?:\/\//i.test(url)) {
          url = 'https://' + url;
        }
        return url;
      case 'text':
        return state.textValue;
      case 'phone':
        return state.phoneValue ? `tel:${state.phoneValue.trim()}` : '';
      case 'email':
        const { address, subject, body } = state.emailConfig;
        if (!address.trim()) return '';
        const params = [];
        if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
        if (body) params.push(`body=${encodeURIComponent(body)}`);
        const query = params.length ? `?${params.join('&')}` : '';
        return `mailto:${address.trim()}${query}`;
      case 'wifi':
        const { ssid, password, encryption, hidden } = state.wifiConfig;
        if (!ssid.trim()) return '';
        return `WIFI:S:${ssid.trim()};T:${encryption};P:${password ? password : ''};H:${hidden ? 'true' : 'false'};;`;
      case 'sms':
        const { phone: smsPhone, message: smsMsg } = state.smsConfig;
        if (!smsPhone.trim()) return '';
        return `SMSTO:${smsPhone.trim()}:${smsMsg || ''}`;
      case 'social':
        const { platform, username } = state.socialConfig;
        const user = username.trim();
        if (!user) return '';
        switch (platform) {
          case 'twitter': return `https://twitter.com/${user}`;
          case 'instagram': return `https://instagram.com/${user}`;
          case 'linkedin': return `https://linkedin.com/in/${user}`;
          case 'youtube': return `https://youtube.com/@${user}`;
          case 'custom': return user.startsWith('http') ? user : `https://${user}`;
          default: return '';
        }
      default:
        return '';
    }
  };

  const rawValue = getCompiledValue(activeTab, formState) || 'https://ai.studio/build';

  // Trigger dynamic generation state to draw canvas
  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);

    try {
      // Small visual delay to feel premium SaaS loading instantly
      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = await generateQRCanvas({
        text: rawValue,
        fgColor: designState.fgColor,
        bgColor: designState.bgColor,
        size: designState.size,
        margin: designState.margin,
        errorCorrectionLevel: designState.errorCorrectionLevel,
        logoUrl: designState.logoUrl,
        logoScale: designState.logoScale,
      });

      const dataUrl = canvas.toDataURL('image/png');
      setQrUrl(dataUrl);

      // Successfully generated, write history logger
      const label = rawValue.length > 32 ? rawValue.slice(0, 30) + '...' : rawValue;
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        title: label,
        type: activeTab,
        rawValue: rawValue,
        design: { ...designState },
        timestamp: Date.now(),
      };

      // Ensure no duplicates on top-most list
      const isDuplicate = history.some((item) => item.rawValue === rawValue && item.type === activeTab);
      if (!isDuplicate) {
        const updated = [historyItem, ...history.slice(0, 19)]; // keep last 20
        saveHistoryToStorage(updated);
      }

      showToast('QR Code compiled successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to compile QR. Try adapting colors.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Re-generate on design variable tweaks
  useEffect(() => {
    let active = true;
    const updateQR = async () => {
      try {
        const canvas = await generateQRCanvas({
          text: rawValue,
          fgColor: designState.fgColor,
          bgColor: designState.bgColor,
          size: designState.size,
          margin: designState.margin,
          errorCorrectionLevel: designState.errorCorrectionLevel,
          logoUrl: designState.logoUrl,
          logoScale: designState.logoScale,
        });
        if (active) {
          setQrUrl(canvas.toDataURL('image/png'));
        }
      } catch (err) {
        // Suppress initial cycle trigger failures
      }
    };
    updateQR();
    return () => {
      active = false;
    };
  }, [designState, rawValue]);

  const handleClear = () => {
    setFormState(DEFAULT_STATE);
    setDesignState(DEFAULT_DESIGN);
    showToast('Form inputs resets to default.', 'info');
  };

  // Color Preset applier
  const applyPreset = (fg: string, bg: string) => {
    setDesignState((prev) => ({
      ...prev,
      fgColor: fg,
      bgColor: bg,
    }));
    showToast('Theme palette updated.', 'info');
  };

  // Logo uploader
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.size > 2 * 1024 * 1024) {
        showToast('Logo must be less than 2MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setDesignState((prev) => ({
            ...prev,
            logoUrl: reader.result as string,
            errorCorrectionLevel: 'H', // Force high error correction for logos
          }));
          showToast('Custom logo uploaded successfully. Enforced (H) tolerance.', 'success');
        }
      };
      reader.onerror = () => {
        showToast('Failed to parse selected image.', 'error');
      };
      reader.readAsDataURL(file);
    }
  };

  // Load history item back to state
  const loadHistoryItem = (item: HistoryItem) => {
    setActiveTab(item.type);
    setDesignState(item.design);

    // Apply back form string
    setFormState((prev) => {
      const newState = { ...prev };
      if (item.type === 'url') newState.urlValue = item.rawValue;
      else if (item.type === 'text') newState.textValue = item.rawValue;
      else if (item.type === 'phone') {
        newState.phoneValue = item.rawValue.replace('tel:', '');
      } else if (item.type === 'email') {
        const mailUrl = item.rawValue.replace('mailto:', '');
        const [email, search] = mailUrl.split('?');
        newState.emailConfig.address = email;
        if (search) {
          const urlParams = new URLSearchParams(search);
          newState.emailConfig.subject = urlParams.get('subject') || '';
          newState.emailConfig.body = urlParams.get('body') || '';
        }
      } else if (item.type === 'wifi') {
        // Extract protocol elements
        const wifiStr = item.rawValue;
        const ssidMatch = wifiStr.match(/S:([^;]+)/);
        const passMatch = wifiStr.match(/P:([^;]*)/);
        const encMatch = wifiStr.match(/T:([^;]+)/);
        const hiddenMatch = wifiStr.match(/H:([^;]+)/);

        if (ssidMatch) newState.wifiConfig.ssid = ssidMatch[1];
        if (passMatch) newState.wifiConfig.password = passMatch[1];
        if (encMatch) newState.wifiConfig.encryption = encMatch[1] as 'WEP' | 'WPA' | 'nopass';
        if (hiddenMatch) newState.wifiConfig.hidden = hiddenMatch[1] === 'true';
      } else if (item.type === 'sms') {
        const smsMatch = item.rawValue.match(/SMSTO:([^:]+):?(.*)/);
        if (smsMatch) {
          newState.smsConfig.phone = smsMatch[1];
          newState.smsConfig.message = smsMatch[2] || '';
        }
      } else if (item.type === 'social') {
        // Resolve platform
        const val = item.rawValue;
        if (val.includes('twitter.com')) {
          newState.socialConfig.platform = 'twitter';
          newState.socialConfig.username = val.replace('https://twitter.com/', '');
        } else if (val.includes('instagram.com')) {
          newState.socialConfig.platform = 'instagram';
          newState.socialConfig.username = val.replace('https://instagram.com/', '');
        } else if (val.includes('linkedin.com/in')) {
          newState.socialConfig.platform = 'linkedin';
          newState.socialConfig.username = val.replace('https://linkedin.com/in/', '');
        } else if (val.includes('youtube.com/@')) {
          newState.socialConfig.platform = 'youtube';
          newState.socialConfig.username = val.replace('https://youtube.com/@', '');
        } else {
          newState.socialConfig.platform = 'custom';
          newState.socialConfig.username = val;
        }
      }
      return newState;
    });

    showToast('Loaded item from scanning logs.', 'info');
    // Scroll smoothly to generate panel
    document.getElementById('generator-panel')?.scrollIntoView({ behavior: 'smooth' });
  };

  const removeHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter((item) => item.id !== id);
    saveHistoryToStorage(updated);
    showToast('Scanning log removed.', 'info');
  };

  const clearAllHistory = () => {
    if (window.confirm('Do you want to purge all generated logs?')) {
      saveHistoryToStorage([]);
      showToast('Logs purged completely.', 'success');
    }
  };

  // Clipboard Copier
  const copyToClipboard = async () => {
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(rawValue);
      showToast('Encoded parameters copied to clipboard!', 'success');
    } catch (err) {
      showToast('Copy failed.', 'error');
    } finally {
      setTimeout(() => setIsCopying(false), 800);
    }
  };

  // Share actions
  const handleShare = async (platform: 'twitter' | 'whatsapp' | 'telegram' | 'web') => {
    const textMsg = `Unlock my brand-new scan-ready QR code created instantly on GenQR'By D: ${rawValue}`;
    const shareUrl = window.location.href;

    if (platform === 'web') {
      if (navigator.share) {
        try {
          await navigator.share({
            title: `GenQR'By D QR Code`,
            text: textMsg,
            url: rawValue,
          });
          showToast('Shared successfully!', 'success');
        } catch (err) {
          showToast('Could not open share portal.', 'error');
        }
      } else {
        copyToClipboard();
      }
    } else {
      let url = '';
      if (platform === 'twitter') {
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(textMsg)}`;
      } else if (platform === 'whatsapp') {
        url = `https://api.whatsapp.com/send?text=${encodeURIComponent(textMsg)}`;
      } else if (platform === 'telegram') {
        url = `https://t.me/share/url?url=${encodeURIComponent(rawValue)}&text=${encodeURIComponent('GenQR Code')}`;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // HD Download File Helpers
  const downloadQR = async (format: 'png' | 'jpg' | 'svg') => {
    try {
      showToast(`Preparing HD ${format.toUpperCase()} download...`, 'info');

      if (format === 'svg') {
        const svgString = await generateQRSVG({
          text: rawValue,
          fgColor: designState.fgColor,
          bgColor: designState.bgColor,
          size: designState.size,
          margin: designState.margin,
          errorCorrectionLevel: designState.errorCorrectionLevel,
          logoUrl: designState.logoUrl,
          logoScale: designState.logoScale,
        });

        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const element = document.createElement('a');
        element.href = URL.createObjectURL(blob);
        element.download = `genqr_${Date.now()}.svg`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        showToast('SVG downloaded successfully!', 'success');
      } else {
        // High fidelity canvas drawing
        const canvas = await generateQRCanvas({
          text: rawValue,
          fgColor: designState.fgColor,
          bgColor: designState.bgColor,
          size: designState.size * 2, // Doubled resolution for crisp HD print renders!
          margin: designState.margin,
          errorCorrectionLevel: designState.errorCorrectionLevel,
          logoUrl: designState.logoUrl,
          logoScale: designState.logoScale,
        });

        const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
        const fileExt = format === 'jpg' ? 'jpg' : 'png';

        const trigger = document.createElement('a');
        trigger.href = canvas.toDataURL(mimeType, 1.0);
        trigger.download = `genqr_${Date.now()}.${fileExt}`;
        document.body.appendChild(trigger);
        trigger.click();
        document.body.removeChild(trigger);
        showToast(`HD ${format.toUpperCase()} downloaded successfully!`, 'success');
      }
    } catch (err) {
      showToast('Failed to export image format.', 'error');
    }
  };

  // Form value setters
  const setFormValue = (key: string, val: any) => {
    setFormState((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const updateEmailConfig = (key: string, val: string) => {
    setFormState((prev) => ({
      ...prev,
      emailConfig: { ...prev.emailConfig, [key]: val },
    }));
  };

  const updateWifiConfig = (key: string, val: any) => {
    setFormState((prev) => ({
      ...prev,
      wifiConfig: { ...prev.wifiConfig, [key]: val },
    }));
  };

  const updateSmsConfig = (key: string, val: string) => {
    setFormState((prev) => ({
      ...prev,
      smsConfig: { ...prev.smsConfig, [key]: val },
    }));
  };

  const updateSocialConfig = (key: string, val: string) => {
    setFormState((prev) => ({
      ...prev,
      socialConfig: { ...prev.socialConfig, [key]: val },
    }));
  };

  return (
    <div id="genqr-app-root" className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-purple-500/30 selection:text-white">
      {/* Dynamic Particle Canvas Network */}
      <ParticleBackground />

      {/* Floating Blobs of light */}
      <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/10 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Sticky Blurred Navbar */}
      <nav id="app-nav" className="sticky top-0 w-full bg-[#0F172A]/70 backdrop-blur-xl border-b border-slate-800/60 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 via-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <QrCode className="w-5.5 h-5.5 text-white animate-pulse" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 text-transparent bg-clip-text">
              GenQR<span className="text-cyan-400 font-medium">’By D</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#app-root" className="text-sm font-sans font-medium text-slate-300 hover:text-white transition-colors">Home</a>
            <a href="#generator-panel" className="text-sm font-sans font-medium text-slate-300 hover:text-white transition-colors">Generate</a>
            <a href="#features" className="text-sm font-sans font-medium text-slate-300 hover:text-white transition-colors">Features</a>
            {history.length > 0 && (
              <a href="#scanning-history" className="text-sm font-sans font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1.5">
                <History className="w-4 h-4 text-purple-400" /> Scanning Logs
              </a>
            )}
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#generator-panel"
              className="px-4 py-2 bg-gradient-to-r from-[#6C63FF] to-[#4F46E5] hover:from-[#7F5AF0] hover:to-[#4F46E5] text-xs font-semibold font-display tracking-wide rounded-lg shadow-lg shadow-purple-500/15 text-white hover:scale-103 active:scale-97 cursor-pointer transition-all duration-200"
            >
              Generate Now
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Header Section */}
      <header className="relative pt-24 pb-16 px-4 md:px-8 max-w-7xl mx-auto text-center z-10 flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-sans tracking-wide text-cyan-400 font-semibold uppercase">Ultimate Dev Suite</span>
        </div>

        <h1 className="font-display text-4.5xl md:text-6xl font-bold tracking-tight text-white max-w-4xl leading-[1.12] mb-6">
          Create Beautiful QR Codes <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-500 font-extrabold pb-2">
            Instantly for <TypingAnimation phrases={phraseRotation} />
          </span>
        </h1>

        <p className="max-w-2xl text-slate-400 font-sans font-light text-base md:text-lg leading-relaxed mb-9">
          “Generate Smart QR Codes Instantly.” Embed custom vectors, colors, matching canvas padding, branding logs, and download print-ready resolutions effortlessly.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="#generator-panel"
            className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-sm font-semibold tracking-wide font-display rounded-xl text-white shadow-lg shadow-purple-500/20 hover:scale-102 active:scale-98 transition-all cursor-pointer"
          >
            <QrCode className="w-4 h-4" /> Generate QR Code
          </a>
          <a
            href="#features"
            className="px-6 py-3.5 bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800/80 hover:border-slate-700/80 backdrop-blur-xl text-sm font-semibold tracking-wide font-display rounded-xl text-slate-300 hover:text-white transition-all hover:scale-102 active:scale-98 cursor-pointer"
          >
            Explore Features
          </a>
        </div>

        {/* Floating animated mock indicators for visual depth */}
        <div className="relative mt-16 w-full max-w-md h-12 flex justify-around pointer-events-none">
          <div className="absolute left-[5%] top-0 p-3 bg-slate-900/40 border border-slate-800/60 rounded-xl backdrop-blur-md animate-float-slow text-[#22D3EE]/75 flex items-center gap-2">
            <Link2 className="w-4 h-4" /> <span className="font-mono text-[10px]">WEB PROTOCOL</span>
          </div>
          <div className="absolute right-[5%] top-[-20px] p-3 bg-slate-900/40 border border-slate-800/60 rounded-xl backdrop-blur-md animate-float-reverse text-purple-400/75 flex items-center gap-2">
            <Wifi className="w-4 h-4" /> <span className="font-mono text-[10px]">WIFI CREDS</span>
          </div>
        </div>
      </header>

      {/* Main Generator App Section */}
      <main id="generator-panel" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left panel: Mode select, Tabs and Field Inputs */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="rounded-2xl border border-slate-800/70 bg-slate-900/30 p-6 backdrop-blur-xl shadow-2xl relative">
              
              <div className="absolute top-5 right-6 flex items-center gap-1 text-[10px] font-mono text-cyan-400/80 bg-cyan-900/20 px-2 py-0.5 rounded border border-cyan-800/40">
                <Sliders className="w-3 h-3" /> DESIGN DECK
              </div>

              <h2 className="font-display text-xl font-bold text-white mb-6 flex items-center gap-2">
                <QrCode className="w-5.5 h-5.5 text-purple-400" />
                Select QR Parameter
              </h2>

              {/* Form Category Slider Tabs */}
              <div className="flex flex-wrap gap-2 mb-8 bg-slate-950/50 p-1.5 rounded-xl border border-slate-800/60">
                {(['url', 'text', 'wifi', 'email', 'phone', 'sms', 'social'] as QRType[]).map((tab) => {
                  const isActive = activeTab === tab;
                  const config = {
                    url: { label: 'Link', icon: <Link2 className="w-4 h-4" /> },
                    text: { label: 'Text', icon: <FileText className="w-4 h-4" /> },
                    wifi: { label: 'WiFi', icon: <Wifi className="w-4 h-4" /> },
                    email: { label: 'Email', icon: <Mail className="w-4 h-4" /> },
                    phone: { label: 'Phone', icon: <Phone className="w-4 h-4" /> },
                    sms: { label: 'SMS', icon: <MessageSquare className="w-4 h-4" /> },
                    social: { label: 'Social', icon: <Globe className="w-4 h-4" /> },
                  }[tab];

                  return (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab);
                        showToast(`Switched payload to ${config.label} node.`, 'info');
                      }}
                      className={`flex-1 min-w-[75px] max-w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-medium font-sans cursor-pointer transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                      }`}
                    >
                      {config.icon}
                      <span>{config.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Form Input fields depending on Active Tab */}
              <form onSubmit={handleGenerate} className="space-y-6">
                
                {/* 1. Website URL Field */}
                {activeTab === 'url' && (
                  <div className="space-y-2 animate-slide-in">
                    <label className="block text-xs font-sans tracking-wide uppercase text-slate-400 font-semibold">
                      Website link URL
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Link2 className="w-4 h-4" />
                      </div>
                      <input
                        type="url"
                        placeholder="https://example.com"
                        value={formState.urlValue}
                        onChange={(e) => setFormValue('urlValue', e.target.value)}
                        className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-purple-500 pl-10 pr-4 py-3 rounded-xl font-sans text-sm outline-none text-slate-100 transition-colors"
                        required
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 font-light font-sans">
                      Will format as standard redirectable destination protocol link.
                    </p>
                  </div>
                )}

                {/* 2. Plain Text Category */}
                {activeTab === 'text' && (
                  <div className="space-y-2 animate-slide-in">
                    <label className="block text-xs font-sans tracking-wide uppercase text-slate-400 font-semibold">
                      Plain Text Message
                    </label>
                    <div className="relative">
                      <textarea
                        rows={4}
                        placeholder="Type any textual notes, alphanumeric codes, secure data, keys or parameters..."
                        value={formState.textValue}
                        onChange={(e) => setFormValue('textValue', e.target.value)}
                        className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-purple-500 p-4 rounded-xl font-sans text-sm outline-none text-slate-100 transition-colors resize-none"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* 4. WiFi Credentials Format */}
                {activeTab === 'wifi' && (
                  <div className="space-y-4 animate-slide-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-sans tracking-wide uppercase text-slate-400 font-semibold">
                          Network Name SSID
                        </label>
                        <input
                          type="text"
                          placeholder="My Home Router"
                          value={formState.wifiConfig.ssid}
                          onChange={(e) => updateWifiConfig('ssid', e.target.value)}
                          className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-purple-500 px-4 py-3 rounded-xl font-sans text-sm outline-none text-slate-100 transition-colors"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-sans tracking-wide uppercase text-slate-400 font-semibold">
                          Secret Password
                        </label>
                        <input
                          type="password"
                          placeholder="••••••••••••••"
                          value={formState.wifiConfig.password || ''}
                          onChange={(e) => updateWifiConfig('password', e.target.value)}
                          className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-purple-500 px-4 py-3 rounded-xl font-sans text-sm outline-none text-slate-100 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center pt-2">
                      <div className="space-y-2">
                        <label className="block text-xs font-sans tracking-wide uppercase text-slate-400 font-semibold">
                          Encryption Type
                        </label>
                        <select
                          value={formState.wifiConfig.encryption}
                          onChange={(e) => updateWifiConfig('encryption', e.target.value)}
                          className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-purple-500 px-4 py-3 rounded-xl font-sans text-sm outline-none text-slate-300 transition-colors cursor-pointer"
                        >
                          <option value="WPA">WPA/WPA2/WPA3 (Standard)</option>
                          <option value="WEP">WEP (Legacy)</option>
                          <option value="nopass">Unsecured / No Password</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2 pt-5">
                        <input
                          type="checkbox"
                          id="wifi-hidden"
                          checked={formState.wifiConfig.hidden}
                          onChange={(e) => updateWifiConfig('hidden', e.target.checked)}
                          className="w-4 h-4 rounded text-purple-600 bg-slate-950 border-slate-800 focus:ring-purple-500/40 cursor-pointer"
                        />
                        <label htmlFor="wifi-hidden" className="text-xs font-sans text-slate-300 font-medium cursor-pointer select-none">
                          Hidden SSID Network?
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Email Protocols */}
                {activeTab === 'email' && (
                  <div className="space-y-4 animate-slide-in">
                    <div className="space-y-2">
                      <label className="block text-xs font-sans tracking-wide uppercase text-slate-400 font-semibold">
                        Recipient Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="developer@gmail.com"
                        value={formState.emailConfig.address}
                        onChange={(e) => updateEmailConfig('address', e.target.value)}
                        className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-purple-500 px-4 py-3 rounded-xl font-sans text-sm outline-none text-slate-100 transition-colors"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-sans tracking-wide uppercase text-slate-400 font-semibold">
                          Subject Line
                        </label>
                        <input
                          type="text"
                          placeholder="Project Collaboration"
                          value={formState.emailConfig.subject || ''}
                          onChange={(e) => updateEmailConfig('subject', e.target.value)}
                          className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-purple-500 px-4 py-3 rounded-xl font-sans text-sm outline-none text-slate-100 transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-sans tracking-wide uppercase text-slate-400 font-semibold">
                          Body Prompt Draft
                        </label>
                        <input
                          type="text"
                          placeholder="Hey D, checked out GenQR app..."
                          value={formState.emailConfig.body || ''}
                          onChange={(e) => updateEmailConfig('body', e.target.value)}
                          className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-purple-500 px-4 py-3 rounded-xl font-sans text-sm outline-none text-slate-100 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. Phone Number Node */}
                {activeTab === 'phone' && (
                  <div className="space-y-2 animate-slide-in">
                    <label className="block text-xs font-sans tracking-wide uppercase text-slate-400 font-semibold">
                      Telephone / Dial Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        placeholder="+91 9999999999"
                        value={formState.phoneValue}
                        onChange={(e) => setFormValue('phoneValue', e.target.value)}
                        className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-purple-500 pl-10 pr-4 py-3 rounded-xl font-sans text-sm outline-none text-slate-100 transition-colors"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* 7. SMS Trigger Schema */}
                {activeTab === 'sms' && (
                  <div className="space-y-4 animate-slide-in">
                    <div className="space-y-2">
                      <label className="block text-xs font-sans tracking-wide uppercase text-slate-400 font-semibold">
                        Dial Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="+1 (555) 019-2834"
                        value={formState.smsConfig.phone}
                        onChange={(e) => updateSmsConfig('phone', e.target.value)}
                        className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-purple-500 px-4 py-3 rounded-xl font-sans text-sm outline-none text-slate-100 transition-colors"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-sans tracking-wide uppercase text-slate-400 font-semibold">
                        Auto Text Message Content
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Draft standard message..."
                        value={formState.smsConfig.message || ''}
                        onChange={(e) => updateSmsConfig('message', e.target.value)}
                        className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-purple-500 px-4 py-3 rounded-xl font-sans text-sm outline-none text-slate-100 transition-colors resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* 8. Social Platform link aggregator */}
                {activeTab === 'social' && (
                  <div className="space-y-4 animate-slide-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-sans tracking-wide uppercase text-slate-400 font-semibold">
                          Platform Link Type
                        </label>
                        <select
                          value={formState.socialConfig.platform}
                          onChange={(e) => updateSocialConfig('platform', e.target.value)}
                          className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-purple-500 px-4 py-3 rounded-xl font-sans text-sm outline-none text-slate-300 transition-colors cursor-pointer"
                        >
                          <option value="twitter">X / Twitter</option>
                          <option value="instagram">Instagram</option>
                          <option value="linkedin">LinkedIn</option>
                          <option value="youtube">YouTube</option>
                          <option value="custom">Custom Site Profile URL</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-sans tracking-wide uppercase text-slate-400 font-semibold">
                          {formState.socialConfig.platform === 'custom' ? 'Full Profile Link Address' : 'Username / Handle ID'}
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                            {formState.socialConfig.platform === 'twitter' && <Twitter className="w-4 h-4 text-sky-400" />}
                            {formState.socialConfig.platform === 'instagram' && <Instagram className="w-4 h-4 text-pink-400" />}
                            {formState.socialConfig.platform === 'linkedin' && <Linkedin className="w-4 h-4 text-blue-400" />}
                            {formState.socialConfig.platform === 'youtube' && <Youtube className="w-4 h-4 text-red-500" />}
                            {formState.socialConfig.platform === 'custom' && <Globe className="w-4 h-4 text-cyan-400" />}
                          </div>
                          <input
                            type="text"
                            placeholder={formState.socialConfig.platform === 'custom' ? 'https://myblogsite.com' : 'dhairya_p'}
                            value={formState.socialConfig.username}
                            onChange={(e) => updateSocialConfig('username', e.target.value)}
                            className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-purple-500 pl-10 pr-4 py-3 rounded-xl font-sans text-sm outline-none text-slate-100 transition-colors"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Action Triggers */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-800/80">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-5 py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-500 hover:via-indigo-500 hover:to-indigo-600 text-sm font-semibold tracking-wide font-display rounded-xl text-white shadow-lg shadow-purple-500/20 disabled:opacity-50 hover:scale-[1.01] active:scale-99 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Blending Nodes...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Smart QR
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-5 py-3.5 bg-slate-950/60 hover:bg-slate-800/40 border border-slate-800 hover:border-slate-700 text-sm font-semibold font-display text-slate-400 hover:text-slate-200 rounded-xl hover:scale-[1.01] active:scale-99 transition-all cursor-pointer"
                  >
                    Clear Form
                  </button>
                </div>
              </form>
            </div>

            {/* Design & Advanced Customization panel */}
            <div className="rounded-2xl border border-slate-800/70 bg-slate-900/30 p-6 backdrop-blur-xl shadow-2xl space-y-6">
              
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                  <Palette className="w-5.5 h-5.5 text-cyan-400" />
                  QR Styling & Colorway
                </h3>
              </div>

              {/* Color Preset Palette Selection */}
              <div>
                <label className="block text-xs font-sans tracking-wide uppercase text-slate-400 font-semibold mb-3">
                  Theme Preset Profiles
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {COLOR_PRESETS.map((preset, idx) => {
                    const isSelected = designState.fgColor === preset.fg && designState.bgColor === preset.bg;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => applyPreset(preset.fg, preset.bg)}
                        className={`p-2.5 rounded-xl border text-left font-sans transition-all cursor-pointer hover:border-slate-600 ${
                          isSelected ? 'border-purple-500 bg-purple-500/10' : 'border-slate-800 bg-slate-950/40'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <div
                            className="w-4 h-4 rounded-full border border-slate-700/60 flex-shrink-0"
                            style={{ backgroundColor: preset.fg }}
                          />
                          <div
                            className="w-4 h-4 rounded-full border border-slate-700/60 flex-shrink-0"
                            style={{ backgroundColor: preset.bg }}
                          />
                          {isSelected && <Check className="w-3.5 h-3.5 text-purple-400 ml-auto" />}
                        </div>
                        <p className="text-[10px] font-semibold text-slate-100 truncate">{preset.name}</p>
                        <p className="text-[9px] text-slate-500 font-light truncate">{preset.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Precise Color Pickers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-sans text-slate-400 font-semibold">Foreground Color</label>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{designState.fgColor.toUpperCase()}</p>
                  </div>
                  <input
                    type="color"
                    value={designState.fgColor}
                    onChange={(e) => setDesignState((prev) => ({ ...prev, fgColor: e.target.value }))}
                    className="w-10 h-10 rounded-lg bg-transparent border border-slate-700/60 cursor-pointer overflow-hidden"
                  />
                </div>

                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-sans text-slate-400 font-semibold">Background Color</label>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{designState.bgColor.toUpperCase()}</p>
                  </div>
                  <input
                    type="color"
                    value={designState.bgColor}
                    onChange={(e) => setDesignState((prev) => ({ ...prev, bgColor: e.target.value }))}
                    className="w-10 h-10 rounded-lg bg-transparent border border-slate-700/60 cursor-pointer overflow-hidden"
                  />
                </div>
              </div>

              {/* Central Branding Logo controls */}
              <div className="border-t border-slate-800/85 pt-5 space-y-4">
                <div>
                  <h4 className="font-display text-sm font-bold text-white flex items-center gap-1.5 mb-1 text-slate-200">
                    <ImageIcon className="w-4 h-4 text-purple-400" /> Insert Branding Logo
                  </h4>
                  <p className="text-[11px] text-slate-500 font-light font-sans leading-relaxed">
                    Embed custom symbols or selectable brand vectors in the core intersection. Enforces High Level Error Correction (H) to keep scans rock solid.
                  </p>
                </div>

                {/* Upload or Preset row */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDesignState((prev) => ({ ...prev, logoUrl: null }));
                      showToast('Central logo removed.', 'info');
                    }}
                    className={`px-3 py-2 rounded-lg border font-sans text-xs font-medium cursor-pointer transition-colors ${
                      designState.logoUrl === null ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    No Logo
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 bg-slate-950/50 hover:bg-slate-800/30 border border-slate-800 hover:border-slate-700 text-slate-300 font-sans text-xs font-medium rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-cyan-400" /> Upload Logo
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />

                  {LOGO_PRESETS.map((p) => {
                    const isSelected = designState.logoUrl === p.dataUrl;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setDesignState((prev) => ({
                            ...prev,
                            logoUrl: p.dataUrl,
                            errorCorrectionLevel: 'H'
                          }));
                          showToast(`Applied preset ${p.name} logo to core.`, 'info');
                        }}
                        className={`px-3 py-2 rounded-lg border font-sans text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
                          isSelected ? 'border-purple-500 bg-purple-500/20 text-white' : 'border-slate-800 hover:border-slate-700 text-slate-400 font-light'
                        }`}
                      >
                        <span dangerouslySetInnerHTML={{ __html: p.dataUrl.replace('data:image/svg+xml;utf8,', '').replace(/%23/g, '#') }} className="w-3.5 h-3.5 flex items-center justify-center" />
                        {p.name}
                      </button>
                    );
                  })}
                </div>

                {designState.logoUrl && (
                  <div className="space-y-1.5 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/60 animate-slide-in">
                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="text-slate-400">Centered Logo Relative Scale</span>
                      <span className="font-mono text-cyan-400 font-semibold">{(designState.logoScale * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.10"
                      max="0.26"
                      step="0.02"
                      value={designState.logoScale}
                      onChange={(e) => setDesignState((prev) => ({ ...prev, logoScale: parseFloat(e.target.value) }))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-ew-resize accent-purple-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Sliders for Size, Margin and QR Redundancy parameters */}
              <div className="border-t border-slate-800/85 pt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-sans">
                    <span className="text-slate-400">Download Base Dimension</span>
                    <span className="font-mono text-cyan-400 font-semibold">{designState.size}px</span>
                  </div>
                  <input
                    type="range"
                    min="150"
                    max="450"
                    step="25"
                    value={designState.size}
                    onChange={(e) => setDesignState((prev) => ({ ...prev, size: parseInt(e.target.value) }))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-ew-resize accent-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-sans">
                    <span className="text-slate-400">Quiet Margin Padding</span>
                    <span className="font-mono text-cyan-400 font-semibold">{designState.margin} modules</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={designState.margin}
                    onChange={(e) => setDesignState((prev) => ({ ...prev, margin: parseInt(e.target.value) }))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-ew-resize accent-cyan-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: Centered Live Glass Frame Preview */}
          <div className="lg:col-span-5 flex flex-col gap-6 sticky lg:top-24">
            <div className="rounded-2xl border border-slate-800/70 bg-gradient-to-b from-slate-900/50 to-slate-900/20 p-6 backdrop-blur-xl shadow-2xl relative flex flex-col items-center">
              
              <div className="absolute -inset-px bg-gradient-to-b from-[#6C63FF]/8 to-[#22D3EE]/8 rounded-2xl pointer-events-none" />

              <div className="w-full flex items-center justify-between mb-6 relative z-10">
                <span className="text-xs font-mono tracking-wider text-slate-500 uppercase">Live Output Console</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    isLoading ? 'bg-yellow-900/15 border-yellow-800/40 text-yellow-400' : 'bg-slate-950 border-slate-800 text-cyan-400'
                  }`}
                >
                  {isLoading ? 'RENDERING' : 'ACTIVE'}
                </span>
              </div>

              {/* The QR Preview Box wrapped in an animated glowing border */}
              <div className="relative group p-1 rounded-2xl bg-slate-950 overflow-hidden mb-6 glow-purple transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 via-indigo-500 to-cyan-400 opacity-50 blur p-8 group-hover:scale-105 transition-transform duration-500" />
                
                <div className="relative z-10 w-[280px] h-[280px] rounded-xl bg-white flex items-center justify-center p-3">
                  {isLoading ? (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 animate-fade-in text-white rounded-xl">
                      <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                      <div className="text-xs font-mono font-bold tracking-wide animate-pulse">COMPILING VECTOR NODE...</div>
                    </div>
                  ) : null}

                  {qrUrl ? (
                    <img
                      src={qrUrl}
                      alt="Generated Smart QR"
                      referrerPolicy="no-referrer"
                      className="w-full h-full max-w-full max-h-full object-contain rounded transition-all duration-300 shadow"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-4">
                      <QrCode className="w-16 h-16 text-slate-300 mb-2 animate-bounce" />
                      <p className="font-sans text-xs text-slate-400">Waiting for trigger nodes...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions row: Copy text / Link parameters & Share options */}
              <div className="w-full flex flex-col gap-4 border-t border-slate-800/80 pt-5 relative z-10">
                
                <div className="flex items-center gap-2">
                  <div className="bg-slate-950/50 border border-slate-800/80 px-3 py-2.5 rounded-xl flex-1 flex items-center justify-between overflow-hidden">
                    <span className="font-mono text-[11px] text-slate-400 truncate max-w-[200px]" title={rawValue}>
                      {rawValue}
                    </span>
                    <button
                      onClick={copyToClipboard}
                      disabled={isCoping}
                      className="text-slate-400 hover:text-white cursor-pointer hover:bg-slate-800/40 p-1.5 rounded-lg transition-colors flex-shrink-0"
                    >
                      {isCoping ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleShare('twitter')}
                      className="p-2.5 bg-slate-950/50 hover:bg-slate-800/40 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl cursor-pointer transition-colors"
                      title="Share to Twitter / X"
                    >
                      <Twitter className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleShare('whatsapp')}
                      className="p-2.5 bg-slate-950/50 hover:bg-slate-800/40 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl cursor-pointer transition-colors"
                      title="Share to WhatsApp"
                    >
                      {/* Using standard icon fallback */}
                      <Share2 className="w-4 h-4 text-emerald-400" />
                    </button>
                  </div>
                </div>

                {/* Direct High Resolution One Click Download Features */}
                <div className="space-y-2">
                  <label className="block text-xs font-sans tracking-wide uppercase text-slate-400 font-semibold mb-1">
                    High Definition Download (HD)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => downloadQR('png')}
                      className="flex items-center justify-center gap-1.5 px-3 py-3 bg-gradient-to-r from-purple-600/20 to-purple-800/20 hover:from-purple-600/30 hover:to-purple-800/30 border border-purple-500/30 hover:border-purple-500/60 rounded-xl text-purple-300 hover:text-white font-sans text-xs font-semibold cursor-pointer transition-all hover:scale-103 active:scale-97"
                    >
                      <Download className="w-3.5 h-3.5" /> PNG
                    </button>
                    <button
                      onClick={() => downloadQR('jpg')}
                      className="flex items-center justify-center gap-1.5 px-3 py-3 bg-gradient-to-r from-indigo-500/20 to-indigo-700/20 hover:from-indigo-500/30 hover:to-indigo-700/30 border border-indigo-500/30 hover:border-indigo-500/60 rounded-xl text-indigo-300 hover:text-white font-sans text-xs font-semibold cursor-pointer transition-all hover:scale-103 active:scale-97"
                    >
                      <Download className="w-3.5 h-3.5" /> JPG
                    </button>
                    <button
                      onClick={() => downloadQR('svg')}
                      className="flex items-center justify-center gap-1.5 px-3 py-3 bg-gradient-to-r from-cyan-500/20 to-cyan-700/20 hover:from-cyan-500/30 hover:to-cyan-700/30 border border-cyan-500/30 hover:border-cyan-500/60 rounded-xl text-cyan-300 hover:text-white font-sans text-xs font-semibold cursor-pointer transition-all hover:scale-103 active:scale-97"
                    >
                      <Download className="w-3.5 h-3.5" /> SVG
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 text-[10.5px] text-slate-400 font-light leading-relaxed">
                  <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>Downloads are generated raw inside your browser viewport. Supports up to 2x high density resolution scaling.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Local storage History log block */}
      {history.length > 0 && (
        <section id="scanning-history" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-slate-800/65 z-10 w-full animate-slide-in">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2">
                <History className="w-5.5 h-5.5 text-purple-400" />
                Scanning Logs & History
              </h2>
              <p className="text-xs font-sans text-slate-400 font-light mt-1">
                Your last 20 generated codes are safely cached locally. Click any item to load its details back.
              </p>
            </div>
            <button
              onClick={clearAllHistory}
              className="px-3.5 py-2 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/20 text-xs font-sans font-medium text-slate-400 hover:text-rose-400 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Purge Logs
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => loadHistoryItem(item)}
                className="group p-4 bg-slate-900/30 border border-slate-800/70 hover:border-purple-500/40 hover:bg-slate-900/50 rounded-xl cursor-pointer transition-all duration-300 relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-medium tracking-wide uppercase px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-purple-400">
                      {item.type}
                    </span>
                    <button
                      onClick={(e) => removeHistoryItem(item.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                      title="Delete profile"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4 className="font-sans text-sm font-semibold text-slate-100 truncate mb-1">
                    {item.title}
                  </h4>
                  <p className="font-mono text-[10px] text-slate-500 truncate mb-4" title={item.rawValue}>
                    {item.rawValue}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[9px] text-slate-500 border-t border-slate-800/60 pt-2 font-mono">
                  <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.design.fgColor }} />
                    {item.design.fgColor}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Features Showcase Component */}
      <FeaturesSection />

      {/* Site Footer */}
      <footer id="app-footer" className="relative mt-auto border-t border-slate-850/60 bg-slate-950/70 py-10 px-4 md:px-8 text-center z-10 w-full">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-400 to-purple-500 flex items-center justify-center">
              <QrCode className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-base tracking-tight text-white">
              GenQR’By D
            </span>
          </div>

          <p className="font-sans text-xs text-slate-500 font-light">
            Made with ❤️ by <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 font-semibold">D</span> | © 2026 GenQR’By D. All Rights Reserved.
          </p>

          <div className="flex items-center gap-5">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-white transition-colors">
              <Twitter className="w-4.5 h-4.5" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-white transition-colors">
              <Instagram className="w-4.5 h-4.5" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-white transition-colors">
              <Linkedin className="w-4.5 h-4.5" />
            </a>
          </div>
        </div>
      </footer>

      {/* Custom Sliding toasts system */}
      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
