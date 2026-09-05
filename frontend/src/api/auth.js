import conf from "../conf/conf";

const BASE_URL = `${conf.BACKEND_URL}/api/auth`;

class AuthAPI {
  async signup(data) {
    try {
      const response = await fetch(`${BASE_URL}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("Signup API error:", error);
      return { ok: false, success: false, message: error.message || "Network error during signup" };
    }
  }

  async login({ email, password }) {
    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("Login API error:", error);
      return { ok: false, success: false, message: error.message || "Network error during login" };
    }
  }

  async logout() {
    try {
      const response = await fetch(`${BASE_URL}/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("Logout API error:", error);
      return { ok: false, success: false, message: error.message || "Network error during logout" };
    }
  }

  async getMe() {
    try {
      const response = await fetch(`${BASE_URL}/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("GetMe API error:", error);
      return { ok: false, success: false, user: null };
    }
  }
}

const authApi = new AuthAPI();
export default authApi;
