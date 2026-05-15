import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await authenticate(request);
    if (!user) return NextResponse.json({ success: false, message: 'Please login' }, { status: 401 });
    const { amount } = await request.json();
    if (!amount || amount <= 0) return NextResponse.json({ success: false, message: 'Invalid amount' }, { status: 400 });
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return NextResponse.json({ success: false, message: 'Razorpay not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local' }, { status: 500 });
    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Math.round(amount * 100), currency: 'INR', receipt: `lmart_${Date.now()}` }),
    });
    const order = await res.json();
    if (!res.ok) return NextResponse.json({ success: false, message: order.error?.description || 'Failed' }, { status: 500 });
    return NextResponse.json({ success: true, order, keyId });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
