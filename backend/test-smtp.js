const nodemailer = require('nodemailer');
require('dotenv').config();

async function testSMTP() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.error('SMTP Error: SMTP_USER and SMTP_PASS environment variables must be configured.');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });


  try {
    console.log('Verifying connection...');
    await transporter.verify();
    console.log('Connection verified successfully!');

    const info = await transporter.sendMail({
      from: user,
      to: user, // Send to self
      subject: 'Test Email',
      text: 'This is a test email.'
    });

    console.log('Email sent successfully!', info.messageId);
  } catch (err) {
    console.error('SMTP Error:', err);
  }
}

testSMTP();
