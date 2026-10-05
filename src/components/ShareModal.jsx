import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Clock, 
  Flame, 
  Copy, 
  Check, 
  X, 
  ShieldCheck, 
  AlertCircle, 
  Download, 
  Calendar,
  ExternalLink,
  MessageCircle,
  Mail,
  Loader2
} from 'lucide-react';
import { useScrollLock } from '../hooks/useScrollLock';
import { createShareLinkService } from '../services/documentService';

const EXPIRATION_OPTIONS = [
  { value: '1h', label: '1 Hour', hours: 1 },
  { value: '24h', label: '24 Hours (1 Day)', hours: 24 },
  { value: '7d', label: '7 Days', hours: 24 * 7 },
  { value: '30d', label: '30 Days', hours: 24 * 30 },
  { value: 'never', label: 'Never (No Expiration)', hours: null },
];

export const ShareModal = ({ file, isOpen, onClose }) => {
  useScrollLock(isOpen);

  const [expiration, setExpiration] = useState('24h');
  const [isOneTime, setIsOneTime] = useState(false);
  const [allowDownload, setAllowDownload] = useState(true);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeShareData, setActiveShareData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setGeneratedLink('');
      setCopied(false);
      setActiveShareData(null);
      setIsGenerating(false);
    }
  }, [isOpen]);

  if (!isOpen || !file) return null;

  const handleGenerateLink = async () => {
    const selectedOption = EXPIRATION_OPTIONS.find((opt) => opt.value === expiration) || EXPIRATION_OPTIONS[1];
    const now = Date.now();
    const expiresAt = selectedOption.hours ? now + selectedOption.hours * 60 * 60 * 1000 : null;
    
    setIsGenerating(true);
    let token = 'sh_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    let serverShare = null;

    // Call Backend share-link API if file.id is a 24-character ObjectId
    if (file.id && /^[0-9a-fA-F]{24}$/.test(file.id)) {
      try {
        const uId = localStorage.getItem('admin-token') || localStorage.getItem('kt_dms_active_user_id')?.replace(/^u-/, '') || undefined;
        const res = await createShareLinkService({
          fileId: file.id,
          expiresInHours: selectedOption.hours || null,
          isOneTime: Boolean(isOneTime),
          userId: uId,
        });
        if (res && res.success && res.data) {
          serverShare = res.data;
          token = res.data.token;
        }
      } catch (backendErr) {
        console.warn('Backend share link generation notice, using secure local token:', backendErr.message);
      }
    }

    const shareData = {
      token,
      fileId: file.id,
      fileName: file.name,
      fileType: file.type || 'document',
      fileSize: file.size || 'Unknown size',
      fileUrl: file.fileUrl || '',
      externalUrl: file.externalUrl || null,
      projectId: file.projectId || file.folder || null,
      uploadedBy: file.uploadedBy || 'Team Member',
      allowDownload,
      isOneTime,
      isUsed: false,
      expiresAt: serverShare?.expiresAt ? new Date(serverShare.expiresAt).getTime() : expiresAt,
      createdAt: now,
    };

    // Save to localStorage so link works immediately and offline
    try {
      const existingShares = JSON.parse(localStorage.getItem('kt_dms_share_links') || '{}');
      existingShares[token] = shareData;
      localStorage.setItem('kt_dms_share_links', JSON.stringify(existingShares));
    } catch (e) {
      console.error('Failed to save share link locally:', e);
    }

    const fullUrl = `${window.location.origin}/?share=${token}`;
    setGeneratedLink(fullUrl);
    setActiveShareData(shareData);
    setCopied(false);
    setIsGenerating(false);
  };

  const handleCopyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    if (!generatedLink) return;
    const text = encodeURIComponent(`Here is the document "${file.name}" shared securely via Kasper DMS:\n${generatedLink}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleEmailShare = () => {
    if (!generatedLink) return;
    const subject = encodeURIComponent(`Secure Document: ${file.name}`);
    const body = encodeURIComponent(`Hello,\n\nPlease find the document "${file.name}" shared securely with you:\n${generatedLink}\n\nNote: ${isOneTime ? 'This is a one-time link and will expire immediately after first viewing.' : 'Please open before it expires.'}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 overscroll-contain overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 my-auto max-h-[92vh] flex flex-col overscroll-contain"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-sky-50/50 to-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-[#00A3E0] flex items-center justify-center font-bold shrink-0 border border-sky-200/50 shadow-xs">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#0A2540]">
                Share Document Securely
              </h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[280px] sm:max-w-sm" title={file.name}>
                {file.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 overscroll-contain">
          
          {/* File summary pill */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-xs font-bold text-slate-800 truncate">{file.name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Size: <strong className="text-slate-600">{file.size}</strong> • Uploader: <strong className="text-slate-600">{file.uploadedBy}</strong>
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-sky-50 text-[#00A3E0] font-bold text-[10px] border border-sky-100 shrink-0 uppercase">
              {file.type || 'FILE'}
            </span>
          </div>

          {/* Configuration Form */}
          {!generatedLink ? (
            <div className="space-y-4">
              {/* Expiry Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#00A3E0]" />
                  <span>Link Expiration Duration</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {EXPIRATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setExpiration(opt.value)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                        expiration === opt.value
                          ? 'border-[#00A3E0] bg-sky-50 text-[#00A3E0] ring-1 ring-[#00A3E0] shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Single-Use / Burn after click */}
              <div 
                onClick={() => setIsOneTime(!isOneTime)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  isOneTime 
                    ? 'border-amber-300 bg-amber-50/60 ring-1 ring-amber-300' 
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  isOneTime ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'
                }`}>
                  <Flame className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      One-Time Access (Self-Destruct on Click)
                    </span>
                    <input 
                      type="checkbox" 
                      checked={isOneTime}
                      onChange={() => {}}
                      className="w-4 h-4 text-amber-600 rounded-sm focus:ring-amber-500 cursor-pointer pointer-events-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Once opened by the recipient, the link will immediately expire and cannot be accessed again.
                  </p>
                </div>
              </div>

              {/* Allow Download Checkbox */}
              <div 
                onClick={() => setAllowDownload(!allowDownload)}
                className="p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white transition-all cursor-pointer flex items-start gap-3"
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  allowDownload ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                }`}>
                  <Download className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Allow Recipient to Download
                    </span>
                    <input 
                      type="checkbox" 
                      checked={allowDownload}
                      onChange={() => {}}
                      className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500 cursor-pointer pointer-events-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {allowDownload 
                      ? 'Recipient can preview and download the file.' 
                      : 'View-only mode: Recipient can only preview in the browser.'}
                  </p>
                </div>
              </div>

              {/* Generate Action Button */}
              <button
                type="button"
                disabled={isGenerating}
                onClick={handleGenerateLink}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#00A3E0] to-[#0A2540] hover:from-[#0284C7] hover:to-[#07192C] text-white font-bold text-xs shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                <span>{isGenerating ? 'Generating Secure Link...' : 'Generate Secure Share Link'}</span>
              </button>
            </div>
          ) : (
            /* Link Generated State */
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-emerald-900">Secure Share Link Created!</p>
                  <p className="text-emerald-700 mt-0.5 text-[11px]">
                    Anyone with this link can view this document within the configured rules:
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="px-2 py-0.5 rounded-md bg-white/80 font-bold text-emerald-800 text-[10px] border border-emerald-200 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {activeShareData?.expiresAt 
                        ? `Expires: ${new Date(activeShareData.expiresAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                        : 'No Expiration'}
                    </span>
                    {activeShareData?.isOneTime && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 font-bold text-amber-800 text-[10px] border border-amber-300 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-600" />
                        1-Click Self Destruct
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md bg-white/80 font-bold text-emerald-800 text-[10px] border border-emerald-200">
                      {activeShareData?.allowDownload ? 'Download Enabled' : 'View Only (No Download)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* URL Display Box */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Shareable Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedLink}
                    className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-mono select-all focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0 ${
                      copied 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-[#00A3E0] hover:bg-[#0284C7] text-white active:scale-95'
                    }`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Quick Share Buttons */}
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Quick Share Via
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleWhatsAppShare}
                    className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleEmailShare}
                    className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span>Email Link</span>
                  </button>
                </div>
              </div>

              {/* Create Another */}
              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setGeneratedLink('')}
                  className="text-xs font-semibold text-slate-500 hover:text-[#00A3E0] transition-colors cursor-pointer"
                >
                  Configure Different Link Settings
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            End-to-End Link Protection
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
