import API from "./axiosConfig";

/**
 * Create a new folder or subfolder
 * Calls POST /folders
 * @param {{ name: string, projectId: string, parentFolderId?: string|null, userId?: string, createdBy?: string }} data
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const createFolderService = async (data) => {
  try {
    const response = await API.post("/folders", data);
    return response.data;
  } catch (error) {
    console.error("Create folder API error:", error);
    throw error;
  }
};

/**
 * Fetch all folders for a project (optionally filter by parentFolderId)
 * Calls GET /folders/project/:projectId
 * @param {string} projectId
 * @param {string|null} [parentFolderId]
 * @returns {Promise<{ success: boolean, data: Array }>}
 */
export const getProjectFoldersService = async (projectId, parentFolderId = null) => {
  try {
    const params = {};
    if (parentFolderId && parentFolderId !== "null" && parentFolderId !== "undefined") {
      params.parentFolderId = parentFolderId;
    }
    const response = await API.get(`/folders/project/${projectId}`, { params });
    return response.data;
  } catch (error) {
    console.error(`Fetch folders API error for project ${projectId}:`, error);
    throw error;
  }
};

/**
 * Delete a folder, all its child subfolders, and all associated files
 * Calls DELETE /folders/:folderId
 * @param {string} folderId
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const deleteFolderService = async (folderId) => {
  try {
    const response = await API.delete(`/folders/${folderId}`);
    return response.data;
  } catch (error) {
    console.error(`Delete folder API error for folder ${folderId}:`, error);
    throw error;
  }
};
