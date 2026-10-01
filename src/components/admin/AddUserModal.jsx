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
  ArrowRight,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Send,
  MessageCircle,
  RotateCw
} from 'lucide-react';
import { useDMS } from '../../context/DMSContext';
import { sendInviteEmailService } from '../../services/authService';
import { useScrollLock } from '../../hooks/useScrollLock';

const defaultPerms = {
  canView: true,
  canUpload: true,
  canEdit: true,
  canDelete: false,
  canDownload: true,
};

export const AddUserModal = ({ isOpen, onClose }) => {
  useScrollLock(isOpen);
  const { inviteUser, projects, addToast } = useDMS();

  const [email, setEmail] = useState('');
  const [selectedProjectIds, setSelectedProjectIds] = useState(() => (projects.length > 0 ? [projects[0].id] : []));
  const [activeConfigProjId, setActiveConfigProjId] = useState(() => (projects.length > 0 ? projects[0].id : null));

  // Project-wise permissions dictionary: { [projectId]: { canView, canUpload, canEdit, canDelete, canDownload } }
  const [projectPermissions, setProjectPermissions] = useState({});

  const [createdInvite, setCreatedInvite] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendDirectEmail, setSendDirectEmail] = useState(true);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setCreatedInvite(null);
      setCopied(false);
      setEmailSent(false);
      setIsSendingEmail(false);
      const initialIds = projects.length > 0 ? [projects[0].id] : [];
      setSelectedProjectIds(initialIds);
      setActiveConfigProjId(initialIds[0] || null);

      const initialPermsMap = {};
      projects.forEach((p) => {
        initialPermsMap[p.id] = { ...defaultPerms };
      });
      setProjectPermissions(initialPermsMap);
    }
  }, [isOpen, projects]);

  if (!isOpen) return null;

  const toggleProjectSelection = (projId) => {
    setSelectedProjectIds((prev) => {
      const isAlreadySelected = prev.includes(projId);
      const next = isAlreadySelected ? prev.filter((id) => id !== projId) : [...prev, projId];

      if (!isAlreadySelected && !projectPermissions[projId]) {
        setProjectPermissions((pMap) => ({ ...pMap, [projId]: { ...defaultPerms } }));
      }

      if (isAlreadySelected && activeConfigProjId === projId) {
        setActiveConfigProjId(next[0] || null);
      } else if (!isAlreadySelected && next.length === 1) {
        setActiveConfigProjId(projId);
      }

      return next;
    });
  };

  const togglePermissionForProject = (projId, key) => {
    setProjectPermissions((prev) => {
      const current = prev[projId] || { ...defaultPerms };
      return {
        ...prev,
        [projId]: {
          ...current,
          [key]: !current[key],
        },
      };
    });
  };

  const applyPermissionsToAllProjects = (sourceProjId) => {
    const sourcePerms = projectPermissions[sourceProjId] || defaultPerms;
    setProjectPermissions((prev) => {
      const updated = { ...prev };
      selectedProjectIds.forEach((pId) => {
        updated[pId] = { ...sourcePerms };
      });
      return updated;
    });
    addToast('Applied permissions across all selected projects.', 'info');
  };

  const handleClose = () => {
    setEmail('');
    setCreatedInvite(null);
    setCopied(false);
    onClose();
  };

  const handleSendEmailLink = async (targetEmail, inviteLink) => {
    const toEmail = targetEmail || email.trim();
    const linkToSend = inviteLink || createdInvite?.inviteLink;
    if (!toEmail || !linkToSend) return;

    setIsSendingEmail(true);
    try {
      const pNames = selectedProjectIds.map((id) => projects.find((p) => p.id === id)?.name).filter(Boolean).join(', ');
      await sendInviteEmailService({
        email: toEmail,
        inviteLink: linkToSend,
        projectName: pNames || 'Workspace Projects',
      });
      setEmailSent(true);
      addToast(`Joining invitation sent to ${toEmail}!`, 'success');
    } catch (err) {
      console.warn('Backend send invite notice:', err.message);
      // Fallback: Open mailto link so admin can still send it with one click
      const subject = encodeURIComponent('Invitation to join KasperTech DMS Workspace');
      const body = encodeURIComponent(`Hello,\n\nYou have been invited to collaborate on KasperTech Document Management System.\n\nPlease click the link below to accept the invitation and complete registration:\n${linkToSend}\n\nBest regards,\nWorkspace Administrator`);
      window.location.href = `mailto:${encodeURIComponent(toEmail)}?subject=${subject}&body=${body}`;
      addToast(`Opened mail client with invitation for ${toEmail}`, 'info');
      setEmailSent(true);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || selectedProjectIds.length === 0) return;

    setIsSubmitting(true);
    try {
      const targetEmail = email.trim();
      const res = await inviteUser({
        email: targetEmail,
        projectIds: selectedProjectIds,
        permissions: projectPermissions[selectedProjectIds[0]] || defaultPerms,
        projectPermissions,
      });

      if (res && res.success) {
        if (sendDirectEmail && res.inviteLink) {
          await handleSendEmailLink(targetEmail, res.inviteLink);
        } else {
          addToast(`Invitation generated for ${targetEmail}!`, 'success');
        }
        handleClose();
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

  const activeProject = projects.find((p) => p.id === activeConfigProjId);
  const currentActivePerms = (activeConfigProjId && projectPermissions[activeConfigProjId]) || defaultPerms;

  return (
    <div 
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overscroll-contain overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 my-auto max-h-[92vh] flex flex-col overscroll-contain"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-[#00A3E0] flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0A2540]">
                {createdInvite ? 'Invitation Link Ready' : 'Invite User with Project-Wise Access'}
              </h3>
              <p className="text-xs text-slate-500">
                {createdInvite 
                  ? 'Share this registration link with the invited user'
                  : 'Assign multiple projects and customize individual permissions per workspace'}
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
          /* Success View */
          <div className="p-6 space-y-5 overflow-y-auto flex-1 overscroll-contain">
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-emerald-950">
                  Project Invitation Generated!
                </h4>
                <p className="text-xs text-emerald-800/80 mt-1 leading-relaxed">
                  An invitation has been created for <strong className="text-emerald-950">{createdInvite.user.email}</strong> with customized access across <strong>{selectedProjectIds.length} project(s)</strong>.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Shareable Invitation Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={createdInvite.inviteLink}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-mono select-all focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#00A3E0] hover:bg-[#0284C7] text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Quick Share / Email Delivery Actions */}
            <div className="space-y-2 pt-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Direct Delivery Channels
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isSendingEmail}
                  onClick={() => handleSendEmailLink()}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs ${
                    emailSent
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-sky-200 bg-sky-50 text-[#00A3E0] hover:bg-sky-100'
                  }`}
                >
                  {isSendingEmail ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Sending Email...</span>
                    </>
                  ) : emailSent ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Email Sent! Click to Resend</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send to {createdInvite.user.email}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const text = encodeURIComponent(`Hello! You've been invited to join the workspace on KasperTech DMS:\n${createdInvite.inviteLink}`);
                    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                  }}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/60 text-emerald-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Share via WhatsApp</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
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
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00A3E0]/30 focus:border-[#00A3E0] transition-all text-slate-800"
                />
              </div>
            </div>

            {/* Send email toggle */}
            <div 
              onClick={() => setSendDirectEmail(!sendDirectEmail)}
              className="p-3 rounded-2xl border border-sky-100 bg-sky-50/50 flex items-center justify-between cursor-pointer hover:bg-sky-50/80 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-sky-100 text-[#00A3E0] flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Send joining link directly to email
                  </span>
                  <span className="text-[10px] text-slate-500">
                    User will receive the registration link directly in their inbox
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={sendDirectEmail}
                onChange={() => {}}
                className="w-4 h-4 text-[#00A3E0] rounded-sm focus:ring-[#00A3E0] pointer-events-none cursor-pointer"
              />
            </div>

            {/* Select Projects (Multiple) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Select Project Workspaces <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  {selectedProjectIds.length} of {projects.length} selected
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-2xl max-h-40 overflow-y-auto">
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

            {/* Project-Wise Permissions Selector */}
            {selectedProjectIds.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#0A2540] flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-[#00A3E0]" />
                    <span>Project-Wise Permissions</span>
                  </label>
                  {selectedProjectIds.length > 1 && activeConfigProjId && (
                    <button
                      type="button"
                      onClick={() => applyPermissionsToAllProjects(activeConfigProjId)}
                      className="text-[10px] font-bold text-[#00A3E0] hover:text-[#0284C7] hover:underline flex items-center gap-1 cursor-pointer"
                      title="Apply current project permissions to all selected projects"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Apply to all {selectedProjectIds.length} projects</span>
                    </button>
                  )}
                </div>

                {/* Project Selector Tabs */}
                {selectedProjectIds.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 no-scrollbar">
                    {selectedProjectIds.map((pId) => {
                      const p = projects.find((proj) => proj.id === pId);
                      const isActive = pId === activeConfigProjId;
                      return (
                        <button
                          key={pId}
                          type="button"
                          onClick={() => setActiveConfigProjId(pId)}
                          className={`px-3 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                            isActive
                              ? 'bg-[#0A2540] text-white border-[#0A2540] shadow-xs'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {p?.name || pId}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Permissions Checkbox Grid for Active Project */}
                {activeConfigProjId && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
                    <div className="text-[11px] text-slate-500 font-medium mb-1 flex items-center justify-between">
                      <span>Permissions for: <strong className="text-[#0A2540]">{activeProject?.name || 'Selected Project'}</strong></span>
                      <span className="text-[10px] text-slate-400">View access included</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div 
                        onClick={() => togglePermissionForProject(activeConfigProjId, 'canUpload')}
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                          currentActivePerms.canUpload 
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-semibold' 
                            : 'bg-white border-slate-200 text-slate-500'
                        }`}
                      >
                        <span className="text-xs">Upload Documents</span>
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                          currentActivePerms.canUpload ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-slate-100'
                        }`}>
                          {currentActivePerms.canUpload && <Check className="w-3 h-3" />}
                        </div>
                      </div>

                      <div 
                        onClick={() => togglePermissionForProject(activeConfigProjId, 'canEdit')}
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                          currentActivePerms.canEdit 
                            ? 'bg-sky-50/70 border-sky-300 text-sky-900 font-semibold' 
                            : 'bg-white border-slate-200 text-slate-500'
                        }`}
                      >
                        <span className="text-xs">Edit / Rename</span>
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                          currentActivePerms.canEdit ? 'bg-[#00A3E0] text-white' : 'border border-slate-300 bg-slate-100'
                        }`}>
                          {currentActivePerms.canEdit && <Check className="w-3 h-3" />}
                        </div>
                      </div>

                      <div 
                        onClick={() => togglePermissionForProject(activeConfigProjId, 'canDelete')}
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                          currentActivePerms.canDelete 
                            ? 'bg-rose-50/70 border-rose-300 text-rose-900 font-semibold' 
                            : 'bg-white border-slate-200 text-slate-500'
                        }`}
                      >
                        <span className="text-xs">Delete Files</span>
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                          currentActivePerms.canDelete ? 'bg-rose-600 text-white' : 'border border-slate-300 bg-slate-100'
                        }`}>
                          {currentActivePerms.canDelete && <Check className="w-3 h-3" />}
                        </div>
                      </div>

                      <div 
                        onClick={() => togglePermissionForProject(activeConfigProjId, 'canDownload')}
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                          currentActivePerms.canDownload 
                            ? 'bg-purple-50/70 border-purple-300 text-purple-900 font-semibold' 
                            : 'bg-white border-slate-200 text-slate-500'
                        }`}
                      >
                        <span className="text-xs">Download Documents</span>
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                          currentActivePerms.canDownload ? 'bg-purple-600 text-white' : 'border border-slate-300 bg-slate-100'
                        }`}>
                          {currentActivePerms.canDownload && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!email.trim() || selectedProjectIds.length === 0 || isSubmitting || isSendingEmail}
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-[#0A2540] hover:bg-[#07192C] rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                {isSubmitting || isSendingEmail ? (
                  <span className="flex items-center gap-1.5">
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{isSendingEmail ? 'Sending Email...' : 'Inviting User...'}</span>
                  </span>
                ) : (
                  <>
                    <span>Generate Invitation ({selectedProjectIds.length} Projects)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
