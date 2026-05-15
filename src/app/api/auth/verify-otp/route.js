import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { signToken } from '@/lib/auth';

global.otpStore = global.otpStore || {};

export async function POST(request) {
  try {
    await dbConnect();
    const { type, value, otp, name, purpose } = await request.json();
    const key = `${type}:${value.toLowerCase()}`;
    const stored = global.otpStore[key];

    if (!stored) return NextResponse.json({ success: false, message: 'OTP not found. Please request a new one.' }, { status: 400 });
    if (Date.now() > stored.expires) {
      delete global.otpStore[key];
      return NextResponse.json({ success: false, message: 'OTP expired. Please request a new one.' }, { status: 400 });
    }
    if (stored.otp !== otp) return NextResponse.json({ success: false, message: 'Wrong OTP. Please try again.' }, { status: 400 });

    delete global.otpStore[key];

    if (purpose === 'login') {
      // Find or create user
      let user;
      if (type === 'email') {
        user = await User.findOne({ email: value.toLowerCase() });
        if (!user) {
          user = await User.create({ name: name || value.split('@')[0], email: value.toLowerCase(), password: Math.random().toString(36), phone: '' });
        }
      } else {
        user = await User.findOne({ phone: value });
        if (!user) {
          user = await User.create({ name: name || `User${value.slice(-4)}`, email: `${value}@phone.lmart`, password: Math.random().toString(36), phone: value });
        }
      }
      const token = signToken({ id: user._id, email: user.email, role: user.role });
      return NextResponse.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone } });
    }

    return NextResponse.json({ success: true, message: 'OTP verified', verified: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
