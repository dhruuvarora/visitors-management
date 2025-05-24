const db = require('../database/connection');  
const QRCode = require('qrcode');

const VisitorModel = require('../models/Visitor');  
const EmployeeModel = require('../models/Employee'); 

const visitorModel = new VisitorModel(db);  
const employeeModel = new EmployeeModel(db); 


const approveVisitor = async (req, res) => {
  try {
    const { token } = req.params;
    const { remarks } = req.body || {};

    // Find visitor by approval token
    const visitor = await db
      .selectFrom('visitors')
      .selectAll()
      .where('approval_token', '=', token)
      .executeTakeFirst();

    if (!visitor) {
      return res.status(404).json({ error: 'Invalid approval token' });
    }

    // Check if approval has expired
    const now = new Date();
    if (visitor.approval_expiry && new Date(visitor.approval_expiry) < now) {
      return res.status(400).json({ 
        error: 'Approval request has expired',
        expiredAt: visitor.approval_expiry
      });
    }

    // Check if visitor is in pending status
    if (visitor.status !== 'pending') {
      return res.status(400).json({ 
        error: `Visitor is already ${visitor.status}. Cannot approve.`
      });
    }

    // Update visitor status to approved
    await visitorModel.update(visitor.id, {
      status: 'approved',
      approved_at: new Date(),
      approval_remarks: remarks || null,
      approval_token: null, 
      updated_at: new Date()
    });

    // Generate QR code for the visitor
    const qrData = {
      visitorId: visitor.id,
      badgeId: visitor.visitor_badge_id,
      name: visitor.full_name,
      approved: true
    };
    
    const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData));

    res.json({
      message: 'Visitor approved successfully',
      visitor: {
        id: visitor.id,
        name: visitor.full_name,
        badgeId: visitor.visitor_badge_id,
        status: 'approved',
        approvedAt: new Date()
      },
      qrCode: qrCodeUrl,
      checkInUrl: `/api/visitors/${visitor.id}/checkin`
    });

  } catch (error) {
    console.error('Error approving visitor:', error);
    res.status(500).json({ error: 'Failed to approve visitor' });
  }
};

const rejectVisitor = async (req, res) => {
  try {
    const { token } = req.params;
    const { reason } = req.body; // Rejection reason

    // Find visitor by approval token
    const visitor = await db
      .selectFrom('visitors')
      .selectAll()
      .where('approval_token', '=', token)
      .executeTakeFirst();

    if (!visitor) {
      return res.status(404).json({ error: 'Invalid approval token' });
    }

    // Check if visitor is in pending status
    if (visitor.status !== 'pending') {
      return res.status(400).json({ 
        error: `Visitor is already ${visitor.status}. Cannot reject.`
      });
    }

    // Update visitor status to rejected
    await visitorModel.update(visitor.id, {
      status: 'rejected',
      rejected_at: new Date(),
      rejection_reason: reason || 'No reason provided',
      approval_token: null, 
      updated_at: new Date()
    });

    res.json({
      message: 'Visitor request rejected',
      visitor: {
        id: visitor.id,
        name: visitor.full_name,
        badgeId: visitor.visitor_badge_id,
        status: 'rejected',
        rejectedAt: new Date(),
        reason: reason || 'No reason provided'
      }
    });

  } catch (error) {
    console.error('Error rejecting visitor:', error);
    res.status(500).json({ error: 'Failed to reject visitor' });
  }
};

// Get visitors by status
const getVisitorsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const validStatuses = ['pending', 'approved', 'rejected', 'checked_in', 'checked_out'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        validStatuses: validStatuses
      });
    }

    const visitors = await db
      .selectFrom('visitors')
      .selectAll()
      .where('status', '=', status)
      .orderBy('created_at', 'desc')
      .execute();

    res.json({
      status: status,
      count: visitors.length,
      visitors: visitors.map(visitor => ({
        id: visitor.id,
        fullName: visitor.full_name,
        phone: visitor.mobile_number,
        email: visitor.email,
        purposeOfVisit: visitor.purpose_of_visit,
        hostEmployeeName: visitor.host_employee_name,
        hostDepartment: visitor.host_department,
        companyName: visitor.company_name,
        badgeId: visitor.visitor_badge_id,
        status: visitor.status,
        createdAt: visitor.created_at,
        approvedAt: visitor.approved_at,
        rejectedAt: visitor.rejected_at,
        checkInTime: visitor.check_in_time,
        checkOutTime: visitor.check_out_time
      }))
    });

  } catch (error) {
    console.error('Error fetching visitors by status:', error);
    res.status(500).json({ error: 'Failed to fetch visitors' });
  }
};

// Get pending approval requests (for employees)
const getPendingApprovals = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Get pending visitors for specific employee or all if no employeeId provided
    let query = db
      .selectFrom('visitors')
      .selectAll()
      .where('status', '=', 'pending');

    if (employeeId) {
      query = query.where('host_employee_id', '=', parseInt(employeeId));
    }

    const pendingVisitors = await query
      .orderBy('created_at', 'desc')
      .execute();

    // Filter out expired requests
    const now = new Date();
    const validPendingVisitors = pendingVisitors.filter(visitor => {
      return !visitor.approval_expiry || new Date(visitor.approval_expiry) > now;
    });

    res.json({
      count: validPendingVisitors.length,
      pendingApprovals: validPendingVisitors.map(visitor => ({
        id: visitor.id,
        fullName: visitor.full_name,
        phone: visitor.mobile_number,
        email: visitor.email,
        purposeOfVisit: visitor.purpose_of_visit,
        companyName: visitor.company_name,
        badgeId: visitor.visitor_badge_id,
        approvalToken: visitor.approval_token,
        approvalExpiry: visitor.approval_expiry,
        createdAt: visitor.created_at,
        approveUrl: `/api/visitors/approve/${visitor.approval_token}`,
        rejectUrl: `/api/visitors/reject/${visitor.approval_token}`
      }))
    });

  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({ error: 'Failed to fetch pending approvals' });
  }
};

// Clean up expired approval requests
const cleanupExpiredApprovals = async (req, res) => {
  try {
    const now = new Date();

    // Find expired pending requests
    const expiredVisitors = await db
      .selectFrom('visitors')
      .selectAll()
      .where('status', '=', 'pending')
      .where('approval_expiry', '<', now)
      .execute();

    if (expiredVisitors.length === 0) {
      return res.json({
        message: 'No expired approval requests found',
        expiredCount: 0
      });
    }

    // Update expired requests to 'expired' status
    for (const visitor of expiredVisitors) {
      await visitorModel.update(visitor.id, {
        status: 'expired',
        approval_token: null,
        updated_at: new Date()
      });
    }

    res.json({
      message: `${expiredVisitors.length} expired approval requests cleaned up`,
      expiredCount: expiredVisitors.length,
      expiredVisitors: expiredVisitors.map(v => ({
        id: v.id,
        name: v.full_name,
        badgeId: v.visitor_badge_id,
        expiredAt: v.approval_expiry
      }))
    });

  } catch (error) {
    console.error('Error cleaning up expired approvals:', error);
    res.status(500).json({ error: 'Failed to cleanup expired approvals' });
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
        badgeId: visitor.visitor_badge_id,
        status: visitor.status
      }
    });

  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
};


module.exports = {
    approveVisitor,
    rejectVisitor,
    uploadVisitorPhoto,
    getVisitorsByStatus,
    getPendingApprovals,
    cleanupExpiredApprovals
}