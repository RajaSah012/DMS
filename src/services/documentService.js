import API from "./axiosConfig";

/**
 * Upload a document to the backend
 * Calls POST /files/upload with multipart/form-data
 * @param {FormData} formData - Contains 'file', 'projectId', 'userId', 'uploadedBy'
 * @param {Function} [onUploadProgress] - Optional upload progress callback
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const uploadDocumentService = async (formData, onUploadProgress) => {
  try {
    const response = await API.post("/files/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
    });
    return response.data;
  } catch (error) {
    console.error("Upload document API error:", error);
    throw error;
  }
};

/**
 * Fetch all documents for a project
 * Calls GET /files/project/:projectId
 * Passes { projectId, userId } in body/config for backend checkPermission middleware
 * @param {string} projectId
 * @param {string} [userId]
 * @returns {Promise<{ success: boolean, data: Array }>}
 */
export const getProjectDocumentsService = async (projectId, userId, page = 1, limit = 50) => {
  try {
    const response = await API.get(`/files/project/${projectId}`, {
      params: {
        projectId,
        userId,
        page,
        limit,
      },
      headers: {
        "Content-Type": "application/json",
        userid: userId,
      },
      data: {
        projectId,
        userId,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Fetch documents API error for project ${projectId}:`, error);
    throw error;
  }
};

/**
 * Delete a document from the backend
 * Calls DELETE /files/:fileId
 * Passes { projectId, userId } in body/config for backend checkPermission middleware
 * @param {string} fileId
 * @param {string} [projectId]
 * @param {string} [userId]
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const deleteDocumentService = async (fileId, projectId, userId) => {
  try {
    const response = await API.delete(`/files/${fileId}`, {
      params: {
        projectId,
        userId,
      },
      headers: {
        "Content-Type": "application/json",
        userid: userId,
      },
      data: {
        projectId,
        userId,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Delete document API error for file ${fileId}:`, error);
    throw error;
  }
};

/**
 * Rename a document in the backend database
 * Calls PUT /files/:fileId
 * Passes { name, originalName, projectId, userId } in body and headers
 * @param {string} fileId
 * @param {string} newName
 * @param {string} [projectId]
 * @param {string} [userId]
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const renameDocumentService = async (fileId, newName, projectId, userId) => {
  try {
    const payload = {
      name: newName,
      originalName: newName,
      newName,
      projectId,
      userId,
    };
    const response = await API.put(`/files/${fileId}`, payload, {
      headers: {
        "Content-Type": "application/json",
        userid: userId,
      },
      params: {
        projectId,
        userId,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Rename document API error for file ${fileId}:`, error);
    throw error;
  }
};

/**
 * Resolve full URL for static file download from backend server
 * @param {string} fileUrl - e.g. "/uploads/file-123.pdf"
 * @returns {string} - Full accessible URL
 */
export const getFileDownloadUrl = (fileUrl) => {
  if (!fileUrl) return "";
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    return fileUrl;
  }
  const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:27017/api";
  const serverRoot = baseUrl.replace(/\/api\/?$/, "");
  const cleanPath = fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`;
  return `${serverRoot}${cleanPath}`;
};

/**
 * Format bytes to readable size
 * @param {number} bytes
 * @returns {string}
 */
export const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

/**
 * Detect generic file type category from filename or extension
 * @param {string} name
 * @returns {"pdf" | "excel" | "doc" | "zip" | "figma" | "image"}
 */
export const detectTypeFromExtension = (name) => {
  if (!name) return "pdf";
  const ext = name.split(".").pop().toLowerCase();
  if (["pdf"].includes(ext)) return "pdf";
  if (["xls", "xlsx", "csv"].includes(ext)) return "excel";
  if (["doc", "docx", "txt", "rtf", "md"].includes(ext)) return "doc";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "zip";
  if (["fig", "sketch", "xd"].includes(ext)) return "figma";
  if (["png", "jpg", "jpeg", "svg", "webp"].includes(ext)) return "image";
  return "doc";
};

