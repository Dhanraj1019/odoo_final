import conf from "../conf/conf";

const BASE_URL = `${conf.BACKEND_URL}/api/employees`;

class EmployeesAPI {
  /**
   * List employees with optional query filters: ?department=&status=&search=
   */
  async listEmployees(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.department) query.append("department", params.department);
      if (params.status) query.append("status", params.status);
      if (params.search) query.append("search", params.search);

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
      console.error("listEmployees error:", error);
      return { ok: false, success: false, message: error.message || "Failed to fetch employees" };
    }
  }

  /**
   * Get an employee record by ID
   */
  async getEmployeeById(id) {
    try {
      const response = await fetch(`${BASE_URL}/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("getEmployeeById error:", error);
      return { ok: false, success: false, message: error.message || "Failed to fetch employee details" };
    }
  }

  /**
   * Get the logged-in user's own linked employee profile
   */
  async getMyProfile() {
    try {
      const response = await fetch(`${BASE_URL}/me`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("getMyProfile error:", error);
      return { ok: false, success: false, message: error.message || "Failed to fetch self profile" };
    }
  }

  /**
   * Create a new employee record
   */
  async createEmployee(data) {
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
      console.error("createEmployee error:", error);
      return { ok: false, success: false, message: error.message || "Failed to create employee" };
    }
  }

  /**
   * Update an existing employee record
   */
  async updateEmployee(id, data) {
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
      console.error("updateEmployee error:", error);
      return { ok: false, success: false, message: error.message || "Failed to update employee" };
    }
  }

  /**
   * Soft-delete / Terminate an employee record
   */
  async deleteEmployee(id) {
    try {
      const response = await fetch(`${BASE_URL}/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("deleteEmployee error:", error);
      return { ok: false, success: false, message: error.message || "Failed to terminate employee" };
    }
  }
}

const employeesApi = new EmployeesAPI();
export default employeesApi;
