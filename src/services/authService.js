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

const GOOGLE_SCRIPT_WEBHOOK = "https://script.google.com/macros/s/AKfycbylYbKrj0KsVPOdeOqacYzNGDRmxO7gY-4W0KEjyF7ukCtjf4gj4EMamM_GmmuGSX7c/exec";

/**
 * Dispatch email directly via Google Apps Script Webhook
 * Uses HTTPS (Port 443) - 100% bypasses any cloud hosting firewall blocks
 * @param {{ to: string, subject: string, html: string, text?: string }} payload
 */
export const sendDirectEmailViaWebhook = async ({ to, subject, html, text }) => {
  try {
    const res = await fetch(GOOGLE_SCRIPT_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        to,
        subject,
        html: html || `<p>${text || ''}</p>`,
        text: text || ""
      })
    });
    const data = await res.json().catch(() => ({}));
    return { success: true, data };
  } catch (err) {
    console.warn("Direct webhook email error:", err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Send email verification OTP
 * Calls POST /users/send-otp and delivers OTP via Google Webhook
 * @param {string} email
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const sendOtpService = async (email) => {
  const userEmail = (email || '').toLowerCase().trim();
  try {
    // Backend creates OTP in MongoDB and sends the verification email via Google Webhook
    const response = await API.post("/users/send-otp", { email: userEmail });
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
 * Backend sends email via Google Webhook; frontend provides fallback if backend fails
 * @param {{ email: string, inviteLink: string, projectName?: string }} data
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const sendInviteEmailService = async ({ email, inviteLink, projectName }) => {
  const targetEmail = (email || '').toLowerCase().trim();
  const pName = projectName || 'Workspace Projects';

  // 1. Let backend deliver the invitation email (single email delivery)
  try {
    const response = await API.post("/users/send-invite-email", { 
      email: targetEmail, 
      inviteLink, 
      projectName: pName 
    });
    return response.data;
  } catch (error) {
    console.warn("Backend send-invite API failed, using direct webhook fallback:", error.message);

    // 2. Fallback: only if backend fails or times out
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 25px; max-width: 550px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; margin: 0 auto;">
        <h2 style="color: #0A2540; margin-top: 0; font-size: 20px;">Workspace Invitation</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">You have been invited to collaborate on the <strong>${pName}</strong> project workspace on KasperTech DMS.</p>
        <div style="margin: 25px 0;">
          <a href="${inviteLink}" style="background-color: #00A3E0; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px;">
            Accept Invitation &amp; Register
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin-bottom: 0;">
          Or copy and paste this link into your browser:<br/>
          <a href="${inviteLink}" style="color: #00A3E0; word-break: break-all;">${inviteLink}</a>
        </p>
      </div>
    `;

    await sendDirectEmailViaWebhook({
      to: targetEmail,
      subject: `Invitation to join ${pName} - KasperTech DMS`,
      html: emailHtml
    });

    return { success: true, message: "Invitation email dispatched successfully via fallback" };
  }
};



