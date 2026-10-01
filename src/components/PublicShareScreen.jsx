import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  ExternalLink, 
  Clock, 
  Flame, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowLeft, 
  Eye, 
  Video, 
  Music, 
  FileSpreadsheet, 
  FileCode,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Lock
} from 'lucide-react';
import { 
  getSharedFileService, 
  getFileDownloadUrl, 
  formatBytes, 
  detectTypeFromExtension 
} from '../services/documentService';

export const PublicShareScreen = () => {
  const [loading, setLoading] = useState(true);
  const [shareData, setShareData] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null); // 'not_found' | 'expired' | 'already_used'
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('share');

    if (!token) {
      setErrorStatus('not_found');
      setLoading(false);
      return;
    }

    const resolveShare = async () => {
      // 1. Check local metadata first if present
      let localShare = null;
      try {
        const allShares = JSON.parse(localStorage.getItem('kt_dms_share_links') || '{}');
        localShare = allShares[token] || null;
      } catch (e) {
        console.warn('LocalStorage share parse error:', e);
      }

      const now = Date.now();
      if (localShare) {
        if (localShare.expiresAt && now > localShare.expiresAt) {
          setErrorStatus('expired');
          setShareData(localShare);
          setLoading(false);
          return;
        }
        if (localShare.isOneTime && localShare.isUsed) {
          setErrorStatus('already_used');
          setShareData(localShare);
          setLoading(false);
          return;
        }
      }

      // 2. Attempt to fetch via Backend API
      try {
        const res = await getSharedFileService(token);
        if (res && res.success && res.data) {
          const bFile = res.data;
          const fullFileUrl = getFileDownloadUrl(bFile.fileUrl);

          // If localShare is marked one-time, mark it used
          if (localShare && localShare.isOneTime) {
            try {
              const allShares = JSON.parse(localStorage.getItem('kt_dms_share_links') || '{}');
              if (allShares[token]) {
                allShares[token].isUsed = true;
                localStorage.setItem('kt_dms_share_links', JSON.stringify(allShares));
              }
            } catch {}
          }

          setShareData({
            token,
            fileName: bFile.fileName || localShare?.fileName || 'Shared Document',
            fileType: detectTypeFromExtension(bFile.fileName || localShare?.fileName || ''),
            fileSize: formatBytes(bFile.size || 0),
            fileUrl: fullFileUrl || localShare?.fileUrl,
            externalUrl: bFile.externalUrl || localShare?.externalUrl || null,
            uploadedBy: localShare?.uploadedBy || 'Team Member',
            allowDownload: localShare?.allowDownload !== undefined ? localShare.allowDownload : true,
            isOneTime: localShare?.isOneTime || false,
            expiresAt: localShare?.expiresAt || null,
          });
          setLoading(false);
          return;
        }
      } catch (backendErr) {
        console.warn('Backend shared file fetch notice:', backendErr.response?.data?.message || backendErr.message);
        if (backendErr.response?.status === 410) {
          const msg = backendErr.response.data?.message || '';
          if (msg.toLowerCase().includes('one-time') || msg.toLowerCase().includes('already')) {
            setErrorStatus('already_used');
          } else {
            setErrorStatus('expired');
          }
          setLoading(false);
          return;
        }
      }

      // 3. Client-side LocalStorage Fallback
      if (localShare) {
        if (localShare.isOneTime) {
          try {
            const allShares = JSON.parse(localStorage.getItem('kt_dms_share_links') || '{}');
            if (allShares[token]) {
              allShares[token].isUsed = true;
              localStorage.setItem('kt_dms_share_links', JSON.stringify(allShares));
            }
          } catch {}
        }
        setShareData(localShare);
        setLoading(false);
        return;
      }

      setErrorStatus('not_found');
      setLoading(false);
    };

    resolveShare();
  }, []);

  const handleReturnHome = () => {
    window.location.href = window.location.origin;
  };

  const handleDownload = async () => {
    if (!shareData?.fileUrl) return;
    try {
      const response = await fetch(shareData.fileUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = shareData.fileName || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      const link = document.createElement('a');
      link.href = shareData.fileUrl;
      link.download = shareData.fileName || 'document';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#00A3E0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-sm font-semibold">Verifying secure link authorization...</p>
        </div>
      </div>
    );
  }

  // Error States
  if (errorStatus) {
    return (
      <div className="min-h-screen bg-[#0A2540] flex items-center justify-center p-4 antialiased">
        <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-200">
          <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
            errorStatus === 'already_used' 
              ? 'bg-amber-100 text-amber-600' 
              : errorStatus === 'expired' 
              ? 'bg-rose-100 text-rose-600' 
              : 'bg-slate-100 text-slate-500'
          }`}>
            {errorStatus === 'already_used' ? (
              <Flame className="w-8 h-8" />
            ) : errorStatus === 'expired' ? (
              <Clock className="w-8 h-8" />
            ) : (
              <AlertTriangle className="w-8 h-8" />
            )}
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-[#0A2540] mb-2">
            {errorStatus === 'already_used'
              ? 'One-Time Link Destroyed'
              : errorStatus === 'expired'
              ? 'Document Link Has Expired'
              : 'Invalid Document Link'}
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
            {errorStatus === 'already_used'
              ? 'This document was shared with a one-time single-access policy. It was already viewed and has been permanently invalidated for security.'
              : errorStatus === 'expired'
              ? `This secure link expired on ${shareData?.expiresAt ? new Date(shareData.expiresAt).toLocaleString() : 'the scheduled time'} and is no longer accessible.`
              : 'The requested document link is invalid, has been deleted, or may have been revoked by the sender.'}
          </p>

          <button
            onClick={handleReturnHome}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#00A3E0] to-[#0A2540] text-white font-bold text-xs shadow-md transition-all hover:opacity-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Kasper DMS Portal</span>
          </button>
        </div>
      </div>
    );
  }

  // Valid Active Share Screen
  const fileName = (shareData.fileName || '').toLowerCase();
  const isVideo = shareData.fileType === 'video' || fileName.match(/\.(mp4|webm|mov|ogg|m4v|avi|mkv)$/i);
  const isAudio = shareData.fileType === 'audio' || fileName.match(/\.(mp3|wav|ogg|aac|m4a|flac)$/i);
  const isImage = shareData.fileType === 'image' || fileName.match(/\.(png|jpg|jpeg|svg|webp|gif|bmp|ico)$/i);
  const isPdf = shareData.fileType === 'pdf' || fileName.endsWith('.pdf');
  const isOfficeDoc = fileName.match(/\.(docx?|xlsx?|pptx?|odt|ods|odp)$/i);
  const isTextOrCode = fileName.match(/\.(txt|csv|json|md|js|jsx|ts|tsx|html|css|py|xml|log)$/i);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col antialiased">
      {/* Top Header */}
      <header className="bg-slate-950/80 border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00A3E0] to-[#0A2540] flex items-center justify-center text-white font-bold text-sm shadow-md">
            K
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">
              Kasper DMS <span className="text-[#00A3E0] font-normal text-xs">• Secure Document Share</span>
            </h1>
            <p className="text-[10px] text-slate-400">
              End-to-End Encrypted File Delivery
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {shareData.allowDownload && (
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 rounded-xl bg-[#00A3E0] hover:bg-[#0284C7] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
          )}

          <button
            onClick={handleReturnHome}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all border border-slate-700 cursor-pointer"
          >
            Portal Login
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-6 flex flex-col gap-4">
        
        {/* Banner notices */}
        {shareData.isOneTime && (
          <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
            <Flame className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <strong className="font-bold text-amber-200">One-Time Link Activated:</strong> This link was set to self-destruct upon reading. It has now been invalidated and cannot be reloaded or opened again.
            </div>
          </div>
        )}

        {shareData.expiresAt && !shareData.isOneTime && (
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#00A3E0]" />
              <span>Link active until: <strong className="text-white">{new Date(shareData.expiresAt).toLocaleString()}</strong></span>
            </span>
            <span className="text-[10px] text-slate-400">Expires automatically</span>
          </div>
        )}

        {/* File Info Header Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-400/20 text-[#00A3E0] flex items-center justify-center shrink-0">
              {isVideo ? <Video className="w-6 h-6 text-purple-400" /> :
               isAudio ? <Music className="w-6 h-6 text-indigo-400" /> :
               isOfficeDoc ? <FileSpreadsheet className="w-6 h-6 text-blue-400" /> :
               isTextOrCode ? <FileCode className="w-6 h-6 text-amber-400" /> :
               <FileText className="w-6 h-6" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-white truncate" title={shareData.fileName}>
                {shareData.fileName}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-400">
                <span>{shareData.fileSize}</span>
                <span>•</span>
                <span>Shared by <strong className="text-slate-200">{shareData.uploadedBy}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {shareData.externalUrl && (
              <a
                href={shareData.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-sky-300 font-bold text-xs flex items-center gap-1.5 transition-all border border-slate-600"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Reference URL</span>
              </a>
            )}

            {shareData.allowDownload && (
              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-xl bg-[#00A3E0] hover:bg-[#0284C7] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download File</span>
              </button>
            )}
          </div>
        </div>

        {/* Media Preview Box */}
        <div className="flex-1 rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden min-h-[500px] flex flex-col justify-center items-center p-4 relative shadow-2xl">
          
          {/* Video Preview */}
          {isVideo && shareData.fileUrl ? (
            <video 
              src={shareData.fileUrl} 
              controls 
              className="w-full max-h-[75vh] object-contain rounded-2xl"
            />
          ) : isAudio && shareData.fileUrl ? (
            /* Audio Preview */
            <div className="w-full max-w-lg p-6 bg-slate-900 rounded-3xl border border-slate-800 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                <Music className="w-8 h-8" />
              </div>
              <p className="text-white font-bold text-sm truncate">{shareData.fileName}</p>
              <audio src={shareData.fileUrl} controls className="w-full" />
            </div>
          ) : isImage && shareData.fileUrl ? (
            /* Image Preview */
            <div className="relative w-full h-full flex flex-col items-center justify-center min-h-[450px]">
              <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-700 z-10">
                <button
                  onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
                  title="Rotate"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>

              <img 
                src={shareData.fileUrl} 
                alt={shareData.fileName}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease-out'
                }}
                className="max-w-full max-h-[70vh] object-contain rounded-xl"
              />
            </div>
          ) : isPdf && shareData.fileUrl ? (
            /* PDF Preview */
            <iframe 
              src={`${shareData.fileUrl}#toolbar=1`}
              title={shareData.fileName}
              className="w-full h-[75vh] rounded-2xl border border-slate-800"
            />
          ) : (
            /* Office / Generic File Card */
            <div className="text-center p-8 max-w-md">
              <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 text-[#00A3E0] flex items-center justify-center mx-auto mb-4 shadow-lg">
                <FileText className="w-10 h-10" />
              </div>
              <h3 className="text-white font-bold text-base mb-1 truncate">
                {shareData.fileName}
              </h3>
              <p className="text-slate-400 text-xs mb-6">
                This document ({shareData.fileSize}) is ready for secure offline viewing.
              </p>
              {shareData.allowDownload ? (
                <button
                  onClick={handleDownload}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#00A3E0] to-[#0A2540] text-white font-bold text-xs shadow-md transition-all hover:opacity-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Document ({shareData.fileSize})</span>
                </button>
              ) : (
                <p className="text-amber-400 text-xs font-semibold flex items-center justify-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  <span>Download restricted by document owner</span>
                </p>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
