import { NextResponse } from 'next/server';

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

global.otpStore = global.otpStore || {};

function otpHtml(otp) {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f8f4f9;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:40px 16px;">
<table width="500" cellpadding="0" cellspacing="0" style="border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(45,30,47,0.18);">
  <tr><td style="background:linear-gradient(135deg,#2D1E2F,#4E2A4F);padding:30px;text-align:center;">
    <h1 style="color:#D4AF6A;margin:0;font-size:26px;font-family:Georgia,serif;">🛒 L MART</h1>
    <p style="color:rgba(255,255,255,0.5);font-size:11px;margin:6px 0 0;letter-spacing:2px;text-transform:uppercase;">Global Growth · Local Fresh</p>
  </td></tr>
  <tr><td style="background:#ffffff;padding:40px;text-align:center;">
    <p style="color:#333;font-size:16px;margin:0 0 8px;font-weight:600;">Your Verification OTP</p>
    <p style="color:#aaa;font-size:13px;margin:0 0 28px;">Enter this code to verify your account</p>
    <table align="center" cellpadding="0" cellspacing="0">
    <tr><td style="background:linear-gradient(135deg,#2D1E2F,#4E2A4F);border-radius:12px;padding:20px 44px;">
      <span style="color:#D4AF6A;font-size:44px;font-weight:900;letter-spacing:16px;font-family:'Courier New',monospace;">${otp}</span>
    </td></tr></table>
    <table align="center" cellpadding="12" style="margin-top:24px;">
    <tr>
      <td align="center" width="120"><div style="font-size:22px;">⏱</div><p style="color:#888;font-size:12px;margin:4px 0 0;">Valid 10 min</p></td>
      <td align="center" width="120"><div style="font-size:22px;">🔒</div><p style="color:#888;font-size:12px;margin:4px 0 0;">Do not share</p></td>
    </tr></table>
  </td></tr>
  <tr><td style="background:#f8f4f9;padding:16px;text-align:center;">
    <p style="color:#7B4F7C;font-size:11px;margin:0;">L MART • Agadalalanka, Eluru District, Andhra Pradesh 534427</p>
    <p style="color:#aaa;font-size:10px;margin:4px 0 0;">If you didn't request this OTP, please ignore this email.</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

async function sendEmail(to, otp) {
  const errors = [];

  // 1. Try Brevo (free 300/day — best option)
  try {
    const key = process.env.BREVO_API_KEY?.trim();
    if (key) {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: { name: 'L MART', email: process.env.EMAIL_USER || 'supportlmart@gmail.com' },
          to: [{ email: to }],
          subject: 'L MART – Your Verification OTP 🔐',
          htmlContent: otpHtml(otp),
          textContent: `Your L MART OTP is ${otp}. Valid for 10 minutes. Do not share.`,
        }),
      });
      const d = await res.json();
      if (res.ok) { console.log('[OTP] ✅ Brevo sent to', to); return 'brevo'; }
      errors.push('Brevo: ' + (d.message || res.status));
    }
  } catch (e) { errors.push('Brevo: ' + e.message.substring(0, 50)); }

  // 2. Try Gmail nodemailer (fallback)
  try {
    const user = process.env.EMAIL_USER?.trim();
    const pass = (process.env.EMAIL_PASS || '').replace(/\s/g, '');
    if (user && pass) {
      const nodemailer = (await import('nodemailer')).default;
      const t = nodemailer.createTransport({
        host: 'smtp.gmail.com', port: 587, secure: false,
        auth: { user, pass }, tls: { rejectUnauthorized: false },
      });
      await t.sendMail({
        from: `"L MART" <${user}>`, to,
        subject: 'L MART – Your Verification OTP 🔐',
        html: otpHtml(otp),
        text: `Your L MART OTP is ${otp}. Valid for 10 minutes. Do not share.`,
      });
      console.log('[OTP] ✅ Gmail sent to', to);
      return 'gmail';
    }
  } catch (e) { errors.push('Gmail: ' + e.message.substring(0, 50)); }

  throw new Error('All email providers failed: ' + errors.join(' | '));
}

export async function POST(request) {
  try {
    const { type, value } = await request.json();
    if (!value) return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });

    // Only email OTP supported
    const email = value.trim().toLowerCase();
    if (!email.includes('@')) {
      return NextResponse.json({ success: false, message: 'Please enter a valid email address' }, { status: 400 });
    }

    const otp = generateOTP();
    const key = `email:${email}`;
    global.otpStore[key] = { otp, expires: Date.now() + 10 * 60 * 1000 };

    console.log(`\n=== L MART EMAIL OTP === ${email} → ${otp} ===\n`);

    try {
      const provider = await sendEmail(email, otp);
      return NextResponse.json({
        success: true,
        message: `✅ OTP sent to ${value}! Check your inbox and spam folder.`,
        provider,
      });
    } catch (emailErr) {
      console.error('[OTP Email Error]', emailErr.message);
      return NextResponse.json({
        success: false,
        message: `Failed to send OTP email. Please check your BREVO_API_KEY or EMAIL_PASS in .env.local`,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[OTP Error]', error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
