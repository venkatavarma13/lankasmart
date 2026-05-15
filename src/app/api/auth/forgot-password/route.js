import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

global.otpStore = global.otpStore || {};

export async function POST(request) {
  try {
    await dbConnect();
    const { email, otp, newPassword } = await request.json();
    if (!email) return NextResponse.json({ success: false, message: 'Email required' }, { status: 400 });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return NextResponse.json({ success: false, message: 'No account found with this email' }, { status: 404 });

    if (otp && newPassword) {
      const key = `email:${email.toLowerCase()}`;
      const stored = global.otpStore[key];
      if (!stored || Date.now() > stored.expires) return NextResponse.json({ success: false, message: 'OTP expired. Please request a new OTP.' }, { status: 400 });
      if (stored.otp !== otp) return NextResponse.json({ success: false, message: 'Wrong OTP. Please check and try again.' }, { status: 400 });
      delete global.otpStore[key];

      // Hash password here and use updateOne to BYPASS the pre-save hook
      // (pre-save hook would double-hash the password causing login failure)
      const hashed = await bcrypt.hash(newPassword, 12);
      await User.updateOne(
        { email: email.toLowerCase() },
        { $set: { password: hashed } }
      );
      return NextResponse.json({ success: true, message: '✅ Password reset successfully! You can now login.' });
    }

    return NextResponse.json({ success: true, message: 'User found' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
