const { pool } = require('../db/database');

class HabitService {
  // Get all habits for a user
  async getUserHabits(userId) {
    try {
      const result = await pool.query(
        `SELECT id, user_id, name, description, xp_value, color, category_id, created_at, updated_at 
         FROM habits 
         WHERE user_id = $1 
         ORDER BY created_at DESC`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching habits: ${error.message}`);
    }
  }

  // Get all habits completed on date
  async getHabitsCompletedOnDate(userId, date) {
    try {
      const result = await pool.query(
        `SELECT h.id, h.name, h.description, h.xp_value, h.color, h.created_at, h.updated_at, h.category_id
         FROM habits h
         JOIN completions c ON h.id = c.habit_id
         WHERE c.user_id = $1 AND DATE(c.date) = $2`,
        [userId, date]
      );
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching habits completed on date: ${error.message}`);
    }
  }

  // Get habit by ID
  async getHabitById(habitId, userId) {
    try {
      const result = await pool.query(
        `SELECT id, user_id, name, description, xp_value, color, category_id, created_at, updated_at 
         FROM habits 
         WHERE id = $1 AND user_id = $2`,
        [habitId, userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching habit: ${error.message}`);
    }
  }

  // Create a new habit
  async createHabit(userId, name, description, xpValue, color, categoryId) {
    try {
      // Validate XP value
      if (xpValue < 1 || xpValue > 100) {
        throw new Error('XP value must be between 1 and 100');
      }

      const result = await pool.query(
        `INSERT INTO habits (user_id, name, description, xp_value, color, category_id) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id, user_id, name, description, xp_value, color, category_id, created_at, updated_at`,
        [userId, name, description || null, xpValue, color, categoryId]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating habit: ${error.message}`);
    }
  }

  // Update habit
  async updateHabit(habitId, userId, name, description, xpValue, color) {
    try {
      // Validate XP value if provided
      if (xpValue !== undefined && (xpValue < 1 || xpValue > 100)) {
        throw new Error('XP value must be between 1 and 100');
      }

      const habit = await this.getHabitById(habitId, userId);
      if (!habit) return null;

      const result = await pool.query(
        `UPDATE habits 
         SET name = COALESCE($1, name), 
             description = COALESCE($2, description), 
             xp_value = COALESCE($3, xp_value), 
             color = COALESCE($4, color),
             updated_at = CURRENT_TIMESTAMP 
         WHERE id = $5 AND user_id = $6 
         RETURNING id, user_id, name, description, xp_value, color, created_at, updated_at`,
        [name || null, description || null, xpValue || null, color || null, habitId, userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error updating habit: ${error.message}`);
    }
  }

  // Delete habit (cascade delete completions via database constraint)
  async deleteHabit(habitId, userId) {
    try {
      const habit = await this.getHabitById(habitId, userId);
      if (!habit) return false;

      const result = await pool.query(
        'DELETE FROM habits WHERE id = $1 AND user_id = $2',
        [habitId, userId]
      );

      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Error deleting habit: ${error.message}`);
    }
  }

  // Get habit with completion stats
  async getHabitWithStats(habitId, userId) {
    try {
      const habit = await this.getHabitById(habitId, userId);
      if (!habit) return null;

      // Get completion count
      const completionsResult = await pool.query(
        'SELECT COUNT(*) as count FROM completions WHERE habit_id = $1',
        [habitId]
      );
      const completionCount = parseInt(completionsResult.rows[0].count);

      // Get streak
      const now = new Date();
      const streakResult = await pool.query(
        `WITH RECURSIVE date_series AS (
           SELECT CURRENT_DATE as date
           UNION ALL
           SELECT date - INTERVAL '1 day'
           FROM date_series
           WHERE date > CURRENT_DATE - INTERVAL '365 days'
         )
         SELECT COUNT(*) as streak
         FROM date_series ds
         WHERE EXISTS (
           SELECT 1 FROM completions c
           WHERE c.habit_id = $1 AND c.date = ds.date
         )
         AND ds.date <= CURRENT_DATE
         AND NOT EXISTS (
           SELECT 1 FROM date_series ds2
           WHERE ds2.date = ds.date - INTERVAL '1 day'
           AND NOT EXISTS (
             SELECT 1 FROM completions c2
             WHERE c2.habit_id = $1 AND c2.date = ds2.date
           )
         )`,
        [habitId]
      );

      // Simpler streak calculation: count consecutive days ending today
      const lastSevenDaysResult = await pool.query(
        `SELECT date FROM completions 
         WHERE habit_id = $1 
         AND date >= CURRENT_DATE - INTERVAL '30 days'
         ORDER BY date DESC`,
        [habitId]
      );

      let streak = 0;
      if (lastSevenDaysResult.rows.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if completed today or yesterday
        let lastDate = new Date(lastSevenDaysResult.rows[0].date);
        lastDate.setHours(0, 0, 0, 0);

        if (lastDate.getTime() === today.getTime() || lastDate.getTime() === today.getTime() - 86400000) {
          for (let i = 0; i < lastSevenDaysResult.rows.length; i++) {
            const currentDate = new Date(lastSevenDaysResult.rows[i].date);
            currentDate.setHours(0, 0, 0, 0);
            const expectedDate = new Date(today.getTime() - i * 86400000);

            if (currentDate.getTime() === expectedDate.getTime()) {
              streak++;
            } else {
              break;
            }
          }
        }
      }

      return {
        id: habit.id,
        name: habit.name,
        description: habit.description,
        xpValue: habit.xp_value,
        color: habit.color,
        completionCount,
        streak,
        createdAt: habit.created_at,
        updatedAt: habit.updated_at,
      };
    } catch (error) {
      throw new Error(`Error fetching habit with stats: ${error.message}`);
    }
  }
}

module.exports = new HabitService();
