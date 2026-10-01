import React, { useState } from 'react';
import { DMSProvider, useDMS } from './context/DMSContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ProjectGrid } from './components/ProjectGrid';
import { FileTable } from './components/FileTable';
import { FolderExplorer } from './components/FolderExplorer';
import { UserManagement } from './components/admin/UserManagement';
import { AuditLogs } from './components/admin/AuditLogs';
import { UploadModal } from './components/UploadModal';
import { FilePreviewModal } from './components/FilePreviewModal';
import { EditFileModal } from './components/EditFileModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ProjectModal } from './components/ProjectModal';
import { ShareModal } from './components/ShareModal';
import { PublicShareScreen } from './components/PublicShareScreen';
import { ToastNotification } from './components/ToastNotification';
import { LoginScreen } from './components/LoginScreen';
import { AcceptInviteScreen } from './components/AcceptInviteScreen';
import { MobileBottomNav } from './components/MobileBottomNav';
import { useScrollLock } from './hooks/useScrollLock';
import { 
  FileText, 
  Users, 
  Shield, 
  Upload
} from 'lucide-react';

const MainContent = () => {
  const { 
    activeTab, 
    currentUser, 
    files, 
    users, 
    logs,
    canUpload
  } = useDMS();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [projectToManage, setProjectToManage] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [shareFileTarget, setShareFileTarget] = useState(null);
  const [editFile, setEditFile] = useState(null);
  const [deleteFileTarget, setDeleteFileTarget] = useState(null);

  const isAnyModalOpen = isUploadOpen || isCreateProjectOpen || !!projectToManage || !!previewFile || !!shareFileTarget || !!editFile || !!deleteFileTarget || isMobileMenuOpen;
  useScrollLock(isAnyModalOpen);

  return (
    <div className="h-screen h-[100dvh] bg-[#F8FAFC] flex flex-col antialiased overflow-hidden">
      <Navbar 
        onOpenUpload={() => setIsUploadOpen(true)} 
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <div className="flex-1 flex w-full max-w-[1600px] mx-auto min-w-0 overflow-hidden">
        <Sidebar 
          isMobileOpen={isMobileMenuOpen} 
          onCloseMobile={() => setIsMobileMenuOpen(false)} 
          onOpenCreateProject={() => setIsCreateProjectOpen(true)}
        />

        <main className={`flex-1 min-w-0 p-3.5 sm:p-5 md:p-6 lg:p-8 pb-28 lg:pb-8 overflow-y-auto overscroll-contain`}>
          {activeTab === 'all-files' && (
            <div className="space-y-6 sm:space-y-8">
              {currentUser?.role === 'Admin' && (
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div className="p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3 text-center sm:text-left">
                    <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-sky-50 text-[#00A3E0] flex items-center justify-center font-bold shrink-0">
                      <FileText className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] sm:text-[11px] font-medium text-slate-400 block truncate">Documents</span>
                      <p className="text-sm sm:text-xl font-bold text-[#0A2540]">{files.length}</p>
                    </div>
                  </div>

                  <div className="p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3 text-center sm:text-left">
                    <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-50 text-[#0284C7] flex items-center justify-center font-bold shrink-0">
                      <Users className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] sm:text-[11px] font-medium text-slate-400 block truncate">Members</span>
                      <p className="text-sm sm:text-xl font-bold text-[#0A2540]">{users.length}</p>
                    </div>
                  </div>

                  <div className="p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3 text-center sm:text-left">
                    <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
                      <Shield className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] sm:text-[11px] font-medium text-slate-400 block truncate">Audit Logs</span>
                      <p className="text-sm sm:text-xl font-bold text-[#0A2540]">{logs.length}</p>
                    </div>
                  </div>
                </div>
              )}

              <ProjectGrid 
                onOpenCreateProject={() => setIsCreateProjectOpen(true)} 
                onOpenManageProject={(proj) => setProjectToManage(proj)}
              />

              <FolderExplorer />

              <FileTable
                onPreview={(file) => setPreviewFile(file)}
                onShare={(file) => setShareFileTarget(file)}
                onEdit={(file) => setEditFile(file)}
                onDelete={(file) => setDeleteFileTarget(file)}
              />
            </div>
          )}

          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'logs' && <AuditLogs />}
        </main>
      </div>

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onOpenCreateProject={() => setIsCreateProjectOpen(true)}
      />

      <ProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
      />

      <ProjectModal
        isOpen={!!projectToManage}
        project={projectToManage}
        onClose={() => setProjectToManage(null)}
      />

      <FilePreviewModal
        file={previewFile}
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
      />

      <ShareModal
        file={shareFileTarget}
        isOpen={!!shareFileTarget}
        onClose={() => setShareFileTarget(null)}
      />

      <EditFileModal
        file={editFile}
        isOpen={!!editFile}
        onClose={() => setEditFile(null)}
      />

      <DeleteConfirmModal
        file={deleteFileTarget}
        isOpen={!!deleteFileTarget}
        onClose={() => setDeleteFileTarget(null)}
      />

      <MobileBottomNav onOpenUpload={() => setIsUploadOpen(true)} />
      <ToastNotification />
    </div>
  );
};

const AppContent = () => {
  const { isAuthenticated, inviteToken } = useDMS();

  // Check for public share link in URL (fallback)
  const shareToken = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('share') : null;
  if (shareToken) {
    return <PublicShareScreen />;
  }

  if (inviteToken) {
    return (
      <>
        <AcceptInviteScreen />
        <ToastNotification />
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen />
        <ToastNotification />
      </>
    );
  }

  return <MainContent />;
};

export default function App() {
  // Check for public share link in URL directly so public recipients don't initialize DMS auth context
  const shareToken = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('share') : null;
  if (shareToken) {
    return <PublicShareScreen />;
  }

  return (
    <DMSProvider>
      <AppContent />
    </DMSProvider>
  );
}


