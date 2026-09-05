import conf from "../conf/conf";

const BACKEND_URL = conf.BACKEND_URL;

class ReferencesAPI {
  /**
   * List all departments
   */
  async listDepartments() {
    try {
      const response = await fetch(`${BACKEND_URL}/api/departments`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("listDepartments error:", error);
      return { ok: false, success: false, data: { departments: [] }, message: error.message };
    }
  }

  /**
   * List job positions (optional ?department= query)
   */
  async listJobPositions(departmentId = "") {
    try {
      const url = departmentId
        ? `${BACKEND_URL}/api/job-positions?department=${departmentId}`
        : `${BACKEND_URL}/api/job-positions`;

      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("listJobPositions error:", error);
      return { ok: false, success: false, data: { jobPositions: [] }, message: error.message };
    }
  }

  /**
   * List working schedules (optional ?status= query)
   */
  async listWorkingSchedules(status = "Active") {
    try {
      const url = status
        ? `${BACKEND_URL}/api/working-schedules?status=${status}`
        : `${BACKEND_URL}/api/working-schedules`;

      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("listWorkingSchedules error:", error);
      return { ok: false, success: false, data: { workingSchedules: [] }, message: error.message };
    }
  }

  /**
   * List salary structures
   */
  async listSalaryStructures() {
    try {
      const response = await fetch(`${BACKEND_URL}/api/salary-structures`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("listSalaryStructures error:", error);
      return { ok: false, success: false, data: { salaryStructures: [] }, message: error.message };
    }
  }
}

const referencesApi = new ReferencesAPI();
export default referencesApi;
