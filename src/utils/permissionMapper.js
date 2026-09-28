

export const backendPermissionsToFrontend = (permissions = []) => {
  const permArray = Array.isArray(permissions) ? permissions : [];
  return {
    canView: permArray.includes('read'),
    canUpload: permArray.includes('create'),
    canEdit: permArray.includes('update'),
    canDelete: permArray.includes('delete'),
    canDownload: permArray.includes('read'), 
  };
};

export const frontendPermissionsToBackend = (perms = {}) => {
  const result = [];
  if (perms.canView !== false) result.push('read');
  if (perms.canUpload) result.push('create');
  if (perms.canEdit) result.push('update');
  if (perms.canDelete) result.push('delete');

  return result.length > 0 ? result : ['read'];
};
