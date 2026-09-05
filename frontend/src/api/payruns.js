import conf from "../conf/conf";

const BASE_URL = conf.BACKEND_URL;

class PayrunsAPI {
  /**
   * List payruns: GET /api/payruns?status=&salaryStructure=&department=
   */
  async listPayruns(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.status) query.append("status", params.status);
      if (params.salaryStructure) query.append("salaryStructure", params.salaryStructure);
      if (params.department) query.append("department", params.department);

      const qs = query.toString();
      const url = qs ? `${BASE_URL}/api/payruns?${qs}` : `${BASE_URL}/api/payruns`;

      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("listPayruns error:", error);
      return { ok: false, success: false, message: error.message || "Failed to fetch payruns" };
    }
  }

  /**
   * Get single payrun by ID
   */
  async getPayrunById(id) {
    try {
      const response = await fetch(`${BASE_URL}/api/payruns/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("getPayrunById error:", error);
      return { ok: false, success: false, message: error.message || "Failed to fetch payrun" };
    }
  }

  /**
   * Query candidate eligible employees for payrun
   * GET /api/payruns/eligible-employees?salaryStructure=&periodStart=&periodEnd=&department=&employeeType=
   */
  async getEligibleEmployees(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.salaryStructure) query.append("salaryStructure", params.salaryStructure);
      if (params.periodStart) query.append("periodStart", params.periodStart);
      if (params.periodEnd) query.append("periodEnd", params.periodEnd);
      if (params.department) query.append("department", params.department);
      if (params.employeeType) query.append("employeeType", params.employeeType);

      const qs = query.toString();
      const url = qs ? `${BASE_URL}/api/payruns/eligible-employees?${qs}` : `${BASE_URL}/api/payruns/eligible-employees`;

      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("getEligibleEmployees error:", error);
      return { ok: false, success: false, message: error.message || "Failed to fetch eligible employees" };
    }
  }

  /**
   * Create payrun: POST /api/payruns
   */
  async createPayrun(data) {
    try {
      const response = await fetch(`${BASE_URL}/api/payruns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("createPayrun error:", error);
      return { ok: false, success: false, message: error.message || "Failed to create payrun" };
    }
  }

  /**
   * Compute payrun: POST /api/payruns/:id/compute
   */
  async computePayrun(id) {
    try {
      const response = await fetch(`${BASE_URL}/api/payruns/${id}/compute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("computePayrun error:", error);
      return { ok: false, success: false, message: error.message || "Failed to compute payrun" };
    }
  }

  /**
   * Validate payrun: POST /api/payruns/:id/validate
   */
  async validatePayrun(id) {
    try {
      const response = await fetch(`${BASE_URL}/api/payruns/${id}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("validatePayrun error:", error);
      return { ok: false, success: false, message: error.message || "Failed to validate payrun" };
    }
  }

  /**
   * Mark paid: POST /api/payruns/:id/mark-paid
   */
  async markPaid(id) {
    try {
      const response = await fetch(`${BASE_URL}/api/payruns/${id}/mark-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("markPaid error:", error);
      return { ok: false, success: false, message: error.message || "Failed to mark payrun as paid" };
    }
  }

  /**
   * Send payslips via email: POST /api/payruns/:id/send-payslips
   */
  async sendPayslips(id) {
    try {
      const response = await fetch(`${BASE_URL}/api/payruns/${id}/send-payslips`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("sendPayslips error:", error);
      return { ok: false, success: false, message: error.message || "Failed to send payslips" };
    }
  }

  /**
   * Delete payrun: DELETE /api/payruns/:id
   */
  async deletePayrun(id) {
    try {
      const response = await fetch(`${BASE_URL}/api/payruns/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("deletePayrun error:", error);
      return { ok: false, success: false, message: error.message || "Failed to delete payrun" };
    }
  }
}

const payrunsApi = new PayrunsAPI();
export default payrunsApi;
