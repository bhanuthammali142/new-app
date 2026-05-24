const nodemailer = require('nodemailer')

// Initialize SMTP transporter
// If credentials are not provided, we run in "development mode" and just log the emails to console.
const hasCredentials = process.env.EMAIL_USER && process.env.EMAIL_PASS

let transporter = null
if (hasCredentials) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  })
  console.log('✉️ Email Service: Gmail SMTP configured successfully.')
} else {
  console.warn('⚠️ Email Service: EMAIL_USER or EMAIL_PASS environment variables are missing.')
  console.warn('   Emails will be logged to the console instead of being sent.')
}

/**
 * Base function to send an email with standard HTML wrapper
 */
async function sendMail({ to, subject, html, text }) {
  if (!to) return
  
  const fromName = 'HostelOS Portal'
  const fromEmail = process.env.EMAIL_USER || 'no-reply@hostelos.com'
  
  if (hasCredentials && transporter) {
    try {
      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        text,
        html
      })
      console.log(`✉️ Email successfully sent to ${to}: "${subject}"`)
    } catch (err) {
      console.error(`❌ Failed to send email to ${to}:`, err.message)
    }
  } else {
    console.log('\n--- ✉️ DEV EMAIL LOG ---')
    console.log(`To:      ${to}`)
    console.log(`Subject: ${subject}`)
    console.log(`Text:    ${text}`)
    console.log('------------------------\n')
  }
}

/**
 * Sends student registration credentials
 */
async function sendWelcomeEmail(email, name, tempPassword) {
  const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  const html = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">HostelOS</h1>
        <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Your Premium Living Portal</p>
      </div>
      <div style="padding: 32px; background-color: #ffffff;">
        <h2 style="margin-top: 0; color: #1e293b; font-size: 20px; font-weight: 700;">Welcome to HostelOS, ${name}!</h2>
        <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin-top: 8px;">
          Your hostel administrator has registered your profile in the hostel management portal. You can now use your credentials to log in, pay fees, mark leaves, view food menus, and track rewards.
        </p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; margin: 24px 0;">
          <h3 style="margin-top: 0; margin-bottom: 12px; color: #475569; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;">Your Account Details</h3>
          <p style="margin: 0; font-size: 14px; color: #334155;"><strong>Login URL:</strong> <a href="${loginUrl}/login" style="color: #4f46e5; text-decoration: none; font-weight: 600;">${loginUrl}/login</a></p>
          <p style="margin: 8px 0 0 0; font-size: 14px; color: #334155;"><strong>Username/Email:</strong> <span style="font-family: monospace; font-size: 13px; bg-color: #fff; padding: 2px 6px; border: 1px solid #cbd5e1; border-radius: 4px;">${email}</span></p>
          <p style="margin: 8px 0 0 0; font-size: 14px; color: #334155;"><strong>Temporary Password:</strong> <span style="font-family: monospace; font-size: 13px; font-weight: bold; color: #e11d48; bg-color: #fff; padding: 2px 6px; border: 1px solid #cbd5e1; border-radius: 4px;">${tempPassword}</span></p>
        </div>

        <div style="background-color: #fffbeb; border: 1px solid #fef3c7; padding: 12px 16px; border-radius: 8px; font-size: 13px; color: #92400e; margin-bottom: 24px; font-weight: 500;">
          ⚠️ Please change this temporary password immediately after your first login under the Settings page to secure your account.
        </div>

        <a href="${loginUrl}/login" style="display: block; width: 100%; text-align: center; background-color: #4f46e5; color: white; padding: 12px 0; border-radius: 8px; font-weight: 700; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">Log In to Your Account</a>
      </div>
      <div style="background-color: #f8fafc; border-t: 1px solid #cbd5e1; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
        © ${new Date().getFullYear()} HostelOS Inc. All rights reserved.
      </div>
    </div>
  `
  
  const text = `Welcome to HostelOS, ${name}!\n\nYour account has been created successfully.\nLogin URL: ${loginUrl}/login\nUsername: ${email}\nTemporary Password: ${tempPassword}\n\nPlease change this password after your first login.`
  
  await sendMail({ to: email, subject: 'Welcome to HostelOS - Your Login Credentials', html, text })
}

/**
 * Sends a monthly fee reminder
 */
async function sendFeeReminderEmail(email, name, monthName, amount, dueDate) {
  const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  const html = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #e11d48 0%, #be123c 100%); padding: 32px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 26px; font-weight: 800;">Fee Payment Reminder</h1>
        <p style="margin: 6px 0 0 0; font-size: 15px; opacity: 0.9;">Outstanding Bill for ${monthName}</p>
      </div>
      <div style="padding: 32px; background-color: #ffffff;">
        <h2 style="margin-top: 0; color: #1e293b; font-size: 18px;">Hi ${name},</h2>
        <p style="color: #64748b; font-size: 15px; line-height: 1.6;">
          This is a friendly reminder that your monthly room fee bill for <strong>${monthName}</strong> is pending payment. Please log in to clear your outstanding dues on time to avoid late fines.
        </p>
        
        <div style="background-color: #fafafa; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; margin: 24px 0; text-align: center;">
          <p style="margin: 0; font-size: 13px; text-transform: uppercase; color: #94a3b8; font-weight: 700; letter-spacing: 0.05em;">DUE AMOUNT</p>
          <h2 style="margin: 8px 0; color: #e11d48; font-size: 32px; font-weight: 900;">₹${Number(amount).toLocaleString('en-IN')}</h2>
          <p style="margin: 0; font-size: 14px; color: #475569;">Due Date: <strong>${new Date(dueDate).toLocaleDateString()}</strong></p>
        </div>

        <a href="${loginUrl}/login" style="display: block; width: 100%; text-align: center; background-color: #e11d48; color: white; padding: 12px 0; border-radius: 8px; font-weight: 700; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(225, 29, 72, 0.2);">Pay Outstanding Dues Now</a>
      </div>
      <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
        Please ignore this email if you have already cleared this payment.
      </div>
    </div>
  `
  
  const text = `Hi ${name},\n\nThis is a reminder that your fee for ${monthName} of ₹${amount} is pending. Due Date: ${dueDate}. Please log in and pay at: ${loginUrl}/login`
  
  await sendMail({ to: email, subject: `Fee Payment Reminder - ${monthName}`, html, text })
}

/**
 * Sends a payment receipt
 */
async function sendPaymentReceiptEmail(email, name, receiptId, amountPaid, monthName, paymentMethod) {
  const html = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #047857 100%); padding: 32px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 26px; font-weight: 800;">Payment Receipt</h1>
        <p style="margin: 6px 0 0 0; font-size: 15px; opacity: 0.9;">Transaction Successful</p>
      </div>
      <div style="padding: 32px; background-color: #ffffff;">
        <h2 style="margin-top: 0; color: #1e293b; font-size: 18px;">Hi ${name},</h2>
        <p style="color: #64748b; font-size: 15px; line-height: 1.6;">
          Thank you for your payment. Your room fee payment has been successfully processed. Here is your transaction summary.
        </p>
        
        <div style="border: 1px solid #e2e8f0; border-radius: 12px; margin: 24px 0; overflow: hidden;">
          <div style="background-color: #f8fafc; padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #475569; display: flex; justify-content: space-between;">
            <span>RECEIPT ID: ${receiptId}</span>
            <span>DATE: ${new Date().toLocaleDateString()}</span>
          </div>
          <div style="padding: 16px; space-y: 12px;">
            <div style="display: flex; justify-content: space-between; font-size: 14px; color: #475569; margin-bottom: 8px;">
              <span>Billing Cycle</span>
              <span style="font-weight: 600; color: #1e293b;">${monthName}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 14px; color: #475569; margin-bottom: 8px;">
              <span>Payment Mode</span>
              <span style="font-weight: 600; color: #1e293b; text-transform: uppercase;">${paymentMethod}</span>
            </div>
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 12px 0;" />
            <div style="display: flex; justify-content: space-between; font-size: 16px; color: #1e293b; font-weight: 700;">
              <span>Amount Paid</span>
              <span style="color: #10b981;">₹${Number(amountPaid).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>
      <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
        This is an automatically generated receipt. No signature is required.
      </div>
    </div>
  `
  
  const text = `Hi ${name},\n\nPayment successful! Receipt ID: ${receiptId}. Amount Paid: ₹${amountPaid} for ${monthName} via ${paymentMethod}.`
  
  await sendMail({ to: email, subject: `Payment Receipt - ${receiptId}`, html, text })
}

/**
 * Sends complaint update notification
 */
async function sendComplaintUpdateEmail(email, name, title, category, status, messageText) {
  const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  const html = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 32px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 800;">Complaint Status Update</h1>
        <p style="margin: 6px 0 0 0; font-size: 15px; opacity: 0.9;">Ticket Resolution Tracker</p>
      </div>
      <div style="padding: 32px; background-color: #ffffff;">
        <h2 style="margin-top: 0; color: #1e293b; font-size: 18px;">Hi ${name},</h2>
        <p style="color: #64748b; font-size: 15px; line-height: 1.6;">
          Your complaint ticket has received a status update from the hostel administration.
        </p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Title:</strong> ${title}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Category:</strong> ${category}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px;">
            <strong>New Status:</strong> 
            <span style="font-weight: 700; text-transform: uppercase; color: ${status === 'resolved' ? '#10b981' : '#f59e0b'};">
              ${status}
            </span>
          </p>
          ${messageText ? `
            <p style="margin: 12px 0 0 0; font-size: 14px; border-top: 1px dashed #cbd5e1; padding-top: 12px; color: #475569; font-style: italic;">
              <strong>Admin Note:</strong> "${messageText}"
            </p>
          ` : ''}
        </div>

        <a href="${loginUrl}/login" style="display: block; width: 100%; text-align: center; background-color: #3b82f6; color: white; padding: 12px 0; border-radius: 8px; font-weight: 700; text-decoration: none;">View Complaint in Portal</a>
      </div>
    </div>
  `
  
  const text = `Hi ${name},\n\nYour complaint "${title}" status has been updated to "${status}". Log in to view details.`
  
  await sendMail({ to: email, subject: `Complaint Ticket Update - [${status}]`, html, text })
}

/**
 * Sends a notification of a new announcement
 */
async function sendAnnouncementEmail(email, name, title, message) {
  const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  const html = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); padding: 32px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 800;">New Hostel Announcement</h1>
        <p style="margin: 6px 0 0 0; font-size: 15px; opacity: 0.9;">Notification Center</p>
      </div>
      <div style="padding: 32px; background-color: #ffffff;">
        <h2 style="margin-top: 0; color: #1e293b; font-size: 18px;">Hi ${name},</h2>
        <p style="color: #64748b; font-size: 15px; line-height: 1.6;">
          A new official announcement has been posted by the hostel management:
        </p>
        
        <div style="background-color: #fdf4ff; border: 1px solid #fae8ff; padding: 20px; border-radius: 12px; margin: 24px 0;">
          <h3 style="margin-top: 0; margin-bottom: 8px; color: #701a75; font-size: 16px; font-weight: 700;">📢 ${title}</h3>
          <p style="margin: 0; font-size: 14px; color: #4a044e; line-height: 1.5; white-space: pre-line;">${message}</p>
        </div>

        <a href="${loginUrl}/login" style="display: block; width: 100%; text-align: center; background-color: #7c3aed; color: white; padding: 12px 0; border-radius: 8px; font-weight: 700; text-decoration: none;">Log In to View More Details</a>
      </div>
    </div>
  `
  
  const text = `New Announcement: ${title}\n\n${message}`
  
  await sendMail({ to: email, subject: `New Announcement: ${title}`, html, text })
}

module.exports = {
  sendWelcomeEmail,
  sendFeeReminderEmail,
  sendPaymentReceiptEmail,
  sendComplaintUpdateEmail,
  sendAnnouncementEmail
}
