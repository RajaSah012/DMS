import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RotateCcw, 
  Maximize2, 
  ExternalLink,
  Video,
  Music,
  FileCode,
  FileSpreadsheet,
  Globe
} from 'lucide-react';
import { useDMS } from '../context/DMSContext';
import { useScrollLock } from '../hooks/useScrollLock';

export const FilePreviewModal = ({ file, isOpen, onClose }) => {
  useScrollLock(isOpen);
  const { downloadFile, canDownloadFile, projects } = useDMS();

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!isOpen || !file) return null;

  const fileProj = projects.find((p) => p.id === (file.projectId || file.folder));
  const projectName = fileProj ? fileProj.name : (file.projectId || file.folder || 'General');
  const allowedToDownload = canDownloadFile ? canDownloadFile(file) : true;

  const fileName = (file.name || '').toLowerCase();
  const fileUrl = file.fileUrl || '';

  const isVideo = file.type === 'video' || fileName.match(/\.(mp4|webm|mov|ogg|m4v|avi|mkv)$/i);
  const isAudio = file.type === 'audio' || fileName.match(/\.(mp3|wav|ogg|aac|m4a|flac)$/i);
  const isImage = file.type === 'image' || fileName.match(/\.(png|jpg|jpeg|svg|webp|gif|bmp|ico)$/i);
  const isPdf = file.type === 'pdf' || fileName.endsWith('.pdf');
  const isOfficeDoc = fileName.match(/\.(docx?|xlsx?|pptx?|odt|ods|odp)$/i);
  const isTextOrCode = fileName.match(/\.(txt|csv|json|md|js|jsx|ts|tsx|html|css|py|xml|log)$/i);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleResetImage = () => {
    setZoom(1);
    setRotation(0);
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200 overscroll-contain overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 my-auto max-h-[94vh] flex flex-col overscroll-contain"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3 truncate">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00A3E0]/15 to-[#0A2540]/10 text-[#00A3E0] flex items-center justify-center font-bold text-xs uppercase shrink-0 border border-[#00A3E0]/20 shadow-xs">
              {isVideo ? <Video className="w-5 h-5 text-purple-600" /> :
               isAudio ? <Music className="w-5 h-5 text-indigo-600" /> :
               isPdf ? <span className="text-rose-600 font-extrabold text-[11px]">PDF</span> :
               isImage ? <span className="text-emerald-600 font-extrabold text-[11px]">IMG</span> :
               isOfficeDoc ? <FileSpreadsheet className="w-5 h-5 text-blue-600" /> :
               isTextOrCode ? <FileCode className="w-5 h-5 text-amber-600" /> :
               <FileText className="w-5 h-5 text-[#00A3E0]" />}
            </div>
            <div className="truncate">
              <h3 className="text-sm sm:text-base font-bold text-[#0A2540] truncate" title={file.name}>
                {file.name}
              </h3>
              <p className="text-[11px] text-slate-400">
                {file.size} • Uploaded by <strong className="text-slate-700">{file.uploadedBy}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            title="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media Preview Stage */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain bg-slate-900/[0.02]">
          {/* 1. Video Player */}
          {isVideo && fileUrl ? (
            <div className="rounded-2xl bg-slate-950 overflow-hidden shadow-lg flex items-center justify-center border border-slate-800">
              <video 
                src={fileUrl} 
                controls 
                autoPlay={false} 
                className="w-full max-h-[60vh] object-contain rounded-2xl"
              >
                Your browser does not support HTML5 video preview.
              </video>
            </div>
          ) : /* 2. Audio Player */
          isAudio && fileUrl ? (
            <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-indigo-50 to-slate-100 border border-indigo-100 flex flex-col items-center justify-center text-center shadow-xs">
              <div className="w-20 h-20 rounded-3xl bg-white shadow-md border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 animate-pulse">
                <Music className="w-10 h-10" />
              </div>
              <h4 className="text-sm font-bold text-[#0A2540] mb-2">{file.name}</h4>
              <audio src={fileUrl} controls className="w-full max-w-md mt-4 shadow-sm rounded-full" />
            </div>
          ) : /* 3. Image Lightbox with Zoom & Rotate */
          isImage && fileUrl ? (
            <div className="flex flex-col items-center">
              {/* Image Controls Toolbar */}
              <div className="flex items-center gap-1.5 p-1.5 mb-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRotate}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
                  title="Rotate 90° Clockwise"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleResetImage}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
                >
                  Reset
                </button>
                <span className="text-[10px] font-bold text-slate-400 px-2 border-l border-slate-200">
                  {Math.round(zoom * 100)}%
                </span>
              </div>

              {/* Viewport */}
              <div className="w-full h-[55vh] rounded-2xl bg-slate-900/5 border border-slate-200/80 overflow-hidden flex items-center justify-center p-3 relative">
                <img
                  src={fileUrl}
                  alt={file.name}
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  className="max-h-full max-w-full object-contain rounded-xl shadow-xs cursor-grab active:cursor-grabbing"
                />
              </div>
            </div>
          ) : /* 4. PDF Document Viewer */
          isPdf && fileUrl ? (
            <div className="w-full rounded-2xl bg-slate-100 overflow-hidden shadow-sm border border-slate-200">
              <iframe
                src={`${fileUrl}#toolbar=1&navpanes=0`}
                className="w-full h-[62vh] rounded-2xl border-none"
                title={file.name}
              />
            </div>
          ) : /* 5. Office Documents / Spreadsheets / Other */
          fileUrl ? (
            <div className="rounded-3xl bg-gradient-to-br from-slate-50 via-white to-sky-50/50 border border-slate-200 p-8 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-3xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-[#00A3E0] mb-4">
                {isOfficeDoc ? <FileSpreadsheet className="w-8 h-8 text-blue-600" /> : <FileText className="w-8 h-8" />}
              </div>
              <h4 className="text-base font-bold text-[#0A2540] mb-1">{file.name}</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
                This document is securely stored on the server. You can download it directly to view in your desktop editor or open its reference link below.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => downloadFile(file)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A2540] hover:bg-[#07192C] text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download to View ({file.size})</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600">{file.name}</p>
              <p className="text-[11px] text-slate-400 mt-1">Preview is not available for this file type.</p>
            </div>
          )}

          {/* Optional External Reference Link Banner */}
          {file.externalUrl && (
            <div className="mt-4 p-3.5 rounded-2xl bg-sky-50/80 border border-sky-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-7 h-7 rounded-xl bg-sky-100 text-[#00A3E0] flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <span className="text-[10px] font-bold text-sky-900 uppercase tracking-wider block">Attached External Reference</span>
                  <a 
                    href={file.externalUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs font-semibold text-[#00A3E0] hover:underline truncate block"
                  >
                    {file.externalUrl}
                  </a>
                </div>
              </div>
              <a
                href={file.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-sky-100 text-[#0284C7] text-xs font-semibold border border-sky-200 shadow-xs transition-colors shrink-0"
              >
                <span>Open Link</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">
                File Size
              </span>
              <span className="text-xs font-bold text-slate-800">
                {file.size}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">
                Workspace Project
              </span>
              <span className="text-xs font-bold text-slate-800 truncate block" title={projectName}>
                {projectName}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">
                Uploaded By
              </span>
              <span className="text-xs font-bold text-slate-800 truncate block">
                {file.uploadedBy}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">
                Date Added
              </span>
              <span className="text-xs font-bold text-slate-800">
                {new Date(file.uploadedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-2 shrink-0">
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Document ID: <code className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">{file.id || 'N/A'}</code>
          </span>
          <div className="flex items-center gap-2 ml-auto">
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
                  ? 'bg-gradient-to-r from-[#00A3E0] to-[#0284C7] hover:from-[#0284C7] hover:to-[#0A2540] cursor-pointer active:scale-95'
                  : 'bg-slate-300 cursor-not-allowed opacity-60'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
