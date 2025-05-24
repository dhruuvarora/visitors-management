// const path = require('path');
// const QRCode = require('qrcode');
// const nodemailer = require('nodemailer');
// const db = require('../database/connection');

// const VisitorModel = require('../models/Visitor');
// const EmployeeModel = require('../models/Employee');

// const visitorModel = new VisitorModel(db);
// const employeeModel = new EmployeeModel(db);


// const generateApprovalToken = () => {
//   return Math.random().toString(36).substring(2, 15) + 
//          Math.random().toString(36).substring(2, 15);
// };

// const createVisitor = async (req, res) => {
//   try {
//     const {
//       fullName,
//       phone,
//       email,
//       purposeOfVisit,
//       hostEmployeeId,
//       hostEmployeeName,
//       hostDepartment,
//       companyName
//     } = req.body;

//     // Validate required fields
//     if (!fullName || !purposeOfVisit || !hostEmployeeName) {
//       return res.status(400).json({
//         error: 'Full name, purpose of visit, and host employee name are required'
//       });
//     }

//     // Check if photo was uploaded
//     if (!req.file) {
//       return res.status(400).json({
//         error: 'Visitor photo is mandatory'
//       });
//     }

//     // Generate visitor badge ID and approval token
//     const visitorBadgeId = 'VIS-' + Date.now();
//     const approvalToken = generateApprovalToken();

//     // Prepare visitor data
//     const visitorData = {
//       full_name: fullName,
//       mobile_number: phone,
//       email: email,
//       purpose_of_visit: purposeOfVisit,
//       host_employee_id: hostEmployeeId || null,
//       host_employee_name: hostEmployeeName,
//       host_department: hostDepartment,
//       company_name: companyName,
//       photo_path: req.file.path,
//       visitor_badge_id: visitorBadgeId,
//       status: 'pending',
//       approval_token: approvalToken,
//       created_at: new Date(),
//       updated_at: new Date()
//     };

//     // Create visitor record
//     const newVisitor = await visitorModel.create(visitorData);

//     // Send approval request to host employee
//     await sendApprovalRequest({
//       id: newVisitor.id,
//       approval_token: approvalToken
//     }, {
//       fullName,
//       phone,
//       email,
//       purposeOfVisit,
//       companyName,
//       hostEmployeeName
//     });

//     res.status(201).json({
//       message: 'Visitor registered successfully. Approval request sent to host employee.',
//       visitorId: newVisitor.id,
//       badgeId: visitorBadgeId,
//       status: 'pending'
//     });

//   } catch (error) {
//     console.error('Error registering visitor:', error);
//     res.status(500).json({ error: 'Failed to register visitor' });
//   }
// };
// // Get all visitors
// const getAllVisitors = async (req, res) => {
//   try {
//     const visitors = await db
//       .selectFrom('visitors')
//       .selectAll()
//       .orderBy('created_at', 'desc')
//       .execute();

//     res.json({
//       visitors: visitors.map(visitor => ({
//         id: visitor.id,
//         fullName: visitor.full_name,
//         phone: visitor.mobile_number,
//         email: visitor.email,
//         purposeOfVisit: visitor.purpose_of_visit,
//         hostEmployeeName: visitor.host_employee_name,
//         hostDepartment: visitor.host_department,
//         companyName: visitor.company_name,
//         status: visitor.status,
//         checkInTime: visitor.check_in_time,
//         checkOutTime: visitor.check_out_time,
//         createdAt: visitor.created_at
//       }))
//     });

//   } catch (error) {
//     console.error('Error fetching visitors:', error);
//     res.status(500).json({ error: 'Failed to fetch visitors' });
//   }
// };

// // Get visitor by ID
// const getVisitorById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const visitor = await visitorModel.findById(parseInt(id));

//     if (!visitor) {
//       return res.status(404).json({ error: 'Visitor not found' });
//     }

//     res.json({
//       visitor: {
//         id: visitor.id,
//         fullName: visitor.full_name,
//         phone: visitor.mobile_number,
//         email: visitor.email,
//         purposeOfVisit: visitor.purpose_of_visit,
//         hostEmployeeName: visitor.host_employee_name,
//         hostDepartment: visitor.host_department,
//         companyName: visitor.company_name,
//         status: visitor.status,
//         checkInTime: visitor.check_in_time,
//         checkOutTime: visitor.check_out_time,
//         photoPath: visitor.photo_path,
//         visitorBadgeId: visitor.visitor_badge_id,
//         createdAt: visitor.created_at
//       }
//     });

//   } catch (error) {
//     console.error('Error fetching visitor:', error);
//     res.status(500).json({ error: 'Failed to fetch visitor' });
//   }
// };

// // Approve visitor
// const approveVisitor = async (req, res) => {
//   try {
//     const { token } = req.params;
    
//     // Find visitor by approval token
//     const visitors = await visitorModel.findByCondition({
//       field: 'approval_token',
//       operator: '=',
//       value: token
//     });

//     const visitor = visitors[0];

//     if (!visitor) {
//       return res.status(404).json({ error: 'Invalid approval token' });
//     }

//     if (visitor.status !== 'pending') {
//       return res.status(400).json({ error: 'Visitor request already processed' });
//     }

//     // Update visitor status to approved
//     await visitorModel.update(visitor.id, { 
//       status: 'approved',
//       updated_at: new Date()
//     });

//     // Generate QR code for visitor badge
//     const qrData = {
//       visitorId: visitor.id,
//       badgeId: visitor.visitor_badge_id,
//       name: visitor.full_name,
//       host: visitor.host_employee_name
//     };

//     const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

//     res.json({
//       message: 'Visitor approved successfully',
//       visitor: {
//         id: visitor.id,
//         name: visitor.full_name,
//         badgeId: visitor.visitor_badge_id,
//         qrCode: qrCode
//       }
//     });

//   } catch (error) {
//     console.error('Error approving visitor:', error);
//     res.status(500).json({ error: 'Failed to approve visitor' });
//   }
// };

// // Reject visitor
// const rejectVisitor = async (req, res) => {
//   try {
//     const { token } = req.params;
//     const { reason } = req.body;

//     // Find visitor by approval token
//     const visitors = await visitorModel.findByCondition({
//       field: 'approval_token',
//       operator: '=',
//       value: token
//     });

//     const visitor = visitors[0];

//     if (!visitor) {
//       return res.status(404).json({ error: 'Invalid approval token' });
//     }

//     // Update visitor status to rejected
//     await visitorModel.update(visitor.id, { 
//       status: 'rejected',
//       updated_at: new Date()
//     });

//     res.json({
//       message: 'Visitor request rejected',
//       reason: reason || 'No reason provided'
//     });

//   } catch (error) {
//     console.error('Error rejecting visitor:', error);
//     res.status(500).json({ error: 'Failed to reject visitor' });
//   }
// };

// // Check in visitor
// const checkInVisitor = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const visitor = await visitorModel.findById(parseInt(id));

//     if (!visitor) {
//       return res.status(404).json({ error: 'Visitor not found' });
//     }

//     if (visitor.status !== 'approved') {
//       return res.status(400).json({ error: 'Visitor not approved for entry' });
//     }

//     // Update visitor status to checked_in and set check_in_time
//     await visitorModel.update(visitor.id, {
//       status: 'checked_in',
//       check_in_time: new Date(),
//       updated_at: new Date()
//     });

//     res.json({
//       message: 'Visitor checked in successfully',
//       checkInTime: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('Error checking in visitor:', error);
//     res.status(500).json({ error: 'Failed to check in visitor' });
//   }
// };

// // Check out visitor
// const checkOutVisitor = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const visitor = await visitorModel.findById(parseInt(id));

//     if (!visitor) {
//       return res.status(404).json({ error: 'Visitor not found' });
//     }

//     if (visitor.status !== 'checked_in') {
//       return res.status(400).json({ error: 'Visitor not checked in' });
//     }

//     // Update visitor status to checked_out and set check_out_time
//     await visitorModel.update(visitor.id, {
//       status: 'checked_out',
//       check_out_time: new Date(),
//       is_checked_out: true,
//       updated_at: new Date()
//     });

//     res.json({
//       message: 'Visitor checked out successfully',
//       checkOutTime: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('Error checking out visitor:', error);
//     res.status(500).json({ error: 'Failed to check out visitor' });
//   }
// };

// // Update visitor information
// const updateVisitor = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updateData = req.body;

//     const visitor = await visitorModel.findById(parseInt(id));

//     if (!visitor) {
//       return res.status(404).json({ error: 'Visitor not found' });
//     }

//     // Prepare update object
//     const updateFields = { updated_at: new Date() };
//     if (updateData.fullName) updateFields.full_name = updateData.fullName;
//     if (updateData.phone) updateFields.mobile_number = updateData.phone;
//     if (updateData.email) updateFields.email = updateData.email;
//     if (updateData.purposeOfVisit) updateFields.purpose_of_visit = updateData.purposeOfVisit;
//     if (updateData.companyName) updateFields.company_name = updateData.companyName;

//     await visitorModel.update(parseInt(id), updateFields);

//     res.json({
//       message: 'Visitor information updated successfully'
//     });

//   } catch (error) {
//     console.error('Error updating visitor:', error);
//     res.status(500).json({ error: 'Failed to update visitor' });
//   }
// };

// // Delete visitor
// const deleteVisitor = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const visitor = await visitorModel.findById(parseInt(id));

//     if (!visitor) {
//       return res.status(404).json({ error: 'Visitor not found' });
//     }

//     await visitorModel.delete(parseInt(id));

//     res.json({
//       message: 'Visitor deleted successfully'
//     });

//   } catch (error) {
//     console.error('Error deleting visitor:', error);
//     res.status(500).json({ error: 'Failed to delete visitor' });
//   }
// };

// // Get visitors by status
// const getVisitorsByStatus = async (req, res) => {
//   try {
//     const { status } = req.params;

//     const validStatuses = ['pending', 'approved', 'rejected', 'checked_in', 'checked_out'];
//     if (!validStatuses.includes(status)) {
//       return res.status(400).json({ error: 'Invalid status' });
//     }

//     const visitors = await visitorModel.findByCondition({
//       field: 'status',
//       operator: '=',
//       value: status
//     });

//     res.json({
//       status,
//       count: visitors.length,
//       visitors: visitors.map(visitor => ({
//         id: visitor.id,
//         fullName: visitor.full_name,
//         phone: visitor.mobile_number,
//         hostEmployeeName: visitor.host_employee_name,
//         checkInTime: visitor.check_in_time,
//         checkOutTime: visitor.check_out_time,
//         createdAt: visitor.created_at
//       }))
//     });

//   } catch (error) {
//     console.error('Error fetching visitors by status:', error);
//     res.status(500).json({ error: 'Failed to fetch visitors' });
//   }
// };

// // Search visitors
// const searchVisitors = async (req, res) => {
//   try {
//     const { query } = req.query;

//     if (!query) {
//       return res.status(400).json({ error: 'Search query is required' });
//     }

//     const visitors = await db
//       .selectFrom('visitors')
//       .selectAll()
//       .where((eb) => eb.or([
//         eb('full_name', 'like', `%${query}%`),
//         eb('mobile_number', 'like', `%${query}%`),
//         eb('email', 'like', `%${query}%`),
//         eb('company_name', 'like', `%${query}%`),
//         eb('host_employee_name', 'like', `%${query}%`)
//       ]))
//       .orderBy('created_at', 'desc')
//       .execute();

//     res.json({
//       query,
//       count: visitors.length,
//       visitors: visitors.map(visitor => ({
//         id: visitor.id,
//         fullName: visitor.full_name,
//         phone: visitor.mobile_number,
//         email: visitor.email,
//         companyName: visitor.company_name,
//         hostEmployeeName: visitor.host_employee_name,
//         status: visitor.status,
//         createdAt: visitor.created_at
//       }))
//     });

//   } catch (error) {
//     console.error('Error searching visitors:', error);
//     res.status(500).json({ error: 'Failed to search visitors' });
//   }
// };

// const sendApprovalRequest = async (visitor, visitorData) => {
//   try {
//     // Configure nodemailer
//     const transporter = nodemailer.createTransporter({
//       service: 'gmail',
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS
//       }
//     });

//     const approvalUrl = `${process.env.BASE_URL}/api/visitors/approve/${visitor.approval_token}`;
//     const rejectUrl = `${process.env.BASE_URL}/api/visitors/reject/${visitor.approval_token}`;

//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to: 'host@company.com', // You'll need to get this from employee table
//       subject: 'Visitor Approval Request',
//       html: `
//         <h2>Visitor Approval Request</h2>
//         <p><strong>Visitor:</strong> ${visitorData.fullName}</p>
//         <p><strong>Company:</strong> ${visitorData.companyName || 'N/A'}</p>
//         <p><strong>Purpose:</strong> ${visitorData.purposeOfVisit}</p>
//         <p><strong>Contact:</strong> ${visitorData.phone} | ${visitorData.email}</p>
        
//         <div style="margin: 20px 0;">
//           <a href="${approvalUrl}" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">APPROVE</a>
//           <a href="${rejectUrl}" style="background: #f44336; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-left: 10px;">REJECT</a>
//         </div>
//       `
//     };

//     await transporter.sendMail(mailOptions);
//     console.log('Approval email sent successfully');

//   } catch (error) {
//     console.error('Failed to send approval email:', error);
//   }
// };

// module.exports = {
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
// };

// controllers/visitorController.js
const path = require('path');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const db = require('../database/connection');

// Initialize models
const VisitorModel = require('../models/Visitor');
const EmployeeModel = require('../models/Employee');

const visitorModel = new VisitorModel(db);
const employeeModel = new EmployeeModel(db);

// Generate approval token
const generateApprovalToken = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Create a new visitor (JSON data only)
const createVisitor = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      email,
      purposeOfVisit,
      hostEmployeeId,
      hostEmployeeName,
      hostDepartment,
      companyName
    } = req.body;

    // Validate required fields
    if (!fullName || !purposeOfVisit || !hostEmployeeName) {
      return res.status(400).json({
        error: 'Full name, purpose of visit, and host employee name are required'
      });
    }

    // Generate visitor badge ID and approval token
    const visitorBadgeId = 'VIS-' + Date.now();
    const approvalToken = generateApprovalToken();

    // Prepare visitor data (without photo for now)
    const visitorData = {
      full_name: fullName,
      mobile_number: phone,
      email: email,
      purpose_of_visit: purposeOfVisit,
      host_employee_id: hostEmployeeId || null,
      host_employee_name: hostEmployeeName,
      host_department: hostDepartment,
      company_name: companyName,
      photo_path: null, // Will be updated when photo is uploaded
      visitor_badge_id: visitorBadgeId,
      status: 'pending',
      approval_token: approvalToken,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Create visitor record
    const newVisitor = await visitorModel.create(visitorData);

    res.status(201).json({
      message: 'Visitor registered successfully. Please upload photo.',
      visitorId: newVisitor.id,
      badgeId: visitorBadgeId,
      status: 'pending',
      uploadPhotoUrl: `/api/visitors/${newVisitor.id}/upload-photo`
    });

  } catch (error) {
    console.error('Error registering visitor:', error);
    res.status(500).json({ error: 'Failed to register visitor' });
  }
};

// Upload photo for existing visitor
const uploadVisitorPhoto = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if visitor exists
    const visitor = await visitorModel.findById(parseInt(id));
    if (!visitor) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    // Check if photo was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: 'Photo file is required'
      });
    }

    // Update visitor with photo path
    await visitorModel.update(parseInt(id), {
      photo_path: req.file.path,
      updated_at: new Date()
    });

    res.json({
      message: 'Photo uploaded successfully',
      photoPath: req.file.path,
      visitor: {
        id: visitor.id,
        name: visitor.full_name,
        badgeId: visitor.visitor_badge_id
      }
    });

  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
};

// All other controller functions remain the same...
const getAllVisitors = async (req, res) => {
  try {
    const visitors = await db
      .selectFrom('visitors')
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();

    res.json({
      visitors: visitors.map(visitor => ({
        id: visitor.id,
        fullName: visitor.full_name,
        phone: visitor.mobile_number,
        email: visitor.email,
        purposeOfVisit: visitor.purpose_of_visit,
        hostEmployeeName: visitor.host_employee_name,
        hostDepartment: visitor.host_department,
        companyName: visitor.company_name,
        status: visitor.status,
        checkInTime: visitor.check_in_time,
        checkOutTime: visitor.check_out_time,
        photoPath: visitor.photo_path,
        createdAt: visitor.created_at
      }))
    });

  } catch (error) {
    console.error('Error fetching visitors:', error);
    res.status(500).json({ error: 'Failed to fetch visitors' });
  }
};

const getVisitorById = async (req, res) => {
  try {
    const { id } = req.params;
    const visitor = await visitorModel.findById(parseInt(id));

    if (!visitor) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    res.json({
      visitor: {
        id: visitor.id,
        fullName: visitor.full_name,
        phone: visitor.mobile_number,
        email: visitor.email,
        purposeOfVisit: visitor.purpose_of_visit,
        hostEmployeeName: visitor.host_employee_name,
        hostDepartment: visitor.host_department,
        companyName: visitor.company_name,
        status: visitor.status,
        checkInTime: visitor.check_in_time,
        checkOutTime: visitor.check_out_time,
        photoPath: visitor.photo_path,
        visitorBadgeId: visitor.visitor_badge_id,
        createdAt: visitor.created_at
      }
    });

  } catch (error) {
    console.error('Error fetching visitor:', error);
    res.status(500).json({ error: 'Failed to fetch visitor' });
  }
};

const checkInVisitor = async (req, res) => {
  try {
    const { id } = req.params;
    const visitor = await visitorModel.findById(parseInt(id));

    if (!visitor) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    if (visitor.status !== 'approved') {
      return res.status(400).json({ error: 'Visitor not approved for entry' });
    }

    // Update visitor status to checked_in and set check_in_time
    await visitorModel.update(visitor.id, {
      status: 'checked_in',
      check_in_time: new Date(),
      updated_at: new Date()
    });

    res.json({
      message: 'Visitor checked in successfully',
      checkInTime: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error checking in visitor:', error);
    res.status(500).json({ error: 'Failed to check in visitor' });
  }
};

const checkOutVisitor = async (req, res) => {
  try {
    const { id } = req.params;
    const visitor = await visitorModel.findById(parseInt(id));

    if (!visitor) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    if (visitor.status !== 'checked_in') {
      return res.status(400).json({ error: 'Visitor not checked in' });
    }

    // Update visitor status to checked_out and set check_out_time
    await visitorModel.update(visitor.id, {
      status: 'checked_out',
      check_out_time: new Date(),
      is_checked_out: true,
      updated_at: new Date()
    });

    res.json({
      message: 'Visitor checked out successfully',
      checkOutTime: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error checking out visitor:', error);
    res.status(500).json({ error: 'Failed to check out visitor' });
  }
};

module.exports = {
  createVisitor,
  uploadVisitorPhoto,
  getAllVisitors,
  getVisitorById,
  checkInVisitor,
  checkOutVisitor
  // Add other functions as needed
};