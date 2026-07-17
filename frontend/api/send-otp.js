import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';

    if (!user || !pass) {
      console.error('[Vercel OTP] Missing SMTP credentials in Vercel Environment Variables');
      return res.status(500).json({ message: 'SMTP credentials not configured on Vercel' });
    }

    // Configure Nodemailer for Gmail over IPv4/Port 465
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      tls: {
        rejectUnauthorized: false
      }
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const mailOptions = {
      from: `"Daily Utility Hub" <${user}>`,
      to: email,
      subject: 'Your Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #2563eb; text-align: center;">Daily Utility Hub</h2>
          <p style="font-size: 16px; color: #333;">Hello,</p>
          <p style="font-size: 16px; color: #333;">Your verification code is:</p>
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #1e293b; letter-spacing: 5px;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #64748b;">This code will expire in 3 minutes. Do not share this code with anyone.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    const token = jwt.sign(
      { email, otp },
      jwtSecret,
      { expiresIn: '3m' }
    );

    res.status(200).json({ success: true, token });
  } catch (error) {
    console.error('[Vercel OTP] Send Error:', error);
    res.status(500).json({ 
      message: 'Failed to send OTP verification email.', 
      error: error.message || String(error) 
    });
  }
}
