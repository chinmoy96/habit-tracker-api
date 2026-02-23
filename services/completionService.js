const { pool } = require('../db/database');
const userService = require('./UserService');

class CompletionService {
  // Get all completions for a user
  async getUserCompletions(userId, startDate = null, endDate = null) {
    try {
      let query = `
        SELECT id, user_id, habit_id, date, created_at 
        FROM completions 
        WHERE user_id = $1
      `;
      const params = [userId];

      if (startDate) {
        query += ` AND date >= $${params.length + 1}`;
        params.push(startDate);
      }

      if (endDate) {
        query += ` AND date <= $${params.length + 1}`;
        params.push(endDate);
      }

      query += ' ORDER BY date DESC';

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching completions: ${error.message}`);
    }
  }

  // Get completions for a specific habit
  async getHabitCompletions(userId, habitId) {
    try {
      const result = await pool.query(
        `SELECT id, user_id, habit_id, date, created_at 
         FROM completions 
         WHERE user_id = $1 AND habit_id = $2
         ORDER BY date DESC`,
        [userId, habitId]
      );
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching habit completions: ${error.message}`);
    }
  }

  // Get completion by ID
  async getCompletionById(completionId, userId) {
    try {
      const result = await pool.query(
        `SELECT id, user_id, habit_id, date, created_at 
         FROM completions 
         WHERE id = $1 AND user_id = $2`,
        [completionId, userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching completion: ${error.message}`);
    }
  }

  // Mark habit as completed
  async addCompletion(userId, habitId, date) {
    try {
      // Validate inputs
      if (!date) {
        throw new Error('Date is required');
      }

      // Format date to YYYY-MM-DD
    //   const completionDate = new Date(date);
    //   completionDate.setHours(0, 0, 0, 0);
    //   const formattedDate = completionDate.toISOString().split('T')[0];

      // Get habit to verify it exists and get XP value
      const habitResult = await pool.query(
        'SELECT xp_value FROM habits WHERE id = $1 AND user_id = $2',
        [habitId, userId]
      );

      if (habitResult.rows.length === 0) {
        throw new Error('Habit not found');
      }

      const xpValue = habitResult.rows[0].xp_value;

      // Insert completion (will fail if duplicate due to unique constraint)
      const result = await pool.query(
        `INSERT INTO completions (user_id, habit_id, date) 
         VALUES ($1, $2, $3) 
         RETURNING id, user_id, habit_id, date, created_at`,
        [userId, habitId, date]
      );

      // Update user XP
      await userService.updateUserTotalXP(userId, xpValue);

      return result.rows[0];
    } catch (error) {
      if (error.message.includes('duplicate key')) {
        throw new Error('Habit already completed on this date');
      }
      throw new Error(`Error adding completion: ${error.message}`);
    }
  }

  // Remove completion and refund XP
  async removeCompletion(completionId, userId) {
    try {
      const completion = await this.getCompletionById(completionId, userId);
      if (!completion) return false;

      // Get habit to get XP value
      const habitResult = await pool.query(
        'SELECT xp_value FROM habits WHERE id = $1 AND user_id = $2',
        [completion.habit_id, userId]
      );

      if (habitResult.rows.length === 0) {
        throw new Error('Habit not found');
      }

      const xpValue = habitResult.rows[0].xp_value;

      // Delete completion
      const deleteResult = await pool.query(
        'DELETE FROM completions WHERE id = $1 AND user_id = $2',
        [completionId, userId]
      );

      // Refund XP
      await userService.updateUserTotalXP(userId, -xpValue);

      return deleteResult.rowCount > 0;
    } catch (error) {
      throw new Error(`Error removing completion: ${error.message}`);
    }
  }

  // Get completions for calendar (current month)
  async getMonthCompletions(userId, year = null, month = null) {
    try {
      const now = new Date();
      const targetYear = year || now.getFullYear();
      const targetMonth = month !== null ? month : now.getMonth() + 1;

      const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
      const endDate = new Date(targetYear, targetMonth, 0).toISOString().split('T')[0];

      const result = await pool.query(
        `SELECT id, user_id, habit_id, date, created_at 
         FROM completions 
         WHERE user_id = $1 AND date >= $2 AND date <= $3
         ORDER BY date ASC`,
        [userId, startDate, endDate]
      );

      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching month completions: ${error.message}`);
    }
  }
}

module.exports = new CompletionService();
