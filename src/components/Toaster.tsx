import React, { useEffect } from 'react';
import { X, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToasterProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export default function Toaster({ toasts, removeToast }: ToasterProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 min-w-[300px] max-w-md">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: () => void;
  key?: any;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const config = {
    success: {
      bg: 'bg-slate-900/90 border-[#10B981]/30 text-[#10B981]',
      icon: <CheckCircle className="w-5 h-5" />,
      glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]',
    },
    info: {
      bg: 'bg-slate-900/90 border-cyan-500/30 text-cyan-400',
      icon: <Info className="w-5 h-5" />,
      glow: 'shadow-[0_0_15px_rgba(34,211,238,0.15)]',
    },
    error: {
      bg: 'bg-slate-900/90 border-rose-500/30 text-rose-400',
      icon: <AlertTriangle className="w-5 h-5" />,
      glow: 'shadow-[0_0_15px_rgba(244,63,94,0.15)]',
    },
  }[toast.type];

  return (
    <div
      className={`flex items-center justify-between gap-3 p-4 rounded-xl border backdrop-blur-xl ${config.bg} ${config.glow} transition-all duration-300 animate-slide-in`}
    >
      <div className="flex items-center gap-3">
        <span className="flex-shrink-0">{config.icon}</span>
        <span className="font-sans text-sm font-medium text-slate-100">
          {toast.message}
        </span>
      </div>
      <button
        onClick={onDismiss}
        className="text-slate-400 hover:text-white hover:bg-slate-800/50 p-1 rounded-lg transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
