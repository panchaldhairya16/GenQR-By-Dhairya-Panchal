import React, { ReactNode } from 'react';
import { Sparkles, Download, Smartphone, Moon, ShieldCheck, Palette } from 'lucide-react';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  glowColor: string;
  key?: any;
}

function FeatureCard({ icon, title, description, glowColor }: FeatureCardProps) {
  return (
    <div className="relative group rounded-2xl border border-slate-800/80 bg-slate-900/30 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-slate-700/80 hover:bg-slate-900/50">
      {/* Outer Glow on hover */}
      <div className={`absolute -inset-px rounded-2xl opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-20 bg-gradient-to-r ${glowColor}`} />
      
      <div className="relative z-10">
        <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-slate-800/50 p-3 text-cyan-400 border border-slate-700/40 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <h3 className="mb-2 font-sans text-lg font-semibold text-white tracking-wide">
          {title}
        </h3>
        <p className="font-sans text-sm text-slate-400 leading-relaxed font-light">
          {description}
        </p>
      </div>
    </div>
  );
}

export default function FeaturesSection() {
  const features = [
    {
      icon: <Sparkles className="w-6 h-6 text-cyan-400" />,
      title: "Instant Generation",
      description: "Instantly encode text, URLs, contacts, and custom details as soon as you key them in.",
      glowColor: "from-cyan-500 via-sky-500 to-indigo-500",
    },
    {
      icon: <Download className="w-6 h-6 text-fuchsia-400" />,
      title: "Download in HD Quality",
      description: "Claim crystal clear QR vectors in high-fidelity PNG, JPG, or fully scalable SVG formats.",
      glowColor: "from-fuchsia-500 to-purple-500",
    },
    {
      icon: <Palette className="w-6 h-6 text-purple-400" />,
      title: "Advanced Customization",
      description: "Fine-tune foregrounds, backgrounds, scale ratios, and inject customized logos in the center.",
      glowColor: "from-purple-500 to-indigo-500",
    },
    {
      icon: <Smartphone className="w-6 h-6 text-emerald-400" />,
      title: "Mobile Friendly",
      description: "Designed from the ground up for superb visual symmetry across mobile and desktop displays.",
      glowColor: "from-emerald-500 to-teal-500",
    },
    {
      icon: <Moon className="w-6 h-6 text-yellow-400" />,
      title: "Dark Mode Ecosystem",
      description: "Relax your eyes with an immersive midnight slate design scheme and seamless visual harmony.",
      glowColor: "from-yellow-400 to-orange-500",
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-indigo-400" />,
      title: "Secure & Fast",
      description: "Processes variables 100% locally. Your typed URLs and sensitive text never touch any cloud servers.",
      glowColor: "from-indigo-500 to-violet-500",
    }
  ];

  return (
    <section id="features" className="relative py-20 px-4 md:px-8 max-w-7xl mx-auto z-10">
      <div className="mb-12 text-center">
        <h2 className="font-sans text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
          Engineered for <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Superior Scanning</span>
        </h2>
        <p className="mx-auto max-w-2xl text-slate-400 font-light font-sans text-base leading-relaxed">
          Unlock high-performance utilities to craft, customize, brand, and secure professional QR codes inside a beautiful UI ecosystem.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feat, idx) => (
          <FeatureCard
            key={idx}
            icon={feat.icon}
            title={feat.title}
            description={feat.description}
            glowColor={feat.glowColor}
          />
        ))}
      </div>
    </section>
  );
}
