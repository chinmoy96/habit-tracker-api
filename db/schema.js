// Database schema initialization
const { v4: uuidv4 } = require('uuid');

const initializeSchema = async (pool) => {
  const client = await pool.connect();
  try {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        github_id VARCHAR(255),
        github_image VARCHAR(500),
        total_xp INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create habits category table
    await client.query(`
      CREATE TABLE IF NOT EXISTS habit_categories (
        habits_Category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create habits table
    await client.query(`
      CREATE TABLE IF NOT EXISTS habits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        xp_value INTEGER NOT NULL CHECK (xp_value >= 1 AND xp_value <= 100),
        color VARCHAR(50) NOT NULL,
        category_id UUID REFERENCES habit_categories(habits_Category_id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);



    // Create completions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS completions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, habit_id, date)
      )
    `);

    // Create goals table
    await client.query(`CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  description TEXT,

  xp_value INTEGER NOT NULL CHECK (xp_value >= 1 AND xp_value <= 1000),

  category_id UUID REFERENCES habit_categories(habits_Category_id)
    ON DELETE SET NULL,

  due_date DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`);

// Create task table
await client.query(`CREATE TABLE IF NOT EXISTS daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  description TEXT,

  xp_value INTEGER NOT NULL CHECK (xp_value >= 1 AND xp_value <= 200),

  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,

  task_date DATE NOT NULL DEFAULT CURRENT_DATE, -- important

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, name, task_date) -- prevent duplicates same day
);`);

    // Create indexes for better query performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_completions_user_id ON completions(user_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_completions_habit_id ON completions(habit_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_completions_date ON completions(date)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_goals_due_date ON goals(due_date)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_id ON daily_tasks(user_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_daily_tasks_task_date ON daily_tasks(task_date)
    `);

    // Check if data already exists
    const userCount = await client.query('SELECT COUNT(*) as count FROM users');
    if (parseInt(userCount.rows[0].count) === 0) {
      // Insert sample users
      const user1 = await client.query(
        `INSERT INTO users (email, name, github_id, github_image, total_xp) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id`,
        ['john@example.com', 'John Developer', 'john123', 'https://avatars.githubusercontent.com/u/1?v=4', 5500]
      );
      const user1Id = user1.rows[0].id;

      const user2 = await client.query(
        `INSERT INTO users (email, name, github_id, github_image, total_xp) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id`,
        ['jane@example.com', 'Jane Coder', 'jane456', 'https://avatars.githubusercontent.com/u/2?v=4', 3200]
      );
      const user2Id = user2.rows[0].id;

      // Insert sample habit categories
      const category1 = await client.query(
        `INSERT INTO habit_categories (name, description)
         VALUES ($1, $2) 
         RETURNING habits_Category_id`,
        ['Health', 'Physical and mental well-being habits']
      );
      const category1Id = category1.rows[0].habits_category_id;

      const category2 = await client.query(
        `INSERT INTO habit_categories (name, description) 
         VALUES ($1, $2) 
         RETURNING habits_Category_id`,
        ['Productivity', 'Work and learning related habits']
      );
      const category2Id = category2.rows[0].habits_category_id;

      // Insert sample habits for user 1
      const habit1 = await client.query(
        `INSERT INTO habits (user_id, name, description, xp_value, color, category_id) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id`,
        [user1Id, 'Morning Run', 'Run for 30 minutes every morning', 50, 'blue-500', category1Id]
      );
      const habit1Id = habit1.rows[0].id;

      const habit2 = await client.query(
        `INSERT INTO habits (user_id, name, description, xp_value, color, category_id) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id`,
        [user1Id, 'Read Books', 'Read at least 30 pages', 30, 'purple-500', category2Id]
      );
      const habit2Id = habit2.rows[0].id;

      const habit3 = await client.query(
        `INSERT INTO habits (user_id, name, description, xp_value, color, category_id) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id`,
        [user1Id, 'Meditate', 'Meditate for 10 minutes', 20, 'green-500', category1Id]
      );
      const habit3Id = habit3.rows[0].id;

      // Insert sample habits for user 2
      const habit4 = await client.query(
        `INSERT INTO habits (user_id, name, description, xp_value, color, category_id) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id`,
        [user2Id, 'Code Practice', 'Code for 1 hour', 75, 'yellow-500', category2Id]
      );
      const habit4Id = habit4.rows[0].id;

      const habit5 = await client.query(
        `INSERT INTO habits (user_id, name, description, xp_value, color, category_id) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id`,
        [user2Id, 'Gym Workout', 'Exercise at the gym', 60, 'red-500', category1Id]
      );
      const habit5Id = habit5.rows[0].id;

      // Insert sample completions for user 1
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < 15; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        if (i % 2 === 0) {
          await client.query(
            `INSERT INTO completions (user_id, habit_id, date) 
             VALUES ($1, $2, $3)`,
            [user1Id, habit1Id, dateStr]
          );
        }
        if (i % 3 === 0) {
          await client.query(
            `INSERT INTO completions (user_id, habit_id, date) 
             VALUES ($1, $2, $3)`,
            [user1Id, habit2Id, dateStr]
          );
        }
        if (i % 4 === 0) {
          await client.query(
            `INSERT INTO completions (user_id, habit_id, date) 
             VALUES ($1, $2, $3)`,
            [user1Id, habit3Id, dateStr]
          );
        }
      }

      // Insert sample completions for user 2
      for (let i = 0; i < 10; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        if (i % 2 === 0) {
          await client.query(
            `INSERT INTO completions (user_id, habit_id, date) 
             VALUES ($1, $2, $3)`,
            [user2Id, habit4Id, dateStr]
          );
        }
        if (i < 8) {
          await client.query(
            `INSERT INTO completions (user_id, habit_id, date) 
             VALUES ($1, $2, $3)`,
            [user2Id, habit5Id, dateStr]
          );
        }
      }


      console.log('✓ Sample data inserted');
    }

    console.log('✓ Database schema initialized successfully');
  } finally {
    client.release();
  }
};

module.exports = initializeSchema;
