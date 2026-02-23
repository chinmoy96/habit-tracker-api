require('dotenv').config();

const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const specs = require('./config/swagger');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const habitsRoutes = require('./routes/habits');
const completionsRoutes = require('./routes/completions');
const statsRoutes = require('./routes/stats');
const errorHandler = require('./middleware/errorHandler');
const { initializeDatabase } = require('./db/database');
const monthlyInsightsRoutes = require("./routes/monthlyInsights");


const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// CORS Configuration
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/habits', habitsRoutes);
app.use('/api/completions', completionsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/habit-categories', require('./routes/habitCategory'));
app.use('/api/habit-categories-xp', require('./routes/habitCategoryXp'));
app.use("/api/monthly-summary", require("./routes/monthlySummary"));

app.use("/api/monthly-insights", monthlyInsightsRoutes);
app.use("/api/goals", require("./routes/goalRoutes"));
app.use("/api/daily-tasks", require("./routes/dailyTasks"));

/**
 * @swagger
 * /:
 *   get:
 *     summary: Welcome endpoint
 *     tags:
 *       - Welcome
 *     responses:
 *       200:
 *         description: Welcome message
 */
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to XP Tracker API', docs: '/api-docs' });
});

// Error handling middleware
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
