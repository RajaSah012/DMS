import React from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';
import { useDMS } from '../context/DMSContext';
import { useScrollLock } from '../hooks/useScrollLock';

export const DeleteConfirmModal = ({ file, isOpen, onClose }) => {
  useScrollLock(isOpen);
  const { deleteFile, currentUser } = useDMS();

  if (!isOpen || !file) return null;

  const handleConfirm = () => {
    deleteFile(file.id);
    onClose();
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overscroll-contain overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 my-auto overscroll-contain"
      >
        <div className="p-6 pb-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#0A2540]">
            Delete Document?
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Are you sure you want to permanently delete <strong className="text-slate-800">"{file.name}"</strong>?
          </p>
        </div>

        <div className="px-6 py-3">
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-800">
            <strong>Audit Record Notice:</strong> This action will be permanently recorded under <strong>{currentUser.name}</strong>.
          </div>
        </div>

        <div className="p-6 pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Yes, Delete File</span>
          </button>
        </div>

      </div>
    </div>
  );
};
