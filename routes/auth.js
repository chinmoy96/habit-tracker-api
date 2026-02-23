const express = require('express');
const userService = require('../services/UserService');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/auth/user:
 *   get:
 *     summary: Get current authenticated user info
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Current user information
 *       401:
 *         description: Unauthorized
 */
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const user = await userService.getUserByEmail(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        statusCode: 404,
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        githubId: user.github_id,
        githubImage: user.github_image,
        totalXP: user.total_xp,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
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
