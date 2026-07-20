const nodemailer = require('nodemailer');
const dns = require('dns');

// Force Node to use IPv4 for DNS resolution.
// This fixes 'ENETUNREACH' for IPv6 connections on cloud hosts like Render.
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

let transporter;

const getTransporter = async () => {
  if (transporter) return transporter;

  const user = process.env.SMTP_USER || 'jaganparida39064@gmail.com';
  const pass = process.env.SMTP_PASS || 'oexrwsbocfdhbftx';
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const service = process.env.SMTP_SERVICE || 'gmail';

  if (host) {
    transporter = nodemailer.createTransport({
      host,
      port: parseInt(port),
      secure: parseInt(port) === 465,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    });
    console.log('Using configured host SMTP transporter for emails.');
  } else {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      tls: {
        rejectUnauthorized: false
      },
      family: 4
    });
    console.log(`Using explicit smtp.gmail.com host for emails (${user}).`);

  }

  return transporter;
};

const sendOtpEmail = async (email, otp) => {
  try {
    const activeTransporter = await getTransporter();
    
    const fromEmail = process.env.SMTP_USER || 'jaganparida39064@gmail.com';
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

    console.log(`[Email Sent] Message ID: ${info.messageId} to ${email}`);
    return true;
  } catch (error) {
    console.error('Nodemailer send error:', error);
    throw error;
  }
};

module.exports = { sendOtpEmail };
