import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Key, 
  CheckCircle, 
  XCircle, 
  MoreVertical, 
  Lock, 
  Settings, 
  ArrowRight,
  UserCheck,
  ShieldAlert,
  User,
  Trash2
} from 'lucide-react';
import { useDMS } from '../../context/DMSContext';
import { AddUserModal } from './AddUserModal';
import { EditPermissionsModal } from './EditPermissionsModal';

export const UserManagement = () => {
  const { 
    users, 
    currentUser, 
    setCurrentUserId, 
    canManageUsers, 
    toggleUserStatus,
    deleteUser,
    projects,
    addToast,
    getInviteLink
  } = useDMS();

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [selectedUserForPerms, setSelectedUserForPerms] = useState(null);

  const displayedUsers = useMemo(() => {
    let deletedEmails = [];
    let deletedIds = [];
    try {
      deletedEmails = JSON.parse(localStorage.getItem('kt_dms_deleted_user_emails') || '[]').map((e) => String(e).toLowerCase());
      deletedIds = JSON.parse(localStorage.getItem('kt_dms_deleted_user_ids') || '[]').map((id) => String(id));
    } catch {}

    return users.filter((u) => {
      const email = (u.email || '').toLowerCase();
      const uid = String(u.id);
      if (email && deletedEmails.includes(email)) return false;
      if (uid && deletedIds.includes(uid)) return false;

      return (
        u.role !== 'Admin' ||
        u.email?.toLowerCase() === currentUser.email?.toLowerCase()
      );
    });
  }, [users, currentUser]);

  const { activeCount, adminCount } = useMemo(() => {
    let active = 0;
    let admins = 0;
    for (const u of displayedUsers) {
      if (u.status === 'active') active++;
      if (u.role === 'Admin') admins++;
    }
    return { activeCount: active, adminCount: admins };
  }, [displayedUsers]);

  if (!canManageUsers) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs max-w-lg mx-auto mt-12">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-[#0A2540] mb-2">
          Administrator Access Required
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          You are currently viewing as <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.role}). This section is restricted to Admin personnel to safeguard company credentials and roles.
        </p>
        <button
          onClick={() => {
            setCurrentUserId('u-admin');
            addToast('Switched to Administrator account.', 'info');
          }}
          className="px-5 py-2.5 bg-[#0A2540] hover:bg-[#07192C] text-white rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer"
        >
          Switch to Administrator Account
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[#0A2540] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#00A3E0]" />
            <span>Team Access & Permissions Control</span>
          </h2>
          <p className="text-xs text-slate-500">
            Provision team accounts, configure granular permissions (Upload, Edit, Delete, Download), and manage system security.
          </p>
        </div>

        <button
          onClick={() => setIsAddUserOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0A2540] hover:bg-[#07192C] text-white text-xs font-semibold shadow-md transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <UserPlus className="w-4 h-4 text-[#00A3E0]" />
          <span>Invite Team Member</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        
        <div className="p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center sm:items-center justify-between text-center sm:text-left gap-1">
          <div>
            <span className="text-[10px] sm:text-xs text-slate-400 font-medium block truncate">Registered</span>
            <p className="text-sm sm:text-2xl font-black text-[#0A2540] mt-0.5">{displayedUsers.length}</p>
          </div>
          <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-sky-50 text-[#00A3E0] flex items-center justify-center font-bold shrink-0">
            <Users className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center sm:items-center justify-between text-center sm:text-left gap-1">
          <div>
            <span className="text-[10px] sm:text-xs text-slate-400 font-medium block truncate">Active</span>
            <p className="text-sm sm:text-2xl font-black text-emerald-600 mt-0.5">{activeCount}</p>
          </div>
          <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <CheckCircle className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center sm:items-center justify-between text-center sm:text-left gap-1">
          <div>
            <span className="text-[10px] sm:text-xs text-slate-400 font-medium block truncate">Admins</span>
            <p className="text-sm sm:text-2xl font-black text-[#0284C7] mt-0.5">{adminCount}</p>
          </div>
          <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-50 text-[#0284C7] flex items-center justify-center font-bold shrink-0">
            <Shield className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </div>
        </div>

      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-sm font-bold text-[#0A2540]">
            All Organization Accounts ({displayedUsers.length})
          </h3>
          <span className="text-[11px] text-slate-400">
            Click 'Edit Permissions' to customize actions per member
          </span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/70">
                <th className="py-3.5 pl-6 pr-3">User & Email</th>
                <th className="py-3.5 px-3">Projects</th>
                <th className="py-3.5 px-3">Granular Permissions</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 pr-6 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {displayedUsers.map((user) => {
                const isAdmin = user.role === 'Admin';
                const perms = user.permissions || {};

                return (
                  <tr key={user.id} className="hover:bg-sky-50/30 transition-colors">
                    <td className="py-4 pl-6 pr-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-sky-50 text-[#00A3E0] flex items-center justify-center shrink-0 border border-sky-100">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-[#0A2540] flex items-center gap-1.5">
                            {user.name}
                            {user.status === 'invited' && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                                INVITED
                              </span>
                            )}
                            {isAdmin && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-sky-100 text-[#00A3E0]">
                                ROOT ADMIN
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-3">
                      {isAdmin ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          All Projects (Root Admin)
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {projects
                            .filter((p) => p.members?.some((m) => m.userId === user.id))
                            .map((p) => (
                              <span
                                key={p.id}
                                className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 text-[#0284C7] border border-sky-100"
                              >
                                {p.name}
                              </span>
                            ))}
                          {projects.filter((p) => p.members?.some((m) => m.userId === user.id)).length === 0 && (
                            <span className="text-[11px] text-slate-400 italic">No assigned projects</span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-3">
                      {isAdmin ? (
                        <span className="inline-flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                          Full System Access
                        </span>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              perms.canUpload
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-400 line-through opacity-60'
                            }`}
                            title={perms.canUpload ? 'Can Upload' : 'No Upload'}
                          >
                            Upload
                          </span>

                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              perms.canEdit
                                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                : 'bg-slate-100 text-slate-400 line-through opacity-60'
                            }`}
                            title={perms.canEdit ? 'Can Edit' : 'No Edit'}
                          >
                            Edit
                          </span>

                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              perms.canDelete
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-400 line-through opacity-60'
                            }`}
                            title={perms.canDelete ? 'Can Delete' : 'No Delete Permission'}
                          >
                            Delete
                          </span>

                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              perms.canDownload
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-slate-100 text-slate-400 line-through opacity-60'
                            }`}
                            title={perms.canDownload ? 'Can Download' : 'No Download'}
                          >
                            Download
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-3">
                      {user.status === 'invited' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          Pending Invite
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          user.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                          {user.status === 'active' ? 'Active' : 'Suspended'}
                        </span>
                      )}
                    </td>

                    <td className="py-4 pr-6 pl-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {user.status === 'invited' && (
                          <button
                            onClick={() => {
                              const link = getInviteLink(user.id);
                              navigator.clipboard.writeText(link).then(() => {
                                addToast('Invitation link copied to clipboard!', 'success');
                              });
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
                            title="Copy invitation link"
                          >
                            <span>Copy Link</span>
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedUserForPerms(user)}
                          disabled={isAdmin}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            isAdmin
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'bg-sky-50 text-[#0284C7] hover:bg-sky-100 cursor-pointer'
                          }`}
                          title={isAdmin ? 'Root Admin cannot be modified' : 'Edit permissions'}
                        >
                          <span>Permissions</span>
                        </button>
                        {!isAdmin && (
                          <button
                            onClick={async () => {
                              if (window.confirm(`Are you sure you want to remove user "${user.name}"?`)) {
                                await deleteUser(user.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove user account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {isAddUserOpen && (
        <AddUserModal
          isOpen={isAddUserOpen}
          onClose={() => setIsAddUserOpen(false)}
        />
      )}

      <EditPermissionsModal
        user={selectedUserForPerms}
        isOpen={!!selectedUserForPerms}
        onClose={() => setSelectedUserForPerms(null)}
      />

    </div>
  );
};
