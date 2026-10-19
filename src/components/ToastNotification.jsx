import React from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useDMS } from '../context/DMSContext';

export const ToastNotification = () => {
  const { toasts, removeToast } = useDMS();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 w-full max-w-md pointer-events-none px-4">
      {toasts.map((toast) => {
        let icon = <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />;
        let border = 'border-emerald-200 bg-white/95 text-emerald-950 shadow-emerald-500/10';

        if (toast.type === 'error') {
          icon = <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />;
          border = 'border-rose-200 bg-white/95 text-rose-950 shadow-rose-500/10';
        } else if (toast.type === 'warning') {
          icon = <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
          border = 'border-amber-200 bg-white/95 text-amber-950 shadow-amber-500/10';
        } else if (toast.type === 'info') {
          icon = <Info className="w-4 h-4 text-[#00A3E0] shrink-0" />;
          border = 'border-sky-200 bg-white/95 text-sky-950 shadow-sky-500/10';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 py-2.5 px-4 rounded-2xl border shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-4 duration-200 w-auto min-w-[280px] max-w-full ${border}`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {icon}
              <p className="text-xs sm:text-sm font-semibold leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer ml-1"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
