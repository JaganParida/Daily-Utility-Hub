const nodemailer = require('nodemailer');

async function testSMTP() {
  const user = 'jaganparida39064@gmail.com';
  const pass = 'oexrwsbocfdhbftx';

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
