import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Check, AlertCircle, User } from 'lucide-react';
import { useDMS } from '../../context/DMSContext';
import { useScrollLock } from '../../hooks/useScrollLock';

export const EditPermissionsModal = ({ user, isOpen, onClose, initialProjectId = 'all' }) => {
  useScrollLock(isOpen);
  const { updateUserPermissions, projects } = useDMS();

  const [targetProjectId, setTargetProjectId] = useState('all');
  const [permissions, setPermissions] = useState({
    canView: true,
    canUpload: false,
    canEdit: false,
    canDelete: false,
    canDownload: true,
  });

  const [userProjectIds, setUserProjectIds] = useState([]);

  useEffect(() => {
    if (!user) return;
    const assigned = projects
      .filter((p) => p.members?.some((m) => m.userId === user.id || (m.email && user.email && m.email.toLowerCase() === user.email.toLowerCase())))
      .map((p) => p.id);
    setUserProjectIds(assigned);

    const activeProj = initialProjectId && assigned.includes(initialProjectId) ? initialProjectId : 'all';
    setTargetProjectId(activeProj);

    if (activeProj !== 'all') {
      const proj = projects.find((p) => p.id === activeProj);
      const m = proj?.members?.find((mem) => mem.userId === user.id || (mem.email && user.email && mem.email.toLowerCase() === user.email.toLowerCase()));
      if (m?.permissions) {
        setPermissions({
          canView: m.permissions.canView !== false,
          canUpload: !!m.permissions.canUpload,
          canEdit: !!m.permissions.canEdit,
          canDelete: !!m.permissions.canDelete,
          canDownload: m.permissions.canDownload !== false,
        });
        return;
      }
    }

    if (user?.permissions) {
      setPermissions({
        canView: user.permissions.canView !== false,
        canUpload: !!user.permissions.canUpload,
        canEdit: !!user.permissions.canEdit,
        canDelete: !!user.permissions.canDelete,
        canDownload: user.permissions.canDownload !== false,
      });
    }
  }, [user, projects, initialProjectId, isOpen]);

  if (!isOpen || !user) return null;

  const togglePermission = (key) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleProjectMembership = (projId) => {
    setUserProjectIds((prev) =>
      prev.includes(projId) ? prev.filter((id) => id !== projId) : [...prev, projId]
    );
  };

  const handleTargetProjectChange = (projId) => {
    setTargetProjectId(projId);
    if (projId !== 'all') {
      const proj = projects.find((p) => p.id === projId);
      const m = proj?.members?.find((mem) => mem.userId === user.id || (mem.email && user.email && mem.email.toLowerCase() === user.email.toLowerCase()));
      if (m?.permissions) {
        setPermissions({
          canView: m.permissions.canView !== false,
          canUpload: !!m.permissions.canUpload,
          canEdit: !!m.permissions.canEdit,
          canDelete: !!m.permissions.canDelete,
          canDownload: m.permissions.canDownload !== false,
        });
        return;
      }
    }
    if (user?.permissions) {
      setPermissions({
        canView: user.permissions.canView !== false,
        canUpload: !!user.permissions.canUpload,
        canEdit: !!user.permissions.canEdit,
        canDelete: !!user.permissions.canDelete,
        canDownload: user.permissions.canDownload !== false,
      });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await updateUserPermissions(
      user.id,
      permissions,
      userProjectIds,
      targetProjectId === 'all' ? null : targetProjectId
    );
    onClose();
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
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-[#00A3E0] flex items-center justify-center shrink-0 border border-sky-200">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0A2540]">
                Configure Permissions
              </h3>
              <p className="text-xs text-slate-500">
                {user.name} • <span className="text-slate-400">{user.email}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">
          {user.role !== 'Admin' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Assigned Projects
                </label>
                <span className="text-[10px] text-slate-400">
                  Select which projects {user.name} can access
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl max-h-36 overflow-y-auto">
                {projects.map((proj) => {
                  const isAssigned = userProjectIds.includes(proj.id);
                  return (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() => toggleProjectMembership(proj.id)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left border text-xs transition-all cursor-pointer ${
                        isAssigned
                          ? 'bg-sky-50 border-[#00A3E0] text-[#0284C7] font-semibold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate">{proj.name}</span>
                      <div
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 ml-1.5 border ${
                          isAssigned
                            ? 'bg-[#00A3E0] border-[#00A3E0] text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isAssigned && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Project Target Selector for Granular Permissions */}
          {userProjectIds.length > 0 && (
            <div className="bg-sky-50/70 p-3 rounded-2xl border border-sky-100">
              <label className="block text-[11px] font-bold text-[#0A2540] mb-1">
                Configure Permissions For:
              </label>
              <select
                value={targetProjectId}
                onChange={(e) => handleTargetProjectChange(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold bg-white border border-sky-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#00A3E0]/30 cursor-pointer"
              >
                <option value="all">🌐 All Assigned Projects (Unified)</option>
                {projects
                  .filter((p) => userProjectIds.includes(p.id))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      📁 Project: {p.name}
                    </option>
                  ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                {targetProjectId === 'all'
                  ? 'Selected permissions will apply across all assigned projects.'
                  : `Selected permissions will apply specifically to "${projects.find((p) => p.id === targetProjectId)?.name}".`}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-600">
              Granular actions allowed {targetProjectId !== 'all' ? `in ${projects.find((p) => p.id === targetProjectId)?.name}` : 'for this user'}:
            </p>
            <span className="text-[10px] text-slate-400 font-medium">
              View access included
            </span>
          </div>

          <div className="space-y-2.5">
            <div
              onClick={() => togglePermission('canUpload')}
              className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                permissions.canUpload
                  ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <div>
                <p className="text-xs font-bold">Can Upload Documents</p>
                <p className="text-[11px] text-slate-400">Add new files to folders and cloud drive</p>
              </div>
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs transition-colors ${
                  permissions.canUpload ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-slate-100'
                }`}
              >
                {permissions.canUpload && <Check className="w-3.5 h-3.5" />}
              </div>
            </div>

            <div
              onClick={() => togglePermission('canEdit')}
              className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                permissions.canEdit
                  ? 'bg-sky-50/60 border-sky-300 text-sky-950'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <div>
                <p className="text-xs font-bold">Can Edit & Rename Documents</p>
                <p className="text-[11px] text-slate-400">Rename files, update tags and security metadata</p>
              </div>
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs transition-colors ${
                  permissions.canEdit ? 'bg-[#00A3E0] text-white' : 'border border-slate-300 bg-slate-100'
                }`}
              >
                {permissions.canEdit && <Check className="w-3.5 h-3.5" />}
              </div>
            </div>

            <div
              onClick={() => togglePermission('canDelete')}
              className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                permissions.canDelete
                  ? 'bg-rose-50/60 border-rose-300 text-rose-950'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <div>
                <p className="text-xs font-bold">Can Delete Documents</p>
                <p className="text-[11px] text-slate-400">Permanently delete files or send them to trash</p>
              </div>
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs transition-colors ${
                  permissions.canDelete ? 'bg-rose-600 text-white' : 'border border-slate-300 bg-slate-100'
                }`}
              >
                {permissions.canDelete && <Check className="w-3.5 h-3.5" />}
              </div>
            </div>

            <div
              onClick={() => togglePermission('canDownload')}
              className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                permissions.canDownload
                  ? 'bg-indigo-50/60 border-indigo-300 text-indigo-950'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <div>
                <p className="text-xs font-bold">Can Download Documents</p>
                <p className="text-[11px] text-slate-400">Save local offline copies of company assets</p>
              </div>
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs transition-colors ${
                  permissions.canDownload ? 'bg-indigo-600 text-white' : 'border border-slate-300 bg-slate-100'
                }`}
              >
                {permissions.canDownload && <Check className="w-3.5 h-3.5" />}
              </div>
            </div>

          </div>

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
              className="px-5 py-2 text-xs font-semibold text-white bg-[#0A2540] hover:bg-[#07192C] rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
            >
              Apply Permissions
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
