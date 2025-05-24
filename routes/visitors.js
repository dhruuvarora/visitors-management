// // routes/visitors.js
// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const {
//   createVisitor,
//   getAllVisitors,
//   getVisitorById,
//   approveVisitor,
//   rejectVisitor,
//   checkInVisitor,
//   checkOutVisitor,
//   updateVisitor,
//   deleteVisitor,
//   getVisitorsByStatus,
//   searchVisitors
// } = require('../controllers/visitorController');

// const router = express.Router();

// // Configure multer for photo uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/visitor-photos/');
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, 'visitor-' + uniqueSuffix + path.extname(file.originalname));
//   }
// });

// const upload = multer({ 
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith('image/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only image files are allowed'));
//     }
//   }
// });

// // Visitor Routes
// router.post('/', upload.single('photo'), createVisitor);                    // POST /api/visitors - Register new visitor
// router.get('/', getAllVisitors);                                           // GET /api/visitors - Get all visitors
// router.get('/search', searchVisitors);                                     // GET /api/visitors/search?query=name - Search visitors
// router.get('/status/:status', getVisitorsByStatus);                        // GET /api/visitors/status/pending - Get visitors by status
// router.get('/approve/:token', approveVisitor);                             // GET /api/visitors/approve/abc123 - Approve visitor via email link
// router.post('/reject/:token', rejectVisitor);                              // POST /api/visitors/reject/abc123 - Reject visitor
// router.get('/:id', getVisitorById);                                        // GET /api/visitors/123 - Get visitor by ID
// router.put('/:id', updateVisitor);                                         // PUT /api/visitors/123 - Update visitor info
// router.delete('/:id', deleteVisitor);                                      // DELETE /api/visitors/123 - Delete visitor
// router.post('/:id/checkin', checkInVisitor);                               // POST /api/visitors/123/checkin - Check in visitor
// router.post('/:id/checkout', checkOutVisitor);                             // POST /api/visitors/123/checkout - Check out visitor

// module.exports = router;

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