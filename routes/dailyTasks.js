const express = require("express");
const dailyTaskService = require("../services/DailyTaskService");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * /api/daily-tasks:
 *   get:
 *     summary: Get daily tasks for a specific date
 *     description: Returns all daily tasks for the authenticated user. If no date is provided, today's tasks are returned.
 *     tags:
 *       - Daily Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: 2026-03-12
 *         description: Date to fetch tasks for (YYYY-MM-DD). Defaults to today.
 *     responses:
 *       200:
 *         description: List of daily tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                         nullable: true
 *                       xp_value:
 *                         type: integer
 *                       is_completed:
 *                         type: boolean
 *                       completed_at:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       task_date:
 *                         type: string
 *                         format: date
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { date } = req.query;
    const tasks = await dailyTaskService.getTasksForDate(req.userId, date);
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


/**
 * @swagger
 * /api/daily-tasks:
 *   post:
 *     summary: Create a new daily task
 *     description: Creates a daily task for the authenticated user.
 *     tags:
 *       - Daily Tasks
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
 *                 example: Drink 2L Water
 *               description:
 *                 type: string
 *                 example: Stay hydrated today
 *               xpValue:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 200
 *                 example: 15
 *               taskDate:
 *                 type: string
 *                 format: date
 *                 example: 2026-03-12
 *     responses:
 *       201:
 *         description: Task created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, description, xpValue, taskDate } = req.body;

    const task = await dailyTaskService.createTask(
      req.userId,
      name,
      description,
      xpValue,
      taskDate
    );

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});


/**
 * @swagger
 * /api/daily-tasks/{id}/complete:
 *   post:
 *     summary: Complete a daily task and receive XP
 *     description: Marks the task as completed and adds XP to the user's total XP.
 *     tags:
 *       - Daily Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task completed successfully
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
 *                     taskId:
 *                       type: string
 *                       format: uuid
 *                     xpAwarded:
 *                       type: integer
 *                       example: 15
 *       400:
 *         description: Task already completed or invalid
 *       401:
 *         description: Unauthorized
 */
router.post("/:id/complete", authMiddleware, async (req, res) => {
  try {
    const result = await dailyTaskService.completeTask(
      req.params.id,
      req.userId
    );

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});


/**
 * @swagger
 * /api/daily-tasks/{id}:
 *   delete:
 *     summary: Delete a daily task
 *     description: Deletes a daily task for the authenticated user.
 *     tags:
 *       - Daily Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const deleted = await dailyTaskService.deleteTask(
      req.params.id,
      req.userId
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: "Task not found"
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;