import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  FolderPlus, 
  ChevronRight, 
  ArrowLeft, 
  Trash2, 
  FolderOpen,
  X,
  Check
} from 'lucide-react';
import { useDMS } from '../context/DMSContext';

export const FolderExplorer = () => {
  const { 
    selectedProject, 
    setSelectedProject, 
    projects, 
    folders, 
    currentFolderId, 
    setCurrentFolderId, 
    createSubfolder, 
    deleteSubfolder,
    loadProjectFolders,
    files,
    currentUser,
    canEdit
  } = useDMS();

  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Fetch folders for current level from backend whenever project or folder changes
  useEffect(() => {
    if (selectedProject && loadProjectFolders) {
      loadProjectFolders(selectedProject, currentFolderId);
    }
  }, [selectedProject, currentFolderId, loadProjectFolders]);

  if (!selectedProject) return null;

  const currentProject = projects.find((p) => String(p.id) === String(selectedProject));
  const projectName = currentProject ? currentProject.name : 'Current Project';

  // Folders to show in current level:
  // If at root (currentFolderId is null/empty): show folders with no parentFolderId
  // If inside a folder: show folders whose parentFolderId matches currentFolderId
  const currentLevelFolders = folders.filter((f) => {
    const projMatch = String(f.projectId) === String(selectedProject);
    const parentIdStr = f.parentFolderId ? String(f.parentFolderId) : '';
    const currentIdStr = currentFolderId ? String(currentFolderId) : '';
    return projMatch && parentIdStr === currentIdStr;
  });

  // Active open folder object
  const activeCurrentFolder = currentFolderId ? folders.find((f) => String(f.id) === String(currentFolderId)) : null;

  // Compute breadcrumbs path
  const breadcrumbs = [];
  let curr = activeCurrentFolder;
  while (curr) {
    breadcrumbs.unshift(curr);
    curr = curr.parentFolderId ? folders.find((f) => String(f.id) === String(curr.parentFolderId)) : null;
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const created = await createSubfolder({
      name: newFolderName.trim(),
      projectId: selectedProject,
      parentFolderId: currentFolderId,
    });
    setNewFolderName('');
    setIsCreating(false);
    if (created && loadProjectFolders) {
      loadProjectFolders(selectedProject, currentFolderId);
    }
  };

  const handleGoBack = () => {
    if (!currentFolderId) {
      setSelectedProject(null);
      return;
    }
    const currFld = folders.find((f) => String(f.id) === String(currentFolderId));
    if (currFld && currFld.parentFolderId) {
      setCurrentFolderId(currFld.parentFolderId);
      if (loadProjectFolders) loadProjectFolders(selectedProject, currFld.parentFolderId);
    } else {
      setCurrentFolderId(null);
      if (loadProjectFolders) loadProjectFolders(selectedProject, null);
    }
  };

  const handleNavigateToFolder = (targetId) => {
    setCurrentFolderId(targetId);
    if (loadProjectFolders) loadProjectFolders(selectedProject, targetId);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 mb-6 animate-in fade-in duration-150">
      
      {/* Breadcrumb Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 overflow-x-auto py-1 max-w-full">
          <button
            onClick={() => {
              setSelectedProject(null);
              setCurrentFolderId(null);
            }}
            className="text-slate-400 hover:text-[#00A3E0] transition-colors cursor-pointer shrink-0"
          >
            Projects
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          
          <button
            onClick={() => handleNavigateToFolder(null)}
            className={`shrink-0 transition-colors cursor-pointer ${
              !currentFolderId ? 'text-[#0A2540] font-bold' : 'text-slate-500 hover:text-[#00A3E0]'
            }`}
          >
            {projectName}
          </button>

          {breadcrumbs.map((b, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={b.id}>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                <button
                  onClick={() => handleNavigateToFolder(b.id)}
                  className={`shrink-0 transition-colors cursor-pointer ${
                    isLast ? 'text-[#00A3E0] font-bold' : 'text-slate-500 hover:text-[#00A3E0]'
                  }`}
                >
                  {b.name}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
            title="Navigate up one level"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Up</span>
          </button>

          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 text-[#00A3E0] hover:bg-sky-100 border border-sky-200 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <FolderPlus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ Subfolder</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Folder Indicator Banner */}
      {activeCurrentFolder && (
        <div className="mt-3 px-3.5 py-2 rounded-xl bg-sky-50/70 border border-sky-200/80 flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs">
            <FolderOpen className="w-4 h-4 text-[#00A3E0]" />
            <span className="text-slate-500">Inside Folder:</span>
            <span className="font-bold text-[#0A2540]">{activeCurrentFolder.name}</span>
          </div>
          <button
            onClick={handleGoBack}
            className="text-[11px] font-bold text-[#00A3E0] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Back</span>
          </button>
        </div>
      )}

      {/* Inline New Folder Input */}
      {isCreating && (
        <form onSubmit={handleCreate} className="mt-3 p-3 rounded-xl bg-sky-50/60 border border-sky-200/80 flex items-center gap-2 animate-in fade-in duration-150">
          <Folder className="w-4 h-4 text-[#00A3E0] shrink-0" />
          <input
            type="text"
            autoFocus
            required
            placeholder={activeCurrentFolder ? `Subfolder name inside "${activeCurrentFolder.name}"...` : "Folder name (e.g. Invoices, Contracts)..."}
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs bg-white border border-sky-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#00A3E0]/30 text-slate-800"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-[#00A3E0] hover:bg-[#0284C7] text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Create</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsCreating(false);
              setNewFolderName('');
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Folders List / Grid */}
      <div className="mt-3">
        {currentLevelFolders.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-xs text-slate-400">
              {activeCurrentFolder 
                ? `No nested subfolders inside "${activeCurrentFolder.name}". Upload files below or click `
                : 'No folders created yet in this workspace. Upload documents below or click '}
              <strong className="text-slate-600">+ Subfolder</strong> to organize.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {currentLevelFolders.map((fld) => {
              const fileCount = files.filter((file) => String(file.folderId) === String(fld.id)).length;
              const subSubCount = folders.filter((sub) => String(sub.parentFolderId) === String(fld.id)).length;

              return (
                <div
                  key={fld.id}
                  onClick={() => handleNavigateToFolder(fld.id)}
                  className="group relative p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-sky-50/40 hover:border-sky-300 transition-all cursor-pointer flex items-center justify-between gap-2 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 text-[#00A3E0] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Folder className="w-4 h-4 fill-sky-200" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800 group-hover:text-[#00A3E0] transition-colors truncate">
                        {fld.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {fileCount} {fileCount === 1 ? 'doc' : 'docs'}
                        {subSubCount > 0 ? ` • ${subSubCount} subfolders` : ''}
                      </p>
                    </div>
                  </div>

                  {(currentUser.role === 'Admin' || canEdit) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Delete folder "${fld.name}" and any subfolders?`)) {
                          deleteSubfolder(fld.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                      title="Delete folder"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
