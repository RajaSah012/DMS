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
