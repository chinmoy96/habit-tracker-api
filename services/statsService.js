const { pool } = require('../db/database');

class StatsService {
  // Get user summary stats
  async getUserSummaryStats(userId) {
    try {
      // Get user info with total XP
      const userResult = await pool.query(
        'SELECT total_xp FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const totalXP = userResult.rows[0].total_xp;

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
      const level = Math.floor(totalXP / 1000) + 1;
      const nextLevelXP = level * 1000;
      const xpToNextLevel = nextLevelXP - totalXP;

      return {
        totalXP,
        level,
        xpToNextLevel,
        habitsCount,
        totalCompletions,
      };
    } catch (error) {
      throw new Error(`Error fetching summary stats: ${error.message}`);
    }
  }

  // Get habit-specific stats
  async getHabitStats(userId, habitId) {
    try {
      // Verify habit exists and belongs to user
      const habitResult = await pool.query(
        'SELECT id, name, xp_value FROM habits WHERE id = $1 AND user_id = $2',
        [habitId, userId]
      );

      if (habitResult.rows.length === 0) {
        throw new Error('Habit not found');
      }

      const habit = habitResult.rows[0];

      // Get completion count
      const completionResult = await pool.query(
        'SELECT COUNT(*) as count FROM completions WHERE habit_id = $1',
        [habitId]
      );
      const completionCount = parseInt(completionResult.rows[0].count);

      // Get total XP earned from this habit
      const totalXPEarned = completionCount * habit.xp_value;

      // Calculate streak
      let streak = 0;
      const lastCompletionsResult = await pool.query(
        `SELECT date FROM completions 
         WHERE habit_id = $1 
         AND date >= CURRENT_DATE - INTERVAL '30 days'
         ORDER BY date DESC`,
        [habitId]
      );

      if (lastCompletionsResult.rows.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if completed today or yesterday
        let lastDate = new Date(lastCompletionsResult.rows[0].date);
        lastDate.setHours(0, 0, 0, 0);

        if (lastDate.getTime() === today.getTime() || lastDate.getTime() === today.getTime() - 86400000) {
          for (let i = 0; i < lastCompletionsResult.rows.length; i++) {
            const currentDate = new Date(lastCompletionsResult.rows[i].date);
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

      // Get last completion date
      const lastCompletionResult = await pool.query(
        `SELECT date FROM completions 
         WHERE habit_id = $1 
         ORDER BY date DESC 
         LIMIT 1`,
        [habitId]
      );

      const lastCompletionDate = lastCompletionResult.rows[0]?.date || null;

      return {
        habitId,
        habitName: habit.name,
        xpValue: habit.xp_value,
        completionCount,
        totalXPEarned,
        streak,
        lastCompletionDate,
      };
    } catch (error) {
      throw new Error(`Error fetching habit stats: ${error.message}`);
    }
  }

  // Get calendar data for current month
  async getCalendarStats(userId, year = null, month = null) {
    try {
      // Get all habits for user with their completions
      const now = new Date();
      const targetYear = year || now.getFullYear();
      const targetMonth = month !== null ? month : now.getMonth() + 1;

      // Get habits
      const habitsResult = await pool.query(
        'SELECT id, name, color FROM habits WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );

      const habits = habitsResult.rows;

      // Get all completions for the month
      const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
      const endDate = new Date(targetYear, targetMonth, 0)
        .toISOString()
        .split('T')[0];

      const completionsResult = await pool.query(
        `SELECT habit_id, date FROM completions 
         WHERE user_id = $1 AND date >= $2 AND date <= $3
         ORDER BY date ASC`,
        [userId, startDate, endDate]
      );

      // Organize completions by date -> habit
      const completionsByDate = {};
      completionsResult.rows.forEach((completion) => {
        const dateKey = completion.date.toISOString().split('T')[0];
        if (!completionsByDate[dateKey]) {
          completionsByDate[dateKey] = [];
        }
        completionsByDate[dateKey].push(completion.habit_id);
      });

      // Get number of days in month
      const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();

      // Build calendar data
      const calendar = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        calendar.push({
          date: dateStr,
          completedHabits: completionsByDate[dateStr] || [],
          completionCount: (completionsByDate[dateStr] || []).length,
        });
      }

      return {
        year: targetYear,
        month: targetMonth,
        habits: habits.map((h) => ({
          id: h.id,
          name: h.name,
          color: h.color,
        })),
        calendar,
      };
    } catch (error) {
      throw new Error(`Error fetching calendar stats: ${error.message}`);
    }
  }
}

module.exports = new StatsService();
