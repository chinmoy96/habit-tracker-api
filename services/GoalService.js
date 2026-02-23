const { pool } = require("../db/database");

class GoalService {

  // Get all goals for user
  async getUserGoals(userId, status = null) {
    try {
      let query = `
        SELECT id, name, description, xp_value, category_id,
               due_date, is_completed, completed_at,
               created_at, updated_at
        FROM goals
        WHERE user_id = $1
      `;

      const params = [userId];

      if (status === "active") {
        query += " AND is_completed = FALSE";
      } else if (status === "completed") {
        query += " AND is_completed = TRUE";
      }

      query += " ORDER BY created_at DESC";

      const result = await pool.query(query, params);
      return result.rows;

    } catch (error) {
      throw new Error(`Error fetching goals: ${error.message}`);
    }
  }

  // Get goal by ID
  async getGoalById(goalId, userId) {
    try {
      const result = await pool.query(
        `
        SELECT *
        FROM goals
        WHERE id = $1 AND user_id = $2
        `,
        [goalId, userId]
      );

      return result.rows[0] || null;

    } catch (error) {
      throw new Error(`Error fetching goal: ${error.message}`);
    }
  }

  // Create goal
  async createGoal(userId, name, description, xpValue, categoryId, dueDate) {
    try {
      if (!name || !xpValue) {
        throw new Error("Name and xpValue are required");
      }

      const result = await pool.query(
        `
        INSERT INTO goals (
          user_id, name, description, xp_value, category_id, due_date
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        `,
        [
          userId,
          name,
          description || null,
          xpValue,
          categoryId || null,
          dueDate || null
        ]
      );

      return result.rows[0];

    } catch (error) {
      throw new Error(`Error creating goal: ${error.message}`);
    }
  }

  // Complete goal (transaction safe)
  async completeGoal(goalId, userId) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const goalResult = await client.query(
        `
        SELECT * FROM goals
        WHERE id = $1 AND user_id = $2
        FOR UPDATE
        `,
        [goalId, userId]
      );

      const goal = goalResult.rows[0];

      if (!goal) {
        throw new Error("Goal not found");
      }

      if (goal.is_completed) {
        throw new Error("Goal already completed");
      }

      // Mark goal completed
      await client.query(
        `
        UPDATE goals
        SET is_completed = TRUE,
            completed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        `,
        [goalId]
      );

      // Add XP to user
      await client.query(
        `
        UPDATE users
        SET total_xp = total_xp + $1
        WHERE id = $2
        `,
        [goal.xp_value, userId]
      );

      // Fetch updated XP
      const userResult = await client.query(
        `SELECT total_xp FROM users WHERE id = $1`,
        [userId]
      );

      await client.query("COMMIT");

      return {
        goalId: goalId,
        xpAwarded: goal.xp_value,
        newTotalXp: userResult.rows[0].total_xp
      };

    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(`Error completing goal: ${error.message}`);
    } finally {
      client.release();
    }
  }

  // Delete goal
  async deleteGoal(goalId, userId) {
    try {
      const result = await pool.query(
        `
        DELETE FROM goals
        WHERE id = $1 AND user_id = $2
        `,
        [goalId, userId]
      );

      return result.rowCount > 0;

    } catch (error) {
      throw new Error(`Error deleting goal: ${error.message}`);
    }
  }
}

module.exports = new GoalService();