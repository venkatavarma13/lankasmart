import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Product from '@/models/Product';
import { authenticate } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    await dbConnect();
    const products = await Product.find({ 'reviews.0': { $exists: true } }).lean();
    const reviews = [];
    products.forEach(p => p.reviews.forEach(r => reviews.push({ ...r, productId: p._id, productName: p.name })));
    return NextResponse.json({ success: true, reviews });
  } catch (error) { return NextResponse.json({ success: false, message: error.message }, { status: 500 }); }
}

export async function PUT(request) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    await dbConnect();
    const { productId, reviewId, approved } = await request.json();
    await Product.updateOne({ _id: productId, 'reviews._id': reviewId }, { $set: { 'reviews.$.approved': approved } });
    return NextResponse.json({ success: true });
  } catch (error) { return NextResponse.json({ success: false, message: error.message }, { status: 500 }); }
}

export async function DELETE(request) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const reviewId = searchParams.get('reviewId');
    await Product.updateOne({ _id: productId }, { $pull: { reviews: { _id: reviewId } } });
    return NextResponse.json({ success: true });
  } catch (error) { return NextResponse.json({ success: false, message: error.message }, { status: 500 }); }
}
