const crypto = require("crypto");
const nodemailer = require("nodemailer");

let mailTransporter;
const emailVerifications = new Map();

function createVerificationCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function getMailTransporter() {
  if (mailTransporter) {
    return mailTransporter;
  }

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  mailTransporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user,
      pass,
    },
  });

  return mailTransporter;
}

async function sendVerificationEmail(email, code) {
  const transporter = getMailTransporter();

  if (!transporter) {
    console.log(`[개발용 이메일 인증번호] ${email}: ${code}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: "동아리픽 회원가입 인증번호",
    text: `동아리픽 회원가입 인증번호는 ${code} 입니다. 5분 안에 입력해주세요.`,
  });
}

function setEmailVerification(email, code) {
  emailVerifications.set(email, {
    code,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });
}

function getEmailVerification(email) {
  return emailVerifications.get(email);
}

function deleteEmailVerification(email) {
  emailVerifications.delete(email);
}

module.exports = {
  createVerificationCode,
  sendVerificationEmail,
  setEmailVerification,
  getEmailVerification,
  deleteEmailVerification,
};
