import conf from "../conf/conf";

const BASE_URL = `${conf.BACKEND_URL}/api/working-schedules`;

class WorkingSchedulesAPI {
  /**
   * List working schedules with optional status query
   */
  async listWorkingSchedules(params = {}) {
    try {
      const query = new URLSearchParams();
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
      console.error("listWorkingSchedules error:", error);
      return { ok: false, success: false, message: error.message || "Failed to fetch schedules" };
    }
  }

  /**
   * Get working schedule by ID
   */
  async getWorkingScheduleById(id) {
    try {
      const response = await fetch(`${BASE_URL}/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("getWorkingScheduleById error:", error);
      return { ok: false, success: false, message: error.message || "Failed to fetch schedule" };
    }
  }

  /**
   * Create working schedule
   */
  async createWorkingSchedule(data) {
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
      console.error("createWorkingSchedule error:", error);
      return { ok: false, success: false, message: error.message || "Failed to create schedule" };
    }
  }

  /**
   * Update working schedule
   */
  async updateWorkingSchedule(id, data) {
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
      console.error("updateWorkingSchedule error:", error);
      return { ok: false, success: false, message: error.message || "Failed to update schedule" };
    }
  }

  /**
   * Archive working schedule (soft delete)
   */
  async archiveWorkingSchedule(id) {
    try {
      const response = await fetch(`${BASE_URL}/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("archiveWorkingSchedule error:", error);
      return { ok: false, success: false, message: error.message || "Failed to archive schedule" };
    }
  }
}

const workingSchedulesApi = new WorkingSchedulesAPI();
export default workingSchedulesApi;
