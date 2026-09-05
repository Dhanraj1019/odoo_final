import conf from "../conf/conf";

const BASE_URL = conf.BACKEND_URL;

class TimeOffAPI {
  // ==================== TIME OFF TYPES ====================

  /**
   * List time off types: GET /api/time-off-types?status=
   */
  async listTypes(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.status) query.append("status", params.status);

      const qs = query.toString();
      const url = qs ? `${BASE_URL}/api/time-off-types?${qs}` : `${BASE_URL}/api/time-off-types`;

      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("listTypes error:", error);
      return { ok: false, success: false, message: error.message || "Failed to fetch leave types" };
    }
  }

  /**
   * Get single time off type
   */
  async getTypeById(id) {
    try {
      const response = await fetch(`${BASE_URL}/api/time-off-types/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("getTypeById error:", error);
      return { ok: false, success: false, message: error.message || "Failed to fetch leave type" };
    }
  }

  /**
   * Create time off type
   */
  async createType(data) {
    try {
      const response = await fetch(`${BASE_URL}/api/time-off-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("createType error:", error);
      return { ok: false, success: false, message: error.message || "Failed to create leave type" };
    }
  }

  /**
   * Update time off type
   */
  async updateType(id, data) {
    try {
      const response = await fetch(`${BASE_URL}/api/time-off-types/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("updateType error:", error);
      return { ok: false, success: false, message: error.message || "Failed to update leave type" };
    }
  }

  /**
   * Delete time off type
   */
  async deleteType(id) {
    try {
      const response = await fetch(`${BASE_URL}/api/time-off-types/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("deleteType error:", error);
      return { ok: false, success: false, message: error.message || "Failed to delete leave type" };
    }
  }

  // ==================== TIME OFF ALLOCATIONS ====================

  /**
   * List allocations: GET /api/time-off-allocations?employee=&timeOffType=&status=
   */
  async listAllocations(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.employee) query.append("employee", params.employee);
      if (params.timeOffType) query.append("timeOffType", params.timeOffType);
      if (params.status) query.append("status", params.status);

      const qs = query.toString();
      const url = qs ? `${BASE_URL}/api/time-off-allocations?${qs}` : `${BASE_URL}/api/time-off-allocations`;

      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("listAllocations error:", error);
      return { ok: false, success: false, message: error.message || "Failed to fetch allocations" };
    }
  }

  /**
   * Get single allocation by ID
   */
  async getAllocationById(id) {
    try {
      const response = await fetch(`${BASE_URL}/api/time-off-allocations/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("getAllocationById error:", error);
      return { ok: false, success: false, message: error.message || "Failed to fetch allocation" };
    }
  }

  /**
   * Create allocation
   */
  async createAllocation(data) {
    try {
      const response = await fetch(`${BASE_URL}/api/time-off-allocations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("createAllocation error:", error);
      return { ok: false, success: false, message: error.message || "Failed to create allocation" };
    }
  }

  /**
   * Approve allocation: PUT /api/time-off-allocations/:id/approve
   */
  async approveAllocation(id) {
    try {
      const response = await fetch(`${BASE_URL}/api/time-off-allocations/${id}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("approveAllocation error:", error);
      return { ok: false, success: false, message: error.message || "Failed to approve allocation" };
    }
  }

  /**
   * Update allocation
   */
  async updateAllocation(id, data) {
    try {
      const response = await fetch(`${BASE_URL}/api/time-off-allocations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("updateAllocation error:", error);
      return { ok: false, success: false, message: error.message || "Failed to update allocation" };
    }
  }

  /**
   * Delete allocation
   */
  async deleteAllocation(id) {
    try {
      const response = await fetch(`${BASE_URL}/api/time-off-allocations/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("deleteAllocation error:", error);
      return { ok: false, success: false, message: error.message || "Failed to delete allocation" };
    }
  }

  // ==================== TIME OFF REQUESTS ====================

  /**
   * List requests: GET /api/time-off-requests?employee=&timeOffType=&status=
   */
  async listRequests(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.employee) query.append("employee", params.employee);
      if (params.timeOffType) query.append("timeOffType", params.timeOffType);
      if (params.status) query.append("status", params.status);

      const qs = query.toString();
      const url = qs ? `${BASE_URL}/api/time-off-requests?${qs}` : `${BASE_URL}/api/time-off-requests`;

      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("listRequests error:", error);
      return { ok: false, success: false, message: error.message || "Failed to fetch leave requests" };
    }
  }

  /**
   * Get single request
   */
  async getRequestById(id) {
    try {
      const response = await fetch(`${BASE_URL}/api/time-off-requests/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("getRequestById error:", error);
      return { ok: false, success: false, message: error.message || "Failed to fetch leave request" };
    }
  }

  /**
   * Submit leave request: POST /api/time-off-requests
   */
  async createRequest(data) {
    try {
      const response = await fetch(`${BASE_URL}/api/time-off-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("createRequest error:", error);
      return { ok: false, success: false, message: error.message || "Failed to submit leave request" };
    }
  }

  /**
   * Approve leave request: PUT /api/time-off-requests/:id/approve
   */
  async approveRequest(id) {
    try {
      const response = await fetch(`${BASE_URL}/api/time-off-requests/${id}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("approveRequest error:", error);
      return { ok: false, success: false, message: error.message || "Failed to approve request" };
    }
  }

  /**
   * Refuse leave request: PUT /api/time-off-requests/:id/refuse
   */
  async refuseRequest(id, reason = "") {
    try {
      const response = await fetch(`${BASE_URL}/api/time-off-requests/${id}/refuse`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason }),
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("refuseRequest error:", error);
      return { ok: false, success: false, message: error.message || "Failed to refuse request" };
    }
  }

  /**
   * Delete leave request: DELETE /api/time-off-requests/:id
   */
  async deleteRequest(id) {
    try {
      const response = await fetch(`${BASE_URL}/api/time-off-requests/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("deleteRequest error:", error);
      return { ok: false, success: false, message: error.message || "Failed to delete leave request" };
    }
  }
}

const timeOffApi = new TimeOffAPI();
export default timeOffApi;
