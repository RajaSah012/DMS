import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  FileArchive, 
  File, 
  Eye, 
  Download, 
  Edit3, 
  Trash2, 
  Lock, 
  MoreVertical,
  Calendar,
  User,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Share2
} from 'lucide-react';
import { useDMS } from '../context/DMSContext';

export const FileTable = ({ onPreview, onEdit, onDelete, onShare }) => {
  const { 
    files, 
    projects,
    userProjects,
    searchQuery, 
    selectedProject, 
    folders,
    currentFolderId,
    activeTab, 
    canUpload,
    canEdit, 
    canDelete, 
    canDownload,
    canEditFile,
    canDeleteFile,
    canDownloadFile,
    getProjectPermissions,
    downloadFile, 
    currentUser 
  } = useDMS();

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf':
        return (
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs shrink-0 border border-red-100">
            PDF
          </div>
        );
      case 'excel':
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-100">
            XLS
          </div>
        );
      case 'doc':
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100">
            DOC
          </div>
        );
      case 'zip':
        return (
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-100">
            ZIP
          </div>
        );
      case 'figma':
        return (
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs shrink-0 border border-purple-100">
            FIG
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">
            FILE
          </div>
        );
    }
  };

  const filteredFiles = useMemo(() => {
    const authorizedProjectIds = new Set(userProjects.map((p) => p.id));

    return files.filter((file) => {
      const fileProjId = file.projectId || file.folder;

      if (currentUser.role !== 'Admin' && !authorizedProjectIds.has(fileProjId)) {
        return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const proj = projects.find((p) => p.id === fileProjId);
        const match =
          file.name.toLowerCase().includes(q) ||
          file.uploadedBy.toLowerCase().includes(q) ||
          fileProjId.toLowerCase().includes(q) ||
          (proj && proj.name.toLowerCase().includes(q));
        if (!match) return false;
      }

      if (selectedProject && fileProjId !== selectedProject) {
        return false;
      }

      if (selectedProject && currentFolderId) {
        if (file.folderId !== currentFolderId) return false;
      }

      return true;
    });
  }, [files, searchQuery, selectedProject, currentFolderId, activeTab, userProjects, projects, currentUser]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedProject, currentFolderId]);

  const totalPages = Math.max(1, Math.ceil(filteredFiles.length / pageSize));
  const paginatedFiles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredFiles.slice(start, start + pageSize);
  }, [filteredFiles, currentPage, pageSize]);

  const activeProjectObj = selectedProject ? projects.find((p) => p.id === selectedProject) : null;
  const activeFolderObj = currentFolderId ? folders.find((f) => f.id === currentFolderId) : null;
  const activePrivileges = selectedProject
    ? getProjectPermissions(selectedProject)
    : { canUpload, canEdit, canDelete, canDownload };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-4 sm:px-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <h3 className="text-sm font-bold text-[#0A2540]">
            {activeFolderObj
              ? `📁 Folder: ${activeFolderObj.name}`
              : activeProjectObj 
              ? `Project: ${activeProjectObj.name}` 
              : 'All Project Documents'}
          </h3>
          <p className="text-xs text-slate-500">
            Showing {filteredFiles.length} documents {activeFolderObj ? `inside "${activeFolderObj.name}"` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
          <span className="text-slate-400 font-medium text-[11px]">
            {activeProjectObj ? 'Project Privileges:' : 'Your Privileges:'}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activePrivileges.canUpload ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-400'}`}>
            {activePrivileges.canUpload ? 'Upload' : 'No Upload'}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activePrivileges.canEdit ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>
            {activePrivileges.canEdit ? 'Edit' : 'No Edit'}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activePrivileges.canDelete ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-400'}`}>
            {activePrivileges.canDelete ? 'Delete' : 'No Delete'}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activePrivileges.canDownload ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-400'}`}>
            {activePrivileges.canDownload ? 'Download' : 'No Download'}
          </span>
        </div>
      </div>

      {filteredFiles.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <File className="w-8 h-8" />
          </div>
          <h4 className="text-sm font-bold text-slate-700 mb-1">No documents found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery 
              ? `No files matching "${searchQuery}". Try different keywords.` 
              : 'No documents in this directory yet. Upload one to get started.'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile View: Clean Document Cards (sm:hidden) */}
          <div className="sm:hidden divide-y divide-slate-100">
            {paginatedFiles.map((file) => {
              const fileProj = projects.find((p) => p.id === (file.projectId || file.folder));
              const fileCanEdit = canEditFile(file);
              const fileCanDelete = canDeleteFile(file);
              const fileCanDownload = canDownloadFile(file);

              return (
                <div key={file.id} className="p-3.5 hover:bg-sky-50/30 transition-colors">
                  <div className="flex items-start gap-3">
                    {getFileIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 w-full">
                        <button
                          onClick={() => onPreview(file)}
                          className="font-bold text-xs text-[#0A2540] hover:text-[#00A3E0] transition-colors truncate block text-left flex-1 cursor-pointer"
                        >
                          {file.name}
                        </button>
                        {file.externalUrl && (
                          <a
                            href={file.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-sky-50 text-[#00A3E0] text-[10px] font-bold border border-sky-200 shrink-0 hover:bg-sky-100"
                            title={`Open reference: ${file.externalUrl}`}
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Link</span>
                          </a>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="px-2 py-0.5 rounded-md bg-sky-50 text-[#0284C7] font-semibold text-[10px] border border-sky-100 truncate max-w-[130px]">
                          {fileProj ? fileProj.name : (file.projectId || file.folder)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {file.size}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(file.uploadedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100/70">
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                      <div className="w-4 h-4 rounded-full bg-sky-100 text-[#00A3E0] flex items-center justify-center text-[9px] font-bold">
                        {file.uploadedBy.charAt(0)}
                      </div>
                      <span className="truncate max-w-[90px]">{file.uploadedBy}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onPreview(file)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-[#00A3E0] hover:bg-sky-50 transition-colors cursor-pointer"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => downloadFile(file)}
                        disabled={!fileCanDownload}
                        className={`p-1.5 rounded-lg transition-colors ${
                          fileCanDownload ? 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer' : 'text-slate-200 cursor-not-allowed'
                        }`}
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onShare && onShare(file)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-[#00A3E0] hover:bg-sky-50 transition-colors cursor-pointer"
                        title="Share File (Expiring & One-Time Link)"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(file)}
                        disabled={!fileCanEdit}
                        className={`p-1.5 rounded-lg transition-colors ${
                          fileCanEdit ? 'text-slate-500 hover:text-[#0284C7] hover:bg-sky-50 cursor-pointer' : 'text-slate-200 cursor-not-allowed opacity-40'
                        }`}
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(file)}
                        disabled={!fileCanDelete}
                        className={`p-1.5 rounded-lg transition-colors ${
                          fileCanDelete ? 'text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer' : 'text-slate-200 cursor-not-allowed opacity-40'
                        }`}
                        title="Delete"
                      >
                        {fileCanDelete ? <Trash2 className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5 text-slate-300" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

         
          <div className="hidden sm:block overflow-x-auto w-full overscroll-x-contain">
            <table className="w-full text-left border-collapse min-w-[680px]">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/70">
                  <th className="py-3.5 pl-6 pr-3">Document Name</th>
                  <th className="py-3.5 px-3">Project</th>
                  <th className="py-3.5 px-3">Size</th>
                  <th className="py-3.5 px-3">Uploaded By</th>
                  <th className="py-3.5 px-3">Date</th>
                  <th className="py-3.5 pr-6 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedFiles.map((file) => {
                  const fileProj = projects.find((p) => p.id === (file.projectId || file.folder));
                  const fileCanEdit = canEditFile(file);
                  const fileCanDelete = canDeleteFile(file);
                  const fileCanDownload = canDownloadFile(file);

                  return (
                    <tr 
                      key={file.id} 
                      className="hover:bg-sky-50/40 transition-colors group"
                    >
                      <td className="py-3 pl-6 pr-3">
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.type)}
                          <div className="max-w-xs md:max-w-md truncate">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => onPreview(file)}
                                className="font-semibold text-[#0A2540] hover:text-[#00A3E0] transition-colors truncate block text-left cursor-pointer"
                              >
                                {file.name}
                              </button>
                              {file.externalUrl && (
                                <a
                                  href={file.externalUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-sky-50 text-[#00A3E0] hover:bg-sky-100 text-[10px] font-bold border border-sky-200 shrink-0 transition-colors"
                                  title={`Open reference: ${file.externalUrl}`}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Link</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="capitalize px-2.5 py-1 rounded-lg bg-sky-50 text-[#0284C7] font-semibold text-[11px] border border-sky-100/80">
                          {fileProj ? fileProj.name : (file.projectId || file.folder)}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-medium text-slate-600">
                        {file.size}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-sky-100 text-[#00A3E0] flex items-center justify-center text-[10px] font-bold">
                            {file.uploadedBy.charAt(0)}
                          </div>
                          <span className="text-slate-700 font-medium truncate max-w-[120px]">
                            {file.uploadedBy}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-400">
                        {new Date(file.uploadedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-3 pr-6 pl-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onPreview(file)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#00A3E0] hover:bg-sky-50 transition-colors cursor-pointer"
                            title="Preview Document"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => downloadFile(file)}
                            disabled={!fileCanDownload}
                            className={`p-1.5 rounded-lg transition-colors ${
                              fileCanDownload
                                ? 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer'
                                : 'text-slate-300 cursor-not-allowed'
                            }`}
                            title={fileCanDownload ? 'Download File' : 'Download Restricted'}
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onShare && onShare(file)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#00A3E0] hover:bg-sky-50 transition-colors cursor-pointer"
                            title="Share File (Expiring & One-Time Link)"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onEdit(file)}
                            disabled={!fileCanEdit}
                            className={`p-1.5 rounded-lg transition-colors ${
                              fileCanEdit
                                ? 'text-slate-500 hover:text-[#0284C7] hover:bg-sky-50 cursor-pointer'
                                : 'text-slate-200 cursor-not-allowed opacity-50'
                            }`}
                            title={fileCanEdit ? 'Rename / Edit File' : 'You do not have Edit permission for this project'}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onDelete(file)}
                            disabled={!fileCanDelete}
                            className={`p-1.5 rounded-lg transition-colors ${
                              fileCanDelete
                                ? 'text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer'
                                : 'text-slate-200 cursor-not-allowed opacity-40'
                            }`}
                            title={fileCanDelete ? 'Delete File' : 'Permission Denied: You do not have Delete permission for this project'}
                          >
                            {fileCanDelete ? (
                              <Trash2 className="w-4 h-4" />
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-slate-300" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {filteredFiles.length > 0 && (
            <div className="p-4 sm:px-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Showing</span>
                <span className="font-bold text-slate-800">
                  {filteredFiles.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                </span>
                <span>to</span>
                <span className="font-bold text-slate-800">
                  {Math.min(currentPage * pageSize, filteredFiles.length)}
                </span>
                <span>of</span>
                <span className="font-bold text-[#0A2540]">{filteredFiles.length}</span>
                <span>documents</span>

                <div className="ml-3 flex items-center gap-1.5 border-l border-slate-200 pl-3">
                  <span>Per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#00A3E0]/30"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    currentPage <= 1
                      ? 'text-slate-300 bg-slate-100/50 cursor-not-allowed'
                      : 'text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs cursor-pointer'
                  }`}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((num) => num === 1 || num === totalPages || Math.abs(num - currentPage) <= 1)
                  .map((num, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && num - prev > 1;

                    return (
                      <React.Fragment key={num}>
                        {showEllipsis && (
                          <span className="px-1 text-xs text-slate-400 select-none">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(num)}
                          className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            currentPage === num
                              ? 'bg-[#00A3E0] text-white shadow-xs'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {num}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    currentPage >= totalPages
                      ? 'text-slate-300 bg-slate-100/50 cursor-not-allowed'
                      : 'text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs cursor-pointer'
                  }`}
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
};
