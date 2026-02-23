const express = require('express');
const completionService = require('../services/completionService');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/completions:
 *   get:
 *     summary: Get all completions for current user (with optional date range filter)
 *     tags:
 *       - Completions
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: List of completions
 *       401:
 *         description: Unauthorized
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const completions = await completionService.getUserCompletions(
      req.userId,
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: completions.map((c) => ({
        id: c.id,
        habitId: c.habit_id,
        date: c.date,
        createdAt: c.created_at,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      statusCode: 500,
    });
  }
});

/**
 * @swagger
 * /api/completions/{habitId}:
 *   get:
 *     summary: Get completions for specific habit
 *     tags:
 *       - Completions
 *     parameters:
 *       - in: path
 *         name: habitId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: List of completions for habit
 *       401:
 *         description: Unauthorized
 */
router.get('/:habitId', authMiddleware, async (req, res) => {
  try {
    const completions = await completionService.getHabitCompletions(
      req.userId,
      req.params.habitId
    );

    res.json({
      success: true,
      data: completions.map((c) => ({
        id: c.id,
        habitId: c.habit_id,
        date: c.date,
        createdAt: c.created_at,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      statusCode: 500,
    });
  }
});

/**
 * @swagger
 * /api/completions:
 *   post:
 *     summary: Mark habit as completed
 *     tags:
 *       - Completions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - habitId
 *               - date
 *             properties:
 *               habitId:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Completion recorded
 *       400:
 *         description: Invalid input or duplicate
 *       401:
 *         description: Unauthorized
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { habitId, date } = req.body;

    // Validate required fields
    if (!habitId || !date) {
      return res.status(400).json({
        success: false,
        error: 'habitId and date are required',
        statusCode: 400,
      });
    }

    const completion = await completionService.addCompletion(
      req.userId,
      habitId,
      date
    );

    res.status(201).json({
      success: true,
      data: {
        id: completion.id,
        habitId: completion.habit_id,
        date: completion.date,
        createdAt: completion.created_at,
      },
    });
  } catch (error) {
    // Check if it's a duplicate error
    if (error.message.includes('already completed')) {
      return res.status(400).json({
        success: false,
        error: error.message,
        statusCode: 400,
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
 * /api/completions/{id}:
 *   delete:
 *     summary: Remove a completion and refund XP
 *     tags:
 *       - Completions
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Completion removed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Completion not found
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const deleted = await completionService.removeCompletion(
      req.params.id,
      req.userId
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Completion not found',
        statusCode: 404,
      });
    }

    res.json({
      success: true,
      data: { message: 'Completion removed and XP refunded' },
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
