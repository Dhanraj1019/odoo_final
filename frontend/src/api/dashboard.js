import conf from "../conf/conf";

const BASE_URL = `${conf.BACKEND_URL}/api/dashboard`;

class DashboardAPI {
  /**
   * Fetch dashboard analytics:
   * GET /api/dashboard?period=&from=&to=&department=&employeeType=&scope=
   */
  async getDashboard(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.period) query.append("period", params.period);
      if (params.from) query.append("from", params.from);
      if (params.to) query.append("to", params.to);
      if (params.department) query.append("department", params.department);
      if (params.employeeType && params.employeeType !== "All") query.append("employeeType", params.employeeType);
      if (params.scope) query.append("scope", params.scope);

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
      console.error("getDashboard error:", error);
      return { ok: false, success: false, message: error.message || "Failed to fetch dashboard data" };
    }
  }
}

const dashboardApi = new DashboardAPI();
export default dashboardApi;
