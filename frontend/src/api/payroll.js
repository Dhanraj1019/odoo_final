import conf from "../conf/conf";

const BASE_URL = conf.BACKEND_URL;

class PayrollAPI {
  // ==================== SALARY RULES ====================

  /**
   * List salary rules: GET /api/salary-rules?category=&status=&computationMethod=
   */
  async listSalaryRules(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.category) query.append("category", params.category);
      if (params.status) query.append("status", params.status);
      if (params.computationMethod) query.append("computationMethod", params.computationMethod);

      const qs = query.toString();
      const url = qs ? `${BASE_URL}/api/salary-rules?${qs}` : `${BASE_URL}/api/salary-rules`;

      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("listSalaryRules error:", error);
      return { ok: false, success: false, message: error.message || "Failed to fetch salary rules" };
    }
  }

  /**
   * Get single salary rule by ID
   */
  async getSalaryRuleById(id) {
    try {
      const response = await fetch(`${BASE_URL}/api/salary-rules/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("getSalaryRuleById error:", error);
      return { ok: false, success: false, message: error.message || "Failed to fetch salary rule" };
    }
  }

  /**
   * Create salary rule
   */
  async createSalaryRule(data) {
    try {
      const response = await fetch(`${BASE_URL}/api/salary-rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("createSalaryRule error:", error);
      return { ok: false, success: false, message: error.message || "Failed to create salary rule" };
    }
  }

  /**
   * Update salary rule
   */
  async updateSalaryRule(id, data) {
    try {
      const response = await fetch(`${BASE_URL}/api/salary-rules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("updateSalaryRule error:", error);
      return { ok: false, success: false, message: error.message || "Failed to update salary rule" };
    }
  }

  /**
   * Delete salary rule
   */
  async deleteSalaryRule(id) {
    try {
      const response = await fetch(`${BASE_URL}/api/salary-rules/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("deleteSalaryRule error:", error);
      return { ok: false, success: false, message: error.message || "Failed to delete salary rule" };
    }
  }

  // ==================== SALARY STRUCTURES ====================

  /**
   * List salary structures: GET /api/salary-structures?status=
   */
  async listSalaryStructures(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.status) query.append("status", params.status);

      const qs = query.toString();
      const url = qs ? `${BASE_URL}/api/salary-structures?${qs}` : `${BASE_URL}/api/salary-structures`;

      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("listSalaryStructures error:", error);
      return { ok: false, success: false, message: error.message || "Failed to fetch salary structures" };
    }
  }

  /**
   * Get single salary structure by ID
   */
  async getSalaryStructureById(id) {
    try {
      const response = await fetch(`${BASE_URL}/api/salary-structures/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("getSalaryStructureById error:", error);
      return { ok: false, success: false, message: error.message || "Failed to fetch salary structure" };
    }
  }

  /**
   * Create salary structure
   */
  async createSalaryStructure(data) {
    try {
      const response = await fetch(`${BASE_URL}/api/salary-structures`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("createSalaryStructure error:", error);
      return { ok: false, success: false, message: error.message || "Failed to create salary structure" };
    }
  }

  /**
   * Update salary structure
   */
  async updateSalaryStructure(id, data) {
    try {
      const response = await fetch(`${BASE_URL}/api/salary-structures/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("updateSalaryStructure error:", error);
      return { ok: false, success: false, message: error.message || "Failed to update salary structure" };
    }
  }

  /**
   * Delete salary structure
   */
  async deleteSalaryStructure(id) {
    try {
      const response = await fetch(`${BASE_URL}/api/salary-structures/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("deleteSalaryStructure error:", error);
      return { ok: false, success: false, message: error.message || "Failed to delete salary structure" };
    }
  }
}

const payrollApi = new PayrollAPI();
export default payrollApi;
