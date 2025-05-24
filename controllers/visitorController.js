// controllers/visitorController.js
const path = require('path');
const QRCode = require('qrcode');
const emailService = require('../services/emailService'); // Import email service
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

    // Set approval expiry (24 hours from now)
    const approvalExpiry = new Date();
    approvalExpiry.setHours(approvalExpiry.getHours() + 24);

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
      photo_path: null, // will get updated when photo gets uploaded
      visitor_badge_id: visitorBadgeId,
      status: 'pending',
      approval_token: approvalToken,
      approval_expiry: approvalExpiry,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Create visitor record
    const newVisitor = await visitorModel.create(visitorData);

    // Prepare response data
    const responseData = {
      message: 'Visitor registered successfully. Please upload photo.',
      visitorId: newVisitor.id,
      badgeId: visitorBadgeId,
      status: 'pending',
      uploadPhotoUrl: `/api/visitors/${newVisitor.id}/upload-photo`,
      approvalExpiry: approvalExpiry,
      employeeNotificationSent: false
    };

    // Send notification email to host employee if hostEmployeeId is provided
    if (hostEmployeeId) {
      try {
        const hostEmployee = await employeeModel.findById(parseInt(hostEmployeeId));
        if (hostEmployee && hostEmployee.email) {
          const visitorDataForEmail = {
            ...visitorData,
            approval_token: approvalToken
          };
          
          await emailService.sendEmployeeNotification(hostEmployee.email, visitorDataForEmail);
          console.log(`✅ Employee notification sent to: ${hostEmployee.email}`);
          responseData.employeeNotificationSent = true;
        }
      } catch (emailError) {
        console.error('❌ Failed to send employee notification:', emailError);
        responseData.emailError = 'Failed to send employee notification';
      }
    }

    res.status(201).json(responseData);

  } catch (error) {
    console.error('Error registering visitor:', error);
    res.status(500).json({ error: 'Failed to register visitor' });
  }
};

// Upload photo for existing visitor and trigger employee notification if not sent yet
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

    // Prepare response data
    const responseData = {
      message: 'Photo uploaded successfully',
      photoPath: req.file.path,
      visitor: {
        id: visitor.id,
        name: visitor.full_name,
        badgeId: visitor.visitor_badge_id
      },
      employeeNotificationSent: false
    };

    // Send employee notification if not sent during visitor creation
    if (visitor.host_employee_id && visitor.status === 'pending') {
      try {
        const hostEmployee = await employeeModel.findById(visitor.host_employee_id);
        if (hostEmployee && hostEmployee.email) {
          await emailService.sendEmployeeNotification(hostEmployee.email, visitor);
          console.log(`✅ Employee notification sent to: ${hostEmployee.email} after photo upload`);
          responseData.employeeNotificationSent = true;
        }
      } catch (emailError) {
        console.error('❌ Failed to send employee notification after photo upload:', emailError);
        responseData.emailError = 'Failed to send employee notification';
      }
    }

    res.json(responseData);

  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
};

// Get all visitors (unchanged)
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

// Get visitor by ID (unchanged)
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

// Check in visitor (unchanged)
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

// Check out visitor (unchanged)
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
};