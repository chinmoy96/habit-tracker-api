const express = require("express");
const monthlySummaryService = require("../services/MonthlySummaryService");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * /api/monthly-summary:
 *   get:
 *     summary: Get monthly activity summary for the current user
 *     description: Returns total XP, strongest category, longest streak, and habit completion grid for a given month. Optionally hide specific habits.
 *     tags:
 *       - Monthly Summary
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           example: 2026
 *         description: Year of the summary (YYYY)
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *           example: 3
 *         description: Month number (1-12)
 *       - in: query
 *         name: hiddenHabitIds
 *         required: false
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         style: form
 *         explode: false
 *         example: uuid1,uuid2
 *         description: Optional comma-separated list of habit IDs to hide from summary
 *     responses:
 *       200:
 *         description: Monthly summary retrieved successfully
 *       400:
 *         description: Missing or invalid year/month parameter
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { year, month, hiddenHabitIds } = req.query;

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

    // -----------------------------
    // Parse hiddenHabitIds safely
    // -----------------------------
    let hiddenIdsArray = [];

    if (hiddenHabitIds) {
      if (Array.isArray(hiddenHabitIds)) {
        // ?hiddenHabitIds[]=id1&hiddenHabitIds[]=id2
        hiddenIdsArray = hiddenHabitIds;
      } else if (typeof hiddenHabitIds === "string") {
        // ?hiddenHabitIds=id1,id2
        hiddenIdsArray = hiddenHabitIds
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean);
      }
    }

    const data = await monthlySummaryService.getMonthlySummary(
      req.userId,
      parsedYear,
      parsedMonth,
      hiddenIdsArray
    );

    res.json({
      success: true,
      data,
    });

  } catch (error) {
    console.error("Monthly Summary Error:", error);

    res.status(500).json({
      success: false,
      error: error.message,
      statusCode: 500,
    });
  }
});

module.exports = router;