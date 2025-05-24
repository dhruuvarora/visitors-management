// services/emailService.js

const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

   initializeTransporter() {
     this.transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
     })
   }
   async sendApprovalEmail(visitorData, qrCodeUrl) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: visitorData.email,
        subject: '✅ Visitor Request Approved - Access Granted',
        html: this.getApprovalEmailTemplate(visitorData, qrCodeUrl),
        attachments: [
          {
            filename: 'visitor-qr-code.png',
            content: qrCodeUrl.split(',')[1], // Remove data:image/png;base64, prefix
            encoding: 'base64',
            cid: 'qrcode' // Referenced in HTML template
          }
        ]
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Approval email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending approval email:', error);
      throw error;
    }
  }

   async sendRejectionEmail(visitorData, rejectionReason) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: visitorData.email,
        subject: '❌ Visitor Request Declined',
        html: this.getRejectionEmailTemplate(visitorData, rejectionReason)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Rejection email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending rejection email:', error);
      throw error;
    }
  }

  async sendPreApprovalEmail(visitorData, qrCodeUrl) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: visitorData.email,
        subject: '🎟️ Pre-Approved Visit - Quick Access Pass',
        html: this.getPreApprovalEmailTemplate(visitorData, qrCodeUrl),
        attachments: [
          {
            filename: 'pre-approved-qr-code.png',
            content: qrCodeUrl.split(',')[1],
            encoding: 'base64',
            cid: 'qrcode'
          }
        ]
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Pre-approval email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending pre-approval email:', error);
      throw error;
    }
  }

  async sendEmployeeNotification(employeeEmail, visitorData) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: employeeEmail,
        subject: '🔔 New Visitor Approval Request',
        html: this.getEmployeeNotificationTemplate(visitorData)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Employee notification sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending employee notification:', error);
      throw error;
    }
  }
  getApprovalEmailTemplate(visitorData, qrCodeUrl) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Visitor Access Approved</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .success-badge { background: #28a745; color: white; padding: 10px 20px; border-radius: 25px; display: inline-block; margin-bottom: 20px; }
        .details-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; }
        .qr-section { text-align: center; background: white; padding: 30px; border-radius: 8px; margin: 20px 0; }
        .button { background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
        .footer { text-align: center; color: #666; padding: 20px; font-size: 12px; }
        .highlight { color: #667eea; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Access Approved!</h1>
          <p>Your visitor request has been approved</p>
        </div>
        
        <div class="content">
          <div class="success-badge">✅ APPROVED</div>
          
          <h2>Hello ${visitorData.full_name || visitorData.fullName},</h2>
          <p>Great news! Your visit request has been <strong>approved</strong> by <span class="highlight">${visitorData.host_employee_name || visitorData.hostEmployeeName}</span>.</p>
          
          <div class="details-box">
            <h3>📋 Visit Details</h3>
            <p><strong>Visitor Badge ID:</strong> ${visitorData.visitor_badge_id || visitorData.badgeId}</p>
            <p><strong>Purpose:</strong> ${visitorData.purpose_of_visit || visitorData.purposeOfVisit}</p>
            <p><strong>Host:</strong> ${visitorData.host_employee_name || visitorData.hostEmployeeName}</p>
            <p><strong>Department:</strong> ${visitorData.host_department || visitorData.hostDepartment || 'N/A'}</p>
            ${visitorData.company_name || visitorData.companyName ? `<p><strong>Company:</strong> ${visitorData.company_name || visitorData.companyName}</p>` : ''}
            <p><strong>Approved At:</strong> ${new Date().toLocaleString()}</p>
            ${visitorData.approval_remarks ? `<p><strong>Remarks:</strong> ${visitorData.approval_remarks}</p>` : ''}
          </div>

          <div class="qr-section">
            <h3>📱 Your Access QR Code</h3>
            <p>Show this QR code at the security desk for quick check-in:</p>
            <img src="cid:qrcode" alt="QR Code" style="max-width: 200px; border: 2px solid #ddd; border-radius: 8px;">
            <p><em>Save this email or screenshot the QR code for easy access</em></p>
          </div>

          <div style="text-align: center;">
            <h3>🏢 Next Steps</h3>
            <p>1. Arrive at the main reception/security desk</p>
            <p>2. Show this QR code or provide your Badge ID</p>
            <p>3. Complete the check-in process</p>
            <p>4. Don't forget to check out when leaving</p>
          </div>

          <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>⚠️ Important:</strong> Please bring a valid photo ID for verification at the security desk.</p>
          </div>
        </div>

        <div class="footer">
          <p>This is an automated message from the Visitor Management System.</p>
          <p>If you have any questions, please contact the security desk or your host.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }
  getRejectionEmailTemplate(visitorData, rejectionReason) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Visitor Request Declined</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .rejection-badge { background: #dc3545; color: white; padding: 10px 20px; border-radius: 25px; display: inline-block; margin-bottom: 20px; }
        .details-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545; }
        .reason-box { background: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #f5c6cb; }
        .footer { text-align: center; color: #666; padding: 20px; font-size: 12px; }
        .highlight { color: #dc3545; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ Request Declined</h1>
          <p>Your visitor request could not be approved</p>
        </div>
        
        <div class="content">
          <div class="rejection-badge">DECLINED</div>
          
          <h2>Hello ${visitorData.full_name || visitorData.fullName},</h2>
          <p>We regret to inform you that your visitor request has been <strong>declined</strong> by <span class="highlight">${visitorData.host_employee_name || visitorData.hostEmployeeName}</span>.</p>
          
          <div class="details-box">
            <h3>📋 Request Details</h3>
            <p><strong>Visitor Badge ID:</strong> ${visitorData.visitor_badge_id || visitorData.badgeId}</p>
            <p><strong>Purpose:</strong> ${visitorData.purpose_of_visit || visitorData.purposeOfVisit}</p>
            <p><strong>Host:</strong> ${visitorData.host_employee_name || visitorData.hostEmployeeName}</p>
            <p><strong>Department:</strong> ${visitorData.host_department || visitorData.hostDepartment || 'N/A'}</p>
            ${visitorData.company_name || visitorData.companyName ? `<p><strong>Company:</strong> ${visitorData.company_name || visitorData.companyName}</p>` : ''}
            <p><strong>Declined At:</strong> ${new Date().toLocaleString()}</p>
          </div>

          ${rejectionReason ? `
          <div class="reason-box">
            <h3>📝 Reason for Decline</h3>
            <p>${rejectionReason}</p>
          </div>
          ` : ''}

          <div style="background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #c3e6cb;">
            <h3>💡 What you can do:</h3>
            <p>• Contact your host directly to discuss alternative arrangements</p>
            <p>• Submit a new request with updated details if circumstances change</p>
            <p>• Reach out to the security desk if you believe this is an error</p>
          </div>
        </div>

        <div class="footer">
          <p>This is an automated message from the Visitor Management System.</p>
          <p>For questions about this decision, please contact your host or the security desk.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

   getPreApprovalEmailTemplate(visitorData, qrCodeUrl) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pre-Approved Visit Pass</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .pre-approval-badge { background: #17a2b8; color: white; padding: 10px 20px; border-radius: 25px; display: inline-block; margin-bottom: 20px; }
        .details-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8; }
        .time-window { background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #b8daff; }
        .qr-section { text-align: center; background: white; padding: 30px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; color: #666; padding: 20px; font-size: 12px; }
        .highlight { color: #17a2b8; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎟️ Pre-Approved Access</h1>
          <p>Your visit has been scheduled and pre-approved</p>
        </div>
        
        <div class="content">
          <div class="pre-approval-badge">✅ PRE-APPROVED</div>
          
          <h2>Hello ${visitorData.full_name || visitorData.fullName},</h2>
          <p>Excellent! <span class="highlight">${visitorData.host_employee_name || visitorData.hostEmployeeName}</span> has pre-approved your visit. You can use quick check-in during your scheduled time window.</p>
          
          <div class="details-box">
            <h3>📋 Visit Details</h3>
            <p><strong>Visitor Badge ID:</strong> ${visitorData.visitor_badge_id || visitorData.badgeId}</p>
            <p><strong>Purpose:</strong> ${visitorData.purpose_of_visit || visitorData.purposeOfVisit}</p>
            <p><strong>Host:</strong> ${visitorData.host_employee_name || visitorData.hostEmployeeName}</p>
            <p><strong>Department:</strong> ${visitorData.host_department || visitorData.hostDepartment || 'N/A'}</p>
            ${visitorData.company_name || visitorData.companyName ? `<p><strong>Company:</strong> ${visitorData.company_name || visitorData.companyName}</p>` : ''}
          </div>

          <div class="time-window">
            <h3>⏰ Valid Time Window</h3>
            <p><strong>Visit Date:</strong> ${visitorData.visit_date ? new Date(visitorData.visit_date).toDateString() : 'TBD'}</p>
            <p><strong>Access Window:</strong> ${visitorData.scheduled_arrival_start ? new Date(visitorData.scheduled_arrival_start).toLocaleTimeString() : 'TBD'} - ${visitorData.scheduled_arrival_end ? new Date(visitorData.scheduled_arrival_end).toLocaleTimeString() : 'TBD'}</p>
            <p><em>⚠️ This access pass is only valid during the above time window</em></p>
          </div>

          <div class="qr-section">
            <h3>📱 Quick Access QR Code</h3>
            <p>Show this QR code at security for instant check-in:</p>
            <img src="cid:qrcode" alt="Pre-Approval QR Code" style="max-width: 200px; border: 2px solid #ddd; border-radius: 8px;">
            <p><em>No waiting for approval - instant access during your time window!</em></p>
          </div>

          <div style="text-align: center;">
            <h3>🚀 Quick Check-in Steps</h3>
            <p>1. Arrive during your scheduled time window</p>
            <p>2. Show this QR code at the security desk</p>
            <p>3. Provide your photo ID for verification</p>
            <p>4. Get instant access - no waiting!</p>
          </div>
        </div>

        <div class="footer">
          <p>This is an automated message from the Visitor Management System.</p>
          <p>Your pre-approval expires after the scheduled time window.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }
   getEmployeeNotificationTemplate(visitorData) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Visitor Approval Request</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%); color: #333; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .pending-badge { background: #ffc107; color: #333; padding: 10px 20px; border-radius: 25px; display: inline-block; margin-bottom: 20px; }
        .details-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
        .action-buttons { text-align: center; margin: 30px 0; }
        .approve-btn { background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 0 10px; display: inline-block; }
        .reject-btn { background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 0 10px; display: inline-block; }
        .footer { text-align: center; color: #666; padding: 20px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 Visitor Approval Needed</h1>
          <p>A visitor is requesting to meet with you</p>
        </div>
        
        <div class="content">
          <div class="pending-badge">⏳ PENDING APPROVAL</div>
          
          <h2>New Visitor Request</h2>
          <p>You have received a new visitor approval request that requires your attention.</p>
          
          <div class="details-box">
            <h3>👤 Visitor Information</h3>
            <p><strong>Name:</strong> ${visitorData.full_name || visitorData.fullName}</p>
            <p><strong>Phone:</strong> ${visitorData.mobile_number || visitorData.phone || 'Not provided'}</p>
            <p><strong>Email:</strong> ${visitorData.email || 'Not provided'}</p>
            <p><strong>Company:</strong> ${visitorData.company_name || visitorData.companyName || 'Not specified'}</p>
            <p><strong>Purpose of Visit:</strong> ${visitorData.purpose_of_visit || visitorData.purposeOfVisit}</p>
            <p><strong>Badge ID:</strong> ${visitorData.visitor_badge_id || visitorData.badgeId}</p>
            <p><strong>Requested Time:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <div class="action-buttons">
            <a href="${process.env.BASE_URL}/api/visitors/approve/${visitorData.approval_token}" class="approve-btn">
              ✅ Approve Visit
            </a>
            <a href="${process.env.BASE_URL}/api/visitors/reject/${visitorData.approval_token}" class="reject-btn">
              ❌ Decline Visit
            </a>
          </div>

          <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>⏰ Time Sensitive:</strong> Please respond promptly to avoid keeping the visitor waiting.</p>
          </div>
        </div>

        <div class="footer">
          <p>This is an automated notification from the Visitor Management System.</p>
          <p>You can also approve/reject visitors through the mobile app or web portal.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  async testEmailConfiguration() {
    try {
      await this.transporter.verify();
      console.log('✅ Email service is ready');
      return true;
    } catch (error) {
      console.error('❌ Email service configuration error:', error);
      return false;
    }
  }
}

module.exports = new EmailService();