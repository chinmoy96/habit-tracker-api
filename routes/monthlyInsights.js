const express = require("express");
const monthlyInsightsService = require("../services/MonthlyInsightsService");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * /api/monthly-insights:
 *   get:
 *     summary: Get smart monthly insights for current user
 *     tags:
 *       - Monthly Insights
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           example: 2026
 *         required: true
 *         description: Year of the report
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           example: 2
 *           minimum: 1
 *           maximum: 12
 *         required: true
 *         description: Month of the report (1-12)
 *     responses:
 *       200:
 *         description: Monthly insights retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     month:
 *                       type: string
 *                     totalDays:
 *                       type: integer
 *                     activeDays:
 *                       type: integer
 *                     totalCompletions:
 *                       type: integer
 *                     consistencyRate:
 *                       type: integer
 *                     perfectDays:
 *                       type: integer
 *                     weeklyPeak:
 *                       type: string
 *                     mostActiveWeekday:
 *                       type: string
 *                     monthComparison:
 *                       type: object
 *                       properties:
 *                         xpChangePercent:
 *                           type: integer
 *                         completionChange:
 *                           type: integer
 *                         consistencyChange:
 *                           type: integer
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { year, month } = req.query;

    // ----------------------------
    // Validation
    // ----------------------------
    if (!year || !month) {
      return res.status(400).json({
        success: false,
        error: "Year and month are required",
        statusCode: 400,
      });
    }

    const parsedYear = parseInt(year);
    const parsedMonth = parseInt(month);

    if (
      isNaN(parsedYear) ||
      isNaN(parsedMonth) ||
      parsedMonth < 1 ||
      parsedMonth > 12
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid year or month",
        statusCode: 400,
      });
    }

    // ----------------------------
    // Service Call
    // ----------------------------
    const insights = await monthlyInsightsService.getMonthlyInsights(
      req.userId,
      parsedYear,
      parsedMonth
    );

    res.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    console.error("Monthly Insights Error:", error);

    res.status(500).json({
      success: false,
      error: error.message,
      statusCode: 500,
    });
  }
});

module.exports = router;