import conf from "../conf/conf";

const BASE_URL = conf.BACKEND_URL;

class PayslipsAPI {
  /**
   * List payslips: GET /api/payslips?payrun=&employee=&status=
   */
  async listPayslips(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.payrun) query.append("payrun", params.payrun);
      if (params.employee) query.append("employee", params.employee);
      if (params.status) query.append("status", params.status);

      const qs = query.toString();
      const url = qs ? `${BASE_URL}/api/payslips?${qs}` : `${BASE_URL}/api/payslips`;

      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("listPayslips error:", error);
      return { ok: false, success: false, message: error.message || "Failed to fetch payslips" };
    }
  }

  /**
   * Get single payslip by ID: GET /api/payslips/:id
   */
  async getPayslipById(id) {
    try {
      const response = await fetch(`${BASE_URL}/api/payslips/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("getPayslipById error:", error);
      return { ok: false, success: false, message: error.message || "Failed to fetch payslip" };
    }
  }

  /**
   * Get PDF download URL or trigger direct browser stream
   */
  getPdfUrl(id) {
    return `${BASE_URL}/api/payslips/${id}/pdf`;
  }

  /**
   * Download PDF as Blob
   */
  async downloadPdfBlob(id) {
    try {
      const response = await fetch(`${BASE_URL}/api/payslips/${id}/pdf`, {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Failed to download PDF (Status ${response.statusCode || response.status})`);
      }
      return await response.blob();
    } catch (error) {
      console.error("downloadPdfBlob error:", error);
      throw error;
    }
  }

  /**
   * Update payslip line (manual adjustment before validation)
   */
  async updatePayslipLine(id, data) {
    try {
      const response = await fetch(`${BASE_URL}/api/payslips/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("updatePayslipLine error:", error);
      return { ok: false, success: false, message: error.message || "Failed to update payslip" };
    }
  }

  /**
   * Delete payslip: DELETE /api/payslips/:id
   */
  async deletePayslip(id) {
    try {
      const response = await fetch(`${BASE_URL}/api/payslips/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      return { ok: response.ok, ...result };
    } catch (error) {
      console.error("deletePayslip error:", error);
      return { ok: false, success: false, message: error.message || "Failed to delete payslip" };
    }
  }
}

const payslipsApi = new PayslipsAPI();
export default payslipsApi;
