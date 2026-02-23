const { pool } = require('../db/database');

class HabitCategoryService {
  // Get all categories
  async getAllCategories() {
    try {
      const result = await pool.query(
        `SELECT habits_category_id, name, description, created_at, updated_at
         FROM habit_categories
         ORDER BY created_at DESC`
      );

      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching habit categories: ${error.message}`);
    }
  }

  // Get category by ID
  async getCategoryById(categoryId) {
    try {
      const result = await pool.query(
        `SELECT habits_category_id, name, description, created_at, updated_at
         FROM habit_categories
         WHERE habits_category_id = $1`,
        [categoryId]
      );

      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching habit category: ${error.message}`);
    }
  }

  // Create category
  async createCategory(name, description) {
    try {
      if (!name) {
        throw new Error('Name is required');
      }

      const result = await pool.query(
        `INSERT INTO habit_categories (name, description)
         VALUES ($1, $2)
         RETURNING habits_category_id, name, description, created_at, updated_at`,
        [name, description || null]
      );

      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating habit category: ${error.message}`);
    }
  }

  // Update category
  async updateCategory(categoryId, name, description) {
    try {
      const category = await this.getCategoryById(categoryId);
      if (!category) return null;

      const result = await pool.query(
        `UPDATE habit_categories
         SET name = COALESCE($1, name),
             description = COALESCE($2, description),
             updated_at = CURRENT_TIMESTAMP
         WHERE habits_category_id = $3
         RETURNING habits_category_id, name, description, created_at, updated_at`,
        [name || null, description || null, categoryId]
      );

      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error updating habit category: ${error.message}`);
    }
  }

  // Delete category
  async deleteCategory(categoryId) {
    try {
      const category = await this.getCategoryById(categoryId);
      if (!category) return false;

      const result = await pool.query(
        `DELETE FROM habit_categories
         WHERE habits_category_id = $1`,
        [categoryId]
      );

      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Error deleting habit category: ${error.message}`);
    }
  }
}

module.exports = new HabitCategoryService();