const express = require('express');
const userService = require('../services/UserService');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get current user profile and stats
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: User profile with stats
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const profile = await userService.getUserProfileWithStats(req.userId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        statusCode: 404,
      });
    }

    res.json({
      success: true,
      data: profile,
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
 * /api/users/profile/{id}:
 *   put:
 *     summary: Update current user profile (name)
 *     tags:
 *       - Users
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
 *     responses:
 *       200:
 *         description: User profile with stats
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.put('/profile/:id', authMiddleware, async (req, res) => {
  try {
    const profile = await userService.updateUserProfile(req.params.id, req.body.name);
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        statusCode: 404,
      });
    }

    res.json({
      success: true,
      data: profile,
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
 * /api/users/stats:
 *   get:
 *     summary: Get user statistics (total XP, level, habits count)
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: User statistics
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const stats = await userService.getUserStats(req.userId);
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        statusCode: 404,
      });
    }

    res.json({
      success: true,
      data: stats,
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
