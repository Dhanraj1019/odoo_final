const dashboardService = require("../services/dashboard.service");

/**
 * GET /api/dashboard
 * Retrieves KPI aggregates, charts, alerts, attendance/time-off overviews, and department breakdowns
 */
exports.getDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getDashboardData(req.query, req.user);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
