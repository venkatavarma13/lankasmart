import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Order from '@/models/Order';
import { authenticate } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const query = status && status !== 'All' ? { status } : {};
    const [orders, total] = await Promise.all([Order.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('user', 'name email phone').lean(), Order.countDocuments(query)]);
    return NextResponse.json({ success: true, orders, total, pages: Math.ceil(total / limit) });
  } catch (error) { return NextResponse.json({ success: false, message: error.message }, { status: 500 }); }
}
