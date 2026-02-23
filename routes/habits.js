const express = require('express');
const habitService = require('../services/HabitService');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/habits:
 *   get:
 *     summary: List all habits for current user
 *     tags:
 *       - Habits
 *     responses:
 *       200:
 *         description: List of user's habits
 *       401:
 *         description: Unauthorized
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const habits = await habitService.getUserHabits(req.userId);
    res.json({
      success: true,
      data: habits.map((h) => ({
        id: h.id,
        name: h.name,
        description: h.description,
        xpValue: h.xp_value,
        color: h.color,
        categoryId: h.category_id,
        createdAt: h.created_at,
        updatedAt: h.updated_at,
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
 * /api/habits/{date}:
 *   get:
 *     summary: List all habits for current user on a specific date
 *     tags:
 *       - Habits
 *     parameters:
 *       - in: path
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: The date to retrieve habits for (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: List of user's habits
 *       401:
 *         description: Unauthorized
 */
router.get('/:date', authMiddleware, async (req, res) => {
  try {
    console.log(`Fetching habits for user ${req.userId} on date ${req.params.date}`);
    const habits = await habitService.getHabitsCompletedOnDate(req.userId, req.params.date);
    res.json({
      success: true,
      data: habits.map((h) => ({
        id: h.id,
        name: h.name,
        description: h.description,
        xpValue: h.xp_value,
        color: h.color,
        categoryId: h.category_id,
        createdAt: h.created_at,
        updatedAt: h.updated_at,
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
 * /api/habits/{id}:
 *   get:
 *     summary: Get specific habit details
 *     tags:
 *       - Habits
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The habit ID
 *     responses:
 *       200:
 *         description: Habit details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Habit not found
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const habit = await habitService.getHabitById(req.params.id, req.userId);
    if (!habit) {
      return res.status(404).json({
        success: false,
        error: 'Habit not found',
        statusCode: 404,
      });
    }

    res.json({
      success: true,
      data: {
        id: habit.id,
        name: habit.name,
        description: habit.description,
        xpValue: habit.xp_value,
        color: habit.color,
        categoryId: habit.category_id,
        createdAt: habit.created_at,
        updatedAt: habit.updated_at,
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

/**
 * @swagger
 * /api/habits:
 *   post:
 *     summary: Create new habit
 *     tags:
 *       - Habits
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - xpValue
 *               - color
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               xpValue:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *               color:
 *                 type: string
 *               categoryId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Habit created
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, xpValue, color, categoryId } = req.body;

    // Validate required fields
    if (!name || !xpValue || !color || !categoryId) {
      return res.status(400).json({
        success: false,
        error: 'name, xpValue, color, and categoryId are required',
        statusCode: 400,
      });
    }

    // Validate XP value
    if (xpValue < 1 || xpValue > 100) {
      return res.status(400).json({
        success: false,
        error: 'xpValue must be between 1 and 100',
        statusCode: 400,
      });
    }

    const habit = await habitService.createHabit(
      req.userId,
      name,
      description,
      xpValue,
      color,
      categoryId
    );

    res.status(201).json({
      success: true,
      data: {
        id: habit.id,
        name: habit.name,
        description: habit.description,
        xpValue: habit.xp_value,
        color: habit.color,
        createdAt: habit.created_at,
        updatedAt: habit.updated_at,
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

/**
 * @swagger
 * /api/habits/{id}:
 *   put:
 *     summary: Update habit
 *     tags:
 *       - Habits
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               xpValue:
 *                 type: integer
 *               color:
 *                 type: string
 *     responses:
 *       200:
 *         description: Habit updated
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Habit not found
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, xpValue, color } = req.body;

    // Validate XP value if provided
    if (xpValue !== undefined && (xpValue < 1 || xpValue > 100)) {
      return res.status(400).json({
        success: false,
        error: 'xpValue must be between 1 and 100',
        statusCode: 400,
      });
    }

    const habit = await habitService.updateHabit(
      req.params.id,
      req.userId,
      name,
      description,
      xpValue,
      color
    );

    if (!habit) {
      return res.status(404).json({
        success: false,
        error: 'Habit not found',
        statusCode: 404,
      });
    }

    res.json({
      success: true,
      data: {
        id: habit.id,
        name: habit.name,
        description: habit.description,
        xpValue: habit.xp_value,
        color: habit.color,
        createdAt: habit.created_at,
        updatedAt: habit.updated_at,
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

/**
 * @swagger
 * /api/habits/{id}:
 *   delete:
 *     summary: Delete habit (cascade delete completions)
 *     tags:
 *       - Habits
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Habit deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Habit not found
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const deleted = await habitService.deleteHabit(req.params.id, req.userId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Habit not found',
        statusCode: 404,
      });
    }

    res.json({
      success: true,
      data: { message: 'Habit deleted successfully' },
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
