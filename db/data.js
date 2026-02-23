const { pool } = require('./database');

const getAll = async () => {
  try {
    const result = await pool.query('SELECT * FROM items ORDER BY created_at DESC');
    console.log('✓ Fetched all items successfully');
    return result.rows;
  } catch (error) {
    console.error('Error fetching all items:', error.message);
    throw error;
  }
};

const getById = async (id) => {
  try {
    const result = await pool.query('SELECT * FROM items WHERE id = $1', [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching item by ID:', error.message);
    throw error;
  }
};

const create = async (name, description) => {
  try {
    const result = await pool.query(
      `INSERT INTO items (name, description) VALUES ($1, $2) RETURNING *`,
      [name, description || '']
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating item:', error.message);
    throw error;
  }
};

const update = async (id, name, description) => {
  try {
    const item = await getById(id);
    if (!item) return null;

    const result = await pool.query(
      `UPDATE items SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
      [name || item.name, description !== undefined ? description : item.description, id]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error updating item:', error.message);
    throw error;
  }
};

const remove = async (id) => {
  try {
    const item = await getById(id);
    if (!item) return false;

    await pool.query('DELETE FROM items WHERE id = $1', [id]);
    return true;
  } catch (error) {
    console.error('Error deleting item:', error.message);
    throw error;
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
