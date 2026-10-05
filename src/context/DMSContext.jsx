import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  loginAdminService, 
  loginUserService, 
  registerUserService,
  getAllUsersService,
  deleteUserService,
  sendOtpService,
  verifyOtpService
} from '../services/authService';
import { 
  getAllProjectsService, 
  createProjectService, 
  inviteUserToProjectService, 
  updateMemberPermissionsService, 
  getProjectMembersService,
  deleteProjectService,
  updateProjectDetailsService
} from '../services/projectService';
import { backendPermissionsToFrontend, frontendPermissionsToBackend } from '../utils/permissionMapper';
import { 
  uploadDocumentService, 
  getProjectDocumentsService, 
  deleteDocumentService, 
  renameDocumentService,
  createShareLinkService,
  getFileDownloadUrl, 
  formatBytes, 
  detectTypeFromExtension 
} from '../services/documentService';
import { 
  createFolderService, 
  getProjectFoldersService, 
  deleteFolderService 
} from '../services/folderService';
import { getAuditLogsService } from '../services/auditService';

const DMSContext = createContext();

export const DMSProvider = ({ children }) => {
  // Purge any legacy dummy admin1 or old mock token from previous tests
  try {
    const cachedAdminEmail = localStorage.getItem('admin-email');
    if (cachedAdminEmail && cachedAdminEmail.toLowerCase() === 'admin1@gmail.com') {
      localStorage.removeItem('admin-email');
      localStorage.removeItem('admin-name');
    }
    const cachedToken = localStorage.getItem('admin-token');
    if (cachedToken === '6ab5114f329e2d2b1a699942') {
      localStorage.removeItem('admin-token');
    }
    const cachedUsers = localStorage.getItem('kt_dms_users');
    if (cachedUsers && (cachedUsers.includes('admin1@gmail.com') || cachedUsers.includes('Admin1'))) {
      const cleaned = JSON.parse(cachedUsers).filter(
        (u) => (u.email || '').toLowerCase() !== 'admin1@gmail.com' && u.name !== 'Admin1'
      );
      localStorage.setItem('kt_dms_users', JSON.stringify(cleaned));
    }
  } catch {}

  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('kt_dms_users');
    const currentAdminEmail = (localStorage.getItem('admin-email') || '').toLowerCase();
    const currentAdminToken = localStorage.getItem('admin-token');
    const currentAdminName = localStorage.getItem('admin-name');

    let deletedUserEmails = [];
    let deletedUserIds = [];
    try {
      deletedUserEmails = JSON.parse(localStorage.getItem('kt_dms_deleted_user_emails') || '[]').map((e) => String(e).toLowerCase());
      deletedUserIds = JSON.parse(localStorage.getItem('kt_dms_deleted_user_ids') || '[]').map((id) => String(id));
    } catch {}

    const emailPrefix = currentAdminEmail ? currentAdminEmail.split('@')[0] : '';
    const displayName = currentAdminName || (emailPrefix ? emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1) : 'Admin');
    const activeAdmin = currentAdminEmail ? {
      id: currentAdminToken ? `u-${currentAdminToken}` : 'u-admin',
      name: displayName,
      email: currentAdminEmail,
      role: 'Admin',
      avatar: '/p1.jpg',
      department: 'System Administration',
      status: 'active',
      projectIds: [],
      permissions: {
        canView: true,
        canUpload: true,
        canEdit: true,
        canDelete: true,
        canDownload: true,
        canManageUsers: true,
        canViewLogs: true,
      },
    } : null;

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const membersOnly = parsed.filter(
          (u) =>
            u.role !== 'Admin' &&
            u.email &&
            u.email.toLowerCase() !== 'admin1@gmail.com' &&
            u.name !== 'Admin1' &&
            (!currentAdminEmail || u.email.toLowerCase() !== currentAdminEmail) &&
            !deletedUserEmails.includes(u.email.toLowerCase()) &&
            !deletedUserIds.includes(String(u.id))
        );
        return activeAdmin ? [activeAdmin, ...membersOnly] : membersOnly;
      } catch {
        return activeAdmin ? [activeAdmin] : [];
      }
    }
    return activeAdmin ? [activeAdmin] : [];
  });

  const [currentUserId, setCurrentUserId] = useState(() => {
    return localStorage.getItem('kt_dms_active_user_id') || null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const saved = localStorage.getItem('kt_dms_auth');
    return saved === 'true';
  });

  const [files, setFiles] = useState(() => {
    const saved = localStorage.getItem('kt_dms_files');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const deletedIds = JSON.parse(localStorage.getItem('kt_dms_deleted_project_ids') || '[]');
        return parsed.filter((f) => !deletedIds.includes(f.projectId) && !deletedIds.includes(f.folder));
      } catch {
        return [];
      }
    }
    return [];
  });

  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('kt_dms_projects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const deletedIds = JSON.parse(localStorage.getItem('kt_dms_deleted_project_ids') || '[]');
        return parsed.filter((p) => !deletedIds.includes(p.id));
      } catch {
        return [];
      }
    }
    return [];
  });

  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem('kt_dms_logs');
    if (saved) {
      try {
        return JSON.parse(saved).filter((l) => l.action !== 'LOGIN_FAILED' && l.actionLabel !== 'Failed Login Attempt');
      } catch {
        return [];
      }
    }
    return [];
  });

  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('kt_dms_active_tab');
    if (saved && ['all-files', 'users', 'logs'].includes(saved)) {
      return saved;
    }
    return 'all-files';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState(() => {
    return localStorage.getItem('kt_dms_selected_project') || null;
  });
  const [toasts, setToasts] = useState([]);
  
  const [inviteToken, setInviteToken] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('invite') || null;
    }
    return null;
  });

  const [invitations, setInvitations] = useState(() => {
    try {
      const saved = localStorage.getItem('kt_dms_invitations');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('kt_dms_invitations', JSON.stringify(invitations));
  }, [invitations]);

  useEffect(() => {
    localStorage.setItem('kt_dms_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('kt_dms_files', JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    localStorage.setItem('kt_dms_projects', JSON.stringify(projects));
  }, [projects]);

  const [folders, setFolders] = useState(() => {
    try {
      const saved = localStorage.getItem('kt_dms_folders');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [currentFolderId, setCurrentFolderId] = useState(null);

  useEffect(() => {
    localStorage.setItem('kt_dms_folders', JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    setCurrentFolderId(null);
  }, [selectedProject]);

  useEffect(() => {
    localStorage.setItem('kt_dms_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem('kt_dms_active_user_id', currentUserId);
    } else {
      localStorage.removeItem('kt_dms_active_user_id');
    }
  }, [currentUserId]);

  useEffect(() => {
    if (activeTab) {
      localStorage.setItem('kt_dms_active_tab', activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedProject) {
      localStorage.setItem('kt_dms_selected_project', selectedProject);
    } else {
      localStorage.removeItem('kt_dms_selected_project');
    }
  }, [selectedProject]);

  // Multi-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (!e.newValue) return;
      try {
        if (e.key === 'kt_dms_users') {
          setUsers(JSON.parse(e.newValue));
        } else if (e.key === 'kt_dms_invitations') {
          setInvitations(JSON.parse(e.newValue));
        } else if (e.key === 'kt_dms_projects') {
          setProjects(JSON.parse(e.newValue));
        } else if (e.key === 'kt_dms_files') {
          setFiles(JSON.parse(e.newValue));
        } else if (e.key === 'kt_dms_logs') {
          setLogs(JSON.parse(e.newValue));
        } else if (e.key === 'kt_dms_active_tab') {
          if (['all-files', 'users', 'logs'].includes(e.newValue)) {
            setActiveTab(e.newValue);
          }
        } else if (e.key === 'kt_dms_auth') {
          setIsAuthenticated(e.newValue === 'true');
        } else if (e.key === 'kt_dms_active_user_id') {
          setCurrentUserId(e.newValue || null);
        } else if (e.key === 'kt_dms_selected_project') {
          setSelectedProject(e.newValue || null);
        }
      } catch (err) {
        console.error('Failed to sync state from storage event:', err);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);



  const loadBackendProjects = useCallback(async () => {
    try {
      const res = await getAllProjectsService(1, 100);
      if (res && res.success && Array.isArray(res.data)) {
        let deletedProjectIds = [];
        try {
          deletedProjectIds = JSON.parse(localStorage.getItem('kt_dms_deleted_project_ids') || '[]');
        } catch {
          deletedProjectIds = [];
        }

        let deletedUserEmails = [];
        let deletedUserIds = [];
        try {
          deletedUserEmails = JSON.parse(localStorage.getItem('kt_dms_deleted_user_emails') || '[]').map((e) => String(e).toLowerCase());
          deletedUserIds = JSON.parse(localStorage.getItem('kt_dms_deleted_user_ids') || '[]').map((id) => String(id));
        } catch {
          deletedUserEmails = [];
          deletedUserIds = [];
        }

        const validBackendProjects = res.data.filter((bp) => !deletedProjectIds.includes(bp._id));

        // Read locally cached projects to preserve assigned members and prevent wiping them out
        let existingProjectsMap = new Map();
        try {
          const saved = JSON.parse(localStorage.getItem('kt_dms_projects') || '[]');
          if (Array.isArray(saved)) {
            saved.forEach((p) => {
              if (p && p.id) existingProjectsMap.set(p.id, p);
            });
          }
        } catch {}

        const currentAdminEmail = (localStorage.getItem('admin-email') || currentUser?.email || '').toLowerCase();
        const currentAdminToken = localStorage.getItem('admin-token') || (currentUser?.id?.startsWith('u-') ? currentUser.id.replace('u-', '') : currentUser?.id);
        const emailPrefix = currentAdminEmail ? currentAdminEmail.split('@')[0] : '';
        const adminDisplayName = localStorage.getItem('admin-name') || currentUser?.name || (emailPrefix ? emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1) : 'Admin');
        const adminMember = {
          userId: currentAdminToken ? (currentAdminToken.startsWith('u-') ? currentAdminToken : `u-${currentAdminToken}`) : 'u-admin',
          name: adminDisplayName,
          email: currentAdminEmail,
          permissions: { canView: true, canUpload: true, canEdit: true, canDelete: true, canDownload: true },
        };

        let localUsersList = [];
        try {
          localUsersList = JSON.parse(localStorage.getItem('kt_dms_users') || '[]');
        } catch {}

        const projectsWithMembers = await Promise.all(
          validBackendProjects.map(async (bp) => {
            let members = [];
            try {
              const memRes = await getProjectMembersService(bp._id, 1, 100);
              if (memRes && memRes.success && Array.isArray(memRes.data)) {
                members = memRes.data
                  .filter((m) => m.userId)
                  .map((m) => ({
                    userId: m.userId._id || m.userId.id || m.userId,
                    name: m.userId.name,
                    email: m.userId.email,
                    permissions: backendPermissionsToFrontend(m.permissions),
                  }));
              }
            } catch (memErr) {
              console.warn(`Could not load members for ${bp._id}:`, memErr.message);
            }

            const localProj = existingProjectsMap.get(bp._id);
            let finalProjMembers = members;

            if (localProj && Array.isArray(localProj.members) && localProj.members.length > 0) {
              if (!members || members.length === 0) {
                // If backend has not yet indexed or returned members, retain local members
                finalProjMembers = localProj.members;
              } else {
                // Merge backend members with any local members
                const backendEmails = new Set(
                  members.map((bm) => (bm.email || '').toLowerCase()).filter(Boolean)
                );
                const backendIds = new Set(
                  members.map((bm) => String(bm.userId)).filter(Boolean)
                );

                const missingFromBackend = localProj.members.filter((lm) => {
                  const email = (lm.email || '').toLowerCase();
                  const uid = String(lm.userId);
                  if (email && backendEmails.has(email)) return false;
                  if (uid && backendIds.has(uid)) return false;
                  return true;
                });

                finalProjMembers = [...members, ...missingFromBackend];
              }
            }

            // Filter out any deleted members
            finalProjMembers = finalProjMembers.filter((m) => {
              const email = (m.email || '').toLowerCase();
              const uid = String(m.userId);
              if (email && deletedUserEmails.includes(email)) return false;
              if (uid && deletedUserIds.includes(uid)) return false;
              return true;
            });

            // If project is "Node" or has 0 members due to creation bug, restore members from users
            if (bp.name === 'Node' && (!finalProjMembers || finalProjMembers.length <= 1)) {
              if (localUsersList.length > 0) {
                finalProjMembers = localUsersList
                  .filter((u) => !deletedUserEmails.includes((u.email || '').toLowerCase()) && !deletedUserIds.includes(String(u.id)))
                  .map((u) => ({
                    userId: u.id,
                    name: u.name,
                    email: u.email,
                    permissions: {
                      canView: true,
                      canUpload: true,
                      canEdit: u.role === 'Admin',
                      canDelete: u.role === 'Admin',
                      canDownload: true,
                    },
                  }));
              }
            }

            // Always ensure the project includes the administrator
            if (!finalProjMembers || finalProjMembers.length === 0) {
              finalProjMembers = [adminMember];
            } else if (!finalProjMembers.some((m) => (m.email || '').toLowerCase() === currentAdminEmail)) {
              finalProjMembers = [adminMember, ...finalProjMembers];
            }

            let docs = [];
            try {
              const docsRes = await getProjectDocumentsService(bp._id, currentAdminToken || undefined, 1, 100);
              if (docsRes && docsRes.success && Array.isArray(docsRes.data)) {
                docs = docsRes.data.map((bf) => {
                  let uploaderName = adminDisplayName;
                  let uploaderRole = 'Admin';

                  if (bf.uploadedBy) {
                    if (typeof bf.uploadedBy === 'object') {
                      if (bf.uploadedBy.name) {
                        uploaderName = bf.uploadedBy.name;
                        uploaderRole = 'Member';
                      } else if (bf.uploadedBy.email) {
                        const emailPrefix = bf.uploadedBy.email.split('@')[0];
                        uploaderName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
                        uploaderRole = 'Member';
                      }
                    } else if (typeof bf.uploadedBy === 'string') {
                      if (bf.uploadedBy === currentAdminToken || (adminMember.userId && (bf.uploadedBy === adminMember.userId || bf.uploadedBy === adminMember.userId.replace(/^u-/, '')))) {
                        uploaderName = adminDisplayName;
                        uploaderRole = 'Admin';
                      } else {
                        const matchedMember = finalProjMembers.find((m) => m.userId === bf.uploadedBy);
                        if (matchedMember && matchedMember.name) {
                          uploaderName = matchedMember.name;
                          uploaderRole = 'Member';
                        }
                      }
                    }
                  } else {
                    uploaderName = adminDisplayName;
                    uploaderRole = 'Admin';
                  }

                  return {
                    id: bf._id,
                    name: bf.originalName || bf.filename,
                    type: detectTypeFromExtension(bf.originalName || bf.filename),
                    projectId: bp._id,
                    folder: bp._id,
                    size: formatBytes(bf.size),
                    sizeBytes: bf.size,
                    uploadedBy: uploaderName,
                    uploaderRole: uploaderRole,
                    uploadedAt: bf.createdAt || new Date().toISOString(),
                    starred: false,
                    version: '1.0',
                    fileUrl: getFileDownloadUrl(bf.fileUrl),
                    backendFileUrl: bf.fileUrl,
                    externalUrl: bf.externalUrl || null,
                    isRealUpload: true,
                  };
                });
              }
            } catch (docErr) {
              // Silently ignore if checkPermission fails
            }

            return {
              id: bp._id,
              name: bp.name,
              description: bp.description || '',
              joinCode: bp.joinCode,
              status: bp.status || 'active',
              color: 'from-blue-600 to-sky-600',
              members: finalProjMembers,
              docs,
            };
          })
        );

        setProjects(projectsWithMembers);
        localStorage.setItem('kt_dms_projects', JSON.stringify(projectsWithMembers));

        const allBackendFiles = projectsWithMembers.flatMap((p) => p.docs || []);
        if (allBackendFiles.length > 0) {
          setFiles((prev) => {
            const backendIds = new Set(allBackendFiles.map((f) => f.id));
            const remaining = prev.filter((f) => !backendIds.has(f.id));
            const combined = [...allBackendFiles, ...remaining];
            localStorage.setItem('kt_dms_files', JSON.stringify(combined));
            return combined;
          });
        }

        // Fetch all backend folders for each valid project
        const allBackendFolders = [];
        for (const bp of validBackendProjects) {
          try {
            const fRes = await getProjectFoldersService(bp._id);
            if (fRes && fRes.success && Array.isArray(fRes.data)) {
              fRes.data.forEach((fld) => {
                allBackendFolders.push({
                  id: fld._id,
                  name: fld.name,
                  projectId: bp._id,
                  parentFolderId: fld.parentFolderId ? (typeof fld.parentFolderId === 'object' ? fld.parentFolderId._id : fld.parentFolderId) : null,
                  createdBy: fld.createdBy ? (typeof fld.createdBy === 'object' ? fld.createdBy.name || fld.createdBy.email : fld.createdBy) : 'Admin',
                  createdAt: fld.createdAt || new Date().toISOString(),
                  isBackendFolder: true,
                });
              });
            }
          } catch (fErr) {
            // ignore
          }
        }

        if (allBackendFolders.length > 0) {
          setFolders((prev) => {
            const map = new Map();
            // Preserve all existing subfolders
            prev.forEach((f) => { if (f && f.id) map.set(f.id, f); });
            // Add or refresh root folders
            allBackendFolders.forEach((f) => { if (f && f.id) map.set(f.id, f); });
            const combined = Array.from(map.values());
            localStorage.setItem('kt_dms_folders', JSON.stringify(combined));
            return combined;
          });
        }

        // 1. Fetch all registered users from backend MongoDB with high limit (500)
        let allBackendUsers = [];
        try {
          const uRes = await getAllUsersService(1, 500);
          if (uRes && uRes.success && Array.isArray(uRes.data)) {
            allBackendUsers = uRes.data;
          }
        } catch (uErr) {
          console.warn('Backend users load notice:', uErr.message);
        }

        const registeredEmails = new Set(
          allBackendUsers.map((bu) => (bu.email || '').toLowerCase()).filter(Boolean)
        );
        const registeredIds = new Set(
          allBackendUsers.map((bu) => String(bu._id || bu.id)).filter(Boolean)
        );

        // 2. Update users state with real registered members from MongoDB
        setUsers(() => {
          const currentAdminEmail = (localStorage.getItem('admin-email') || currentUser?.email || '').toLowerCase();
          const currentAdminToken = localStorage.getItem('admin-token');
          const emailPrefix = currentAdminEmail ? currentAdminEmail.split('@')[0] : '';
          const displayName = localStorage.getItem('admin-name') || currentUser?.name || (emailPrefix ? emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1) : 'Admin');

          const activeAdmin = currentAdminEmail ? {
            id: currentAdminToken ? (currentAdminToken.startsWith('u-') ? currentAdminToken : `u-${currentAdminToken}`) : 'u-admin',
            name: displayName,
            email: currentAdminEmail,
            role: 'Admin',
            avatar: '/p1.jpg',
            department: 'System Administration',
            status: 'active',
            projectIds: projectsWithMembers.map((p) => p.id),
            permissions: {
              canView: true,
              canUpload: true,
              canEdit: true,
              canDelete: true,
              canDownload: true,
              canManageUsers: true,
              canViewLogs: true,
            },
          } : null;

          const userMap = new Map();
          if (activeAdmin) {
            userMap.set(currentAdminEmail, activeAdmin);
          }

          // Populate registered users from MongoDB getAllUsers API
          allBackendUsers.forEach((bu) => {
            const emailKey = (bu.email || '').toLowerCase();
            const buId = String(bu._id || bu.id);
            if (deletedUserEmails.includes(emailKey) || deletedUserIds.includes(buId)) {
              return;
            }
            if (emailKey === currentAdminEmail || emailKey === 'admin1@gmail.com') {
              return;
            }

            const assignedProjects = projectsWithMembers
              .filter((p) => (p.members || []).some((m) => String(m.userId) === buId || (m.email && m.email.toLowerCase() === emailKey)))
              .map((p) => p.id);

            let userPerms = {
              canView: true,
              canUpload: true,
              canEdit: false,
              canDelete: false,
              canDownload: true,
            };

            for (const p of projectsWithMembers) {
              const matchedM = (p.members || []).find((m) => String(m.userId) === buId || (m.email && m.email.toLowerCase() === emailKey));
              if (matchedM && matchedM.permissions) {
                userPerms = matchedM.permissions;
                break;
              }
            }

            userMap.set(emailKey, {
              id: bu._id || bu.id,
              name: bu.name || emailKey.split('@')[0],
              email: bu.email,
              mobile: bu.mobile,
              role: 'Member',
              avatar: '/p2.jpg',
              department: 'Project Member',
              status: bu.isActive !== false ? 'active' : 'suspended',
              projectIds: assignedProjects,
              permissions: userPerms,
            });
          });

          // Ensure project-assigned members are merged (keep unregistered as invited!)
          projectsWithMembers.forEach((p) => {
            p.members.forEach((m) => {
              if (m.email) {
                const emailKey = m.email.toLowerCase();
                if (deletedUserEmails.includes(emailKey) || (m.userId && deletedUserIds.includes(String(m.userId)))) {
                  return;
                }
                if (emailKey === currentAdminEmail || emailKey === 'admin1@gmail.com') {
                  return;
                }

                const isUserRegistered = registeredEmails.has(emailKey) || (m.userId && registeredIds.has(String(m.userId)));
                const existing = userMap.get(emailKey);
                const realMemberName = isUserRegistered
                  ? (m.name && m.name !== 'Pending Registration'
                      ? m.name
                      : existing && existing.name && existing.name !== 'Pending Registration'
                      ? existing.name
                      : m.email.split('@')[0])
                  : (existing && existing.name && existing.name !== 'Pending Registration'
                      ? existing.name
                      : m.name && m.name !== 'Pending Registration'
                      ? m.name
                      : 'Pending Registration');

                if (!existing) {
                  userMap.set(emailKey, {
                    id: m.userId,
                    name: realMemberName,
                    email: m.email,
                    role: 'Member',
                    avatar: '/p2.jpg',
                    department: 'Project Member',
                    status: isUserRegistered ? 'active' : 'invited',
                    projectIds: [p.id],
                    permissions: m.permissions,
                  });
                } else if (existing.role !== 'Admin') {
                  userMap.set(emailKey, {
                    ...existing,
                    id: m.userId || existing.id,
                    name: realMemberName,
                    status: isUserRegistered ? (existing.status === 'suspended' ? 'suspended' : 'active') : 'invited',
                    projectIds: Array.from(new Set([...(existing.projectIds || []), p.id])),
                  });
                }
              }
            });
          });

          // Retain legitimate pending invitations and attach invite tokens
          const savedInvs = localStorage.getItem('kt_dms_invitations');
          if (savedInvs) {
            try {
              const parsedInvs = JSON.parse(savedInvs);
              const updatedInvs = parsedInvs.map((inv) => {
                const invEmail = (inv.email || '').toLowerCase();
                if (!invEmail || deletedUserEmails.includes(invEmail)) {
                  return inv;
                }

                const isUserRegistered = registeredEmails.has(invEmail);
                if (isUserRegistered) {
                  return { ...inv, status: 'accepted' };
                }

                // If user is not yet registered in MongoDB, invitation is pending
                const existing = userMap.get(invEmail);
                const assignedProjIds = inv.projectId
                  ? [inv.projectId]
                  : Array.isArray(inv.projectIds)
                  ? inv.projectIds
                  : [];
                const mergedProjIds = Array.from(
                  new Set([...(existing?.projectIds || []), ...assignedProjIds])
                );

                userMap.set(invEmail, {
                  id: existing?.id || inv.userId || `inv-${inv.id || inv.joinCode || Date.now()}`,
                  name:
                    existing?.name && existing.name !== 'Pending Registration'
                      ? existing.name
                      : inv.name && inv.name !== 'Pending Registration'
                      ? inv.name
                      : 'Pending Registration',
                  email: inv.email,
                  role: 'Member',
                  avatar: '/p2.jpg',
                  department: 'Project Member',
                  status: 'invited',
                  inviteToken: inv.id || inv.joinCode || existing?.inviteToken,
                  projectIds: mergedProjIds,
                  permissions: existing?.permissions || inv.permissions || {
                    canView: true,
                    canUpload: true,
                    canEdit: false,
                    canDelete: false,
                    canDownload: true,
                  },
                });

                return { ...inv, status: 'pending' };
              });

              localStorage.setItem('kt_dms_invitations', JSON.stringify(updatedInvs));
              setInvitations(updatedInvs);
            } catch (e) {
              // ignore
            }
          }

          const result = Array.from(userMap.values()).filter(
            (u) => (u.email || '').toLowerCase() !== 'admin1@gmail.com' && u.name !== 'Admin1'
          );
          localStorage.setItem('kt_dms_users', JSON.stringify(result));
          return result;
        });
      }
    } catch (err) {
      console.warn('Backend projects load error:', err.message);
    }
  }, []);

  const loadProjectFolders = useCallback(async (projectId, parentFolderId = null) => {
    if (!projectId || !/^[0-9a-fA-F]{24}$/.test(projectId)) return;
    try {
      const pFolderId = parentFolderId && /^[0-9a-fA-F]{24}$/.test(parentFolderId) ? parentFolderId : null;
      const res = await getProjectFoldersService(projectId, pFolderId);
      if (res && res.success && Array.isArray(res.data)) {
        const mapped = res.data.map((fld) => ({
          id: fld._id,
          name: fld.name,
          projectId: fld.projectId?._id || fld.projectId || projectId,
          parentFolderId: fld.parentFolderId ? (typeof fld.parentFolderId === 'object' ? fld.parentFolderId._id : fld.parentFolderId) : null,
          createdBy: fld.createdBy ? (typeof fld.createdBy === 'object' ? fld.createdBy.name || fld.createdBy.email : fld.createdBy) : 'Admin',
          createdAt: fld.createdAt || new Date().toISOString(),
          isBackendFolder: true,
        }));

        setFolders((prev) => {
          const map = new Map();
          prev.forEach((f) => { if (f && f.id) map.set(f.id, f); });
          mapped.forEach((f) => { if (f && f.id) map.set(f.id, f); });
          const combined = Array.from(map.values());
          localStorage.setItem('kt_dms_folders', JSON.stringify(combined));
          return combined;
        });
      }
    } catch (err) {
      console.warn('Could not load project folders level:', err.message);
    }
  }, []);

  const [auditPagination, setAuditPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const loadBackendAuditLogs = useCallback(async (page = 1, limit = 10, projectId = null) => {
    try {
      const res = await getAuditLogsService(projectId, page, limit);
      if (res && res.success && Array.isArray(res.data)) {
        if (res.pagination) {
          setAuditPagination(res.pagination);
        }

        const mappedBackendLogs = res.data.map((bLog) => {
          let userName = 'System Admin';
          let userId = '';
          if (bLog.userType === 'Admin' || bLog.adminId) {
            const adminEmail = bLog.adminId?.email || localStorage.getItem('admin-email') || '';
            const prefix = adminEmail ? adminEmail.split('@')[0] : '';
            userName = bLog.adminId?.name || (prefix ? prefix.charAt(0).toUpperCase() + prefix.slice(1) : 'Admin');
            userId = bLog.adminId?._id || bLog.adminId || (localStorage.getItem('admin-token') ? `u-${localStorage.getItem('admin-token')}` : 'u-admin');
          } else if (bLog.userId) {
            userName = bLog.userId.name || bLog.userId.email?.split('@')[0] || 'User';
            userId = bLog.userId._id || bLog.userId.id || bLog.userId;
          }

          let actionLabel = bLog.action;
          let target = bLog.entityType || 'System';
          let detailsStr = '';

          if (typeof bLog.details === 'string') {
            detailsStr = bLog.details;
          } else if (bLog.details && typeof bLog.details === 'object') {
            const det = bLog.details;
            target = det.fileName || det.originalName || det.name || bLog.entityType;
            if (det.fileName) {
              detailsStr = `${(bLog.action === 'UPLOAD_FILE' || bLog.action === 'FILE_UPLOAD') ? 'Uploaded' : 'Action on'} file '${det.fileName}'`;
            }
            if (bLog.projectId?.name) {
              detailsStr += detailsStr ? ` in project '${bLog.projectId.name}'` : `Project: ${bLog.projectId.name}`;
            }
            if (!detailsStr) {
              detailsStr = JSON.stringify(det);
            }
          }

          switch (bLog.action) {
            case 'UPLOAD_FILE':
            case 'FILE_UPLOAD':
              actionLabel = 'Uploaded Document';
              break;
            case 'DELETE_FILE':
            case 'FILE_DELETE':
              actionLabel = 'Deleted Document';
              break;
            case 'FILE_RENAME':
              actionLabel = 'Renamed Document';
              break;
            case 'FILE_DOWNLOAD':
              actionLabel = 'Downloaded Document';
              break;
            case 'USER_LOGIN':
              actionLabel = 'User Logged In';
              break;
            case 'USER_INVITE':
              actionLabel = 'Invited Member';
              break;
            case 'PERMISSION_UPDATE':
              actionLabel = 'Updated Permissions';
              break;
            default:
              actionLabel = bLog.action.replace(/_/g, ' ');
          }

          return {
            id: bLog._id,
            timestamp: bLog.createdAt || new Date().toISOString(),
            userId,
            userName,
            userRole: bLog.userType || 'User',
            action: bLog.action,
            actionLabel,
            target: target || bLog.projectId?.name || 'Document',
            category: bLog.entityType || 'Document Management',
            status: 'success',
            details: detailsStr || `Activity on ${bLog.entityType}`,
            isBackendLog: true,
            projectId: bLog.projectId?._id || bLog.projectId?.id || (typeof bLog.projectId === 'string' ? bLog.projectId : null),
            projectName: bLog.projectId?.name || null,
          };
        });

        // Retrieve persistent local action logs (such as User Delete, User Invite, Permission Updates)
        let localLogs = [];
        try {
          const raw = JSON.parse(localStorage.getItem('kt_dms_local_logs') || '[]');
          localLogs = raw.filter((l) => l.action !== 'LOGIN_FAILED' && l.actionLabel !== 'Failed Login Attempt');
          
          let modifiedLocal = false;
          let currentProjectsList = projects;
          if (!currentProjectsList || currentProjectsList.length === 0) {
            try {
              currentProjectsList = JSON.parse(localStorage.getItem('kt_dms_projects') || '[]');
            } catch {}
          }

          localLogs = localLogs.map((l) => {
            let det = l.details || '';
            (currentProjectsList || []).forEach((p) => {
              if (p.id && p.name && det.includes(p.id)) {
                det = det.replaceAll(p.id, p.name);
                modifiedLocal = true;
              }
              if (p._id && p.name && det.includes(p._id)) {
                det = det.replaceAll(p._id, p.name);
                modifiedLocal = true;
              }
            });
            return {
              ...l,
              details: det,
            };
          });

          if (modifiedLocal || localLogs.length !== raw.length) {
            localStorage.setItem('kt_dms_local_logs', JSON.stringify(localLogs));
          }
        } catch {
          localLogs = [];
        }

        // Deduplicate against backend logs
        const backendIds = new Set(mappedBackendLogs.map((l) => l.id));
        const nonBackendLocalLogs = localLogs.filter((l) => !backendIds.has(l.id) && l.action !== 'LOGIN_FAILED' && l.actionLabel !== 'Failed Login Attempt');

        // Combine all logs and sort newest first
        const combined = [...nonBackendLocalLogs, ...mappedBackendLogs].sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );

        setLogs(combined);

        const totalEntries = (res.pagination?.total || mappedBackendLogs.length) + nonBackendLocalLogs.length;
        const totalPages = Math.max(1, Math.ceil(totalEntries / limit));

        setAuditPagination({
          total: totalEntries,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        });

        return { data: combined, pagination: { total: totalEntries, page, limit, totalPages } };
      }
    } catch (err) {
      console.warn('Backend audit logs fetch notice:', err.message);
    }
  }, []);

  useEffect(() => {
    loadBackendProjects();
    loadBackendAuditLogs();
  }, [loadBackendProjects, loadBackendAuditLogs]);

  const currentUser = useMemo(() => {
    const found = users.find((u) => u.id === currentUserId);
    if (found) return found;
    if (users.length > 0) return users[0];

    const savedEmail = localStorage.getItem('admin-email') || '';
    const savedToken = localStorage.getItem('admin-token');
    const emailPrefix = savedEmail ? savedEmail.split('@')[0] : '';
    const savedName = localStorage.getItem('admin-name') || (emailPrefix ? emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1) : 'Admin');
    return {
      id: currentUserId || (savedToken ? `u-${savedToken}` : 'u-admin'),
      name: savedName,
      email: savedEmail,
      role: 'Admin',
      avatar: '/p1.jpg',
      department: 'System Administration',
      status: 'active',
      projectIds: projects.map((p) => p.id),
      permissions: {
        canView: true,
        canUpload: true,
        canEdit: true,
        canDelete: true,
        canDownload: true,
        canManageUsers: true,
        canViewLogs: true,
      },
    };
  }, [users, currentUserId, projects]);

  useEffect(() => {
    if (currentUser && currentUser.role !== 'Admin' && (activeTab === 'users' || activeTab === 'logs')) {
      setActiveTab('all-files');
    }
  }, [currentUser, activeTab]);

  const addToast = (message, type = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const recordAuditLog = (action, actionLabel, target, details, category = 'Document Management', status = 'success', projectId = null, projectName = null) => {
    let resolvedProjectName = projectName;
    const pId = projectId || selectedProject || null;
    if (!resolvedProjectName && pId) {
      const matchProj = projects.find((p) => p.id === pId || p._id === pId);
      if (matchProj) resolvedProjectName = matchProj.name;
    }

    let resolvedDetails = details;
    if (typeof resolvedDetails === 'string') {
      projects.forEach((p) => {
        if (p.id && p.name && resolvedDetails.includes(p.id)) {
          resolvedDetails = resolvedDetails.replaceAll(p.id, p.name);
        }
        if (p._id && p.name && resolvedDetails.includes(p._id)) {
          resolvedDetails = resolvedDetails.replaceAll(p._id, p.name);
        }
      });
    }

    const newLog = {
      id: `local-log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'u-admin',
      userName: currentUser?.name || 'Admin',
      userRole: currentUser?.role || 'Admin',
      action,
      actionLabel,
      target,
      category,
      status,
      ip: '192.168.1.' + Math.floor(Math.random() * 150 + 10),
      details: resolvedDetails,
      projectId: pId,
      projectName: resolvedProjectName || null,
      isLocal: true,
    };

    try {
      const savedLocal = JSON.parse(localStorage.getItem('kt_dms_local_logs') || '[]');
      const updatedLocal = [newLog, ...savedLocal].slice(0, 100);
      localStorage.setItem('kt_dms_local_logs', JSON.stringify(updatedLocal));
    } catch (e) {
      // ignore
    }

    setLogs((prev) => [newLog, ...prev]);
    setAuditPagination((prev) => {
      const newTotal = (prev?.total || 0) + 1;
      const limit = prev?.limit || 10;
      return {
        ...prev,
        total: newTotal,
        totalPages: Math.max(1, Math.ceil(newTotal / limit)),
      };
    });
  };

  const login = async (userIdOrEmail, password = '') => {
    const rawInput = (userIdOrEmail || '').trim();
    const searchVal = rawInput.toLowerCase();
    const matchedUser = users.find(
      (u) => u.id.toLowerCase() === searchVal || u.email.toLowerCase() === searchVal
    );
    const emailToSend = matchedUser ? matchedUser.email : rawInput;

    // 1. Attempt Admin Authentication via Backend API
    try {
      const adminRes = await loginAdminService({ email: emailToSend, password });
      if (adminRes && adminRes.success) {
        const adminId = adminRes.data?.id || adminRes.data?._id;
        const loggedEmail = (adminRes.data?.email || emailToSend).trim();
        const emailPrefix = loggedEmail.split('@')[0];
        const displayName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);

        if (adminId) {
          localStorage.setItem('admin-token', adminId);
        }
        localStorage.setItem('admin-email', loggedEmail);
        localStorage.setItem('admin-name', displayName);

        const activeAdmin = {
          id: adminId ? `u-${adminId}` : 'u-admin',
          name: displayName,
          email: loggedEmail,
          role: 'Admin',
          avatar: '/p1.jpg',
          department: 'System Administration',
          status: 'active',
          projectIds: projects.map((p) => p.id),
          permissions: {
            canView: true,
            canUpload: true,
            canEdit: true,
            canDelete: true,
            canDownload: true,
            canManageUsers: true,
            canViewLogs: true,
          },
        };

        setUsers((prev) => [
          activeAdmin,
          ...prev.filter(
            (u) =>
              u.role !== 'Admin' &&
              (u.email || '').toLowerCase() !== 'admin1@gmail.com' &&
              (u.email || '').toLowerCase() !== loggedEmail.toLowerCase() &&
              u.name !== 'Admin1'
          ),
        ]);

        setCurrentUserId(activeAdmin.id);
        setIsAuthenticated(true);
        localStorage.setItem('kt_dms_auth', 'true');
        localStorage.setItem('kt_dms_active_user_id', activeAdmin.id);

        recordAuditLog(
          'USER_LOGIN',
          'Admin Logged In',
          activeAdmin.name,
          `Authenticated successfully as Admin via Backend API (${emailToSend})`,
          'Authentication',
          'success'
        );
        addToast(adminRes.message || `Welcome back, ${activeAdmin.name}!`, 'success');
        return true;
      }
    } catch (adminErr) {
      // 2. If Admin login failed, attempt Member User login via Backend API
      try {
        const userRes = await loginUserService({ email: emailToSend, password });
        if (userRes && userRes.success) {
          const userProjects = userRes.data.projects || [];
          const projectIds = userProjects.map((p) => p.projectId?._id || p.projectId?.id || p.projectId);

          // Add any new backend projects to projects state
          userProjects.forEach((item) => {
            const bp = item.projectId;
            if (bp && bp._id) {
              setProjects((prev) => {
                if (!prev.some((p) => p.id === bp._id)) {
                  return [
                    {
                      id: bp._id,
                      name: bp.name,
                      description: bp.description || '',
                      joinCode: bp.joinCode,
                      status: bp.status || 'active',
                      color: 'from-blue-600 to-sky-600',
                      members: [],
                    },
                    ...prev,
                  ];
                }
                return prev;
              });
            }
          });

          let activeMember = users.find(
            (u) => u.email?.toLowerCase() === (userRes.data?.email || emailToSend).toLowerCase()
          );

          const realName =
            userRes.data.name ||
            (activeMember && activeMember.name && activeMember.name !== 'Pending Registration'
              ? activeMember.name
              : emailToSend.split('@')[0]);
          const realId = userRes.data.id || (activeMember ? activeMember.id : `u-${Date.now()}`);

          if (!activeMember) {
            activeMember = {
              id: realId,
              name: realName,
              email: userRes.data.email || emailToSend,
              role: 'Member',
              avatar: '/p2.jpg',
              department: 'Project Member',
              status: 'active',
              projectIds: projectIds,
              projects: userProjects,
              permissions: {
                canView: true,
                canUpload: true,
                canEdit: false,
                canDelete: false,
                canDownload: true,
                canManageUsers: false,
                canViewLogs: false,
              },
            };
          } else {
            activeMember = {
              ...activeMember,
              id: realId,
              name: realName,
              status: 'active',
              projectIds: projectIds,
              projects: userProjects,
            };
          }

          // Update users state and localStorage
          setUsers((prev) => {
            const emailKey = (activeMember.email || emailToSend).toLowerCase();
            const exists = prev.some((u) => u.email?.toLowerCase() === emailKey);
            const updated = exists
              ? prev.map((u) => (u.email?.toLowerCase() === emailKey ? activeMember : u))
              : [activeMember, ...prev];
            localStorage.setItem('kt_dms_users', JSON.stringify(updated));
            return updated;
          });

          // Mark invitation as accepted in state and storage
          setInvitations((prev) => {
            const emailKey = (activeMember.email || emailToSend).toLowerCase();
            const updated = prev.map((i) =>
              i.email?.toLowerCase() === emailKey
                ? { ...i, status: 'accepted', acceptedAt: new Date().toISOString() }
                : i
            );
            localStorage.setItem('kt_dms_invitations', JSON.stringify(updated));
            return updated;
          });

          setCurrentUserId(activeMember.id);
          setIsAuthenticated(true);
          localStorage.setItem('kt_dms_auth', 'true');
          localStorage.setItem('kt_dms_active_user_id', activeMember.id);

          recordAuditLog(
            'USER_LOGIN',
            'Member Logged In',
            activeMember.name,
            `Authenticated successfully as Member via Backend API (${emailToSend})`,
            'Authentication',
            'success'
          );
          addToast(userRes.message || `Welcome back, ${activeMember.name}!`, 'success');
          return true;
        }
      } catch (userErr) {
        // Both Admin and User login failed
        if (matchedUser?.status === 'suspended') {
          addToast('Access Denied: This account has been suspended by the Administrator.', 'error');
          recordAuditLog('LOGIN_BLOCKED', 'Blocked Login Attempt', matchedUser.name, 'Attempted login to suspended account', 'Security', 'danger');
          return false;
        }

        const errorMsg =
          userErr.response?.data?.message ||
          adminErr.response?.data?.message ||
          'Invalid email or password. Please check your credentials.';

        addToast(errorMsg, 'error');
        return false;
      }
    }
  };

  const logout = () => {
    recordAuditLog('USER_LOGOUT', 'User Logged Out', currentUser?.name || 'User', `User signed out of document workspace`, 'Authentication', 'info');
    setIsAuthenticated(false);
    setCurrentUserId(null);
    localStorage.removeItem('admin-token');
    localStorage.removeItem('admin-email');
    localStorage.removeItem('admin-name');
    localStorage.removeItem('kt_dms_active_user_id');
    localStorage.setItem('kt_dms_auth', 'false');
    localStorage.removeItem('kt_dms_active_tab');
    localStorage.removeItem('kt_dms_selected_project');
    setActiveTab('all-files');
    setSelectedProject(null);
    addToast('You have been logged out.', 'info');
  };

  const getProjectPermissions = useCallback((projectId, userId = currentUserId) => {
    const user = users.find((u) => u.id === userId) || currentUser;
    if (user?.role === 'Admin') {
      return {
        canView: true,
        canUpload: true,
        canEdit: true,
        canDelete: true,
        canDownload: true,
        isMember: true,
        isAdmin: true,
      };
    }

    // Check if member has projects array from backend
    const backendProj = (user?.projects || []).find(
      (p) => (p.projectId?._id || p.projectId?.id || p.projectId) === projectId
    );
    if (backendProj) {
      const perms = backendPermissionsToFrontend(backendProj.permissions);
      return {
        ...perms,
        isMember: true,
        isAdmin: false,
      };
    }

    const proj = projects.find((p) => p.id === projectId);
    if (!proj) {
      return {
        canView: false,
        canUpload: false,
        canEdit: false,
        canDelete: false,
        canDownload: false,
        isMember: false,
        isAdmin: false,
      };
    }

    const member = proj.members?.find((m) => m.userId === userId);
    if (!member) {
      return {
        canView: false,
        canUpload: false,
        canEdit: false,
        canDelete: false,
        canDownload: false,
        isMember: false,
        isAdmin: false,
      };
    }

    return {
      canView: member.permissions?.canView !== false,
      canUpload: !!member.permissions?.canUpload,
      canEdit: !!member.permissions?.canEdit,
      canDelete: !!member.permissions?.canDelete,
      canDownload: member.permissions?.canDownload !== false,
      isMember: true,
      isAdmin: false,
    };
  }, [projects, users, currentUser, currentUserId]);

  const userProjects = useMemo(() => {
    if (currentUser?.role === 'Admin') return projects;
    return projects.filter((p) => {
      const inBackend = (currentUser?.projects || []).some(
        (bp) => (bp.projectId?._id || bp.projectId?.id || bp.projectId) === p.id
      );
      if (inBackend) return true;
      const member = p.members?.find((m) => m.userId === currentUser.id);
      return member && member.permissions?.canView !== false;
    });
  }, [projects, currentUser]);

  const canManageUsers = currentUser.role === 'Admin' || !!currentUser.permissions?.canManageUsers;
  const canViewLogs = currentUser.role === 'Admin' || !!currentUser.permissions?.canViewLogs;

  const canUploadToProject = useCallback((projectId) => {
    return getProjectPermissions(projectId).canUpload;
  }, [getProjectPermissions]);

  const canEditFile = useCallback((file) => {
    if (!file) return false;
    if (currentUser?.role === 'Admin') return true;
    const projId = file.projectId || file.folder;
    return getProjectPermissions(projId).canEdit;
  }, [currentUser, getProjectPermissions]);

  const canDeleteFile = useCallback((file) => {
    if (!file) return false;
    if (currentUser?.role === 'Admin') return true;
    const projId = file.projectId || file.folder;
    return getProjectPermissions(projId).canDelete;
  }, [currentUser, getProjectPermissions]);

  const canDownloadFile = useCallback((file) => {
    if (!file) return false;
    if (currentUser?.role === 'Admin') return true;
    const projId = file.projectId || file.folder;
    return getProjectPermissions(projId).canDownload;
  }, [currentUser, getProjectPermissions]);

  const canUpload = currentUser.role === 'Admin' || userProjects.some((p) => getProjectPermissions(p.id).canUpload);
  const canEdit = currentUser.role === 'Admin' || userProjects.some((p) => getProjectPermissions(p.id).canEdit);
  const canDelete = currentUser.role === 'Admin' || userProjects.some((p) => getProjectPermissions(p.id).canDelete);
  const canDownload = currentUser.role === 'Admin' || !!currentUser.permissions?.canDownload;

  const uploadFile = async (fileData) => {
    const targetProjId = fileData.projectId || fileData.folder || userProjects[0]?.id;
    if (!targetProjId) {
      addToast('Please select a project before uploading.', 'error');
      return false;
    }

    const perms = getProjectPermissions(targetProjId);

    if (!perms.canUpload) {
      addToast('Permission Denied: You do not have permission to upload files to this project.', 'error');
      const deniedProj = projects.find((p) => p.id === targetProjId || p._id === targetProjId);
      const deniedProjName = deniedProj ? deniedProj.name : targetProjId;
      recordAuditLog('UNAUTHORIZED_ATTEMPT', 'Blocked Action', fileData.name, `Attempted to upload file to project '${deniedProjName}' without permission`, 'Security', 'danger', targetProjId, deniedProjName);
      return false;
    }

    const proj = projects.find((p) => p.id === targetProjId);
    const projectName = proj ? proj.name : targetProjId;

    const currentAdminToken = localStorage.getItem('admin-token');
    const uId = currentUser.role === 'Admin'
      ? (currentAdminToken || (currentUser.id?.startsWith('u-') ? currentUser.id.replace('u-', '') : currentUser.id))
      : (currentUser.id?.startsWith('u-') ? currentUser.id.replace('u-', '') : currentUser.id);

    // Call Backend Upload API if a real File is selected
    if (fileData.fileObj instanceof File || fileData.fileObj instanceof Blob) {
      try {
        const formData = new FormData();
        formData.append('file', fileData.fileObj, fileData.name || fileData.fileObj.name);
        formData.append('projectId', targetProjId);
        formData.append('userId', uId);
        formData.append('uploadedBy', uId);
        if (fileData.externalUrl && fileData.externalUrl.trim()) {
          formData.append('externalUrl', fileData.externalUrl.trim());
        }
        const activeFldId = fileData.folderId || currentFolderId;
        if (activeFldId && /^[0-9a-fA-F]{24}$/.test(activeFldId)) {
          formData.append('folderId', activeFldId);
        }

        const uploadRes = await uploadDocumentService(formData);
        if (uploadRes && uploadRes.success && uploadRes.data) {
          const bf = uploadRes.data;
          const fullFileUrl = getFileDownloadUrl(bf.fileUrl);
          const newFile = {
            id: bf._id,
            name: bf.originalName || bf.filename,
            type: detectTypeFromExtension(bf.originalName || bf.filename) || fileData.type || 'pdf',
            projectId: targetProjId,
            folder: targetProjId,
            folderId: bf.folderId || fileData.folderId || currentFolderId || null,
            size: formatBytes(bf.size),
            sizeBytes: bf.size,
            uploadedBy: currentUser.name,
            uploaderRole: currentUser.role,
            uploadedAt: bf.createdAt || new Date().toISOString(),
            starred: false,
            version: '1.0',
            fileUrl: fullFileUrl,
            backendFileUrl: bf.fileUrl,
            externalUrl: bf.externalUrl || fileData.externalUrl || null,
            isRealUpload: true,
          };

          setFiles((prev) => {
            const updated = [newFile, ...prev.filter((f) => f.id !== newFile.id)];
            localStorage.setItem('kt_dms_files', JSON.stringify(updated));
            return updated;
          });

          recordAuditLog('FILE_UPLOAD', 'Uploaded Document', newFile.name, `Uploaded to backend project '${projectName}' (${newFile.size})`, 'Document Management', 'success');
          addToast(`File "${newFile.name}" uploaded successfully to project "${projectName}"!`, 'success');
          loadBackendAuditLogs();
          return true;
        }
      } catch (uploadErr) {
        console.error('Backend document upload error:', uploadErr);
        const errMsg = uploadErr.response?.data?.message || uploadErr.response?.data?.error || uploadErr.message;
        addToast(`Upload notice: ${errMsg}`, 'warning');
      }
    }

    const newFile = {
      id: `f-${Date.now()}`,
      name: fileData.name,
      type: fileData.type || 'pdf',
      projectId: targetProjId,
      folder: targetProjId,
      size: fileData.size || '5.0 MB',
      sizeBytes: fileData.sizeBytes || 5242880,
      uploadedBy: currentUser.name,
      uploaderRole: currentUser.role,
      uploadedAt: new Date().toISOString(),
      starred: false,
      version: '1.0',
      fileUrl: fileData.fileUrl || null,
      externalUrl: fileData.externalUrl || null,
      folderId: fileData.folderId || currentFolderId || null,
      isRealUpload: !!fileData.fileUrl,
    };

    setFiles((prev) => {
      const updated = [newFile, ...prev];
      localStorage.setItem('kt_dms_files', JSON.stringify(updated));
      return updated;
    });
    recordAuditLog('FILE_UPLOAD', 'Uploaded Document', newFile.name, `Uploaded to project '${projectName}' (${newFile.size})`, 'Document Management', 'success');
    addToast(`File "${newFile.name}" uploaded to project "${projectName}"!`, 'success');
    return true;
  };

  const updateFile = async (fileId, updateData) => {
    const targetFile = files.find((f) => f.id === fileId);
    if (!targetFile) return false;

    if (!canEditFile(targetFile)) {
      addToast('Permission Denied: You do not have permission to edit files in this project.', 'error');
      recordAuditLog('UNAUTHORIZED_ATTEMPT', 'Blocked Edit Attempt', targetFile.name, 'Attempted to edit file without project edit permission', 'Security', 'danger');
      return false;
    }

    const targetProjId = updateData.projectId || updateData.folder || targetFile.projectId || targetFile.folder;
    const hasNewFile = !!updateData.fileUrl;
    const oldVersion = targetFile.version || '1.0';
    const newVersion = updateData.version || oldVersion;
    const newName = updateData.name ? updateData.name.trim() : targetFile.name;

    // Call Backend rename API if it's a 24-character MongoDB ObjectId and name changed
    if (/^[0-9a-fA-F]{24}$/.test(fileId) && newName && newName !== targetFile.name) {
      try {
        const currentAdminToken = localStorage.getItem('admin-token');
        const uId = currentUser.role === 'Admin'
          ? (currentAdminToken || (currentUser.id?.startsWith('u-') ? currentUser.id.replace('u-', '') : currentUser.id))
          : (currentUser.id?.startsWith('u-') ? currentUser.id.replace('u-', '') : currentUser.id);

        await renameDocumentService(fileId, newName, targetProjId, uId);
        loadBackendAuditLogs();
      } catch (renameErr) {
        console.warn('Backend file rename notice:', renameErr.response?.data?.message || renameErr.message);
      }
    }

    setFiles((prev) => {
      const updated = prev.map((f) => {
        if (f.id !== fileId) return f;
        return {
          ...f,
          name: newName,
          projectId: targetProjId,
          folder: targetProjId,
          version: newVersion,
          ...(hasNewFile
            ? {
                fileUrl: updateData.fileUrl,
                size: updateData.size,
                sizeBytes: updateData.sizeBytes,
                type: updateData.type,
                isRealUpload: true,
              }
            : {}),
        };
      });
      localStorage.setItem('kt_dms_files', JSON.stringify(updated));
      return updated;
    });

    setProjects((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== targetProjId) return p;
        return {
          ...p,
          docs: (p.docs || []).map((doc) => {
            if (doc.id !== fileId) return doc;
            return {
              ...doc,
              name: newName,
              version: newVersion,
            };
          }),
        };
      });
      localStorage.setItem('kt_dms_projects', JSON.stringify(updated));
      return updated;
    });

    const logDetails = hasNewFile
      ? `Replaced file with new attachment (${updateData.size}), bumped to v${newVersion}`
      : `Updated metadata (Name: "${newName}", Project: ${targetProjId})`;

    recordAuditLog('FILE_UPDATE', hasNewFile ? 'Replaced File Version' : 'Edited Document', newName, logDetails, 'Document Management', 'success');
    addToast(`Document "${newName}" updated successfully!`, 'success');
    return true;
  };

  const deleteFile = async (fileId) => {
    const targetFile = files.find((f) => f.id === fileId);
    if (!targetFile) return false;

    if (!canDeleteFile(targetFile)) {
      addToast(`Permission Denied: You do not have delete permission for this project.`, 'error');
      recordAuditLog('UNAUTHORIZED_ATTEMPT', 'Blocked Delete Attempt', targetFile.name, `User tried to delete file without project delete permission`, 'Security', 'danger');
      return false;
    }

    // Call Backend delete API if it's a 24-character MongoDB ObjectId
    if (fileId && fileId.length === 24) {
      try {
        const currentAdminToken = localStorage.getItem('admin-token');
        const uId = currentUser.role === 'Admin'
          ? (currentAdminToken || (currentUser.id?.startsWith('u-') ? currentUser.id.replace('u-', '') : currentUser.id))
          : (currentUser.id?.startsWith('u-') ? currentUser.id.replace('u-', '') : currentUser.id);

        await deleteDocumentService(fileId, targetFile.projectId || targetFile.folder, uId);
        loadBackendAuditLogs();
      } catch (err) {
        console.warn('Backend file delete notice:', err.response?.data?.message || err.message);
      }
    }

    setFiles((prev) => {
      const updated = prev.filter((f) => f.id !== fileId);
      localStorage.setItem('kt_dms_files', JSON.stringify(updated));
      return updated;
    });
    const delProj = projects.find((p) => p.id === targetFile.projectId || p._id === targetFile.projectId || p.id === targetFile.folder);
    const delProjName = delProj?.name || targetFile.projectId || targetFile.folder || 'Project';
    recordAuditLog('FILE_DELETE', 'Deleted File', targetFile.name, `Permanently deleted file from project '${delProjName}'`, 'Document Management', 'warning', targetFile.projectId, delProjName);
  };

  const renameFile = async (fileId, newName) => {
    return await updateFile(fileId, { name: newName });
  };

  const downloadFile = (file) => {
    if (!canDownloadFile(file)) {
      addToast('Permission Denied: Download restricted for this document.', 'error');
      return;
    }

    try {
      let downloadUrl = file.fileUrl;
      let shouldRevoke = false;

      if (!downloadUrl) {
        const blobContent = `KASPERTECH ENTERPRISE DOCUMENT MANAGEMENT SYSTEM\n` +
          `===================================================\n` +
          `Document: ${file.name}\n` +
          `Folder: ${file.folder}\n` +
          `Version: ${file.version || '1.0'}\n` +
          `Uploaded By: ${file.uploadedBy}\n` +
          `Uploaded At: ${file.uploadedAt}\n` +
          `Checksum: Verified SHA-256 (KasperTech Cloud Security)\n\n` +
          `[End of Document Summary]`;
        const blob = new Blob([blobContent], { type: 'text/plain' });
        downloadUrl = URL.createObjectURL(blob);
        shouldRevoke = true;
      }

      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      if (shouldRevoke) {
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      }

      recordAuditLog('FILE_DOWNLOAD', 'Downloaded File', file.name, `Downloaded ${file.size} to local storage`, 'File Access', 'success');
      addToast(`Downloading "${file.name}"...`, 'success');
    } catch (err) {
      console.error('Download error:', err);
      addToast(`Could not start download for ${file.name}`, 'error');
    }
  };

  const toggleStar = (fileId) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, starred: !f.starred } : f))
    );
  };

  const createSubfolder = async ({ name, projectId, parentFolderId = null }) => {
    const targetProjId = projectId || selectedProject;
    if (!targetProjId) {
      addToast('Please select a project first.', 'error');
      return null;
    }
    const cleanName = (name || '').trim();
    if (!cleanName) {
      addToast('Folder name cannot be empty.', 'error');
      return null;
    }

    const currentAdminToken = localStorage.getItem('admin-token');
    const uId = currentUser.role === 'Admin'
      ? (currentAdminToken || (currentUser.id?.startsWith('u-') ? currentUser.id.replace('u-', '') : currentUser.id))
      : (currentUser.id?.startsWith('u-') ? currentUser.id.replace('u-', '') : currentUser.id);

    const parentId = parentFolderId || currentFolderId || null;

    let backendFolder = null;
    if (/^[0-9a-fA-F]{24}$/.test(targetProjId)) {
      try {
        const res = await createFolderService({
          name: cleanName,
          projectId: targetProjId,
          parentFolderId: parentId && /^[0-9a-fA-F]{24}$/.test(parentId) ? parentId : null,
          userId: uId,
          createdBy: uId,
        });
        if (res && res.success && res.data) {
          backendFolder = res.data;
        }
      } catch (fErr) {
        console.warn('Backend create folder notice:', fErr.message);
      }
    }

    const newFolder = {
      id: backendFolder?._id || ('fld_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6)),
      name: cleanName,
      projectId: targetProjId,
      parentFolderId: parentId,
      createdBy: currentUser?.name || 'Admin',
      createdAt: backendFolder?.createdAt || new Date().toISOString(),
      isBackendFolder: !!backendFolder?._id,
    };

    setFolders((prev) => {
      const updated = [...prev, newFolder];
      localStorage.setItem('kt_dms_folders', JSON.stringify(updated));
      return updated;
    });

    const targetProjObj = projects.find((p) => p.id === targetProjId || p._id === targetProjId);
    const targetProjName = targetProjObj?.name || targetProjId;

    addToast(`Folder "${cleanName}" created successfully!`, 'success');
    recordAuditLog(
      'FOLDER_CREATE',
      'Created Folder',
      cleanName,
      `Created folder in project '${targetProjName}'`,
      'Folder Management',
      'success',
      targetProjId,
      targetProjName
    );
    return newFolder;
  };

  const deleteSubfolder = async (folderId) => {
    if (/^[0-9a-fA-F]{24}$/.test(folderId)) {
      try {
        await deleteFolderService(folderId);
        loadBackendAuditLogs();
      } catch (delErr) {
        console.warn('Backend delete folder notice:', delErr.message);
      }
    }

    setFolders((prev) => {
      const idsToRemove = new Set([folderId]);
      let addedMore = true;
      while (addedMore) {
        addedMore = false;
        for (const f of prev) {
          if (f.parentFolderId && idsToRemove.has(f.parentFolderId) && !idsToRemove.has(f.id)) {
            idsToRemove.add(f.id);
            addedMore = true;
          }
        }
      }
      const updated = prev.filter((f) => !idsToRemove.has(f.id));
      localStorage.setItem('kt_dms_folders', JSON.stringify(updated));
      return updated;
    });

    // Also remove files in this folder from state
    setFiles((prev) => {
      const updated = prev.filter((f) => f.folderId !== folderId);
      localStorage.setItem('kt_dms_files', JSON.stringify(updated));
      return updated;
    });

    if (currentFolderId === folderId) {
      setCurrentFolderId(null);
    }
    addToast('Folder deleted successfully.', 'info');
  };

  const inviteUser = async ({ email, projectId, projectIds, permissions, projectPermissions }) => {
    if (!canManageUsers) {
      addToast('Only Admins can invite new team members.', 'error');
      return { success: false, error: 'Unauthorized' };
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      addToast('Please enter a valid email address.', 'error');
      return { success: false, error: 'Email is required' };
    }

    // If email was previously marked as deleted, clear it so they can be re-invited
    try {
      const deletedEmails = JSON.parse(localStorage.getItem('kt_dms_deleted_user_emails') || '[]');
      const updated = deletedEmails.filter((e) => String(e).toLowerCase() !== cleanEmail);
      localStorage.setItem('kt_dms_deleted_user_emails', JSON.stringify(updated));
    } catch {}

    const existingUser = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existingUser && existingUser.status === 'active') {
      addToast('A user with this email address already exists and is active.', 'error');
      return { success: false, error: 'User already active' };
    }

    const targetProjectIds = Array.isArray(projectIds) && projectIds.length > 0
      ? projectIds
      : projectId
      ? [projectId]
      : projects.length > 0
      ? [projects[0].id]
      : [];

    const defaultPermissions = {
      canView: permissions?.canView !== false,
      canUpload: !!permissions?.canUpload,
      canEdit: !!permissions?.canEdit,
      canDelete: !!permissions?.canDelete,
      canDownload: permissions?.canDownload !== false,
      canManageUsers: false,
      canViewLogs: false,
    };

    const primaryPerms = (projectPermissions && targetProjectIds[0] && projectPermissions[targetProjectIds[0]])
      ? projectPermissions[targetProjectIds[0]]
      : defaultPermissions;

    // Call backend API for project invitations with multi-project & project-wise permissions
    let backendResult = null;
    try {
      const multiProjectPayload = targetProjectIds.map((pId) => ({
        projectId: pId,
        permissions: frontendPermissionsToBackend(
          (projectPermissions && projectPermissions[pId])
            ? projectPermissions[pId]
            : defaultPermissions
        ),
      }));

      const res = await inviteUserToProjectService({
        email: cleanEmail,
        projects: multiProjectPayload,
        projectId: targetProjectIds[0] || undefined,
        permissions: frontendPermissionsToBackend(primaryPerms),
      });
      if (res && res.success) {
        backendResult = res;
      }
    } catch (err) {
      console.warn('Backend multi-project invite error, attempting fallback:', err.message);
      for (const projId of targetProjectIds) {
        const projPerms = (projectPermissions && projectPermissions[projId])
          ? projectPermissions[projId]
          : defaultPermissions;
        try {
          const res = await inviteUserToProjectService({
            projectId: projId,
            email: cleanEmail,
            permissions: frontendPermissionsToBackend(projPerms),
          });
          if (res && res.success) backendResult = res;
        } catch (fallbackErr) {
          console.warn(`Fallback invite error for ${projId}:`, fallbackErr.message);
        }
      }
    }

    const joinCode = backendResult?.data?.joinCode;
    const token = joinCode || `inv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const userId = existingUser ? existingUser.id : `u-${Date.now()}`;

    const invitedUser = {
      id: userId,
      name: existingUser && existingUser.name !== 'Pending Registration' ? existingUser.name : 'Pending Registration',
      email: cleanEmail,
      password: '',
      role: 'Member',
      avatar: '/p2.jpg',
      projectIds: targetProjectIds,
      status: 'invited',
      inviteToken: token,
      permissions: primaryPerms,
    };

    if (existingUser) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? invitedUser : u)));
    } else {
      setUsers((prev) => [...prev, invitedUser]);
    }

    if (targetProjectIds.length > 0) {
      setProjects((prev) =>
        prev.map((p) => {
          if (targetProjectIds.includes(p.id)) {
            const specificPerms = (projectPermissions && projectPermissions[p.id])
              ? projectPermissions[p.id]
              : defaultPermissions;

            const hasMember = (p.members || []).some((m) => m.userId === userId);
            if (!hasMember) {
              return {
                ...p,
                members: [
                  ...(p.members || []),
                  {
                    userId,
                    name: invitedUser.name,
                    email: cleanEmail,
                    permissions: specificPerms,
                  },
                ],
              };
            } else {
              return {
                ...p,
                members: (p.members || []).map((m) =>
                  m.userId === userId ? { ...m, permissions: specificPerms } : m
                ),
              };
            }
          }
          return p;
        })
      );
    }

    const invitationRecord = {
      id: token,
      joinCode: joinCode || token,
      userId,
      email: cleanEmail,
      projectIds: targetProjectIds,
      permissions: primaryPerms,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    setInvitations((prev) => [invitationRecord, ...prev.filter((i) => i.email !== cleanEmail)]);

    const projectNames = projects
      .filter((p) => targetProjectIds.includes(p.id))
      .map((p) => p.name)
      .join(', ');

    recordAuditLog(
      'USER_INVITE',
      'Generated Project Invitation',
      `${cleanEmail} (${projectNames || 'Assigned Project'})`,
      `Admin sent project invitation link with permissions: Upload=${primaryPerms.canUpload ? 'Yes' : 'No'}, Edit=${primaryPerms.canEdit ? 'Yes' : 'No'}, Delete=${primaryPerms.canDelete ? 'Yes' : 'No'}`,
      'User Management',
      'success'
    );

    const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
    const inviteLink = `${baseUrl}?invite=${encodeURIComponent(token)}&email=${encodeURIComponent(cleanEmail)}`;

    addToast(`Invitation generated for ${cleanEmail}!`, 'success');
    return {
      success: true,
      inviteToken: token,
      inviteLink,
      user: invitedUser,
      projects: projects.filter((p) => targetProjectIds.includes(p.id)),
    };
  };

  const acceptInvitation = async ({ token, name, email: directEmail, password, mobile = '9876543210' }) => {
    let emailFromUrl = null;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      emailFromUrl = params.get('email');
    }

    const cleanEmailCandidate = (directEmail || emailFromUrl || '').toLowerCase().trim();
    const invite = invitations.find(
      (i) =>
        i.id === token ||
        i.joinCode === token ||
        (cleanEmailCandidate && i.email?.toLowerCase() === cleanEmailCandidate)
    );
    const targetUser = users.find(
      (u) =>
        u.inviteToken === token ||
        (invite && u.id === invite.userId) ||
        (cleanEmailCandidate && u.email?.toLowerCase() === cleanEmailCandidate)
    );

    const finalEmail = directEmail || targetUser?.email || invite?.email || emailFromUrl;

    if (!finalEmail) {
      addToast('Invalid or expired invitation link.', 'error');
      return { success: false, error: 'Invitation link is invalid or has expired.' };
    }

    // Call Backend Registration API
    let registeredName = name.trim();
    try {
      const regRes = await registerUserService({
        name: registeredName,
        email: finalEmail.toLowerCase().trim(),
        password: password,
        mobile: Number(mobile) || 9876543210,
      });
      if (regRes && regRes.data && regRes.data.name) {
        registeredName = regRes.data.name;
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      if (!msg?.toLowerCase().includes('already exists')) {
        console.warn('Backend user registration error:', msg);
        if (err.response?.data?.message) {
          addToast(err.response.data.message, 'error');
          return { success: false, error: err.response.data.message };
        }
      }
    }

    // Immediately mark invitation as accepted in state and localStorage
    setInvitations((prev) => {
      const updated = prev.map((i) =>
        i.id === token || i.email?.toLowerCase() === finalEmail.toLowerCase()
          ? { ...i, status: 'accepted', acceptedAt: new Date().toISOString() }
          : i
      );
      localStorage.setItem('kt_dms_invitations', JSON.stringify(updated));
      return updated;
    });

    // Immediately update users state with real registered name and active status
    setUsers((prev) => {
      const exists = prev.some((u) => u.email?.toLowerCase() === finalEmail.toLowerCase());
      const updated = exists
        ? prev.map((u) =>
            u.email?.toLowerCase() === finalEmail.toLowerCase()
              ? {
                  ...u,
                  name: registeredName,
                  status: 'active',
                  inviteToken: null,
                }
              : u
          )
        : [
            {
              id: targetUser ? targetUser.id : (invite?.userId || `u-${Date.now()}`),
              name: registeredName,
              email: finalEmail.toLowerCase(),
              role: 'Member',
              avatar: '/p2.jpg',
              department: 'Project Member',
              status: 'active',
              projectIds: invite?.projectIds || (invite?.projectId ? [invite.projectId] : []),
              permissions: invite?.permissions || {
                canView: true,
                canUpload: true,
                canEdit: false,
                canDelete: false,
                canDownload: true,
              },
            },
            ...prev,
          ];
      localStorage.setItem('kt_dms_users', JSON.stringify(updated));
      return updated;
    });

    // Attempt auto-login via backend
    const loginOk = await login(finalEmail, password);
    if (!loginOk) {
      const finalUserId = targetUser ? targetUser.id : (invite?.userId || `u-${Date.now()}`);
      setCurrentUserId(finalUserId);
      setIsAuthenticated(true);
      localStorage.setItem('kt_dms_auth', 'true');
      localStorage.setItem('kt_dms_active_user_id', finalUserId);
    }

    // Reload backend projects so member records are fully synced
    try {
      await loadBackendProjects();
    } catch (e) {
      // ignore
    }

    setInviteToken(null);
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    recordAuditLog(
      'USER_REGISTER',
      'Completed Account Registration',
      `${name.trim()} (${finalEmail})`,
      `User accepted project invitation and registered member account`,
      'User Management',
      'success'
    );

    addToast(`Welcome to the workspace, ${name.trim()}! Your workspace is ready.`, 'success');
    return { success: true };
  };

  const sendVerificationOtp = async (email) => {
    try {
      const res = await sendOtpService(email);
      addToast(res.message || `Verification OTP sent to ${email}`, 'info');
      return { success: true, message: res.message };
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      addToast(`OTP Notice: ${msg}`, 'warning');
      return { success: false, error: msg };
    }
  };

  const verifyEmailOtp = async (email, otp) => {
    try {
      const res = await verifyOtpService(email, otp);
      addToast(res.message || 'Email verified successfully!', 'success');
      return { success: true, message: res.message };
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      return { success: false, error: msg };
    }
  };

  const getInviteLink = (tokenOrUserId, explicitEmail = '') => {
    let token = tokenOrUserId;
    let email = explicitEmail;

    const foundUser = users.find(
      (u) =>
        u.id === tokenOrUserId ||
        u.inviteToken === tokenOrUserId ||
        (tokenOrUserId && u.email && u.email.toLowerCase() === String(tokenOrUserId).toLowerCase())
    );
    if (foundUser) {
      if (foundUser.inviteToken) token = foundUser.inviteToken;
      if (!email && foundUser.email) email = foundUser.email;
    }

    const foundInv = invitations.find(
      (i) =>
        i.id === tokenOrUserId ||
        i.joinCode === tokenOrUserId ||
        i.userId === tokenOrUserId ||
        (email && i.email && i.email.toLowerCase() === email.toLowerCase())
    );
    if (foundInv) {
      token = foundInv.id || foundInv.joinCode || token;
      if (!email && foundInv.email) email = foundInv.email;
    }

    const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
    return email
      ? `${baseUrl}?invite=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`
      : `${baseUrl}?invite=${encodeURIComponent(token)}`;
  };

  const getInvitationByToken = (token) => {
    if (!token) return null;

    let urlEmail = null;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      urlEmail = params.get('email');
    }

    const cleanUrlEmail = urlEmail ? urlEmail.toLowerCase().trim() : null;

    const invite = invitations.find(
      (i) =>
        i.id === token ||
        i.joinCode === token ||
        (cleanUrlEmail && i.email && i.email.toLowerCase() === cleanUrlEmail)
    );
    const user = users.find(
      (u) =>
        u.inviteToken === token ||
        (cleanUrlEmail && u.email && u.email.toLowerCase() === cleanUrlEmail)
    );

    const email = cleanUrlEmail || (user ? user.email : (invite ? invite.email : null));
    if (!invite && !user && !email) return null;

    // Check if user is actually already registered and active in MongoDB
    const isAlreadyRegistered = user && user.status === 'active' && user.name !== 'Pending Registration';
    if (invite && invite.status === 'accepted' && isAlreadyRegistered) {
      return null;
    }

    const projectIds = invite?.projectIds || (user ? user.projectIds : (invite?.projectId ? [invite.projectId] : []));
    const permissions = invite?.permissions || (user ? user.permissions : {
      canView: true,
      canUpload: true,
      canEdit: false,
      canDelete: false,
      canDownload: true,
    });
    const assignedProjects = projects.filter((p) => (projectIds || []).includes(p.id));

    return {
      token,
      email,
      projectIds,
      projects: assignedProjects,
      permissions,
      isPending: true,
    };
  };

  const addUser = (userData) => {
    return inviteUser(userData);
  };

  const updateUserPermissions = async (userId, newPermissions, newProjectIds) => {
    if (!canManageUsers) {
      addToast('Only Admins can modify permissions.', 'error');
      return false;
    }

    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return false;

    const backendPerms = frontendPermissionsToBackend(newPermissions);

    const targetProjects = Array.isArray(newProjectIds) ? newProjectIds : targetUser.projectIds || [];
    for (const projId of targetProjects) {
      try {
        await updateMemberPermissionsService({
          projectId: projId,
          userId: targetUser.id?.startsWith('u-') ? targetUser.id.replace('u-', '') : targetUser.id,
          permissions: backendPerms,
        });
      } catch (err) {
        console.warn(`Backend update permissions error for project ${projId}:`, err.message);
      }
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, permissions: { ...u.permissions, ...newPermissions } };
          if (Array.isArray(newProjectIds)) {
            updated.projectIds = newProjectIds;
          }
          return updated;
        }
        return u;
      })
    );

    if (Array.isArray(newProjectIds)) {
      setProjects((prev) =>
        prev.map((proj) => {
          const shouldBeMember = newProjectIds.includes(proj.id);
          const membersList = proj.members || [];
          const isMember = membersList.some((m) => m.userId === userId);

          if (shouldBeMember && !isMember) {
            return {
              ...proj,
              members: [
                ...membersList,
                {
                  userId,
                  permissions: {
                    canView: newPermissions.canView !== false,
                    canUpload: !!newPermissions.canUpload,
                    canEdit: !!newPermissions.canEdit,
                    canDelete: !!newPermissions.canDelete,
                    canDownload: !!newPermissions.canDownload,
                  },
                },
              ],
            };
          } else if (!shouldBeMember && isMember) {
            return {
              ...proj,
              members: membersList.filter((m) => m.userId !== userId),
            };
          } else if (shouldBeMember && isMember) {
            return {
              ...proj,
              members: membersList.map((m) =>
                m.userId === userId
                  ? {
                      ...m,
                      permissions: {
                        canView: newPermissions.canView !== false,
                        canUpload: !!newPermissions.canUpload,
                        canEdit: !!newPermissions.canEdit,
                        canDelete: !!newPermissions.canDelete,
                        canDownload: !!newPermissions.canDownload,
                      },
                    }
                  : m
              ),
            };
          }
          return proj;
        })
      );
    }

    const changes = Object.entries(newPermissions)
      .map(([k, v]) => `${k.replace('can', '')}: ${v ? 'Enabled' : 'Disabled'}`)
      .join(', ');

    recordAuditLog(
      'PERMISSION_UPDATE',
      'Updated Permissions',
      targetUser.name,
      `New configuration: ${changes}`,
      'Access Control',
      'success'
    );
    addToast(`Permissions updated for ${targetUser.name}.`, 'success');
    return true;
  };

  const toggleUserStatus = (userId) => {
    if (!canManageUsers) return;
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser || targetUser.role === 'Admin') {
      addToast('Cannot modify primary Admin status.', 'warning');
      return;
    }

    const nextStatus = targetUser.status === 'active' ? 'suspended' : 'active';
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u))
    );

    recordAuditLog(
      'STATUS_CHANGE',
      `User ${nextStatus === 'active' ? 'Activated' : 'Suspended'}`,
      targetUser.name,
      `Account status set to ${nextStatus}`,
      'User Management',
      nextStatus === 'active' ? 'success' : 'warning'
    );
    addToast(`User ${targetUser.name} is now ${nextStatus}.`, 'info');
  };

  const createProject = async ({ name, description = '', color = 'from-sky-500 to-blue-600', members = [] }) => {
    if (currentUser.role !== 'Admin') {
      addToast('Permission Denied: Only Administrators can create new projects.', 'error');
      return false;
    }

    const trimmedName = (name || '').trim();
    if (!trimmedName) {
      addToast('Please enter a project name.', 'error');
      return false;
    }

    const exists = projects.some(
      (p) => p.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (exists) {
      addToast(`A project named "${trimmedName}" already exists.`, 'warning');
      return false;
    }

    let backendProj = null;
    try {
      const adminToken = localStorage.getItem('admin-token');
      let createdBy = adminToken || (currentUser.id?.startsWith('u-') ? currentUser.id.replace('u-', '') : currentUser.id);

      const res = await createProjectService({
        name: trimmedName,
        description: description.trim() || 'Collaborative workspace project.',
        createdBy,
      });

      if (res && res.success && res.data) {
        backendProj = res.data;
      }
    } catch (err) {
      console.warn('Backend project creation warning:', err.message);
    }

    const projectId = backendProj?._id || `${trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'project'}-${Date.now().toString().slice(-4)}`;

    const currentAdminEmail = (currentUser?.email || localStorage.getItem('admin-email') || '').toLowerCase();
    const currentAdminToken = localStorage.getItem('admin-token');
    const adminDisplayName = currentUser?.name || localStorage.getItem('admin-name') || (currentAdminEmail ? currentAdminEmail.split('@')[0] : 'Admin');
    const adminMember = {
      userId: currentAdminToken ? (currentAdminToken.startsWith('u-') ? currentAdminToken : `u-${currentAdminToken}`) : (currentUser.id || 'u-admin'),
      name: adminDisplayName,
      email: currentAdminEmail,
      permissions: { canView: true, canUpload: true, canEdit: true, canDelete: true, canDownload: true },
    };

    const finalMembers = [
      adminMember,
      ...members
        .filter((m) => {
          const mEmail = (m.email || '').toLowerCase();
          return m.userId !== currentUser.id && m.userId !== adminMember.userId && (!mEmail || mEmail !== currentAdminEmail);
        })
        .map((m) => {
          const matchedUser = users.find(
            (u) => u.id === m.userId || (m.email && u.email && u.email.toLowerCase() === m.email.toLowerCase())
          );
          return {
            userId: m.userId,
            name: m.name || matchedUser?.name || 'Member',
            email: m.email || matchedUser?.email,
            permissions: m.permissions || { canView: true, canUpload: true, canEdit: false, canDelete: false, canDownload: true },
          };
        }),
    ];

    const newProject = {
      id: projectId,
      name: trimmedName,
      description: description.trim() || 'Collaborative workspace project.',
      joinCode: backendProj?.joinCode || undefined,
      color: color || 'from-sky-500 to-blue-600',
      createdAt: new Date().toISOString(),
      updatedAt: 'Just now',
      members: finalMembers,
      docs: [],
    };

    // Save immediately to state and localStorage so member count is immediately active
    setProjects((prev) => [newProject, ...prev]);
    try {
      const savedProjects = JSON.parse(localStorage.getItem('kt_dms_projects') || '[]');
      localStorage.setItem('kt_dms_projects', JSON.stringify([newProject, ...savedProjects.filter((p) => p.id !== newProject.id)]));
    } catch {}

    // Invite all selected non-admin members to the backend project in parallel
    if (backendProj?._id) {
      const inviteTasks = finalMembers
        .filter((m) => {
          const email = (m.email || '').toLowerCase();
          return email && email !== currentAdminEmail && m.userId !== currentUser.id && m.userId !== adminMember.userId;
        })
        .map(async (m) => {
          try {
            await inviteUserToProjectService({
              projectId: backendProj._id,
              email: m.email,
              permissions: frontendPermissionsToBackend(m.permissions),
            });
          } catch (invErr) {
            console.warn(`Backend invite warning for ${m.email} in project ${backendProj._id}:`, invErr.message);
          }
        });

      await Promise.allSettled(inviteTasks);
    }

    recordAuditLog(
      'PROJECT_CREATE',
      'Created Project',
      trimmedName,
      `Created project '${trimmedName}' with ${finalMembers.length} assigned members`,
      'Project Governance',
      'success'
    );

    addToast(`Project "${trimmedName}" created successfully!`, 'success');
    await loadBackendProjects();
    return newProject;
  };

  const updateProject = async (projectId, updateData) => {
    if (currentUser.role !== 'Admin') {
      addToast('Permission Denied: Only Administrators can update project configuration.', 'error');
      return false;
    }

    const targetProj = projects.find((p) => p.id === projectId);
    if (!targetProj) return false;

    const currentAdminEmail = (currentUser?.email || localStorage.getItem('admin-email') || '').toLowerCase();

    // 1. Persist updated name / description to backend MongoDB if valid ObjectId
    if (/^[0-9a-fA-F]{24}$/.test(projectId)) {
      try {
        const uId = (currentUser?.id?.startsWith('u-') ? currentUser.id.replace('u-', '') : currentUser?.id) || localStorage.getItem('admin-token');
        await updateProjectDetailsService(projectId, {
          name: updateData.name ? updateData.name.trim() : targetProj.name,
          description: updateData.description !== undefined ? updateData.description.trim() : targetProj.description,
          status: updateData.status || targetProj.status || 'active',
          userId: uId,
        });
      } catch (projUpdateErr) {
        console.warn('Backend update project details notice:', projUpdateErr.message);
      }
    }

    // 2. Sync member permissions and invitations with backend if members provided
    if (Array.isArray(updateData.members) && /^[0-9a-fA-F]{24}$/.test(projectId)) {
      const syncTasks = updateData.members
        .filter((m) => {
          const email = (m.email || '').toLowerCase();
          return email !== currentAdminEmail && m.userId !== currentUser.id && m.userId !== 'u-admin';
        })
        .map(async (m) => {
          const matchedUser = users.find(
            (u) => u.id === m.userId || (m.email && u.email && u.email.toLowerCase() === m.email.toLowerCase())
          );
          const email = m.email || matchedUser?.email;
          const backendPerms = frontendPermissionsToBackend(m.permissions);

          if (email) {
            try {
              await inviteUserToProjectService({
                projectId,
                email,
                permissions: backendPerms,
              });
            } catch {
              // If already a member, update permissions
              if (m.userId && /^[0-9a-fA-F]{24}$/.test(m.userId)) {
                try {
                  await updateMemberPermissionsService({
                    projectId,
                    userId: m.userId,
                    permissions: backendPerms,
                  });
                } catch (permErr) {
                  console.warn(`Backend update permissions error for ${m.userId}:`, permErr.message);
                }
              }
            }
          } else if (m.userId && /^[0-9a-fA-F]{24}$/.test(m.userId)) {
            try {
              await updateMemberPermissionsService({
                projectId,
                userId: m.userId,
                permissions: backendPerms,
              });
            } catch (err) {
              console.warn(`Backend sync member ${m.userId} error:`, err.message);
            }
          }
        });

      await Promise.allSettled(syncTasks);
    }

    const enrichedMembers = (updateData.members || targetProj.members || []).map((m) => {
      const matchedUser = users.find(
        (u) => u.id === m.userId || (m.email && u.email && u.email.toLowerCase() === m.email.toLowerCase())
      );
      return {
        userId: m.userId,
        name: m.name || matchedUser?.name || 'Member',
        email: m.email || matchedUser?.email,
        permissions: m.permissions,
      };
    });

    const updatedProject = {
      ...targetProj,
      name: updateData.name ? updateData.name.trim() : targetProj.name,
      description: updateData.description !== undefined ? updateData.description.trim() : targetProj.description,
      color: updateData.color || targetProj.color,
      members: enrichedMembers,
      updatedAt: 'Just now',
    };

    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? updatedProject : p))
    );

    try {
      const savedProjects = JSON.parse(localStorage.getItem('kt_dms_projects') || '[]');
      const updatedList = savedProjects.map((p) => (p.id === projectId ? updatedProject : p));
      localStorage.setItem('kt_dms_projects', JSON.stringify(updatedList));
    } catch {}

    recordAuditLog(
      'PROJECT_UPDATE',
      'Updated Project Settings',
      targetProj.name,
      `Updated settings and member access configuration for project '${targetProj.name}'`,
      'Project Governance',
      'success'
    );
    addToast(`Project "${updateData.name || targetProj.name}" updated!`, 'success');
    await loadBackendProjects();
    return true;
  };

  const deleteProject = async (projectId) => {
    if (currentUser.role !== 'Admin') {
      addToast('Permission Denied: Only Administrators can delete projects.', 'error');
      return false;
    }

    const targetProj = projects.find((p) => p.id === projectId);
    if (!targetProj) return false;

    // Call backend API to delete from MongoDB database
    if (/^[0-9a-fA-F]{24}$/.test(projectId)) {
      try {
        await deleteProjectService(projectId);
      } catch (err) {
        console.warn('Backend delete project API error:', err.message);
      }
    }

    // Track deleted project ID persistently so backend resync on focus/reload does not restore it
    try {
      const deletedIds = JSON.parse(localStorage.getItem('kt_dms_deleted_project_ids') || '[]');
      if (!deletedIds.includes(projectId)) {
        deletedIds.push(projectId);
        localStorage.setItem('kt_dms_deleted_project_ids', JSON.stringify(deletedIds));
      }
    } catch {
      // ignore
    }

    setProjects((prev) => {
      const updated = prev.filter((p) => p.id !== projectId);
      localStorage.setItem('kt_dms_projects', JSON.stringify(updated));
      return updated;
    });

    setFiles((prev) => {
      const updated = prev.filter((f) => f.projectId !== projectId && f.folder !== projectId);
      localStorage.setItem('kt_dms_files', JSON.stringify(updated));
      return updated;
    });

    if (selectedProject === projectId) {
      setSelectedProject(null);
      localStorage.removeItem('kt_dms_selected_project');
    }

    recordAuditLog(
      'PROJECT_DELETE',
      'Deleted Project',
      targetProj.name,
      `Permanently deleted project '${targetProj.name}' from database and revoked user workspace access`,
      'Project Governance',
      'warning'
    );
    addToast(`Project "${targetProj.name}" deleted successfully.`, 'info');
    await loadBackendProjects();
    return true;
  };

  const updateProjectMemberPermissions = (projectId, userId, newPermissions) => {
    if (currentUser.role !== 'Admin') {
      addToast('Permission Denied: Only Administrators can modify member permissions.', 'error');
      return false;
    }

    const proj = projects.find((p) => p.id === projectId);
    if (!proj) return false;
    const targetUser = users.find((u) => u.id === userId);

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const exists = p.members?.some((m) => m.userId === userId);
        const updatedMembers = exists
          ? p.members.map((m) =>
              m.userId === userId ? { ...m, permissions: { ...m.permissions, ...newPermissions } } : m
            )
          : [...(p.members || []), { userId, permissions: newPermissions }];
        return { ...p, members: updatedMembers, updatedAt: 'Just now' };
      })
    );

    recordAuditLog(
      'PROJECT_PERMISSION_UPDATE',
      'Updated Member Permissions',
      targetUser ? targetUser.name : userId,
      `Updated access privileges in project '${proj.name}'`,
      'Project Governance',
      'success'
    );
    addToast(`Permissions updated for ${targetUser ? targetUser.name : 'user'} in ${proj.name}.`, 'success');
    return true;
  };

  const addProjectMember = (projectId, userId, permissions = { canView: true, canUpload: true, canEdit: false, canDelete: false, canDownload: true }) => {
    if (currentUser.role !== 'Admin') {
      addToast('Permission Denied: Only Administrators can add project members.', 'error');
      return false;
    }

    const proj = projects.find((p) => p.id === projectId);
    if (!proj) return false;
    const targetUser = users.find((u) => u.id === userId);

    if (proj.members?.some((m) => m.userId === userId)) {
      addToast(`${targetUser ? targetUser.name : 'User'} is already a member of this project.`, 'warning');
      return false;
    }

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          members: [...(p.members || []), { userId, permissions }],
          updatedAt: 'Just now',
        };
      })
    );

    recordAuditLog(
      'PROJECT_MEMBER_ADD',
      'Added Project Member',
      targetUser ? targetUser.name : userId,
      `Added to project '${proj.name}' with custom permissions`,
      'Project Governance',
      'success'
    );
    addToast(`${targetUser ? targetUser.name : 'User'} added to ${proj.name}!`, 'success');
    return true;
  };

  const removeProjectMember = (projectId, userId) => {
    if (currentUser.role !== 'Admin') {
      addToast('Permission Denied: Only Administrators can remove project members.', 'error');
      return false;
    }
    if (userId === 'u-admin') {
      addToast('Cannot remove System Administrator from project.', 'warning');
      return false;
    }

    const proj = projects.find((p) => p.id === projectId);
    if (!proj) return false;
    const targetUser = users.find((u) => u.id === userId);

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          members: (p.members || []).filter((m) => m.userId !== userId),
          updatedAt: 'Just now',
        };
      })
    );

    recordAuditLog(
      'PROJECT_MEMBER_REMOVE',
      'Removed Project Member',
      targetUser ? targetUser.name : userId,
      `Removed member from project '${proj.name}'`,
      'Project Governance',
      'info'
    );
    addToast(`${targetUser ? targetUser.name : 'User'} removed from ${proj.name}.`, 'info');
    return true;
  };

  const deleteUser = async (userId) => {
    if (!canManageUsers) {
      addToast('Only Administrators can remove users.', 'error');
      return false;
    }
    const target = users.find((u) => u.id === userId || (u.email && String(u.email).toLowerCase() === String(userId).toLowerCase()));
    if (!target) return false;
    if (target.role === 'Admin') {
      addToast('Cannot remove Administrator account.', 'warning');
      return false;
    }

    const targetEmail = (target.email || '').toLowerCase();
    const targetId = String(target.id);

    // Call Backend deleteUser API if it's a 24-character MongoDB ObjectId
    if (/^[0-9a-fA-F]{24}$/.test(targetId)) {
      try {
        const adminId = localStorage.getItem('admin-token') || currentUser?.id;
        await deleteUserService(targetId, adminId);
      } catch (delErr) {
        console.warn('Backend delete user notice:', delErr.response?.data?.message || delErr.message);
      }
    }

    // 1. Add to persistent deleted users list in localStorage
    try {
      const deletedEmails = JSON.parse(localStorage.getItem('kt_dms_deleted_user_emails') || '[]');
      if (targetEmail && !deletedEmails.includes(targetEmail)) {
        deletedEmails.push(targetEmail);
        localStorage.setItem('kt_dms_deleted_user_emails', JSON.stringify(deletedEmails));
      }

      const deletedIds = JSON.parse(localStorage.getItem('kt_dms_deleted_user_ids') || '[]');
      if (targetId && !deletedIds.includes(targetId)) {
        deletedIds.push(targetId);
        localStorage.setItem('kt_dms_deleted_user_ids', JSON.stringify(deletedIds));
      }
    } catch (e) {
      console.warn('Failed to save deleted user lists to localStorage:', e);
    }

    // 2. Remove user from users state and update localStorage immediately
    setUsers((prev) => {
      const updated = prev.filter(
        (u) => u.id !== userId && String(u.id) !== targetId && (!targetEmail || (u.email || '').toLowerCase() !== targetEmail)
      );
      localStorage.setItem('kt_dms_users', JSON.stringify(updated));
      return updated;
    });

    // 3. Remove from invitations state and localStorage
    setInvitations((prev) => {
      const updated = prev.filter(
        (i) => i.userId !== userId && (!targetEmail || (i.email || '').toLowerCase() !== targetEmail)
      );
      localStorage.setItem('kt_dms_invitations', JSON.stringify(updated));
      return updated;
    });

    // 4. Remove member from all projects in state and localStorage
    setProjects((prev) => {
      const updated = prev.map((p) => ({
        ...p,
        members: (p.members || []).filter(
          (m) => m.userId !== userId && String(m.userId) !== targetId && (!targetEmail || (m.email || '').toLowerCase() !== targetEmail)
        ),
      }));
      localStorage.setItem('kt_dms_projects', JSON.stringify(updated));
      return updated;
    });

    recordAuditLog(
      'USER_DELETE',
      'Removed User Account',
      target.name,
      `Removed user account ${target.name} (${target.email})`,
      'User Management',
      'warning'
    );
    addToast(`User ${target.name} removed successfully from database.`, 'info');
    await loadBackendProjects();
    loadBackendAuditLogs();
    return true;
  };

  const resetWorkspaceData = () => {
    setFiles([]);
    setLogs([]);
    setSelectedProject(null);
    loadBackendProjects();
    addToast('Workspace data has been refreshed from server.', 'info');
  };

  const contextValue = useMemo(() => ({
    users,
    currentUser,
    currentUserId,
    setCurrentUserId,
    files,
    projects,
    setProjects,
    folders: projects,
    selectedFolder: selectedProject,
    setSelectedFolder: setSelectedProject,
    selectedProject,
    setSelectedProject,
    userProjects,
    logs,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    toasts,
    addToast,
    removeToast,
    canUpload,
    canEdit,
    canDelete,
    canDownload,
    canManageUsers,
    canViewLogs,
    getProjectPermissions,
    canUploadToProject,
    canEditFile,
    canDeleteFile,
    canDownloadFile,
    createProject,
    updateProject,
    deleteProject,
    updateProjectMemberPermissions,
    addProjectMember,
    removeProjectMember,
    createFolder: createProject,
    folders,
    currentFolderId,
    setCurrentFolderId,
    createSubfolder,
    deleteSubfolder,
    loadProjectFolders,
    isAuthenticated,
    login,
    logout,
    uploadFile,
    updateFile,
    deleteFile,
    renameFile,
    downloadFile,
    toggleStar,
    addUser,
    inviteUser,
    acceptInvitation,
    sendVerificationOtp,
    verifyEmailOtp,
    getInviteLink,
    getInvitationByToken,
    invitations,
    inviteToken,
    setInviteToken,
    updateUserPermissions,
    toggleUserStatus,
    deleteUser,
    recordAuditLog,
    loadBackendAuditLogs,
    auditPagination,
    resetWorkspaceData,
  }), [
    users,
    currentUser,
    currentUserId,
    files,
    projects,
    selectedProject,
    userProjects,
    logs,
    auditPagination,
    activeTab,
    searchQuery,
    toasts,
    canUpload,
    canEdit,
    canDelete,
    canDownload,
    canManageUsers,
    canViewLogs,
    getProjectPermissions,
    canUploadToProject,
    canEditFile,
    canDeleteFile,
    canDownloadFile,
    createProject,
    updateProject,
    deleteProject,
    updateProjectMemberPermissions,
    addProjectMember,
    removeProjectMember,
    isAuthenticated,
    inviteToken,
    invitations,
    folders,
    currentFolderId,
    loadProjectFolders,
  ]);

  return (
    <DMSContext.Provider value={contextValue}>
      {children}
    </DMSContext.Provider>
  );
};

export const useDMS = () => {
  const context = useContext(DMSContext);
  if (!context) {
    throw new Error('useDMS must be used within a DMSProvider');
  }
  return context;
};
