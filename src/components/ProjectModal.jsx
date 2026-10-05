import React, { useState, useEffect } from 'react';
import { 
  X, 
  FolderPlus, 
  Settings, 
  Users, 
  Check, 
  Trash2, 
  UserPlus, 
  Shield, 
  CheckCircle2, 
  Lock,
  Eye,
  Upload,
  Edit3,
  Download,
  FolderKanban,
  User
} from 'lucide-react';
import { useDMS } from '../context/DMSContext';
import { useScrollLock } from '../hooks/useScrollLock';

export const ProjectModal = ({ 
  isOpen, 
  onClose, 
  project = null
}) => {
  useScrollLock(isOpen);
  const { 
    users, 
    createProject, 
    updateProject, 
    deleteProject, 
    currentUser 
  } = useDMS();

  const isEditMode = !!project;

  const [name, setName] = useState('');
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      const projMembers = Array.isArray(project.members) ? project.members : [];
      if (projMembers.length > 0) {
        setMembers(JSON.parse(JSON.stringify(projMembers)));
      } else {
        const initial = users.map((u) => {
          const isAdmin = u.role === 'Admin';
          return {
            userId: u.id,
            name: u.name,
            email: u.email,
            permissions: {
              canView: true,
              canUpload: isAdmin || u.permissions?.canUpload !== false,
              canEdit: isAdmin || !!u.permissions?.canEdit,
              canDelete: isAdmin || !!u.permissions?.canDelete,
              canDownload: isAdmin || u.permissions?.canDownload !== false,
            },
          };
        });
        setMembers(initial);
      }
    } else {
      setName('');
      const initial = users.map((u) => {
        const isAdmin = u.role === 'Admin';
        return {
          userId: u.id,
          name: u.name,
          email: u.email,
          permissions: {
            canView: true,
            canUpload: isAdmin || u.permissions?.canUpload !== false,
            canEdit: isAdmin || !!u.permissions?.canEdit,
            canDelete: isAdmin || !!u.permissions?.canDelete,
            canDownload: isAdmin || u.permissions?.canDownload !== false,
          },
        };
      });
      setMembers(initial);
    }
  }, [project, isOpen, users]);

  if (!isOpen) return null;

  const toggleMemberInclusion = (userId) => {
    const targetUser = users.find((u) => u.id === userId);
    if (targetUser?.role === 'Admin' || userId === 'u-admin') return;
    const exists = members.some((m) => m.userId === userId || (m.email && targetUser?.email && m.email.toLowerCase() === targetUser.email.toLowerCase()));
    if (exists) {
      setMembers((prev) => prev.filter((m) => m.userId !== userId && (!m.email || !targetUser?.email || m.email.toLowerCase() !== targetUser.email.toLowerCase())));
    } else {
      setMembers((prev) => [
        ...prev,
        {
          userId,
          name: targetUser?.name || 'Member',
          email: targetUser?.email,
          permissions: { canView: true, canUpload: true, canEdit: false, canDelete: false, canDownload: true },
        },
      ]);
    }
  };

  const toggleMemberPermission = (userId, permKey) => {
    const targetUser = users.find((u) => u.id === userId);
    if (targetUser?.role === 'Admin' || userId === 'u-admin') return;
    setMembers((prev) =>
      prev.map((m) => {
        const matches = m.userId === userId || (m.email && targetUser?.email && m.email.toLowerCase() === targetUser.email.toLowerCase());
        if (!matches) return m;
        return {
          ...m,
          permissions: {
            ...m.permissions,
            [permKey]: !m.permissions[permKey],
          },
        };
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEditMode) {
      await updateProject(project.id, {
        name: name.trim(),
        members: members,
      });
    } else {
      await createProject({
        name: name.trim(),
        members: members,
      });
    }

    onClose();
  };

  const handleDeleteProject = () => {
    if (!project) return;
    if (window.confirm(`Are you sure you want to delete project "${project.name}"? This action cannot be undone.`)) {
      deleteProject(project.id);
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
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-auto max-h-[92vh] flex flex-col overscroll-contain"
      >
        
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#00A3E0] to-[#0A2540] text-white shadow-sm">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#0A2540]">
                {isEditMode ? 'Manage Project & Member Permissions' : 'Create New Project Workspace'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isEditMode ? `Configure access control for "${project.name}"` : 'Setup project governance, team members, and role privileges'}
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

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 overscroll-contain">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Metro Traffic Automation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00A3E0]/30 focus:border-[#00A3E0] font-medium"
            />
          </div>

          <hr className="border-slate-100" />

          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-xs font-bold text-[#0A2540] flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#00A3E0]" />
                  <span>Assign Members & Permissions</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Select which users can access this project and check allowed actions (Upload, Edit, Delete, Download).
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-slate-50/50">
              <div className="grid grid-cols-12 px-3.5 py-2 bg-slate-100/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider items-center">
                <div className="col-span-5">Member</div>
                <div className="col-span-7 grid grid-cols-4 text-center text-[10px]">
                  <span>Upload</span>
                  <span>Edit</span>
                  <span>Delete</span>
                  <span>Download</span>
                </div>
              </div>

              {users.map((u) => {
                const memberEntry = members.find(
                  (m) => m.userId === u.id || (m.email && u.email && m.email.toLowerCase() === u.email.toLowerCase())
                );
                const isMember = !!memberEntry;
                const isAdmin = u.role === 'Admin';
                const perms = memberEntry ? memberEntry.permissions : { canView: false, canUpload: false, canEdit: false, canDelete: false, canDownload: false };

                return (
                  <div 
                    key={u.id} 
                    className={`grid grid-cols-12 px-3.5 py-2.5 items-center transition-colors ${
                      isMember ? 'bg-white' : 'bg-slate-50/60 opacity-60'
                    }`}
                  >
                    <div className="col-span-5 flex items-center gap-2.5 min-w-0 pr-2">
                      <input
                        type="checkbox"
                        disabled={isAdmin}
                        checked={isMember || isAdmin}
                        onChange={() => toggleMemberInclusion(u.id)}
                        className="w-4 h-4 text-[#00A3E0] rounded border-slate-300 focus:ring-[#00A3E0] cursor-pointer shrink-0 disabled:cursor-not-allowed"
                        title={isAdmin ? 'Administrator always has project access' : 'Toggle member inclusion in this project'}
                      />
                      <div className="w-7 h-7 rounded-full bg-sky-100 text-[#00A3E0] flex items-center justify-center shrink-0 border border-slate-200">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate leading-tight flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {u.status === 'invited' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 shrink-0">
                              Invited
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {u.email || u.role}
                        </p>
                      </div>
                    </div>

                    <div className="col-span-7 grid grid-cols-4 text-center items-center">
                      <label className="flex items-center justify-center cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={isAdmin || !isMember}
                          checked={isAdmin || (isMember && !!perms.canUpload)}
                          onChange={() => toggleMemberPermission(u.id, 'canUpload')}
                          className="w-3.5 h-3.5 text-[#00A3E0] rounded border-slate-300 focus:ring-[#00A3E0] cursor-pointer disabled:cursor-not-allowed"
                          title="Can Upload files to this project"
                        />
                      </label>

                      <label className="flex items-center justify-center cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={isAdmin || !isMember}
                          checked={isAdmin || (isMember && !!perms.canEdit)}
                          onChange={() => toggleMemberPermission(u.id, 'canEdit')}
                          className="w-3.5 h-3.5 text-[#00A3E0] rounded border-slate-300 focus:ring-[#00A3E0] cursor-pointer disabled:cursor-not-allowed"
                          title="Can Edit documents in this project"
                        />
                      </label>

                      <label className="flex items-center justify-center cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={isAdmin || !isMember}
                          checked={isAdmin || (isMember && !!perms.canDelete)}
                          onChange={() => toggleMemberPermission(u.id, 'canDelete')}
                          className="w-3.5 h-3.5 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer disabled:cursor-not-allowed"
                          title="Can Delete documents in this project"
                        />
                      </label>

                      <label className="flex items-center justify-center cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={isAdmin || !isMember}
                          checked={isAdmin || (isMember && perms.canDownload !== false)}
                          onChange={() => toggleMemberPermission(u.id, 'canDownload')}
                          className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer disabled:cursor-not-allowed"
                          title="Can Download files in this project"
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <p className="text-[10px] text-slate-400 mt-2 italic">
              * Note: System Administrators inherently hold full master privileges across all projects.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between">
            {isEditMode ? (
              <button
                type="button"
                onClick={handleDeleteProject}
                className="flex items-center gap-1 px-3 py-2 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Project</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
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
                className="px-5 py-2 text-xs font-bold text-white bg-[#00A3E0] hover:bg-[#0284C7] disabled:bg-slate-300 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isEditMode ? 'Save Changes' : 'Create Project'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
