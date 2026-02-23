const { pool } = require('../db/database');

class UserService {
  // Get user by ID
  async getUserById(userId) {
    try {
      const result = await pool.query(
        'SELECT id, email, name, github_id, github_image, total_xp, created_at, updated_at FROM users WHERE id = $1',
        [userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching user: ${error.message}`);
    }
  }

  // Get or create user (for OAuth login)
  async getOrCreateUser(email, name, githubId, githubImage) {
    try {
      let user = await this.getUserByEmail(email);

      if (!user) {
        const result = await pool.query(
          `INSERT INTO users (email, name, github_id, github_image) 
           VALUES ($1, $2, $3, $4) 
           RETURNING id, email, name, github_id, github_image, total_xp, created_at, updated_at`,
          [email, name, githubId, githubImage]
        );
        user = result.rows[0];
      }

      return user;
    } catch (error) {
      throw new Error(`Error in getOrCreateUser: ${error.message}`);
    }
  }

  // Get user by email
  async getUserByEmail(email) {
    try {
      const result = await pool.query(
        'SELECT id, email, name, github_id, github_image, total_xp, created_at, updated_at FROM users WHERE email = $1',
        [email]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching user by email: ${error.message}`);
    }
  }

  // Update user profile
  async updateUserProfile(userId, name, githubImage) {
    try {
      const result = await pool.query(
        `UPDATE users SET name = $1, github_image = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3 
         RETURNING id, email, name, github_id, github_image, total_xp, created_at, updated_at`,
        [name, githubImage, userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error updating user profile: ${error.message}`);
    }
  }

  // Update user total XP
  async updateUserTotalXP(userId, xpDelta) {
    try {
      const result = await pool.query(
        `UPDATE users SET total_xp = total_xp + $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING id, email, name, github_id, github_image, total_xp, created_at, updated_at`,
        [xpDelta, userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error updating user XP: ${error.message}`);
    }
  }

  // Get user profile with stats
  async getUserProfileWithStats(userId) {
    try {
      const user = await this.getUserById(userId);
      if (!user) return null;

      // Get habits count
      const habitsResult = await pool.query(
        'SELECT COUNT(*) as count FROM habits WHERE user_id = $1',
        [userId]
      );
      const habitsCount = parseInt(habitsResult.rows[0].count);

      // Get total completions
      const completionsResult = await pool.query(
        'SELECT COUNT(*) as count FROM completions WHERE user_id = $1',
        [userId]
      );
      const totalCompletions = parseInt(completionsResult.rows[0].count);

      // Calculate level (every 1000 XP = 1 level)
      const level = Math.floor(user.total_xp / 1000) + 1;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        githubId: user.github_id,
        githubImage: user.github_image,
        totalXP: user.total_xp,
        level,
        habitsCount,
        totalCompletions,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      };
    } catch (error) {
      throw new Error(`Error fetching user profile with stats: ${error.message}`);
    }
  }

  // Get user stats
  async getUserStats(userId) {
    try {
      const user = await this.getUserById(userId);
      if (!user) return null;

      // Get habits count
      const habitsResult = await pool.query(
        'SELECT COUNT(*) as count FROM habits WHERE user_id = $1',
        [userId]
      );
      const habitsCount = parseInt(habitsResult.rows[0].count);

      // Get total completions
      const completionsResult = await pool.query(
        'SELECT COUNT(*) as count FROM completions WHERE user_id = $1',
        [userId]
      );
      const totalCompletions = parseInt(completionsResult.rows[0].count);

      // Calculate level
      const level = Math.floor(user.total_xp / 1000) + 1;
      const nextLevelXP = level * 1000;
      const currentLevelXP = (level - 1) * 1000;
      const xpToNextLevel = nextLevelXP - user.total_xp;

      return {
        totalXP: user.total_xp,
        level,
        xpToNextLevel,
        habitsCount,
        totalCompletions,
      };
    } catch (error) {
      throw new Error(`Error fetching user stats: ${error.message}`);
    }
  }
}

module.exports = new UserService();
