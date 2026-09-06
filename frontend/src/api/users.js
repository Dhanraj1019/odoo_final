import conf from "../conf/conf";

const BASE_URL = `${conf.BACKEND_URL}/api/users`;

class UsersAPI {
  /**
   * List users: GET /api/users?search=&role=&status=
   */
  async listUsers(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.search) query.append("search", params.search);
      if (params.role) query.append("role", params.role);
      if (params.status) query.append("status", params.status);

      const qs = query.toString();
      const url = qs ? `${BASE_URL}?${qs}` : BASE_URL;

      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("listUsers error:", error);
      return { ok: false, success: false, message: error.message || "Failed to fetch users" };
    }
  }

  /**
   * Get single user: GET /api/users/:id
   */
  async getUserById(id) {
    try {
      const response = await fetch(`${BASE_URL}/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("getUserById error:", error);
      return { ok: false, success: false, message: error.message || "Failed to fetch user" };
    }
  }

  /**
   * Create user: POST /api/users
   */
  async createUser(data) {
    try {
      const response = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("createUser error:", error);
      return { ok: false, success: false, message: error.message || "Failed to create user" };
    }
  }

  /**
   * Update user: PUT /api/users/:id
   */
  async updateUser(id, data) {
    try {
      const response = await fetch(`${BASE_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("updateUser error:", error);
      return { ok: false, success: false, message: error.message || "Failed to update user" };
    }
  }

  /**
   * Reset password: PUT /api/users/:id/reset-password
   */
  async resetPassword(id, newPassword) {
    try {
      const response = await fetch(`${BASE_URL}/${id}/reset-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newPassword }),
      });

      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("resetPassword error:", error);
      return { ok: false, success: false, message: error.message || "Failed to reset password" };
    }
  }

  /**
   * Soft deactivate user: DELETE /api/users/:id
   */
  async deleteUser(id) {
    try {
      const response = await fetch(`${BASE_URL}/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("deleteUser error:", error);
      return { ok: false, success: false, message: error.message || "Failed to deactivate user" };
    }
  }

  /**
   * Reactivate user: PUT /api/users/:id with { isActive: true }
   */
  async reactivateUser(id) {
    return this.updateUser(id, { isActive: true });
  }

  /**
   * Lookup user by email for Smart Employee Linking: GET /api/users/lookup?email=
   * @param {string} email - Email address to search
   * @param {AbortSignal} [signal] - Optional AbortController signal for request cancellation
   */
  async lookupUserByEmail(email, signal = null) {
    try {
      const normalized = email ? email.trim() : "";
      const url = `${BASE_URL}/lookup?email=${encodeURIComponent(normalized)}`;

      const fetchOptions = {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      };
      if (signal) {
        fetchOptions.signal = signal;
      }

      const response = await fetch(url, fetchOptions);
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      if (error.name === "AbortError") {
        return { ok: false, aborted: true, message: "Request cancelled" };
      }
      console.error("lookupUserByEmail error:", error);
      return { ok: false, success: false, message: error.message || "Failed to search user" };
    }
  }
}

const usersApi = new UsersAPI();
export default usersApi;
