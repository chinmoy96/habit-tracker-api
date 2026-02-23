const express = require('express');
const habitCategoryXpService = require('../services/HabitCategoryXpService');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/habit-categories-xp:
 *   get:
 *     summary: Get XP grouped by habit category for current user
 *     tags:
 *       - Habit Categories
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: XP grouped by category
 *       401:
 *         description: Unauthorized
 */
router.get('/', authMiddleware, async (req, res) => {
    const { startDate, endDate } = req.query;

  try {
    console.log('Received request for XP by category with startDate:', startDate, 'and endDate:', endDate);
    const categories = await habitCategoryXpService.getXpByCategory(
      req.userId,
      startDate,
      endDate
    );

    const totalXp = await habitCategoryXpService.getTotalXp(
      req.userId,
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: {
        totalXp,
        categories,
      },
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