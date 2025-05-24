// routes/preApprovals.js
const express = require('express');
const {
  createPreApprovedVisitor,
  getEmployeePreApprovedVisitors,
  checkPreApprovalLimits,
  updatePreApprovedVisitor,
  cancelPreApprovedVisitor
} = require('../controllers/preApprovalController');

const router = express.Router();

// === PRE-APPROVAL MANAGEMENT ===
router.post('/employee/:employeeId/create', createPreApprovedVisitor);              // POST /api/preapprovals/employee/123/create
router.get('/employee/:employeeId/visitors', getEmployeePreApprovedVisitors);       // GET /api/preapprovals/employee/123/visitors
router.get('/employee/:employeeId/limits', checkPreApprovalLimits);                 // GET /api/preapprovals/employee/123/limits
router.put('/employee/:employeeId/visitor/:visitorId', updatePreApprovedVisitor);   // PUT /api/preapprovals/employee/123/visitor/456
router.delete('/employee/:employeeId/visitor/:visitorId', cancelPreApprovedVisitor); // DELETE /api/preapprovals/employee/123/visitor/456

module.exports = router;