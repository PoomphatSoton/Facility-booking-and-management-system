const { Resend } = require('resend');

const sendOtpEmail = async ({ email, otp }) => {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: 'Your OTP code',
      html: `<p>Your OTP is <strong>${otp}</strong></p>`,
    });

    return {
      channel: 'email',
      simulated: false,
      message: 'OTP sent to email',
    };
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return {
      channel: 'email',
      simulated: false,
      message: 'Failed to send OTP email',
      error: error.message,
    };
  }
};

module.exports = {
  sendOtpEmail,
};