import React, { useState } from 'react';
import { 
  FolderPlus, 
  Folder, 
  X, 
  Check, 
  Palette,
  FileText
} from 'lucide-react';
import { useDMS } from '../context/DMSContext';
import { useScrollLock } from '../hooks/useScrollLock';

const COLOR_THEMES = [
  {
    id: 'sky',
    name: 'Kasper Blue',
    gradient: 'from-sky-500 to-blue-600',
    dotBg: 'bg-sky-500',
    border: 'border-sky-500',
  },
  {
    id: 'indigo',
    name: 'Corporate Indigo',
    gradient: 'from-blue-600 to-indigo-700',
    dotBg: 'bg-indigo-600',
    border: 'border-indigo-600',
  },
  {
    id: 'teal',
    name: 'Emerald Green',
    gradient: 'from-teal-500 to-emerald-600',
    dotBg: 'bg-teal-500',
    border: 'border-teal-500',
  },
  {
    id: 'purple',
    name: 'Executive Purple',
    gradient: 'from-purple-600 to-violet-700',
    dotBg: 'bg-purple-600',
    border: 'border-purple-600',
  },
  {
    id: 'amber',
    name: 'Amber Gold',
    gradient: 'from-amber-500 to-orange-600',
    dotBg: 'bg-amber-500',
    border: 'border-amber-500',
  },
  {
    id: 'rose',
    name: 'Rose Ruby',
    gradient: 'from-rose-500 to-pink-600',
    dotBg: 'bg-rose-500',
    border: 'border-rose-500',
  },
];

export const CreateFolderModal = ({ isOpen, onClose, onCreated }) => {
  useScrollLock(isOpen);
  const { createFolder } = useDMS();

  const [folderName, setFolderName] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('sky');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentThemeObj = COLOR_THEMES.find((t) => t.id === selectedTheme) || COLOR_THEMES[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    setIsSubmitting(true);
    const created = createFolder({
      name: folderName.trim(),
      colorTheme: selectedTheme,
    });

    setIsSubmitting(false);
    if (created) {
      if (onCreated) {
        onCreated(created);
      }
      setFolderName('');
      setSelectedTheme('sky');
      onClose();
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overscroll-contain overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 my-auto max-h-[90vh] flex flex-col overscroll-contain"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-[#00A3E0] flex items-center justify-center">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#0A2540]">
                Create New Folder
              </h3>
              <p className="text-[11px] text-slate-500">
                Organize documents into department categories
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Live Preview
            </label>
            <div className="p-3.5 rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-50/40 to-white shadow-2xs">
              <div className="flex items-start justify-between mb-2">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${currentThemeObj.gradient} text-white shadow-md shadow-sky-500/15`}
                >
                  <Folder className="w-5 h-5 fill-white/20" />
                </div>
                <span className="text-[10px] font-semibold text-slate-400">
                  Just now
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-[#0A2540] truncate">
                {folderName.trim() || 'Untitled Folder'}
              </h4>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3 text-slate-400" />
                  <span>0 Docs</span>
                </span>
                <span className="bg-slate-100 px-1.5 py-0.5 rounded-full font-medium">
                  0 MB
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Folder Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Operations & Logistics, Client Audits..."
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00A3E0]/30 focus:border-[#00A3E0] font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-slate-400" />
              <span>Folder Color Theme</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {COLOR_THEMES.map((theme) => {
                const isSelected = selectedTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#00A3E0] bg-sky-50/70 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-gradient-to-br ${theme.gradient} shrink-0 flex items-center justify-center`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-700 truncate">
                      {theme.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !folderName.trim()}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md cursor-pointer ${
                folderName.trim() && !isSubmitting
                  ? 'bg-gradient-to-r from-[#00A3E0] to-[#0A2540] hover:shadow-sky-500/25 active:scale-95'
                  : 'bg-slate-300 shadow-none cursor-not-allowed'
              }`}
            >
              <FolderPlus className="w-4 h-4" />
              <span>Create Folder</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
