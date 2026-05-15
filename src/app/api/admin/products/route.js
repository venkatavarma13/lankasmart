import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Product from '@/models/Product';
import { authenticate } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const search = searchParams.get('search') || '';
    const query = search ? { $or: [{ name: { $regex: search, $options: 'i' } }, { category: { $regex: search, $options: 'i' } }] } : {};
    const [products, total] = await Promise.all([Product.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), Product.countDocuments(query)]);
    return NextResponse.json({ success: true, products, total, pages: Math.ceil(total / limit) });
  } catch (error) { return NextResponse.json({ success: false, message: error.message }, { status: 500 }); }
}

export async function POST(request) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    await dbConnect();
    const body = await request.json();
    const product = await Product.create(body);
    return NextResponse.json({ success: true, product });
  } catch (error) { return NextResponse.json({ success: false, message: error.message }, { status: 500 }); }
}

export async function PUT(request) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();
    const product = await Product.findByIdAndUpdate(id, body, { new: true });
    return NextResponse.json({ success: true, product });
  } catch (error) { return NextResponse.json({ success: false, message: error.message }, { status: 500 }); }
}

export async function DELETE(request) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    await Product.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) { return NextResponse.json({ success: false, message: error.message }, { status: 500 }); }
}
