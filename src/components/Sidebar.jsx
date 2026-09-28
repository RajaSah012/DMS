import React, { useMemo } from 'react';
import { 
  LayoutDashboard, 
  FolderClosed, 
  Users, 
  FileClock, 
  Lock, 
  ShieldCheck, 
  FolderOpen, 
  FolderPlus,
  FolderKanban,
  Plus,
  X, 
  LogOut,
  User 
} from 'lucide-react';
import { useDMS } from '../context/DMSContext';

export const Sidebar = ({ 
  isMobileOpen, 
  onCloseMobile, 
  onOpenCreateProject, 
  onOpenCreateFolder 
}) => {
  const { 
    activeTab, 
    setActiveTab, 
    currentUser, 
    canManageUsers, 
    canViewLogs,
    selectedProject,
    setSelectedProject,
    userProjects,
    files,
    addToast,
    logout
  } = useDMS();

  const handleTabClick = (tabKey, isAllowed = true) => {
    if (!isAllowed) {
      addToast('Access Denied: This section is restricted to Administrators only.', 'error');
      return;
    }
    setSelectedProject(null);
    setActiveTab(tabKey);
    if (onCloseMobile) onCloseMobile();
  };

  const NavContent = () => (
    <div className="flex flex-col justify-between h-full space-y-6">
      <div className="space-y-6 overflow-y-auto pr-1">
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Main Menu
          </p>
          <nav className="space-y-1">
            <button
              onClick={() => handleTabClick('all-files')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'all-files'
                  ? 'bg-gradient-to-r from-[#00A3E0]/15 to-sky-50 text-[#0284C7] font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <FolderClosed className="w-4 h-4 shrink-0" />
              <span>All Documents</span>
            </button>
          </nav>
        </div>

        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Administration
            </p>
            {currentUser.role === 'Admin' && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-[#0284C7]">
                Admin Zone
              </span>
            )}
          </div>
          <nav className="space-y-1">
            <button
              onClick={() => handleTabClick('users', canManageUsers)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-gradient-to-r from-[#00A3E0]/15 to-sky-50 text-[#0284C7] font-bold'
                  : canManageUsers
                  ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  : 'text-slate-400 hover:bg-slate-50/50 cursor-not-allowed opacity-75'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 shrink-0" />
                <span>Users & Permissions</span>
              </div>
              {!canManageUsers && <Lock className="w-3 h-3 text-slate-400 shrink-0" />}
            </button>

            <button
              onClick={() => handleTabClick('logs', canViewLogs)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-gradient-to-r from-[#00A3E0]/15 to-sky-50 text-[#0284C7] font-bold'
                  : canViewLogs
                  ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  : 'text-slate-400 hover:bg-slate-50/50 cursor-not-allowed opacity-75'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileClock className="w-4 h-4 shrink-0" />
                <span>Activity & Audit Logs</span>
              </div>
              {!canViewLogs && <Lock className="w-3 h-3 text-slate-400 shrink-0" />}
            </button>
          </nav>
        </div>

      </div>

      <div className="pt-3 border-t border-slate-100 shrink-0">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
          <div className="w-8 h-8 rounded-full bg-sky-100 text-[#00A3E0] flex items-center justify-center shrink-0 border border-sky-200">
            <User className="w-4 h-4" />
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-bold text-[#0A2540] truncate leading-tight">
              {currentUser.name}
            </p>
            <p className="text-[10px] text-slate-500 truncate">
              {currentUser.email}
            </p>
          </div>
          {currentUser.role === 'Admin' ? (
            <ShieldCheck className="w-4 h-4 text-[#00A3E0] shrink-0" title="Full Admin Privileges" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Active"></span>
          )}
          <button
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              logout();
            }}
            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 ml-1 cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex w-64 shrink-0 bg-white border-r border-slate-200 flex-col justify-between p-4 h-full overflow-hidden">
        <NavContent />
      </aside>

      <div 
        className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div 
          onClick={onCloseMobile}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        />

        <div 
          className={`absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl p-4 flex flex-col justify-between z-10 transform transition-transform duration-300 ease-in-out ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
            <div className="flex items-center">
              <img
                src="/logo.png"
                alt="KasperTech"
                className="h-10 w-auto object-contain"
              />
            </div>
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <NavContent />
          </div>
        </div>
      </div>
    </>
  );
};
