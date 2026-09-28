import React from 'react';
import { 
  FolderKanban, 
  Files, 
  Plus, 
  Users, 
  FileClock, 
  Lock 
} from 'lucide-react';
import { useDMS } from '../context/DMSContext';

export const MobileBottomNav = ({ onOpenUpload }) => {
  const { 
    activeTab, 
    setActiveTab, 
    setSelectedProject, 
    canUpload, 
    canManageUsers, 
    canViewLogs, 
    addToast 
  } = useDMS();

  const handleTabClick = (tabKey, isAllowed = true) => {
    if (!isAllowed) {
      addToast('Admin Access Required for this section.', 'warning');
      return;
    }
    setSelectedProject(null);
    setActiveTab(tabKey);
  };

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        <button
          onClick={() => handleTabClick('all-files')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            activeTab === 'all-files'
              ? 'text-[#00A3E0] font-bold'
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <div className="relative">
            <Files className="w-5 h-5" />
            {activeTab === 'all-files' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#00A3E0]"></span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Documents</span>
        </button>

        <div className="flex-1 flex justify-center -mt-6">
          <button
            onClick={() => {
              if (canUpload) {
                onOpenUpload();
              } else {
                addToast('Permission Denied: Upload is restricted for your role.', 'error');
              }
            }}
            disabled={!canUpload}
            className={`w-13 h-13 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 border-4 border-white cursor-pointer ${
              canUpload
                ? 'bg-gradient-to-tr from-[#00A3E0] via-[#0284C7] to-[#0A2540] text-white shadow-sky-500/35 hover:shadow-sky-500/50'
                : 'bg-slate-300 text-slate-400 shadow-none cursor-not-allowed'
            }`}
            title={canUpload ? 'Upload New File' : 'Upload Restricted'}
            aria-label="Upload Document"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        <button
          onClick={() => handleTabClick('users', canManageUsers)}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'text-[#00A3E0] font-bold'
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <div className="relative">
            <Users className="w-5 h-5" />
            {!canManageUsers && (
              <Lock className="w-2.5 h-2.5 text-slate-400 absolute -top-1 -right-1" />
            )}
            {activeTab === 'users' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#00A3E0]"></span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Users</span>
        </button>

        <button
          onClick={() => handleTabClick('logs', canViewLogs)}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            activeTab === 'logs'
              ? 'text-[#00A3E0] font-bold'
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <div className="relative">
            <FileClock className="w-5 h-5" />
            {!canViewLogs && (
              <Lock className="w-2.5 h-2.5 text-slate-400 absolute -top-1 -right-1" />
            )}
            {activeTab === 'logs' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#00A3E0]"></span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Logs</span>
        </button>

      </div>
    </div>
  );
};
