import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Order from '@/models/Order';
import { authenticate } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const user = await authenticate(request);
    if (!user) return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    await dbConnect();
    const order = await Order.findOne({ _id: params.id, user: user.id }).populate('items.product', 'name images');
    if (!order) return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    return NextResponse.json({ success: true, order });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
