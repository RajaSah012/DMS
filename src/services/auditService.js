import API from "./axiosConfig";

/**
 * Fetch audit logs from backend for Admin
 * Calls GET /admin/audit-logs
 * @param {string} [projectId] - Optional project ID filter
 * @returns {Promise<{ success: boolean, count: number, data: Array }>}
 */
export const getAuditLogsService = async (projectId = null, page = 1, limit = 10) => {
  try {
    const params = { page, limit };
    if (projectId) params.projectId = projectId;
    const response = await API.get("/admin/audit-logs", { params });
    return response.data;
  } catch (error) {
    console.error("Fetch audit logs API error:", error);
    throw error;
  }
};

export const createAuditLogService = async (logData) => {
  try {
    const response = await API.post("/admin/audit-logs", logData);
    return response.data;
  } catch (error) {
    console.error("Create audit log API error:", error);
    return null;
  }
};
