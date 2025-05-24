// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import database connection
const db = require('./database/connection');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test database connection
app.get('/test-db', async (req, res) => {
  try {
    // Simple connection test using the underlying MySQL connection
    const pool = db.getExecutor();
    res.json({ message: 'Database connection established successfully' });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Visitor Management System API' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;