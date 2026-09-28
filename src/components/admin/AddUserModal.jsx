import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserPlus, 
  Shield, 
  Check, 
  Mail, 
  FolderKanban, 
  Copy, 
  CheckCircle2, 
  ArrowRight 
} from 'lucide-react';
import { useDMS } from '../../context/DMSContext';
import { useScrollLock } from '../../hooks/useScrollLock';

export const AddUserModal = ({ isOpen, onClose }) => {
  useScrollLock(isOpen);
  const { inviteUser, projects, addToast } = useDMS();

  const [email, setEmail] = useState('');
  const [selectedProjectIds, setSelectedProjectIds] = useState(() => (projects.length > 0 ? [projects[0].id] : []));

  const [permissions, setPermissions] = useState({
    canView: true,
    canUpload: true,
    canEdit: true,
    canDelete: false,
    canDownload: true,
  });

  const [createdInvite, setCreatedInvite] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setCreatedInvite(null);
      setCopied(false);
      setSelectedProjectIds(projects.length > 0 ? [projects[0].id] : []);
      setPermissions({
        canView: true,
        canUpload: true,
        canEdit: true,
        canDelete: false,
        canDownload: true,
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const togglePermission = (key) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleProjectSelection = (projId) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projId) ? prev.filter((id) => id !== projId) : [...prev, projId]
    );
  };

  const handleClose = () => {
    setEmail('');
    setCreatedInvite(null);
    setCopied(false);
    onClose();
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || selectedProjectIds.length === 0) return;

    setIsSubmitting(true);
    try {
      const res = await inviteUser({
        email: email.trim(),
        projectIds: selectedProjectIds,
        permissions,
      });

      if (res.success) {
        setCreatedInvite(res);
      } else {
        setCreatedInvite(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!createdInvite?.inviteLink) return;
    navigator.clipboard.writeText(createdInvite.inviteLink).then(() => {
      setCopied(true);
      addToast('Invitation link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 3000);
    });
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
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-[#00A3E0] flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0A2540]">
                {createdInvite ? 'Invitation Link Ready' : 'Invite Team Member to Project'}
              </h3>
              <p className="text-xs text-slate-500">
                {createdInvite 
                  ? 'Share this registration link with the invited user'
                  : 'User will receive a link to set their name, password, and join the project'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {createdInvite ? (
          /* Success View with Generated Link */
          <div className="p-6 space-y-5 overflow-y-auto flex-1 overscroll-contain">
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-emerald-950">
                  Project Invitation Generated!
                </h4>
                <p className="text-xs text-emerald-800/80 mt-1 leading-relaxed">
                  An invitation has been created for <strong className="text-emerald-950">{createdInvite.user.email}</strong>. Share the link below to allow the user to create their account and access their workspace.
                </p>
              </div>
            </div>

            {/* Link Box */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Shareable Invitation Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={createdInvite.inviteLink}
                  className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-mono select-all focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#0A2540] hover:bg-[#07192C] text-white shadow-sm'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-[#0A2540] hover:bg-[#07192C] text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Invite Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">
            
            {/* User Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                User Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@kaspertech.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00A3E0]/30 focus:border-[#00A3E0] transition-all text-slate-800"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                The user will use this email address to accept the invitation and set their password.
              </p>
            </div>

            {/* Select Project Workspace */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Select Project Workspace <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  {selectedProjectIds.length} selected
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-2xl max-h-44 overflow-y-auto">
                {projects.map((proj) => {
                  const isSelected = selectedProjectIds.includes(proj.id);
                  return (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() => toggleProjectSelection(proj.id)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-left border text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-sky-50 border-[#00A3E0] text-[#0284C7] font-semibold ring-1 ring-[#00A3E0]/20'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FolderKanban className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{proj.name}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ml-2 border ${
                          isSelected
                            ? 'bg-[#00A3E0] border-[#00A3E0] text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#0A2540] flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#00A3E0]" />
                  Project Document Permissions
                </label>
                <span className="text-[10px] text-slate-400">View access included</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div 
                  onClick={() => togglePermission('canUpload')}
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                    permissions.canUpload 
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-semibold' 
                      : 'bg-white border-slate-200 text-slate-500'
                  }`}
                >
                  <span className="text-xs">Upload Documents</span>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                    permissions.canUpload ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-slate-100'
                  }`}>
                    {permissions.canUpload && <Check className="w-3 h-3" />}
                  </div>
                </div>

                <div 
                  onClick={() => togglePermission('canEdit')}
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                    permissions.canEdit 
                      ? 'bg-sky-50/70 border-sky-300 text-sky-900 font-semibold' 
                      : 'bg-white border-slate-200 text-slate-500'
                  }`}
                >
                  <span className="text-xs">Edit / Rename</span>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                    permissions.canEdit ? 'bg-[#00A3E0] text-white' : 'border border-slate-300 bg-slate-100'
                  }`}>
                    {permissions.canEdit && <Check className="w-3 h-3" />}
                  </div>
                </div>

                <div 
                  onClick={() => togglePermission('canDelete')}
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                    permissions.canDelete 
                      ? 'bg-rose-50/70 border-rose-300 text-rose-900 font-semibold' 
                      : 'bg-white border-slate-200 text-slate-500'
                  }`}
                >
                  <span className="text-xs">Delete Files</span>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                    permissions.canDelete ? 'bg-rose-600 text-white' : 'border border-slate-300 bg-slate-100'
                  }`}>
                    {permissions.canDelete && <Check className="w-3 h-3" />}
                  </div>
                </div>

                <div 
                  onClick={() => togglePermission('canDownload')}
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                    permissions.canDownload 
                      ? 'bg-indigo-50/70 border-indigo-300 text-indigo-900 font-semibold' 
                      : 'bg-white border-slate-200 text-slate-500'
                  }`}
                >
                  <span className="text-xs">Download Files</span>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                    permissions.canDownload ? 'bg-indigo-600 text-white' : 'border border-slate-300 bg-slate-100'
                  }`}>
                    {permissions.canDownload && <Check className="w-3 h-3" />}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
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
                disabled={!email.trim() || selectedProjectIds.length === 0}
                className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#00A3E0] to-[#0284C7] hover:from-[#0284C7] hover:to-[#0A2540] rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center gap-1.5"
              >
                <span>Generate Project Invitation Link</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
