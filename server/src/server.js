const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { connectDB, disconnectDB } = require('./config/db');
const apiRoutes = require('./routes/apiRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all origins so tracker.js can beacon from any host site
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve Tracker script, Demo webpage, and Full E-Commerce Store statically
const trackerPath = path.resolve(__dirname, '../../tracker');
const demoPath = path.resolve(__dirname, '../../demo');
const storePath = path.resolve(__dirname, '../../store');
const clientDistPath = path.resolve(__dirname, '../../client/dist');
const fs = require('fs');

app.use('/tracker', express.static(trackerPath));
app.use('/demo', express.static(demoPath));
app.use('/store', express.static(storePath));
if (fs.existsSync(clientDistPath)) {
  app.use('/dashboard', express.static(clientDistPath));
}

// API Root & browser dashboard redirect
app.get('/', (req, res) => {
  // If request originates from a web browser, redirect straight to Admin Dashboard
  if (req.accepts('html') && fs.existsSync(clientDistPath)) {
    return res.redirect('/dashboard/');
  }

  res.json({
    name: 'CausalFunnel - User Analytics & Session Tracking API',
    version: '1.0.0',
    documentation: '/api/health',
    endpoints: {
      postEvent: 'POST /api/events',
      getSessions: 'GET /api/sessions',
      getSessionJourney: 'GET /api/sessions/:sessionId',
      getClicks: 'GET /api/clicks?url=<pageUrl>',
      getPages: 'GET /api/pages',
      getStats: 'GET /api/stats',
    },
    ecommerceStore: `http://localhost:${PORT}/store/index.html`,
    demoPage: `http://localhost:${PORT}/demo/index.html`,
    trackerScript: `http://localhost:${PORT}/tracker/tracker.js`,
    adminDashboard: fs.existsSync(clientDistPath) ? `http://localhost:${PORT}/dashboard` : 'Run `npm run dev` in /client',
  });
});

// Mount API routes
app.use('/api', apiRoutes);

// 404 Handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized error handling
app.use(errorHandler);

let serverInstance = null;

/**
 * Start the HTTP server after connecting to database
 */
async function startServer() {
  try {
    await connectDB();
    serverInstance = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 CausalFunnel Analytics Server listening on port ${PORT}`);
      console.log(`🛍️ E-Commerce Store: http://localhost:${PORT}/store/index.html`);
      console.log(`📡 API Base:         http://localhost:${PORT}/api`);
      console.log(`🌐 Legacy Demo:      http://localhost:${PORT}/demo/index.html`);
      console.log(`📦 Tracker Script:   http://localhost:${PORT}/tracker/tracker.js`);
      console.log(`====================================================`);
    });
    return serverInstance;
  } catch (error) {
    console.error('Fatal startup error:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  if (serverInstance) {
    serverInstance.close(async () => {
      console.log('HTTP server closed.');
      await disconnectDB();
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Auto-start if invoked directly
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
