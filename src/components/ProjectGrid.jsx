import React, { useMemo } from 'react';
import { 
  FolderKanban, 
  Settings2, 
  Plus, 
  FileText, 
  Users, 
  ShieldCheck, 
  ArrowRight,
  ShieldAlert,
  Lock
} from 'lucide-react';
import { useDMS } from '../context/DMSContext';

export const ProjectGrid = ({ onOpenCreateProject, onOpenManageProject }) => {
  const { 
    projects, 
    userProjects, 
    files, 
    users, 
    selectedProject, 
    setSelectedProject, 
    setActiveTab, 
    currentUser,
    getProjectPermissions 
  } = useDMS();

  const projectFileCounts = useMemo(() => {
    const counts = {};
    for (const f of files) {
      const pId = f.projectId || f.folder;
      counts[pId] = (counts[pId] || 0) + 1;
    }
    return counts;
  }, [files]);

  const displayedProjects = userProjects;

  return (
    <div id="projects-section" className="mb-8 scroll-mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FolderKanban className="w-4 h-4 text-[#00A3E0]" />
              <span>Active Projects & Workspaces</span>
            </h2>
            <span className="sm:hidden text-[10px] text-slate-400 font-normal">
              (Swipe ➔)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {currentUser.role === 'Admin' && (
            <button
              onClick={onOpenCreateProject}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00A3E0] to-[#0284C7] hover:from-[#0284C7] hover:to-[#0A2540] text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Create a new workspace project"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>New Project</span>
            </button>
          )}
        </div>
      </div>

      {displayedProjects.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
          <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-600">
            {currentUser.role === 'Admin' ? 'No Projects Created Yet' : 'No Authorized Projects'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto mb-3">
            {currentUser.role === 'Admin'
              ? 'Click "New Project" to create your first workspace project and start inviting team members.'
              : 'You have not been assigned to any project workspaces yet. Contact your System Administrator to receive access.'}
          </p>
          {currentUser.role === 'Admin' && (
            <button
              onClick={onOpenCreateProject}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#00A3E0] to-[#0284C7] hover:from-[#0284C7] hover:to-[#0A2540] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Create First Project</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex overflow-x-auto sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pb-2 sm:pb-0 no-scrollbar snap-x">
          {displayedProjects.map((project) => {
            const isSelected = selectedProject === project.id;
            const docCount = projectFileCounts[project.id] || 0;
            const perms = getProjectPermissions(project.id);

            const memberUsers = (project.members || [])
              .map((m) => users.find((u) => u.id === m.userId || (m.email && u.email?.toLowerCase() === m.email?.toLowerCase())))
              .filter(Boolean);

            const memberCount = Math.max(
              Array.isArray(project.members) ? project.members.length : 0,
              memberUsers.length,
              1
            );

            return (
              <div
                key={project.id}
                onClick={() => {
                  setSelectedProject(isSelected ? null : project.id);
                  setActiveTab('all-files');
                }}
                className={`group relative p-3.5 sm:p-5 rounded-2xl transition-all duration-200 cursor-pointer border flex flex-col justify-between w-[240px] sm:w-auto shrink-0 snap-start ${
                  isSelected
                    ? 'bg-gradient-to-br from-sky-50/70 to-white border-[#00A3E0] shadow-md ring-2 ring-[#00A3E0]/20'
                    : 'bg-white border-slate-200/90 hover:border-sky-300 hover:shadow-lg hover:-translate-y-0.5'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#00A3E0] to-[#0A2540] text-white shadow-md shadow-sky-500/15 group-hover:scale-105 transition-transform"
                    >
                      <FolderKanban className="w-5 h-5" />
                    </div>

                    {currentUser.role === 'Admin' ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenManageProject) onOpenManageProject(project);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#00A3E0] hover:bg-sky-50 transition-colors cursor-pointer"
                        title="Manage Project Members & Permissions"
                      >
                        <Settings2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Assigned
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-[#0A2540] group-hover:text-[#00A3E0] transition-colors truncate">
                    {project.name}
                  </h3>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                    <FileText className="w-3 h-3 text-slate-400" />
                    <span>{docCount} {docCount === 1 ? 'doc' : 'docs'}</span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
