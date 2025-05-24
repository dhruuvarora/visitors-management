// routes/approvals.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  approveVisitor,
  rejectVisitor,
  uploadVisitorPhoto,
  getVisitorsByStatus,
  getPendingApprovals,
  cleanupExpiredApprovals
} = require('../controllers/approvalController');

const router = express.Router();

// Configure multer for photo uploads (if you want photo upload in approval routes)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/visitor-photos/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'visitor-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// === APPROVAL WORKFLOW ===
router.post('/approve/:token', approveVisitor);                             // GET /api/approvals/approve/abc123token
router.post('/reject/:token', rejectVisitor);                              // POST /api/approvals/reject/abc123token

// === STATUS MANAGEMENT ===
router.get('/status/:status', getVisitorsByStatus);                        // GET /api/approvals/status/pending
router.get('/pending', getPendingApprovals);                               // GET /api/approvals/pending (all pending)
router.get('/pending/:employeeId', getPendingApprovals);                   // GET /api/approvals/pending/123 (for specific employee)

// === SYSTEM MAINTENANCE ===
router.post('/cleanup-expired', cleanupExpiredApprovals);                  // POST /api/approvals/cleanup-expired

// === PHOTO UPLOAD (if you want it here instead of visitor routes) ===
router.post('/upload-photo/:id', upload.single('photo'), uploadVisitorPhoto); // POST /api/approvals/upload-photo/1

module.exports = router;