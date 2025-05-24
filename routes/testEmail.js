// routes/testEmail.js
const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const QRCode = require('qrcode');

// Test email configuration
router.get('/test-config', async (req, res) => {
  try {
    const isReady = await emailService.testEmailConfiguration();
    res.json({
      emailServiceReady: isReady,
      emailUser: process.env.EMAIL_USER ? 'Configured' : 'Missing',
      emailPassword: process.env.EMAIL_PASSWORD ? 'Configured' : 'Missing',
      baseUrl: process.env.BASE_URL || 'Not set'
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      emailServiceReady: false
    });
  }
});

// Test approval email
router.post('/test-approval', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Generate test QR code
    const testQRData = {
      visitorId: 'TEST-123',
      badgeId: 'VIS-TEST-123',
      name: 'Test Visitor',
      approved: true,
      timestamp: new Date().toISOString()
    };
    const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(testQRData));

    // Test visitor data
    const testVisitorData = {
      full_name: 'John Test Visitor',
      visitor_badge_id: 'VIS-TEST-123',
      purpose_of_visit: 'Testing email functionality',
      host_employee_name: 'Jane Host',
      host_department: 'IT Department',
      company_name: 'Test Company Inc.',
      email: email,
      approval_remarks: 'This is a test approval email'
    };

    await emailService.sendApprovalEmail(testVisitorData, qrCodeUrl);

    res.json({
      message: 'Test approval email sent successfully',
      sentTo: email,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test approval email error:', error);
    res.status(500).json({ 
      error: 'Failed to send test approval email',
      details: error.message 
    });
  }
});

// Test rejection email
router.post('/test-rejection', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const testVisitorData = {
      full_name: 'John Test Visitor',
      visitor_badge_id: 'VIS-TEST-456',
      purpose_of_visit: 'Testing email functionality',
      host_employee_name: 'Jane Host',
      host_department: 'IT Department',
      company_name: 'Test Company Inc.',
      email: email
    };

    const rejectionReason = 'This is a test rejection - your actual visit was not rejected';

    await emailService.sendRejectionEmail(testVisitorData, rejectionReason);

    res.json({
      message: 'Test rejection email sent successfully',
      sentTo: email,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test rejection email error:', error);
    res.status(500).json({ 
      error: 'Failed to send test rejection email',
      details: error.message 
    });
  }
});

// Test employee notification
router.post('/test-employee-notification', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const testVisitorData = {
      full_name: 'John Test Visitor',
      mobile_number: '+1234567890',
      email: 'visitor@test.com',
      purpose_of_visit: 'Testing employee notification',
      company_name: 'Test Company Inc.',
      visitor_badge_id: 'VIS-TEST-789',
      approval_token: 'test-token-123'
    };

    await emailService.sendEmployeeNotification(email, testVisitorData);

    res.json({
      message: 'Test employee notification sent successfully',
      sentTo: email,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test employee notification error:', error);
    res.status(500).json({ 
      error: 'Failed to send test employee notification',
      details: error.message 
    });
  }
});

module.exports = router;