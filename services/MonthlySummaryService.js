const { pool } = require("../db/database");

class MonthlySummaryService {

  async getMonthlySummary(userId, year, month, hiddenHabitIds = []) {
    try {
      if (!year || !month) {
        throw new Error("Year and month are required");
      }

      const pad = (n) => n.toString().padStart(2, "0");
      const daysInMonth = new Date(year, month, 0).getDate();

      const startStr = `${year}-${pad(month)}-01`;
      const endStr = `${year}-${pad(month)}-${pad(daysInMonth)}`;

      const params = [userId, startStr, endStr];
      let habitFilter = "";

      // If hidden habits provided → exclude them
      if (hiddenHabitIds.length > 0) {
        params.push(hiddenHabitIds);
        habitFilter = `AND NOT (h.id = ANY($${params.length}))`;
      }

      // -----------------------------------------
      // 1️⃣ Total XP (excluding hidden habits)
      // -----------------------------------------
      const totalXpResult = await pool.query(
        `
        SELECT COALESCE(SUM(h.xp_value), 0) AS total_xp
        FROM completions c
        JOIN habits h ON c.habit_id = h.id
        WHERE c.user_id = $1
        AND c.date BETWEEN $2 AND $3
        ${habitFilter}
        `,
        params
      );

      const totalXp = parseInt(totalXpResult.rows[0].total_xp);

      // -----------------------------------------
      // 2️⃣ Strongest category
      // -----------------------------------------
      const strongestCategoryResult = await pool.query(
        `
        SELECT hc.name, COALESCE(SUM(h.xp_value), 0) AS category_xp
        FROM completions c
        JOIN habits h ON c.habit_id = h.id
        LEFT JOIN habit_categories hc ON h.category_id = hc.habits_category_id
        WHERE c.user_id = $1
        AND c.date BETWEEN $2 AND $3
        ${habitFilter}
        GROUP BY hc.name
        ORDER BY category_xp DESC
        LIMIT 1
        `,
        params
      );

      const strongestCategory =
        strongestCategoryResult.rows[0]?.name || null;

      // -----------------------------------------
      // 3️⃣ Habit Grid
      // -----------------------------------------
      const gridResult = await pool.query(
        `
        SELECT 
          h.id,
          h.name AS habit_name,
          c.date::text AS date
        FROM habits h
        LEFT JOIN completions c
          ON c.habit_id = h.id
          AND c.user_id = $1
          AND c.date BETWEEN $2 AND $3
        WHERE h.user_id = $1
        ${hiddenHabitIds.length > 0 ? `AND NOT (h.id = ANY($${params.length}))` : ""}
        ORDER BY h.name, c.date
        `,
        params
      );

      const habitMap = {};

      gridResult.rows.forEach((row) => {
        if (!habitMap[row.habit_name]) {
          habitMap[row.habit_name] = {};
        }
        if (row.date) {
          habitMap[row.habit_name][row.date] = true;
        }
      });

      const habitGrid = Object.keys(habitMap).map((habitName) => {
        const dates = {};
        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${year}-${pad(month)}-${pad(day)}`;
          dates[dateStr] = habitMap[habitName][dateStr] || false;
        }
        return { habitName, dates };
      });

      // -----------------------------------------
      // 4️⃣ Longest streak (excluding hidden)
      // -----------------------------------------
      const streakResult = await pool.query(
        `
        SELECT c.date::text AS date
        FROM completions c
        JOIN habits h ON c.habit_id = h.id
        WHERE c.user_id = $1
        AND c.date BETWEEN $2 AND $3
        ${habitFilter}
        ORDER BY c.date ASC
        `,
        params
      );

      let longestStreak = 0;
      let currentStreak = 0;
      let prevDate = null;

      streakResult.rows.forEach((row) => {
        const currentDate = new Date(row.date);

        if (!prevDate) {
          currentStreak = 1;
        } else {
          const diff =
            (currentDate - new Date(prevDate)) /
            (1000 * 60 * 60 * 24);

          if (diff === 1) {
            currentStreak++;
          } else {
            currentStreak = 1;
          }
        }

        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }

        prevDate = row.date;
      });

      const monthLabel = new Date(year, month - 1).toLocaleString(
        "default",
        { month: "long", year: "numeric" }
      );

      return {
        month: monthLabel,
        totalXp,
        strongestCategory,
        longestStreak,
        habitGrid,
      };

    } catch (error) {
      throw new Error(
        `Error generating monthly summary: ${error.message}`
      );
    }
  }
}

module.exports = new MonthlySummaryService();