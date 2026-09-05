import conf from "../conf/conf";

const BASE_URL = `${conf.BACKEND_URL}/api/contracts`;

class ContractsAPI {
  /**
   * List contracts with optional query: ?employee=&department=&status=
   */
  async listContracts(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.employee) query.append("employee", params.employee);
      if (params.department) query.append("department", params.department);
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
      console.error("listContracts error:", error);
      return { ok: false, success: false, message: error.message || "Failed to fetch contracts" };
    }
  }

  /**
   * Get single contract by ID
   */
  async getContractById(id) {
    try {
      const response = await fetch(`${BASE_URL}/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("getContractById error:", error);
      return { ok: false, success: false, message: error.message || "Failed to fetch contract" };
    }
  }

  /**
   * Create a new contract
   */
  async createContract(data) {
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
      console.error("createContract error:", error);
      return { ok: false, success: false, message: error.message || "Failed to create contract" };
    }
  }

  /**
   * Update an existing contract
   */
  async updateContract(id, data) {
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
      console.error("updateContract error:", error);
      return { ok: false, success: false, message: error.message || "Failed to update contract" };
    }
  }

  /**
   * Delete a contract
   */
  async deleteContract(id) {
    try {
      const response = await fetch(`${BASE_URL}/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("deleteContract error:", error);
      return { ok: false, success: false, message: error.message || "Failed to delete contract" };
    }
  }
}

const contractsApi = new ContractsAPI();
export default contractsApi;
