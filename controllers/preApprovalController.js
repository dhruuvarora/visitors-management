// controllers/preApprovalController.js
const QRCode = require('qrcode');
const emailService = require('../services/emailService'); // Import email service
const db = require('../database/connection');

// Initialize models
const VisitorModel = require('../models/Visitor');
const EmployeeModel = require('../models/Employee');

const visitorModel = new VisitorModel(db);
const employeeModel = new EmployeeModel(db);

const generatePreApprovalToken = () => {
  return 'PRE-' + Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

const createPreApprovedVisitor = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const {
      fullName,
      phone,
      email,
      purposeOfVisit,
      companyName,
      visitDate,
      scheduledArrivalStart,
      scheduledArrivalEnd,
      remarks
    } = req.body;

    // Validate required fields
    if (!fullName || !purposeOfVisit || !visitDate || !scheduledArrivalStart || !scheduledArrivalEnd) {
      return res.status(400).json({
        error: 'Full name, purpose of visit, visit date, and time window are required'
      });
    }

    // Check if employee exists
    const employee = await employeeModel.findById(parseInt(employeeId));
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Validate time window
    const arrivalStart = new Date(scheduledArrivalStart);
    const arrivalEnd = new Date(scheduledArrivalEnd);
    const now = new Date();

    if (arrivalStart >= arrivalEnd) {
      return res.status(400).json({ error: 'Arrival start time must be before end time' });
    }

    if (arrivalStart <= now) {
      return res.status(400).json({ error: 'Scheduled arrival time must be in the future' });
    }

    // Check daily visitor limit for employee
    const visitDateObj = new Date(visitDate);
    const startOfDay = new Date(visitDateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(visitDateObj);
    endOfDay.setHours(23, 59, 59, 999);

    const todayVisitors = await db
      .selectFrom('visitors')
      .selectAll()
      .where('pre_approved_by_employee_id', '=', parseInt(employeeId))
      .where('visit_date', '>=', startOfDay)
      .where('visit_date', '<=', endOfDay)
      .where('status', 'in', ['pre_approved', 'checked_in', 'checked_out'])
      .execute();

    const MAX_VISITORS_PER_DAY = 5; // Configurable limit
    if (todayVisitors.length >= MAX_VISITORS_PER_DAY) {
      return res.status(400).json({
        error: `Daily visitor limit reached. Maximum ${MAX_VISITORS_PER_DAY} visitors per employee per day.`,
        currentCount: todayVisitors.length,
        limit: MAX_VISITORS_PER_DAY
      });
    }

    // Generate visitor badge ID and pre-approval token
    const visitorBadgeId = 'PRE-VIS-' + Date.now();
    const preApprovalToken = generatePreApprovalToken();

    // Prepare pre-approved visitor data
    const visitorData = {
      full_name: fullName,
      mobile_number: phone,
      email: email,
      purpose_of_visit: purposeOfVisit,
      host_employee_id: parseInt(employeeId),
      host_employee_name: employee.name,
      host_department: employee.department,
      company_name: companyName,
      visitor_badge_id: visitorBadgeId,
      status: 'pre_approved',
      is_pre_approved: true,
      visit_date: visitDateObj,
      scheduled_arrival_start: arrivalStart,
      scheduled_arrival_end: arrivalEnd,
      pre_approved_by_employee_id: parseInt(employeeId),
      pre_approved_at: new Date(),
      approval_token: preApprovalToken,
      approval_remarks: remarks || null,
      created_at: new Date(),
      updated_at: new Date()
    };

    const newVisitor = await visitorModel.create(visitorData);

    // Generate QR code with pre-approval data
    const qrData = {
      visitorId: newVisitor.id,
      badgeId: visitorBadgeId,
      name: fullName,
      preApproved: true,
      token: preApprovalToken,
      validFrom: arrivalStart.toISOString(),
      validUntil: arrivalEnd.toISOString(),
      hostEmployee: employee.name
    };
    
    const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData));

    // Prepare response data
    const responseData = {
      message: 'Visitor pre-approved successfully',
      visitor: {
        id: newVisitor.id,
        name: fullName,
        badgeId: visitorBadgeId,
        status: 'pre_approved',
        visitDate: visitDate,
        timeWindow: {
          start: scheduledArrivalStart,
          end: scheduledArrivalEnd
        },
        hostEmployee: employee.name,
        preApprovedAt: new Date()
      },
      preApprovalToken: preApprovalToken,
      qrCode: qrCodeUrl,
      quickCheckinUrl: `/api/visitors/quick-checkin/${preApprovalToken}`,
      instructions: 'Visitor can use QR code or token for quick check-in during the scheduled window',
      emailSent: false
    };

    // Send pre-approval email to visitor if email is provided
    if (email) {
      try {
        const visitorDataForEmail = {
          ...visitorData,
          hostEmployeeName: employee.name,
          hostDepartment: employee.department
        };
        
        await emailService.sendPreApprovalEmail(visitorDataForEmail, qrCodeUrl);
        console.log(`✅ Pre-approval email sent to: ${email}`);
        responseData.emailSent = true;
      } catch (emailError) {
        console.error('❌ Failed to send pre-approval email:', emailError);
        responseData.emailError = 'Failed to send email notification';
      }
    }

    res.status(201).json(responseData);

  } catch (error) {
    console.error('Error creating pre-approved visitor:', error);
    res.status(500).json({ error: 'Failed to create pre-approved visitor' });
  }
};

// Get employee's pre-approved visitors (unchanged from your original)
const getEmployeePreApprovedVisitors = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { date, status } = req.query;

    // Check if employee exists
    const employee = await employeeModel.findById(parseInt(employeeId));
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    let query = db
      .selectFrom('visitors')
      .selectAll()
      .where('pre_approved_by_employee_id', '=', parseInt(employeeId))
      .where('is_pre_approved', '=', true);

    // Filter by date if provided
    if (date) {
      const filterDate = new Date(date);
      const startOfDay = new Date(filterDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filterDate);
      endOfDay.setHours(23, 59, 59, 999);

      query = query
        .where('visit_date', '>=', startOfDay)
        .where('visit_date', '<=', endOfDay);
    }

    // Filter by status if provided
    if (status) {
      query = query.where('status', '=', status);
    }

    const preApprovedVisitors = await query
      .orderBy('visit_date', 'desc')
      .orderBy('scheduled_arrival_start', 'asc')
      .execute();

    // Categorize visitors by status and time
    const now = new Date();
    const categorizedVisitors = {
      upcoming: [],
      active: [],
      expired: [],
      completed: []
    };

    preApprovedVisitors.forEach(visitor => {
      const arrivalStart = new Date(visitor.scheduled_arrival_start);
      const arrivalEnd = new Date(visitor.scheduled_arrival_end);

      if (visitor.status === 'checked_out') {
        categorizedVisitors.completed.push(visitor);
      } else if (visitor.status === 'checked_in') {
        categorizedVisitors.active.push(visitor);
      } else if (now > arrivalEnd && visitor.status === 'pre_approved') {
        categorizedVisitors.expired.push(visitor);
      } else if (now >= arrivalStart && now <= arrivalEnd) {
        categorizedVisitors.active.push(visitor);
      } else {
        categorizedVisitors.upcoming.push(visitor);
      }
    });

    res.json({
      employee: {
        id: employee.id,
        name: employee.name,
        department: employee.department
      },
      totalPreApproved: preApprovedVisitors.length,
      visitors: preApprovedVisitors.map(visitor => ({
        id: visitor.id,
        fullName: visitor.full_name,
        phone: visitor.mobile_number,
        email: visitor.email,
        purposeOfVisit: visitor.purpose_of_visit,
        companyName: visitor.company_name,
        badgeId: visitor.visitor_badge_id,
        status: visitor.status,
        visitDate: visitor.visit_date,
        timeWindow: {
          start: visitor.scheduled_arrival_start,
          end: visitor.scheduled_arrival_end
        },
        preApprovedAt: visitor.pre_approved_at,
        checkInTime: visitor.check_in_time,
        checkOutTime: visitor.check_out_time
      })),
      categorized: categorizedVisitors
    });

  } catch (error) {
    console.error('Error fetching pre-approved visitors:', error);
    res.status(500).json({ error: 'Failed to fetch pre-approved visitors' });
  }
};

// Check employee's daily pre-approval limits (unchanged)
const checkPreApprovalLimits = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { date } = req.query;

    // Check if employee exists
    const employee = await employeeModel.findById(parseInt(employeeId));
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Use provided date or default to today
    const checkDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(checkDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(checkDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Count pre-approved visitors for the day
    const todayVisitors = await db
      .selectFrom('visitors')
      .selectAll()
      .where('pre_approved_by_employee_id', '=', parseInt(employeeId))
      .where('visit_date', '>=', startOfDay)
      .where('visit_date', '<=', endOfDay)
      .where('status', 'in', ['pre_approved', 'checked_in', 'checked_out'])
      .execute();

    const MAX_VISITORS_PER_DAY = 5; // This could be configurable per employee
    const remainingSlots = Math.max(0, MAX_VISITORS_PER_DAY - todayVisitors.length);

    res.json({
      employee: {
        id: employee.id,
        name: employee.name,
        department: employee.department
      },
      date: checkDate.toISOString().split('T')[0],
      limits: {
        maxVisitorsPerDay: MAX_VISITORS_PER_DAY,
        currentCount: todayVisitors.length,
        remainingSlots: remainingSlots,
        canCreateMore: remainingSlots > 0
      },
      todayVisitors: todayVisitors.map(visitor => ({
        id: visitor.id,
        name: visitor.full_name,
        status: visitor.status,
        timeWindow: {
          start: visitor.scheduled_arrival_start,
          end: visitor.scheduled_arrival_end
        }
      }))
    });

  } catch (error) {
    console.error('Error checking pre-approval limits:', error);
    res.status(500).json({ error: 'Failed to check pre-approval limits' });
  }
};

// Update pre-approved visitor with email notification
const updatePreApprovedVisitor = async (req, res) => {
  try {
    const { employeeId, visitorId } = req.params;
    const updateData = req.body;

    // Check if employee exists
    const employee = await employeeModel.findById(parseInt(employeeId));
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check if visitor exists and belongs to employee
    const visitor = await visitorModel.findById(parseInt(visitorId));
    if (!visitor) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    if (visitor.pre_approved_by_employee_id !== parseInt(employeeId)) {
      return res.status(403).json({ error: 'Not authorized to update this visitor' });
    }

    if (!visitor.is_pre_approved || visitor.status !== 'pre_approved') {
      return res.status(400).json({ error: 'Can only update pre-approved visitors' });
    }

    // Validate time window if being updated
    if (updateData.scheduledArrivalStart || updateData.scheduledArrivalEnd) {
      const arrivalStart = new Date(updateData.scheduledArrivalStart || visitor.scheduled_arrival_start);
      const arrivalEnd = new Date(updateData.scheduledArrivalEnd || visitor.scheduled_arrival_end);
      const now = new Date();

      if (arrivalStart >= arrivalEnd) {
        return res.status(400).json({ error: 'Arrival start time must be before end time' });
      }

      if (arrivalStart <= now) {
        return res.status(400).json({ error: 'Scheduled arrival time must be in the future' });
      }
    }

    // Prepare update object
    const updateFields = { updated_at: new Date() };
    if (updateData.fullName) updateFields.full_name = updateData.fullName;
    if (updateData.phone) updateFields.mobile_number = updateData.phone;
    if (updateData.email) updateFields.email = updateData.email;
    if (updateData.purposeOfVisit) updateFields.purpose_of_visit = updateData.purposeOfVisit;
    if (updateData.companyName) updateFields.company_name = updateData.companyName;
    if (updateData.visitDate) updateFields.visit_date = new Date(updateData.visitDate);
    if (updateData.scheduledArrivalStart) updateFields.scheduled_arrival_start = new Date(updateData.scheduledArrivalStart);
    if (updateData.scheduledArrivalEnd) updateFields.scheduled_arrival_end = new Date(updateData.scheduledArrivalEnd);
    if (updateData.remarks !== undefined) updateFields.approval_remarks = updateData.remarks;

    await visitorModel.update(parseInt(visitorId), updateFields);

    // Get updated visitor data
    const updatedVisitor = await visitorModel.findById(parseInt(visitorId));

    // Prepare response data
    const responseData = {
      message: 'Pre-approved visitor updated successfully',
      visitor: {
        id: updatedVisitor.id,
        name: updatedVisitor.full_name,
        badgeId: updatedVisitor.visitor_badge_id,
        status: updatedVisitor.status,
        visitDate: updatedVisitor.visit_date,
        timeWindow: {
          start: updatedVisitor.scheduled_arrival_start,
          end: updatedVisitor.scheduled_arrival_end
        }
      },
      emailSent: false
    };

    // Send updated email notification if significant changes were made and visitor has email
    const significantFields = ['scheduledArrivalStart', 'scheduledArrivalEnd', 'visitDate'];
    const hasSignificantChanges = significantFields.some(field => updateData[field]);
    
    if (hasSignificantChanges && updatedVisitor.email) {
      try {
        // Generate new QR code with updated data
        const qrData = {
          visitorId: updatedVisitor.id,
          badgeId: updatedVisitor.visitor_badge_id,
          name: updatedVisitor.full_name,
          preApproved: true,
          token: updatedVisitor.approval_token,
          validFrom: updatedVisitor.scheduled_arrival_start,
          validUntil: updatedVisitor.scheduled_arrival_end,
          hostEmployee: employee.name
        };
        
        const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData));
        
        const visitorDataForEmail = {
          ...updatedVisitor,
          hostEmployeeName: employee.name,
          hostDepartment: employee.department
        };
        
        await emailService.sendPreApprovalEmail(visitorDataForEmail, qrCodeUrl);
        console.log(`✅ Updated pre-approval email sent to: ${updatedVisitor.email}`);
        responseData.emailSent = true;
      } catch (emailError) {
        console.error('❌ Failed to send updated pre-approval email:', emailError);
        responseData.emailError = 'Failed to send email notification';
      }
    }

    res.json(responseData);

  } catch (error) {
    console.error('Error updating pre-approved visitor:', error);
    res.status(500).json({ error: 'Failed to update pre-approved visitor' });
  }
};

// Cancel pre-approved visitor (unchanged)
const cancelPreApprovedVisitor = async (req, res) => {
  try {
    const { employeeId, visitorId } = req.params;
    const { reason } = req.body;

    // Check if employee exists
    const employee = await employeeModel.findById(parseInt(employeeId));
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check if visitor exists and belongs to employee
    const visitor = await visitorModel.findById(parseInt(visitorId));
    if (!visitor) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    if (visitor.pre_approved_by_employee_id !== parseInt(employeeId)) {
      return res.status(403).json({ error: 'Not authorized to cancel this visitor' });
    }

    if (!visitor.is_pre_approved || visitor.status !== 'pre_approved') {
      return res.status(400).json({ error: 'Can only cancel pre-approved visitors' });
    }

    const cancellationReason = reason || 'Cancelled by host employee';

    // Update visitor status to cancelled
    await visitorModel.update(parseInt(visitorId), {
      status: 'cancelled',
      rejection_reason: cancellationReason,
      updated_at: new Date()
    });

    // Prepare response data
    const responseData = {
      message: 'Pre-approved visitor cancelled successfully',
      visitor: {
        id: visitor.id,
        name: visitor.full_name,
        badgeId: visitor.visitor_badge_id,
        status: 'cancelled',
        reason: cancellationReason
      },
      emailSent: false
    };

    // Send cancellation email (similar to rejection email)
    if (visitor.email) {
      try {
        await emailService.sendRejectionEmail(visitor, cancellationReason);
        console.log(`✅ Cancellation email sent to: ${visitor.email}`);
        responseData.emailSent = true;
      } catch (emailError) {
        console.error('❌ Failed to send cancellation email:', emailError);
        responseData.emailError = 'Failed to send email notification';
      }
    }

    res.json(responseData);

  } catch (error) {
    console.error('Error cancelling pre-approved visitor:', error);
    res.status(500).json({ error: 'Failed to cancel pre-approved visitor' });
  }
};

module.exports = {
  createPreApprovedVisitor,
  getEmployeePreApprovedVisitors,
  checkPreApprovalLimits,
  updatePreApprovedVisitor,
  cancelPreApprovedVisitor
};