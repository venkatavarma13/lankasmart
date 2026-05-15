import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    await dbConnect();
    const { name, email, password, phone } = await request.json();
    if (!name || !email || !password) return NextResponse.json({ success: false, message: 'Name, email and password required' }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ success: false, message: 'Password must be at least 6 characters' }, { status: 400 });
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return NextResponse.json({ success: false, message: 'Email already registered' }, { status: 400 });
    const user = await User.create({ name, email: email.toLowerCase(), password, phone });
    const token = signToken({ id: user._id, email: user.email, role: user.role });
    return NextResponse.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
