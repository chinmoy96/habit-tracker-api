const express = require("express");
const goalService = require("../services/GoalService");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Goals
 *   description: One-time goals management
 */

/**
 * @swagger
 * /api/goals:
 *   get:
 *     summary: Get all goals for current user
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed]
 *     responses:
 *       200:
 *         description: List of goals
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;

    const goals = await goalService.getUserGoals(req.userId, status);

    res.json({
      success: true,
      data: goals
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/goals:
 *   post:
 *     summary: Create a new one-time goal
 *     description: Creates a one-time goal for the current user. XP will be awarded once when the goal is completed.
 *     tags:
 *       - Goals
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - xpValue
 *             properties:
 *               name:
 *                 type: string
 *                 example: Run a Half Marathon
 *               description:
 *                 type: string
 *                 example: Complete a 21km marathon before end of month
 *               xpValue:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 1000
 *                 example: 300
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 example: 474c7f19-6603-459e-97c3-675adf326121
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 example: 2026-03-30
 *     responses:
 *       201:
 *         description: Goal created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     xp_value:
 *                       type: integer
 *                     category_id:
 *                       type: string
 *                     due_date:
 *                       type: string
 *                     is_completed:
 *                       type: boolean
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, description, xpValue, categoryId, dueDate } = req.body;

    const goal = await goalService.createGoal(
      req.userId,
      name,
      description,
      xpValue,
      categoryId,
      dueDate
    );

    res.status(201).json({
      success: true,
      data: goal
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/goals/{id}:
 *   get:
 *     summary: Get a specific goal by ID
 *     description: Retrieve full details of a single goal belonging to the current user.
 *     tags:
 *       - Goals
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Goal ID
 *         example: 474c7f19-6603-459e-97c3-675adf326121
 *     responses:
 *       200:
 *         description: Goal retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                       example: Run a Half Marathon
 *                     description:
 *                       type: string
 *                       example: Complete a 21km marathon
 *                     xp_value:
 *                       type: integer
 *                       example: 300
 *                     category_id:
 *                       type: string
 *                       nullable: true
 *                     due_date:
 *                       type: string
 *                       format: date
 *                       nullable: true
 *                     is_completed:
 *                       type: boolean
 *                       example: false
 *                     completed_at:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *       404:
 *         description: Goal not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const goal = await goalService.getGoalById(
      req.params.id,
      req.userId
    );

    if (!goal) {
      return res.status(404).json({
        success: false,
        error: "Goal not found"
      });
    }

    res.json({
      success: true,
      data: goal
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/goals/{id}/complete:
 *   post:
 *     summary: Complete a goal and receive XP
 *     description: Marks the goal as completed and awards XP to the user. A goal can only be completed once.
 *     tags:
 *       - Goals
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Goal ID
 *         example: 474c7f19-6603-459e-97c3-675adf326121
 *     responses:
 *       200:
 *         description: Goal completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     goalId:
 *                       type: string
 *                       format: uuid
 *                     xpAwarded:
 *                       type: integer
 *                       example: 300
 *                     newTotalXp:
 *                       type: integer
 *                       example: 7800
 *       400:
 *         description: Goal already completed or invalid request
 *       404:
 *         description: Goal not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/:id/complete", authMiddleware, async (req, res) => {
  try {
    const result = await goalService.completeGoal(
      req.params.id,
      req.userId
    );

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/goals/{id}:
 *   delete:
 *     summary: Delete a goal
 *     description: Permanently deletes a goal belonging to the current user.
 *     tags:
 *       - Goals
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Goal ID
 *         example: 474c7f19-6603-459e-97c3-675adf326121
 *     responses:
 *       200:
 *         description: Goal deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Goal deleted
 *       404:
 *         description: Goal not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const deleted = await goalService.deleteGoal(
      req.params.id,
      req.userId
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: "Goal not found"
      });
    }

    res.json({
      success: true,
      message: "Goal deleted"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;