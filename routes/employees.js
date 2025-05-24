// routes/employees.js
const express = require('express');
const {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getEmployeeByEmail
} = require('../controllers/employeeController.js');

const router = express.Router();

// Employee Routes
router.post('/', createEmployee);                          // POST /api/employees - Create new employee
router.get('/', getAllEmployees);                          // GET /api/employees - Get all employees
router.get('/email/:email', getEmployeeByEmail);           // GET /api/employees/email/john@company.com - Get employee by email
router.get('/:id', getEmployeeById);                       // GET /api/employees/123 - Get employee by ID
router.put('/:id', updateEmployee);                        // PUT /api/employees/123 - Update employee
router.delete('/:id', deleteEmployee);                     // DELETE /api/employees/123 - Delete employee

module.exports = router;