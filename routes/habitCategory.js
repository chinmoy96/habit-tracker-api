const express = require('express');
const habitCategoryService = require('../services/HabitCategoryService');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/habit-categories:
 *   get:
 *     summary: List all habit categories for current user
 *     tags:
 *       - Habit Categories
 *     responses:
 *       200:
 *         description: List of user's habit categories
 *       401:
 *         description: Unauthorized
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const categories = await habitCategoryService.getAllCategories();

    res.json({
      success: true,
      data: categories.map((c) => ({
        id: c.habits_category_id,
        name: c.name,
        description: c.description,
        color: c.color,
        icon: c.icon,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
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
 * /api/habit-categories/{id}:
 *   get:
 *     summary: Get specific habit category details
 *     tags:
 *       - Habit Categories
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The category ID
 *     responses:
 *       200:
 *         description: Habit category details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const category = await habitCategoryService.getCategoryById(
      req.params.id,
      req.userId
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Habit category not found',
        statusCode: 404,
      });
    }

    res.json({
      success: true,
      data: {
        id: category.id,
        name: category.name,
        description: category.description,
        color: category.color,
        icon: category.icon,
        createdAt: category.created_at,
        updatedAt: category.updated_at,
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
 * /api/habit-categories:
 *   post:
 *     summary: Create new habit category
 *     tags:
 *       - Habit Categories
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - color
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Habit category created
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'name is required',
        statusCode: 400,
      });
    }

    const category = await habitCategoryService.createCategory(
      name,
      description,
    );

    res.status(201).json({
      success: true,
      data: {
        id: category.id,
        name: category.name,
        description: category.description,
        color: category.color,
        icon: category.icon,
        createdAt: category.created_at,
        updatedAt: category.updated_at,
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
 * /api/habit-categories/{id}:
 *   put:
 *     summary: Update habit category
 *     tags:
 *       - Habit Categories
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
 *     responses:
 *       200:
 *         description: Habit category updated
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;

    const category = await habitCategoryService.updateCategory(
      req.params.id,
      req.userId,
      name,
      description,
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Habit category not found',
        statusCode: 404,
      });
    }

    res.json({
      success: true,
      data: {
        id: category.id,
        name: category.name,
        description: category.description,
        color: category.color,
        icon: category.icon,
        createdAt: category.created_at,
        updatedAt: category.updated_at,
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
 * /api/habit-categories/{id}:
 *   delete:
 *     summary: Delete habit category
 *     tags:
 *       - Habit Categories
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Category deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const deleted = await habitCategoryService.deleteCategory(
      req.params.id,
      req.userId
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Habit category not found',
        statusCode: 404,
      });
    }

    res.json({
      success: true,
      data: { message: 'Habit category deleted successfully' },
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