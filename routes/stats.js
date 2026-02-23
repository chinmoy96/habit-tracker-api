const express = require('express');
const statsService = require('../services/statsService');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/stats/summary:
 *   get:
 *     summary: Get user's summary stats (level, XP, habits count, total completions)
 *     tags:
 *       - Statistics
 *     responses:
 *       200:
 *         description: User summary statistics
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const stats = await statsService.getUserSummaryStats(req.userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
        statusCode: 404,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
      statusCode: 500,
    });
  }
});

/**
 * @swagger
 * /api/stats/habits/{id}:
 *   get:
 *     summary: Get habit-specific stats (completion count, streak)
 *     tags:
 *       - Statistics
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Habit statistics
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Habit not found
 */
router.get('/habits/:id', authMiddleware, async (req, res) => {
  try {
    const stats = await statsService.getHabitStats(req.userId, req.params.id);

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'Habit not found',
        statusCode: 404,
      });
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
        statusCode: 404,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
      statusCode: 500,
    });
  }
});

/**
 * @swagger
 * /api/stats/calendar:
 *   get:
 *     summary: Get completions calendar data for current month
 *     tags:
 *       - Statistics
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Year (defaults to current year)
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: Month 1-12 (defaults to current month)
 *     responses:
 *       200:
 *         description: Calendar data for the month
 *       401:
 *         description: Unauthorized
 */
router.get('/calendar', authMiddleware, async (req, res) => {
  try {
    const { year, month } = req.query;

    const calendar = await statsService.getCalendarStats(
      req.userId,
      year ? parseInt(year) : null,
      month ? parseInt(month) : null
    );

    res.json({
      success: true,
      data: calendar,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      statusCode: 500,
    });
  }
});

module.exports = router;
