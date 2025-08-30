const nodemailer = require('nodemailer');
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = this.createTransporter();
  }

  createTransporter() {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  /**
   * Send application confirmation email to candidate
   * @param {Object} application - Application data
   * @returns {Promise<Object>} - Email result
   */
  async sendApplicationConfirmation(application) {
    try {
      const candidate = application.candidate;
      const job = application.job;

      const mailOptions = {
        from: `"Resume AI Analyzer ATS" <${process.env.SMTP_MAIL}>`,
        to: candidate.email,
        subject: `Application Confirmed: ${job.title} at ${job.company}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h1 style="color: #343a40; margin-bottom: 20px;">Application Confirmed!</h1>
              
              <p>Dear ${candidate.firstName},</p>
              
              <p>Thank you for applying to the <strong>${job.title}</strong> position at <strong>${job.company}</strong>.</p>
              
              <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #495057; margin-top: 0;">Application Details:</h3>
                <ul style="color: #6c757d;">
                  <li><strong>Position:</strong> ${job.title}</li>
                  <li><strong>Company:</strong> ${job.company}</li>
                  <li><strong>Location:</strong> ${job.fullLocation || 'Not specified'}</li>
                  <li><strong>Application Date:</strong> ${new Date(application.createdAt).toLocaleDateString()}</li>
                  <li><strong>AI Match Score:</strong> ${application.aiAnalysis?.overallScore || 'Processing'}%</li>
                </ul>
              </div>
              
              <p>Your application is now being reviewed by our recruitment team. We'll keep you updated on your application status.</p>
              
              <p>You can track your application status by logging into your candidate dashboard.</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                <p style="color: #6c757d; font-size: 14px;">
                  Best regards,<br>
                  The ${job.company} Recruitment Team
                </p>
              </div>
            </div>
          </div>
        `,
        text: `
          Dear ${candidate.firstName},
          
          Thank you for applying to the ${job.title} position at ${job.company}.
          
          Application Details:
          - Position: ${job.title}
          - Company: ${job.company}
          - Location: ${job.fullLocation || 'Not specified'}
          - Application Date: ${new Date(application.createdAt).toLocaleDateString()}
          - AI Match Score: ${application.aiAnalysis?.overallScore || 'Processing'}%
          
          Your application is now being reviewed by our recruitment team. We'll keep you updated on your application status.
          
          You can track your application status by logging into your candidate dashboard.
          
          Best regards,
          The ${job.company} Recruitment Team
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Application confirmation email sent:', result.messageId);
      return { success: true, messageId: result.messageId };

    } catch (error) {
      console.error('Error sending application confirmation email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send status update notification to candidate
   * @param {Object} application - Application data with updated status
   * @returns {Promise<Object>} - Email result
   */
  async sendStatusUpdateNotification(application) {
    try {
      const candidate = application.candidate;
      const job = application.job;
      const status = application.status;

      // Status-specific messages
      const statusMessages = {
        screening: 'Your application is being reviewed by our team.',
        shortlisted: 'Congratulations! You have been shortlisted for the next stage.',
        interview: 'Congratulations! We would like to schedule an interview with you.',
        offer: 'Congratulations! We have an offer for you.',
        hired: 'Congratulations! Welcome to the team!',
        rejected: 'Thank you for your interest. Unfortunately, we will not be moving forward with your application at this time.',
        withdrawn: 'Your application has been withdrawn as requested.'
      };

      const statusColors = {
        screening: '#ffc107',
        shortlisted: '#28a745',
        interview: '#17a2b8',
        offer: '#28a745',
        hired: '#28a745',
        rejected: '#dc3545',
        withdrawn: '#6c757d'
      };

      const message = statusMessages[status] || 'Your application status has been updated.';
      const statusColor = statusColors[status] || '#6c757d';

      const mailOptions = {
        from: `"Resume AI Analyzer ATS" <${process.env.SMTP_MAIL}>`,
        to: candidate.email,
        subject: `Application Update: ${job.title} at ${job.company}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h1 style="color: #343a40; margin-bottom: 20px;">Application Status Update</h1>
              
              <p>Dear ${candidate.firstName},</p>
              
              <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor};">
                <h3 style="color: #495057; margin-top: 0;">Status Update</h3>
                <p><strong>Position:</strong> ${job.title} at ${job.company}</p>
                <p><strong>New Status:</strong> <span style="color: ${statusColor}; font-weight: bold; text-transform: uppercase;">${status.replace('-', ' ')}</span></p>
                <p style="color: #6c757d;">${message}</p>
              </div>
              
              ${status === 'interview' ? `
                <div style="background-color: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h4 style="color: #0c5aa6; margin-top: 0;">Next Steps</h4>
                  <p style="color: #495057;">Our team will contact you soon to schedule your interview. Please keep an eye on your email and phone.</p>
                </div>
              ` : ''}
              
              ${status === 'offer' ? `
                <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h4 style="color: #28a745; margin-top: 0;">Congratulations!</h4>
                  <p style="color: #495057;">Please check your email for detailed offer information and next steps.</p>
                </div>
              ` : ''}
              
              <p>You can view your complete application status and details in your candidate dashboard.</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                <p style="color: #6c757d; font-size: 14px;">
                  Best regards,<br>
                  The ${job.company} Recruitment Team
                </p>
              </div>
            </div>
          </div>
        `,
        text: `
          Dear ${candidate.firstName},
          
          Your application status has been updated for the ${job.title} position at ${job.company}.
          
          New Status: ${status.replace('-', ' ').toUpperCase()}
          
          ${message}
          
          You can view your complete application status and details in your candidate dashboard.
          
          Best regards,
          The ${job.company} Recruitment Team
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Status update email sent:', result.messageId);
      return { success: true, messageId: result.messageId };

    } catch (error) {
      console.error('Error sending status update email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send interview invitation email
   * @param {Object} application - Application data
   * @param {Object} interviewData - Interview details
   * @returns {Promise<Object>} - Email result
   */
  async sendInterviewNotification(application, interviewData) {
    try {
      const candidate = application.candidate;
      const job = application.job;
      const interviewer = interviewData.interviewer;

      const interviewDate = new Date(interviewData.scheduledDate);
      const formattedDate = interviewDate.toLocaleDateString();
      const formattedTime = interviewDate.toLocaleTimeString();

      const mailOptions = {
        from: `"Resume AI Analyzer ATS" <${process.env.SMTP_MAIL}>`,
        to: candidate.email,
        subject: `Interview Scheduled: ${job.title} at ${job.company}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h1 style="color: #343a40; margin-bottom: 20px;">Interview Scheduled!</h1>
              
              <p>Dear ${candidate.firstName},</p>
              
              <p>Congratulations! We would like to invite you for an interview for the <strong>${job.title}</strong> position at <strong>${job.company}</strong>.</p>
              
              <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
                <h3 style="color: #495057; margin-top: 0;">Interview Details</h3>
                <ul style="color: #6c757d;">
                  <li><strong>Type:</strong> ${interviewData.type.charAt(0).toUpperCase() + interviewData.type.slice(1)} Interview</li>
                  <li><strong>Date:</strong> ${formattedDate}</li>
                  <li><strong>Time:</strong> ${formattedTime}</li>
                  <li><strong>Duration:</strong> ${interviewData.duration || 60} minutes</li>
                  <li><strong>Position:</strong> ${job.title}</li>
                  <li><strong>Company:</strong> ${job.company}</li>
                </ul>
                ${interviewData.notes ? `<p style="margin-top: 15px;"><strong>Additional Notes:</strong><br>${interviewData.notes}</p>` : ''}
              </div>
              
              <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #856404; margin-top: 0;">Preparation Tips</h4>
                <ul style="color: #856404;">
                  <li>Review the job description and requirements</li>
                  <li>Prepare examples of relevant experience</li>
                  <li>Have questions ready about the role and company</li>
                  <li>Test your technology if it's a video interview</li>
                </ul>
              </div>
              
              <p>Please confirm your attendance by replying to this email. If you need to reschedule, please contact us as soon as possible.</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                <p style="color: #6c757d; font-size: 14px;">
                  Best regards,<br>
                  The ${job.company} Recruitment Team
                </p>
              </div>
            </div>
          </div>
        `,
        text: `
          Dear ${candidate.firstName},
          
          Congratulations! We would like to invite you for an interview for the ${job.title} position at ${job.company}.
          
          Interview Details:
          - Type: ${interviewData.type.charAt(0).toUpperCase() + interviewData.type.slice(1)} Interview
          - Date: ${formattedDate}
          - Time: ${formattedTime}
          - Duration: ${interviewData.duration || 60} minutes
          - Position: ${job.title}
          - Company: ${job.company}
          
          ${interviewData.notes ? `Additional Notes: ${interviewData.notes}` : ''}
          
          Please confirm your attendance by replying to this email. If you need to reschedule, please contact us as soon as possible.
          
          Best regards,
          The ${job.company} Recruitment Team
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Interview notification email sent:', result.messageId);
      return { success: true, messageId: result.messageId };

    } catch (error) {
      console.error('Error sending interview notification email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send welcome email for new user registration
   * @param {Object} user - User data
   * @returns {Promise<Object>} - Email result
   */
  async sendWelcomeEmail(user) {
    try {
      const roleMessages = {
        candidate: 'You can now browse jobs, upload your resume, and start applying!',
        recruiter: 'You can now post job openings and manage applications.',
        admin: 'You have full access to manage the platform.'
      };

      const mailOptions = {
        from: `"Resume AI Analyzer ATS" <${process.env.SMTP_MAIL}>`,
        to: user.email,
        subject: 'Welcome to Resume AI Analyzer ATS!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h1 style="color: #343a40; margin-bottom: 20px;">Welcome to Resume AI Analyzer ATS!</h1>
              
              <p>Dear ${user.firstName},</p>
              
              <p>Welcome to our AI-powered Applicant Tracking System! Your account has been successfully created.</p>
              
              <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #495057; margin-top: 0;">Account Information</h3>
                <ul style="color: #6c757d;">
                  <li><strong>Name:</strong> ${user.fullName}</li>
                  <li><strong>Email:</strong> ${user.email}</li>
                  <li><strong>Role:</strong> ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</li>
                  <li><strong>Profile Completion:</strong> ${user.profileCompletion}%</li>
                </ul>
              </div>
              
              <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #28a745; margin-top: 0;">Getting Started</h4>
                <p style="color: #495057;">${roleMessages[user.role]}</p>
                
                ${user.role === 'candidate' ? `
                  <p style="color: #495057;">
                    <strong>Next steps:</strong>
                  </p>
                  <ul style="color: #495057;">
                    <li>Complete your profile information</li>
                    <li>Upload your resume for AI analysis</li>
                    <li>Browse available job opportunities</li>
                    <li>Start applying to positions that match your skills</li>
                  </ul>
                ` : ''}
              </div>
              
              <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                <p style="color: #6c757d; font-size: 14px;">
                  Best regards,<br>
                  The Resume AI Analyzer ATS Team
                </p>
              </div>
            </div>
          </div>
        `,
        text: `
          Dear ${user.firstName},
          
          Welcome to our AI-powered Applicant Tracking System! Your account has been successfully created.
          
          Account Information:
          - Name: ${user.fullName}
          - Email: ${user.email}
          - Role: ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          - Profile Completion: ${user.profileCompletion}%
          
          ${roleMessages[user.role]}
          
          If you have any questions or need assistance, please don't hesitate to contact our support team.
          
          Best regards,
          The Resume AI Analyzer ATS Team
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent:', result.messageId);
      return { success: true, messageId: result.messageId };

    } catch (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send bulk notification to multiple recipients
   * @param {Array} recipients - Array of email addresses
   * @param {string} subject - Email subject
   * @param {string} htmlContent - HTML email content
   * @param {string} textContent - Plain text email content
   * @returns {Promise<Object>} - Email results
   */
  async sendBulkEmail(recipients, subject, htmlContent, textContent) {
    try {
      const mailOptions = {
        from: `"Resume AI Analyzer ATS" <${process.env.SMTP_MAIL}>`,
        bcc: recipients, // Use BCC for bulk emails
        subject,
        html: htmlContent,
        text: textContent
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Bulk email sent:', result.messageId);
      return { success: true, messageId: result.messageId, recipients: recipients.length };

    } catch (error) {
      console.error('Error sending bulk email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test email configuration
   * @returns {Promise<boolean>} - Test result
   */
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('Email service connection verified successfully');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }

  /**
   * Send password reset email (placeholder for future implementation)
   * @param {Object} user - User data
   * @param {string} resetToken - Password reset token
   * @returns {Promise<Object>} - Email result
   */
  async sendPasswordResetEmail(user, resetToken) {
    // Implementation for password reset emails
    // This would include a secure reset link with the token
    console.log('Password reset email functionality - to be implemented');
    return { success: false, message: 'Password reset not implemented yet' };
  }
}

module.exports = new EmailService();
