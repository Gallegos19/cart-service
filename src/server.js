require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cartRoutes = require('./infrastructure/routes/cartRoutes');

const app = express();
const PORT = process.env.PORT || 3003;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', async (req, res) => {
  try {
    const dbConnection = new (require('./infrastructure/database/connection'))();
    const dbHealth = await dbConnection.healthCheck();
    await dbConnection.close();

    const health = {
      service: 'cart-service',
      status: dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      port: PORT,
      uptime: process.uptime(),
      memory: {
        used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
      },
      database: dbHealth
    };

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      service: 'cart-service',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      database: {
        status: 'unhealthy',
        error: error.message
      }
    });
  }
});

// Routes
app.use('/api', cartRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`🛒 Cart Service running on port ${PORT}`);
});