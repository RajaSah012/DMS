import React, { useState, useRef, useEffect } from 'react';
import { X, UploadCloud, File, CheckCircle, AlertCircle, FileText, Plus, Check } from 'lucide-react';
import { useDMS } from '../context/DMSContext';
import { CustomSelect } from './CustomSelect';
import { useScrollLock } from '../hooks/useScrollLock';

export const UploadModal = ({ isOpen, onClose, onOpenCreateProject }) => {
  useScrollLock(isOpen);
  const { uploadFile, projects, userProjects, canUploadToProject, createProject, currentUser } = useDMS();
  const fileInputRef = useRef(null);

  const [selectedFileObj, setSelectedFileObj] = useState(null);
  const [fileName, setFileName] = useState('');
  const [projectId, setProjectId] = useState(() => userProjects[0]?.id || '');
  const [fileType, setFileType] = useState('pdf');
  const [fileSize, setFileSize] = useState('');
  const [fileSizeBytes, setFileSizeBytes] = useState(0);
  const [fileUrl, setFileUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (userProjects.length > 0 && !userProjects.some((p) => p.id === projectId)) {
      setProjectId(userProjects[0].id);
    }
  }, [userProjects, projectId]);

  if (!isOpen) return null;

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const detectTypeFromExtension = (name) => {
    const ext = name.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) return 'pdf';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'excel';
    if (['doc', 'docx', 'txt', 'rtf', 'md'].includes(ext)) return 'doc';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'zip';
    if (['fig', 'sketch', 'xd'].includes(ext)) return 'figma';
    if (['png', 'jpg', 'jpeg', 'svg', 'webp'].includes(ext)) return 'image';
    return 'doc';
  };

  const processRealFile = (file) => {
    if (!file) return;
    setSelectedFileObj(file);
    setFileName(file.name);
    setFileSize(formatBytes(file.size));
    setFileSizeBytes(file.size);
    setFileType(detectTypeFromExtension(file.name));

    const url = URL.createObjectURL(file);
    setFileUrl(url);
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processRealFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processRealFile(e.dataTransfer.files[0]);
    }
  };

  const handleClose = () => {
    setSelectedFileObj(null);
    setFileName('');
    setFileSize('');
    setFileUrl(null);
    setProgress(0);
    setUploading(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fileName.trim()) return;

    setUploading(true);
    setProgress(35);

    try {
      const success = await uploadFile({
        name: fileName.trim(),
        type: fileType,
        projectId: projectId,
        folder: projectId,
        size: fileSize || '3.2 MB',
        sizeBytes: fileSizeBytes || 3355443,
        fileUrl: fileUrl,
        fileObj: selectedFileObj,
      });

      setProgress(100);
      if (success) {
        handleClose();
      }
    } catch (err) {
      console.error('Submit upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div 
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overscroll-contain overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 my-auto max-h-[90vh] flex flex-col overscroll-contain"
      >
        
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#0A2540]">
              Upload New Document
            </h3>
            <p className="text-xs text-slate-500">
              Uploading as: <span className="font-semibold text-[#00A3E0]">{currentUser.name}</span> ({currentUser.role})
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.zip,.png,.jpg,.jpeg,.txt,.fig"
          />

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-[#00A3E0] bg-sky-50/80 scale-[1.01]'
                : 'border-slate-200 hover:border-[#00A3E0] bg-slate-50/50 hover:bg-sky-50/20'
            }`}
          >
            {selectedFileObj ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-sky-100 text-[#00A3E0] flex items-center justify-center">
                  <File className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-800 truncate max-w-xs">
                    {selectedFileObj.name}
                  </p>
                  <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5" /> Ready for upload ({fileSize})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFileObj(null);
                    setFileName('');
                    setFileSize('');
                    setFileUrl(null);
                  }}
                  className="p-1 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-sky-100 text-[#00A3E0] flex items-center justify-center mx-auto">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">
                    Click to select file from computer, or drag & drop
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Supported: PDF, DOCX, XLSX, CSV, ZIP, Images, FIG (up to 50 MB)
                  </p>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Document Display Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Master_Agreement_Q4.pdf"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00A3E0]/30 focus:border-[#00A3E0]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Target Project
            </label>
            <CustomSelect
              value={projectId}
              onChange={(val) => setProjectId(val)}
              options={userProjects
                .filter((p) => canUploadToProject(p.id))
                .map((p) => ({ value: p.id, label: p.name }))}
            />
          </div>

          {uploading && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span>Encrypting & Storing File...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#00A3E0] to-[#0A2540] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!fileName.trim() || uploading}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#0A2540] hover:bg-[#07192C] rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {uploading ? 'Uploading...' : 'Confirm & Upload'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
