const { pool } = require("../db/database");

class MonthlyInsightsService {
  async getMonthlyInsights(userId, year, month) {
    if (!year || !month) {
      throw new Error("Year and month are required");
    }

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0));

    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    const totalDays = endDate.getUTCDate();

    // ---------------------------------------
    // 1️⃣ TOTAL COMPLETIONS THIS MONTH
    // ---------------------------------------
    const completionsResult = await pool.query(
      `
      SELECT date
      FROM completions
      WHERE user_id = $1
      AND date BETWEEN $2 AND $3
      `,
      [userId, startStr, endStr]
    );

    const completionDates = completionsResult.rows.map(r => r.date);

    const activeDaysSet = new Set(
      completionDates.map(d => d.toISOString().split("T")[0])
    );

    const activeDays = activeDaysSet.size;

    const totalCompletions = completionDates.length;

    const consistencyRate = Math.round((activeDays / totalDays) * 100);

    // ---------------------------------------
    // 2️⃣ PERFECT DAYS
    // ---------------------------------------

    const habitCountResult = await pool.query(
      `SELECT COUNT(*) FROM habits WHERE user_id = $1`,
      [userId]
    );

    const totalHabits = parseInt(habitCountResult.rows[0].count);

    const perfectDaysResult = await pool.query(
      `
      SELECT date, COUNT(*) as completed_count
      FROM completions
      WHERE user_id = $1
      AND date BETWEEN $2 AND $3
      GROUP BY date
      HAVING COUNT(*) = $4
      `,
      [userId, startStr, endStr, totalHabits]
    );

    const perfectDays = perfectDaysResult.rows.length;

    // ---------------------------------------
    // 3️⃣ WEEKLY PEAK
    // ---------------------------------------

    const weeklyResult = await pool.query(
      `
      SELECT
        CEIL(EXTRACT(DAY FROM date) / 7.0) AS week,
        COUNT(*) as count
      FROM completions
      WHERE user_id = $1
      AND date BETWEEN $2 AND $3
      GROUP BY week
      ORDER BY count DESC
      LIMIT 1
      `,
      [userId, startStr, endStr]
    );

    const weeklyPeak =
      weeklyResult.rows[0]
        ? `Week ${weeklyResult.rows[0].week}`
        : null;

    // ---------------------------------------
    // 4️⃣ MOST ACTIVE WEEKDAY
    // ---------------------------------------

    const weekdayResult = await pool.query(
      `
      SELECT
        EXTRACT(DOW FROM date) AS dow,
        COUNT(*) as count
      FROM completions
      WHERE user_id = $1
      AND date BETWEEN $2 AND $3
      GROUP BY dow
      ORDER BY count DESC
      LIMIT 1
      `,
      [userId, startStr, endStr]
    );

    const weekdayMap = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday"
    ];

    const mostActiveWeekday =
      weekdayResult.rows[0]
        ? weekdayMap[parseInt(weekdayResult.rows[0].dow)]
        : null;

    // ---------------------------------------
    // 5️⃣ MONTH COMPARISON
    // ---------------------------------------

    const prevStart = new Date(Date.UTC(year, month - 2, 1));
    const prevEnd = new Date(Date.UTC(year, month - 1, 0));

    const prevStartStr = prevStart.toISOString().split("T")[0];
    const prevEndStr = prevEnd.toISOString().split("T")[0];

    const prevXpResult = await pool.query(
      `
      SELECT COALESCE(SUM(h.xp_value), 0) as xp
      FROM completions c
      JOIN habits h ON c.habit_id = h.id
      WHERE c.user_id = $1
      AND c.date BETWEEN $2 AND $3
      `,
      [userId, prevStartStr, prevEndStr]
    );

    const currentXpResult = await pool.query(
      `
      SELECT COALESCE(SUM(h.xp_value), 0) as xp
      FROM completions c
      JOIN habits h ON c.habit_id = h.id
      WHERE c.user_id = $1
      AND c.date BETWEEN $2 AND $3
      `,
      [userId, startStr, endStr]
    );

    const prevXp = parseInt(prevXpResult.rows[0].xp);
    const currentXp = parseInt(currentXpResult.rows[0].xp);

    const xpChangePercent =
      prevXp === 0
        ? 100
        : Math.round(((currentXp - prevXp) / prevXp) * 100);

    const prevCompletionResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM completions
      WHERE user_id = $1
      AND date BETWEEN $2 AND $3
      `,
      [userId, prevStartStr, prevEndStr]
    );

    const prevCompletions = parseInt(prevCompletionResult.rows[0].count);

    const completionChange = totalCompletions - prevCompletions;

    const prevActiveDaysResult = await pool.query(
      `
      SELECT COUNT(DISTINCT date) as count
      FROM completions
      WHERE user_id = $1
      AND date BETWEEN $2 AND $3
      `,
      [userId, prevStartStr, prevEndStr]
    );

    const prevActiveDays = parseInt(prevActiveDaysResult.rows[0].count);
    const prevConsistency = Math.round(
      (prevActiveDays / prevEnd.getUTCDate()) * 100
    );

    const consistencyChange = consistencyRate - prevConsistency;

    return {
      month: startDate.toLocaleString("default", {
        month: "long",
        year: "numeric"
      }),
      totalDays,
      activeDays,
      totalCompletions,
      consistencyRate,
      perfectDays,
      weeklyPeak,
      mostActiveWeekday,
      monthComparison: {
        xpChangePercent,
        completionChange,
        consistencyChange
      }
    };
  }
}

module.exports = new MonthlyInsightsService();