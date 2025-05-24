// // server.js
// const express = require('express');
// const cors = require('cors');
// require('dotenv').config();

// // Import database connection
// const db = require('./database/connection');

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Test database connection
// app.get('/test-db', async (req, res) => {
//   try {
//     // Simple connection test using the underlying MySQL connection
//     const pool = db.getExecutor();
//     res.json({ message: 'Database connection established successfully' });
//   } catch (error) {
//     console.error('Database connection error:', error);
//     res.status(500).json({ error: 'Database connection failed', details: error.message });
//   }
// });

// // Basic route
// app.get('/', (req, res) => {
//   res.json({ message: 'Visitor Management System API' });
// });

// // Start server
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

// module.exports = app;

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

// Test database connection
app.get('/test-db', async (req, res) => {
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
    endpoints: [
      'POST /api/visitors - Register new visitor',
      'GET /api/visitors - Get all visitors',
      'GET /api/visitors/search?query=name - Search visitors',
      'GET /api/visitors/status/:status - Get visitors by status',
      'GET /api/visitors/approve/:token - Approve visitor',
      'POST /api/visitors/reject/:token - Reject visitor',
      'GET /api/visitors/:id - Get visitor by ID',
      'PUT /api/visitors/:id - Update visitor',
      'DELETE /api/visitors/:id - Delete visitor',
      'POST /api/visitors/:id/checkin - Check in visitor',
      'POST /api/visitors/:id/checkout - Check out visitor',
      'POST /api/employees - Create employee',
      'GET /api/employees - Get all employees',
      'GET /api/employees/:id - Get employee by ID',
      'PUT /api/employees/:id - Update employee',
      'DELETE /api/employees/:id - Delete employee'
    ]
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