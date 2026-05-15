import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Order from '@/models/Order';
import { authenticate } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    await dbConnect();
    const { status, note } = await request.json();
    const order = await Order.findById(params.id);
    if (!order) return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    order.status = status;
    order.statusHistory.push({ status, note: note || '', time: new Date() });
    if (status === 'Delivered') order.deliveredAt = new Date();
    await order.save();
    return NextResponse.json({ success: true, order });
  } catch (error) { return NextResponse.json({ success: false, message: error.message }, { status: 500 }); }
}
