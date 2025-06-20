// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import database connection
const db = require('./database/connection');

// Import routes
const visitorRoutes = require('./routes/visitors');
const employeeRoutes = require('./routes/employees');
const approvalRoutes = require('./routes/approvals');
const preApprovalRoutes = require('./routes/preApprovals');
const testEmailRoutes = require('./routes/testEmail');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (for visitor photos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/visitors', visitorRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/preapprovals', preApprovalRoutes);
app.use('/api/test-email', testEmailRoutes);

// Test database connection
app.get('/connection', async (req, res) => {
  try {
    // Test with a simple query
    const result = await db.selectFrom('visitors').selectAll().limit(1).execute();
    res.json({ 
      message: 'Database connection established successfully',
      sampleData: result
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
});

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Visitor Management System API',
    version: '1.0.0',
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
  }
  
  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({ error: 'Only image files are allowed for visitor photos.' });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} for API documentation`);
});

module.exports = app;