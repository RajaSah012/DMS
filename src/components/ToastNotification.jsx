import React from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useDMS } from '../context/DMSContext';

export const ToastNotification = () => {
  const { toasts, removeToast } = useDMS();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        let icon = <CheckCircle className="w-4 h-4 text-emerald-500" />;
        let border = 'border-emerald-200 bg-white text-emerald-950 shadow-emerald-500/10';

        if (toast.type === 'error') {
          icon = <AlertCircle className="w-4 h-4 text-rose-500" />;
          border = 'border-rose-200 bg-white text-rose-950 shadow-rose-500/10';
        } else if (toast.type === 'warning') {
          icon = <AlertTriangle className="w-4 h-4 text-amber-500" />;
          border = 'border-amber-200 bg-white text-amber-950 shadow-amber-500/10';
        } else if (toast.type === 'info') {
          icon = <Info className="w-4 h-4 text-[#00A3E0]" />;
          border = 'border-sky-200 bg-white text-sky-950 shadow-sky-500/10';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl border shadow-lg transition-all animate-in slide-in-from-bottom-3 duration-200 ${border}`}
          >
            <div className="flex items-center gap-2.5">
              {icon}
              <p className="text-xs font-semibold leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
