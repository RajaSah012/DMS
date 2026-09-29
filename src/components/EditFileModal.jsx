import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Edit3, 
  UploadCloud, 
  CheckCircle, 
  FileText, 
  Layers, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { useDMS } from '../context/DMSContext';
import { CustomSelect } from './CustomSelect';
import { useScrollLock } from '../hooks/useScrollLock';

export const EditFileModal = ({ file, isOpen, onClose }) => {
  useScrollLock(isOpen);
  const { updateFile, projects, userProjects, currentUser } = useDMS();
  const fileInputRef = useRef(null);

  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [version, setVersion] = useState('1.1');
  
  const [replacementFile, setReplacementFile] = useState(null);
  const [newFileSize, setNewFileSize] = useState('');
  const [newFileSizeBytes, setNewFileSizeBytes] = useState(0);
  const [newFileType, setNewFileType] = useState('');
  const [newFileUrl, setNewFileUrl] = useState(null);

  useEffect(() => {
    if (file) {
      setName(file.name);
      setProjectId(file.projectId || file.folder || '');
      
      const currentVer = parseFloat(file.version) || 1.0;
      setVersion((currentVer + 0.1).toFixed(1));

      setReplacementFile(null);
      setNewFileSize('');
      setNewFileUrl(null);
    }
  }, [file]);

  if (!isOpen || !file) return null;

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const detectTypeFromExtension = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) return 'pdf';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'excel';
    if (['doc', 'docx', 'txt', 'rtf', 'md'].includes(ext)) return 'doc';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'zip';
    if (['fig', 'sketch', 'xd'].includes(ext)) return 'figma';
    if (['png', 'jpg', 'jpeg', 'svg', 'webp'].includes(ext)) return 'image';
    return 'doc';
  };

  const handleRealFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      setReplacementFile(selected);
      setNewFileSize(formatBytes(selected.size));
      setNewFileSizeBytes(selected.size);
      setNewFileType(detectTypeFromExtension(selected.name));
      const url = URL.createObjectURL(selected);
      setNewFileUrl(url);

      if (window.confirm(`Would you also like to update the document title to "${selected.name}"?`)) {
        setName(selected.name);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updatePayload = {
      name: name.trim(),
      projectId: projectId || file.projectId || file.folder,
      folder: projectId || file.projectId || file.folder,
      version: version,
    };

    if (replacementFile && newFileUrl) {
      updatePayload.fileUrl = newFileUrl;
      updatePayload.size = newFileSize;
      updatePayload.sizeBytes = newFileSizeBytes;
      updatePayload.type = newFileType;
    }

    const success = await updateFile(file.id, updatePayload);
    if (success) {
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
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 my-auto max-h-[90vh] flex flex-col overscroll-contain"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2 text-sm font-bold text-[#0A2540]">
            <Edit3 className="w-4 h-4 text-[#00A3E0]" />
            <span>Edit Document Details</span>
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
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Document Title / File Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00A3E0]/30 focus:border-[#00A3E0]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Target Project
            </label>
            <CustomSelect
              value={projectId}
              onChange={(val) => setProjectId(val)}
              options={(currentUser.role === 'Admin' ? projects : userProjects).map((p) => ({ value: p.id, label: p.name }))}
            />
          </div>

          <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#0A2540] flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-[#00A3E0]" />
                Replace File Attachment
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Optional</span>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleRealFileSelect}
              className="hidden"
            />

            {replacementFile ? (
              <div className="p-3 bg-white rounded-xl border border-emerald-300 flex items-center justify-between">
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                    NEW
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {replacementFile.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Size: {newFileSize} • Replaces current attachment
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className="text-xs text-[#00A3E0] hover:underline font-semibold shrink-0 ml-2"
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="w-full py-3 px-4 border border-dashed border-sky-300 hover:border-sky-500 rounded-xl bg-white hover:bg-sky-50/50 transition-all text-xs font-semibold text-[#0284C7] flex items-center justify-center gap-2 cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Click to pick replacement file from computer</span>
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-400">
            Note: All edits and file replacements will be recorded in the security audit trail under your account ({currentUser.name}).
          </p>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#00A3E0] hover:bg-[#0284C7] rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save & Apply Changes
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
