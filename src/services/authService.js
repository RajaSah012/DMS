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
 * @param {number} [limit=500]
 * @returns {Promise<{ success: boolean, data: Array, pagination?: Object }>}
 */
export const getAllUsersService = async (page = 1, limit = 500) => {
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

/**
 * Send email verification OTP
 * Calls POST /users/send-otp
 * @param {string} email
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const sendOtpService = async (email) => {
  try {
    const response = await API.post("/users/send-otp", { email });
    return response.data;
  } catch (error) {
    console.error("Send OTP API error:", error);
    throw error;
  }
};

/**
 * Verify email verification OTP
 * Calls POST /users/verify-otp
 * @param {string} email
 * @param {string} otp
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const verifyOtpService = async (email, otp) => {
  try {
    const response = await API.post("/users/verify-otp", { email, otp });
    return response.data;
  } catch (error) {
    console.error("Verify OTP API error:", error);
    throw error;
  }
};

/**
 * Send workspace joining link to user's email
 * Calls POST /users/send-invite-email
 * @param {{ email: string, inviteLink: string, projectName?: string }} data
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const sendInviteEmailService = async (data) => {
  try {
    const response = await API.post("/users/send-invite-email", data);
    return response.data;
  } catch (error) {
    console.error("Send invite email API error:", error);
    throw error;
  }
};


