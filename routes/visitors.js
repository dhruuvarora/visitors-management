const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  createVisitor,
  uploadVisitorPhoto,
  getAllVisitors,
  getVisitorById,
  checkInVisitor,
  checkOutVisitor
} = require('../controllers/visitorController');

const router = express.Router();

// Configure multer for photo uploads
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

// Routes
router.post('/', createVisitor);                                           // POST /api/visitors (JSON data)
router.post('/:id/upload-photo', upload.single('photo'), uploadVisitorPhoto); // POST /api/visitors/1/upload-photo (File upload)
router.get('/', getAllVisitors);                                           // GET /api/visitors
router.get('/:id', getVisitorById);                                        // GET /api/visitors/1
router.post('/:id/checkin', checkInVisitor);                               // POST /api/visitors/1/checkin
router.post('/:id/checkout', checkOutVisitor);                             // POST /api/visitors/1/checkout

module.exports = router;