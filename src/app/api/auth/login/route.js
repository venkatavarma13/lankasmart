import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    await dbConnect();
    const { email, password } = await request.json();
    if (!email || !password) return NextResponse.json({ success: false, message: 'Email and password required' }, { status: 400 });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
    const token = signToken({ id: user._id, email: user.email, role: user.role });
    return NextResponse.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone } });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
