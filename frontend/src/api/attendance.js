import conf from "../conf/conf";

const BASE_URL = `${conf.BACKEND_URL}/api/attendance`;

class AttendanceAPI {
  /**
   * Self Check-In
   */
  async checkIn() {
    try {
      const response = await fetch(`${BASE_URL}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("checkIn error:", error);
      return { ok: false, success: false, message: error.message || "Failed to check in" };
    }
  }

  /**
   * Self Check-Out
   */
  async checkOut() {
    try {
      const response = await fetch(`${BASE_URL}/check-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("checkOut error:", error);
      return { ok: false, success: false, message: error.message || "Failed to check out" };
    }
  }

  /**
   * List attendances with optional filters: ?employee=&from=&to=&status=
   */
  async listAttendances(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.employee) query.append("employee", params.employee);
      if (params.from) query.append("from", params.from);
      if (params.to) query.append("to", params.to);
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
      console.error("listAttendances error:", error);
      return { ok: false, success: false, message: error.message || "Failed to fetch attendance records" };
    }
  }

  /**
   * Get attendance record by ID
   */
  async getAttendanceById(id) {
    try {
      const response = await fetch(`${BASE_URL}/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("getAttendanceById error:", error);
      return { ok: false, success: false, message: error.message || "Failed to fetch attendance record" };
    }
  }

  /**
   * HR / Admin manual attendance record creation
   */
  async createAttendance(data) {
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
      console.error("createAttendance error:", error);
      return { ok: false, success: false, message: error.message || "Failed to create attendance record" };
    }
  }

  /**
   * HR / Admin manual attendance record update
   */
  async updateAttendance(id, data) {
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
      console.error("updateAttendance error:", error);
      return { ok: false, success: false, message: error.message || "Failed to update attendance record" };
    }
  }

  /**
   * Delete attendance record
   */
  async deleteAttendance(id) {
    try {
      const response = await fetch(`${BASE_URL}/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("deleteAttendance error:", error);
      return { ok: false, success: false, message: error.message || "Failed to delete attendance record" };
    }
  }
}

const attendanceApi = new AttendanceAPI();
export default attendanceApi;
