import API from "./axiosConfig";

/**
 * Fetch all projects from backend
 * Calls GET /projects
 * @returns {Promise<{ success: boolean, data: Array }>}
 */
export const getAllProjectsService = async (page = 1, limit = 50) => {
  try {
    const response = await API.get("/projects", {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    console.error("Fetch projects API error:", error);
    throw error;
  }
};

/**
 * Create a new project
 * Calls POST /projects/create
 * @param {{ name: string, description?: string, createdBy: string, defaultRoleId?: string }} data
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const createProjectService = async (data) => {
  try {
    const response = await API.post("/projects/create", data);
    return response.data;
  } catch (error) {
    console.error("Create project API error:", error);
    throw error;
  }
};

/**
 * Add or invite user to project with permissions
 * Calls POST /projects/invite-user
 * @param {{ projectId: string, email: string, permissions: Array<string> }} data
 * @returns {Promise<{ success: boolean, message: string, isDirectAdd: boolean, data: Object }>}
 */
export const inviteUserToProjectService = async (data) => {
  try {
    const response = await API.post("/projects/invite-user", data);
    return response.data;
  } catch (error) {
    console.error("Invite user API error:", error);
    throw error;
  }
};

/**
 * Update member permissions in a project
 * Calls PUT /projects/update-permissions
 * @param {{ projectId: string, userId: string, permissions: Array<string> }} data
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const updateMemberPermissionsService = async (data) => {
  try {
    const response = await API.put("/projects/update-permissions", data);
    return response.data;
  } catch (error) {
    console.error("Update permissions API error:", error);
    throw error;
  }
};

/**
 * Fetch members for a specific project
 * Calls GET /projects/:projectId/members
 * @param {string} projectId
 * @param {number} [page=1]
 * @param {number} [limit=100]
 * @returns {Promise<{ success: boolean, data: Array, pagination?: Object }>}
 */
export const getProjectMembersService = async (projectId, page = 1, limit = 100) => {
  try {
    const response = await API.get(`/projects/${projectId}/members`, {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    console.error("Fetch project members API error:", error);
    throw error;
  }
};
