import React, { useState } from 'react';
import { 
  Upload, 
  Shield, 
  UserCheck, 
  Bell, 
  CheckCircle2, 
  ChevronDown,
  X,
  LogOut,
  User
} from 'lucide-react';
import { useDMS } from '../context/DMSContext';

export const Navbar = ({ onOpenUpload, onToggleMobileMenu }) => {
  const { 
    currentUser, 
    canUpload,
    logs,
    logout,
    activeTab,
    setActiveTab
  } = useDMS();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const recentLogs = logs.slice(0, 4);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs px-3 sm:px-6 py-2.5 sm:py-3">
      <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between gap-2 sm:gap-4">
        
        <div className="flex items-center">
          <div className="flex items-center cursor-pointer select-none py-0.5">
            <img
              src="/logo.png"
              alt="KasperTech"
              className="h-8 sm:h-11 md:h-14 w-auto max-w-[140px] sm:max-w-[200px] md:max-w-[260px] object-contain transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <div className="relative shrink-0">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 rounded-full border border-sky-200 bg-sky-50/70 hover:bg-sky-100/80 text-xs font-semibold text-[#0A2540] transition-all cursor-pointer shrink-0"
              title="View User Profile"
            >
              <div className="w-6 h-6 rounded-full bg-sky-100 text-[#00A3E0] flex items-center justify-center shrink-0 border border-sky-300">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="hidden md:inline font-bold text-[#0284C7] truncate max-w-[90px]">
                {currentUser.name}
              </span>
              {currentUser.role === 'Admin' && (
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#0A2540] text-white">
                  Admin
                </span>
              )}
              <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:inline" />
            </button>

            {showUserMenu && (
              <div 
                className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setShowUserMenu(false)}
              >
                {/* Current User Profile Card */}
                <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00A3E0] to-[#0A2540] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#0A2540] truncate leading-tight flex items-center gap-1.5">
                      <span>{currentUser.name}</span>
                      {currentUser.role === 'Admin' && (
                        <Shield className="w-3.5 h-3.5 text-[#00A3E0] shrink-0" />
                      )}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {currentUser.email}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        currentUser.role === 'Admin'
                          ? 'bg-[#0A2540] text-white'
                          : 'bg-sky-100 text-[#0284C7]'
                      }`}>
                        {currentUser.role === 'Admin' ? 'System Administrator' : 'Workspace Member'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Account Details */}
                <div className="py-2.5 space-y-2 text-[11px] text-slate-600">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-slate-400 font-medium">Session Status</span>
                    <span className="flex items-center gap-1.5 font-bold text-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-1">
                    <span className="text-slate-400 font-medium">Workspace Access</span>
                    <span className="font-bold text-slate-700">
                      {currentUser.role === 'Admin' ? 'All Workspaces (Root)' : `${(currentUser.projectIds || []).length} Assigned Workspaces`}
                    </span>
                  </div>
                </div>

                {/* Log Out Action */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out of Workspace</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={logout}
            className="hidden md:flex p-1.5 sm:p-2 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
            title="Log Out of Account"
          >
            <LogOut className="w-4 h-4" />
          </button>

          <div className="relative hidden md:block shrink-0">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1.5 sm:p-2 rounded-full text-slate-600 hover:bg-slate-100 relative transition-colors cursor-pointer"
              title="Recent Activity"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#00A3E0]"></span>
            </button>

            {showNotifications && (
              <div 
                className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 animate-in fade-in duration-150"
                onClick={() => setShowNotifications(false)}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                  <span className="text-xs font-bold text-slate-900">Live Activity Feed</span>
                  <span className="text-[10px] text-[#00A3E0] font-semibold">Real-time</span>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {recentLogs.map((log) => (
                    <div key={log.id} className="text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800">{log.userName}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">{log.actionLabel}: <span className="font-medium text-[#0A2540]">{log.target}</span></p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onOpenUpload}
            disabled={!canUpload}
            className={`flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-bold shadow-xs transition-all shrink-0 ${
              canUpload
                ? 'bg-[#0A2540] hover:bg-[#07192C] text-white hover:shadow-md cursor-pointer active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
            title={canUpload ? 'Upload Document' : 'You do not have permission to upload'}
          >
            <Upload className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs font-bold">Upload</span>
            <span className="hidden sm:inline text-xs font-bold">File</span>
          </button>

        </div>

      </div>
    </header>
  );
};
