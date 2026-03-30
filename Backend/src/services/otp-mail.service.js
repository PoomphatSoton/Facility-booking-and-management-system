const nodemailer = require('nodemailer');

const hasSmtpConfig = () =>
  Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM
  );

const createTransporter = () => {
  if (!hasSmtpConfig()) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendOtpEmail = async ({ email, otp }) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.log(`[OTP:FALLBACK] email=${email} otp=${otp}`);
    return {
      channel: 'console',
      simulated: true,
      message: 'SMTP is not configured. OTP was written to the server console.',
    };
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Your OTP code',
    text: `Your OTP is ${otp}`,
    html: `<p>Your OTP is <strong>${otp}</strong></p>`,
  });

  return {
    channel: 'email',
    simulated: false,
    message: 'OTP sent to email',
  };
};

module.exports = {
  sendOtpEmail,
};