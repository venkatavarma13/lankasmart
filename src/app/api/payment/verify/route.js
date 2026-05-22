import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { authenticate } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await authenticate(request);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    if (expected !== razorpay_signature) return NextResponse.json({ success: false, message: 'Payment verification failed' }, { status: 400 });
    return NextResponse.json({ success: true, paymentId: razorpay_payment_id });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
