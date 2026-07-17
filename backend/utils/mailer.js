const nodemailer = require('nodemailer');

let transporter;

const getTransporter = async () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    if (host) {
      transporter = nodemailer.createTransport({
        host,
        port: parseInt(port),
        secure: port == 465,
        auth: { user, pass }
      });
      console.log('Using configured SMTP transporter for emails.');
    } else {
      const service = process.env.SMTP_SERVICE || 'gmail';
      transporter = nodemailer.createTransport({
        service,
        auth: { user, pass }
      });
      console.log(`Using inferred SMTP service (${service}) for emails.`);
    }
  } else {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SMTP configuration is missing. Please configure SMTP_USER and SMTP_PASS in your hosting environment variables.');
    }

    // Ethereal fallback for zero-configuration testing
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log('--------------------------------------------------');
    console.log('SMTP config not found in .env. Using Ethereal Email.');
    console.log(`Ethereal Test User: ${testAccount.user}`);
    console.log(`Ethereal Test Pass: ${testAccount.pass}`);
    console.log('--------------------------------------------------');
  }

  return transporter;
};

const sendOtpEmail = async (email, otp) => {
  try {
    const activeTransporter = await getTransporter();
    
    const fromEmail = process.env.SMTP_USER || 'no-reply@dailyutilityhub.com';
    const info = await activeTransporter.sendMail({
      from: `"Daily Utility Hub" <${fromEmail}>`,
      to: email,
      subject: 'Your Verification Code - Daily Utility Hub',
      text: `Your 6-digit verification OTP code is: ${otp}. It will expire in 3 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #2563eb; text-align: center;">Daily Utility Hub</h2>
          <p>Hello,</p>
          <p>Thank you for using Daily Utility Hub. Please use the following 6-digit One-Time Password (OTP) to authorize your session:</p>
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; border-radius: 4px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code is valid for <strong>3 minutes</strong>. If you did not request this code, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280; text-align: center;">Daily Utility Hub &copy; ${new Date().getFullYear()}</p>
        </div>
      `
    });

    if (info.envelope && info.envelope.to) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`[Email Sent] Preview URL: ${previewUrl}`);
      }
    }
    return true;
  } catch (error) {
    console.error('Nodemailer send error:', error);
    throw error;
  }
};

module.exports = { sendOtpEmail };
