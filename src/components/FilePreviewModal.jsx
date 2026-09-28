import React from 'react';
import { 
  X, 
  Download, 
  Share2, 
  Lock, 
  FileText, 
  Calendar, 
  User, 
  HardDrive, 
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { useDMS } from '../context/DMSContext';
import { useScrollLock } from '../hooks/useScrollLock';

export const FilePreviewModal = ({ file, isOpen, onClose }) => {
  useScrollLock(isOpen);
  const { downloadFile, canDownloadFile, projects } = useDMS();

  if (!isOpen || !file) return null;

  const fileProj = projects.find((p) => p.id === (file.projectId || file.folder));
  const projectName = fileProj ? fileProj.name : (file.projectId || file.folder || 'General');
  const allowedToDownload = canDownloadFile ? canDownloadFile(file) : true;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overscroll-contain overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-auto max-h-[90vh] flex flex-col overscroll-contain"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3 truncate">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-[#00A3E0] flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {file.type}
            </div>
            <div className="truncate">
              <h3 className="text-sm font-bold text-[#0A2540] truncate">
                {file.name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1 overscroll-contain">
          {file.fileUrl && (file.type === 'image' || file.name.match(/\.(png|jpg|jpeg|svg|webp)$/i)) ? (
            <div className="h-64 rounded-2xl bg-slate-900/5 border border-slate-200 overflow-hidden flex items-center justify-center p-2">
              <img
                src={file.fileUrl}
                alt={file.name}
                className="max-h-full max-w-full object-contain rounded-xl shadow-xs"
              />
            </div>
          ) : (
            <div className="h-44 rounded-2xl bg-gradient-to-br from-slate-100 to-sky-50/50 border border-slate-200 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-sky-600 mb-2">
                <FileText className="w-7 h-7" />
              </div>
              <p className="text-xs font-bold text-[#0A2540]">
                {file.name}
              </p>
            
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                File Size
              </span>
              <span className="text-xs font-bold text-slate-800">
                {file.size}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                Project
              </span>
              <span className="text-xs font-bold text-slate-800 truncate block" title={projectName}>
                {projectName}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                Uploaded By
              </span>
              <span className="text-xs font-bold text-slate-800 truncate block">
                {file.uploadedBy}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                Date Added
              </span>
              <span className="text-xs font-bold text-slate-800">
                {new Date(file.uploadedAt).toLocaleDateString()}
              </span>
            </div>
          </div>

        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => downloadFile(file)}
            disabled={!allowedToDownload}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white shadow-sm transition-all ${
              allowedToDownload
                ? 'bg-[#00A3E0] hover:bg-[#0284C7] cursor-pointer active:scale-95'
                : 'bg-slate-300 cursor-not-allowed opacity-60'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download File</span>
          </button>
        </div>

      </div>
    </div>
  );
};
