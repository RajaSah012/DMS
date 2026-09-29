import API from "./axiosConfig";

/**
 * Admin Login API service
 * Calls POST /admin/login on backend API
 * @param {{ email: string, password: string }} creds
 * @returns {Promise<{ success: boolean, message: string, data: { id: string, email: string } }>}
 */
export const loginAdminService = async (creds) => {
  try {
    const response = await API.post("/admin/login", creds);
    return response.data;
  } catch (error) {
    console.error("Admin login API error:", error);
    throw error;
  }
};

/**
 * Member User Login API service
 * Calls POST /users/login on backend API
 * @param {{ email: string, password: string }} creds
 * @returns {Promise<{ success: boolean, message: string, data: { id: string, name: string, email: string, projects: Array } }>}
 */
export const loginUserService = async (creds) => {
  try {
    const response = await API.post("/users/login", creds);
    return response.data;
  } catch (error) {
    console.error("User login API error:", error);
    throw error;
  }
};

/**
 * Member User Registration API service
 * Calls POST /users/register on backend API
 * Automatically links to invited projects upon registration
 * @param {{ name: string, email: string, password: string, mobile: number|string }} data
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const registerUserService = async (data) => {
  try {
    const response = await API.post("/users/register", data);
    return response.data;
  } catch (error) {
    console.error("User registration API error:", error);
    throw error;
  }
};

/**
 * Fetch all registered users from backend database (Paginated)
 * Calls GET /users
 * @param {number} [page=1]
 * @param {number} [limit=100]
 * @returns {Promise<{ success: boolean, data: Array, pagination?: Object }>}
 */
export const getAllUsersService = async (page = 1, limit = 100) => {
  try {
    const response = await API.get("/users", {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    console.error("Fetch all users API error:", error);
    throw error;
  }
};

/**
 * Delete a user from the backend database permanently
 * Calls DELETE /users/:id
 * @param {string} userId
 * @param {string} [performingUserId]
 * @returns {Promise<{ success: boolean, message: string, data?: Object }>}
 */
export const deleteUserService = async (userId, performingUserId = null) => {
  try {
    const response = await API.delete(`/users/${userId}`, {
      params: performingUserId ? { performingUserId } : {},
      data: performingUserId ? { performingUserId } : {}
    });
    return response.data;
  } catch (error) {
    console.error(`Delete user API error for ${userId}:`, error);
    throw error;
  }
};
