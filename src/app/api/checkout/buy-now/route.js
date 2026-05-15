import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Product from '@/models/Product';
import { authenticate } from '@/lib/auth';

global.buyNowSession = global.buyNowSession || {};

export async function POST(request) {
  try {
    const user = await authenticate(request);
    if (!user) return NextResponse.json({ success: false, message: 'Please login' }, { status: 401 });
    await dbConnect();
    const { productId, quantity, price } = await request.json();
    const product = await Product.findById(productId).lean();
    if (!product) return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    global.buyNowSession[user.id] = {
      item: { product: { ...product, _id: product._id.toString() }, quantity, price: price || product.price },
      expires: Date.now() + 30 * 60 * 1000,
    };
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const user = await authenticate(request);
    if (!user) return NextResponse.json({ success: false }, { status: 401 });
    const session = global.buyNowSession[user.id];
    if (!session || session.expires < Date.now()) return NextResponse.json({ success: false });
    return NextResponse.json({ success: true, item: session.item });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await authenticate(request);
    if (!user) return NextResponse.json({ success: false }, { status: 401 });
    delete global.buyNowSession[user.id];
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
