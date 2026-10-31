import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Upload, 
  Bell, 
  ChevronDown,
  X,
  LogOut,
  Menu
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
  const userMenuRef = useRef(null);
  const notificationsRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowUserMenu(false);
        setShowNotifications(false);
      }
    };

    if (showUserMenu || showNotifications) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showUserMenu, showNotifications]);

  // Filter logs strictly per-user: each user only sees activities belonging or relevant to them
  const recentLogs = useMemo(() => {
    if (!currentUser) return [];

    const myId = String(currentUser.id || currentUser._id || '').replace(/^u-/, '').toLowerCase();
    const myEmail = (currentUser.email || '').toLowerCase().trim();
    const myName = (currentUser.name || '').toLowerCase().trim();
    const isAdmin = currentUser.role === 'Admin';
    const myProjectIds = new Set((currentUser.projectIds || []).map((id) => String(id)));

    return logs.filter((log) => {
      const logUserId = String(log.userId || '').replace(/^u-/, '').toLowerCase();
      const logAdminId = String(log.adminId || '').replace(/^u-/, '').toLowerCase();
      const logUserEmail = (log.userEmail || '').toLowerCase().trim();
      const logAdminEmail = (log.adminEmail || '').toLowerCase().trim();
      const logUserName = (log.userName || '').toLowerCase().trim();
      const logUserRole = log.userRole || 'User';

      const targetStr = (log.target || '').toLowerCase();
      const targetEmail = (log.targetEmail || '').toLowerCase().trim();
      const detailsStr = (typeof log.details === 'string' ? log.details : JSON.stringify(log.details || {})).toLowerCase();

      // 1. Did the current user perform this action?
      if (isAdmin) {
        // If logged in as Admin: show admin-authored actions or actions explicitly done by this admin
        const isAdminActor =
          logUserRole === 'Admin' ||
          (myId && (logAdminId === myId || logUserId === myId)) ||
          (myEmail && (logAdminEmail === myEmail || logUserEmail === myEmail));
        if (isAdminActor) return true;
      } else {
        // If logged in as regular Member: strictly match member's own ID, email, or name
        const isMemberActor =
          (myId && logUserId === myId) ||
          (myEmail && logUserEmail === myEmail) ||
          (myName && logUserName === myName && logUserRole !== 'Admin');
        if (isMemberActor) return true;
      }

      // 2. Was this action directly targeted at the current user?
      // (e.g. project invitation sent to user, account created, permissions updated)
      const isTarget =
        (myEmail && (targetEmail === myEmail || targetStr.includes(myEmail) || detailsStr.includes(myEmail))) ||
        (myName && myName.length > 2 && (targetStr.includes(myName) || detailsStr.includes(myName)));

      if (isTarget) return true;

      // 3. For Member users: file activity inside a project they are member of
      if (!isAdmin && log.projectId && myProjectIds.has(String(log.projectId))) {
        const fileActions = ['UPLOAD_FILE', 'FILE_UPLOAD', 'DELETE_FILE', 'FILE_DELETE', 'FILE_RENAME', 'FILE_UPDATE'];
        if (fileActions.includes(log.action)) {
          return true;
        }
      }

      // 4. For Admin users: also show member uploads / registrations in the workspace
      if (isAdmin) {
        const workspaceActions = ['UPLOAD_FILE', 'FILE_UPLOAD', 'USER_REGISTER', 'USER_LOGIN', 'UNAUTHORIZED_ATTEMPT', 'LOGIN_BLOCKED'];
        if (workspaceActions.includes(log.action)) {
          return true;
        }
      }

      return false;
    }).slice(0, 10);
  }, [logs, currentUser]);
  const userInitial = currentUser?.name ? currentUser.name.trim().charAt(0).toUpperCase() : 'U';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs px-3 sm:px-6 py-1.5 sm:py-2">
      <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between gap-2 sm:gap-4">
        
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile/Tablet Menu Drawer Toggle Button */}
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-1.5 rounded-xl text-slate-600 hover:text-[#0A2540] hover:bg-slate-100 transition-colors cursor-pointer active:scale-95"
            title="Open Navigation Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center cursor-pointer select-none">
            <img
              src="/logo.png"
              alt="KasperTech"
              className="h-7 sm:h-8 md:h-9 w-auto max-w-[120px] sm:max-w-[150px] md:max-w-[180px] object-contain transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Upload File Button  */}
          <button
            onClick={onOpenUpload}
            disabled={!canUpload}
            className={`flex items-center gap-1 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-bold shadow-xs transition-all shrink-0 ${
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

          {/* User Profile */}
          <div className="relative shrink-0" ref={userMenuRef}>
            <button
              onClick={() => {
                setShowUserMenu((prev) => !prev);
                setShowNotifications(false);
              }}
              className="flex items-center gap-1.5 p-1 pr-2 sm:pr-2.5 rounded-full border border-sky-200 bg-sky-50/70 hover:bg-sky-100/90 text-xs font-semibold text-[#0A2540] transition-all cursor-pointer shrink-0 shadow-xs active:scale-95 hover:border-sky-300"
              title={`View User Profile (${currentUser?.name || 'User'})`}
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-[#00A3E0] to-[#0A2540] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 select-none">
                {userInitial}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {showUserMenu && (
              <div 
                className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                {/* Current User Profile Card */}
                <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00A3E0] to-[#0A2540] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0 select-none">
                    {userInitial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#0A2540] leading-tight break-words">
                      {currentUser?.name || 'User'}
                    </p>
                    <p className="text-[11px] text-slate-400 break-all mt-0.5">
                      {currentUser?.email || ''}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        currentUser?.role === 'Admin'
                          ? 'bg-[#0A2540] text-white'
                          : 'bg-sky-100 text-[#0284C7]'
                      }`}>
                        {currentUser?.role === 'Admin' ? 'System Administrator' : 'Workspace Member'}
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

          {/* Notifications */}
          <div className="relative shrink-0" ref={notificationsRef}>
            <button
              onClick={() => {
                setShowNotifications((prev) => !prev);
                setShowUserMenu(false);
              }}
              className="p-1.5 sm:p-2 rounded-full text-slate-600 hover:bg-slate-100 relative transition-colors cursor-pointer"
              title="Recent Activity"
            >
              <Bell className="w-4 h-4" />
              {recentLogs.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#00A3E0] animate-pulse"></span>
              )}
            </button>

            {showNotifications && (
              <div 
                className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">Live Activity Feed</span>
                    {recentLogs.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-sky-100 text-[#0284C7] text-[10px] font-bold">
                        {recentLogs.length}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Close Activity Feed"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {recentLogs.length > 0 ? (
                    recentLogs.map((log) => (
                      <div key={log.id} className="text-xs p-2 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-slate-800 truncate">{log.userName}</span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 break-words">
                          {log.actionLabel}: <span className="font-medium text-[#0A2540]">{log.target}</span>
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="py-7 px-4 text-center">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                        <Bell className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">No New Activity</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Activity related to your account and files will show here.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
