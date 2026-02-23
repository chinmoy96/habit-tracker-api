const { pool } = require("../db/database");

class DailyTaskService {

async getTasksForDate(userId, date = null) {
  try {
    let query = `
      SELECT *
      FROM daily_tasks
      WHERE user_id = $1
    `;

    const params = [userId];

    // If date is provided, filter by it
    if (date) {
      query += ` AND task_date = $2`;
      params.push(date);
    }

    query += ` ORDER BY task_date DESC, created_at DESC`;

    const result = await pool.query(query, params);

    return result.rows;
  } catch (error) {
    throw new Error(`Error fetching daily tasks: ${error.message}`);
  }
}

  async createTask(userId, name, description, xpValue, taskDate = null) {
    try {
      const date = taskDate || new Date().toISOString().split("T")[0];

      const result = await pool.query(
        `
        INSERT INTO daily_tasks 
        (user_id, name, description, xp_value, task_date)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        `,
        [userId, name, description || null, xpValue, date]
      );

      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating daily task: ${error.message}`);
    }
  }

  async completeTask(taskId, userId) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const taskResult = await client.query(
        `
        SELECT * FROM daily_tasks
        WHERE id = $1 AND user_id = $2
        `,
        [taskId, userId]
      );

      const task = taskResult.rows[0];
      if (!task) throw new Error("Task not found");

      if (task.is_completed)
        throw new Error("Task already completed");

      // Mark complete
      await client.query(
        `
        UPDATE daily_tasks
        SET is_completed = TRUE,
            completed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        `,
        [taskId]
      );

      // Add XP to user
      await client.query(
        `
        UPDATE users
        SET total_xp = total_xp + $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        `,
        [task.xp_value, userId]
      );

      await client.query("COMMIT");

      return {
        taskId,
        xpAwarded: task.xp_value
      };

    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(`Error completing task: ${error.message}`);
    } finally {
      client.release();
    }
  }

  async deleteTask(taskId, userId) {
    const result = await pool.query(
      `
      DELETE FROM daily_tasks
      WHERE id = $1 AND user_id = $2
      `,
      [taskId, userId]
    );

    return result.rowCount > 0;
  }
}

module.exports = new DailyTaskService();