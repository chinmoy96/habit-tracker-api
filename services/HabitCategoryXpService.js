const { pool } = require('../db/database');

class HabitCategoryXpService {

  // XP needed to go from level N to N+1
  xpForLevel(level) {
    return Math.floor(100 * Math.pow(level, 1.5));
  }

  // Calculate level from total XP (O(1) approximation)
  calculateLevel(totalXp) {
    if (totalXp <= 0) return 1;

    // Approximate inverse of level^1.5 formula
    let level = Math.floor(Math.pow(totalXp / 100, 2 / 3)) + 1;

    // Adjust if approximation slightly overshoots
    while (totalXp < this.totalXpToReachLevel(level)) {
      level--;
    }

    return Math.max(level, 1);
  }

  // Total cumulative XP required to reach a level
  totalXpToReachLevel(level) {
    let total = 0;
    for (let i = 1; i < level; i++) {
      total += this.xpForLevel(i);
    }
    return total;
  }

  // Rank tiers
  getRank(level) {
    if (level >= 20) return "Diamond";
    if (level >= 15) return "Platinum";
    if (level >= 10) return "Gold";
    if (level >= 5) return "Silver";
    return "Bronze";
  }

  async getXpByCategory(userId, startDate = null, endDate = null) {
    try {
      const params = [userId];
      let dateFilter = '';

      if (startDate && endDate) {
        dateFilter = `AND c.date BETWEEN $2 AND $3`;
        params.push(startDate, endDate);
      }

      const query = `
        SELECT 
          hc.habits_category_id,
          hc.name,
          COALESCE(SUM(h.xp_value), 0) AS total_xp,
          COUNT(c.id) AS completion_count
        FROM habit_categories hc
        LEFT JOIN habits h 
          ON h.category_id = hc.habits_category_id
          AND h.user_id = $1
        LEFT JOIN completions c 
          ON c.habit_id = h.id
          AND c.user_id = $1
          ${dateFilter}
        GROUP BY hc.habits_category_id, hc.name
        ORDER BY total_xp DESC
      `;

      const result = await pool.query(query, params);

      let strongestCategory = null;
      let highestXp = 0;

      const categories = result.rows.map((row) => {
        const totalXp = parseInt(row.total_xp);

        const level = this.calculateLevel(totalXp);

        const xpBeforeLevel = this.totalXpToReachLevel(level);
        const xpForNextLevel = this.xpForLevel(level);

        const xpIntoLevel = totalXp - xpBeforeLevel;

        const progressPercentage = xpForNextLevel > 0
          ? Math.floor((xpIntoLevel / xpForNextLevel) * 100)
          : 0;

        if (totalXp > highestXp) {
          highestXp = totalXp;
          strongestCategory = row.name;
        }

        return {
          categoryId: row.habits_category_id,
          name: row.name,
          totalXp,
          completionCount: parseInt(row.completion_count),

          level,
          rank: this.getRank(level),

          xpIntoLevel,
          xpForNextLevel,
          progressPercentage: Math.min(progressPercentage, 100)
        };
      });

      return {
        strongestCategory,
        categories
      };

    } catch (error) {
      throw new Error(`Error fetching XP by category: ${error.message}`);
    }
  }

  async getTotalXp(userId, startDate = null, endDate = null) {
    try {
      const params = [userId];
      let dateFilter = '';

      if (startDate && endDate) {
        dateFilter = `AND c.date BETWEEN $2 AND $3`;
        params.push(startDate, endDate);
      }

      const query = `
        SELECT COALESCE(SUM(h.xp_value), 0) AS total_xp
        FROM completions c
        JOIN habits h ON c.habit_id = h.id
        WHERE c.user_id = $1
        ${dateFilter}
      `;

      const result = await pool.query(query, params);
      return parseInt(result.rows[0].total_xp);
    } catch (error) {
      throw new Error(`Error fetching total XP: ${error.message}`);
    }
  }
}

module.exports = new HabitCategoryXpService();