import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Order from '@/models/Order';
import { Cart } from '@/models/Cart';
import Product from '@/models/Product';
import { authenticate } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await authenticate(request);
    if (!user) return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    await dbConnect();
    const orders = await Order.find({ user: user.id })
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 });
    return NextResponse.json({ success: true, orders });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await authenticate(request);
    if (!user) return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    await dbConnect();
    const { shippingAddress, paymentMethod, items, itemsPrice, shippingPrice, totalAmount } = await request.json();

    if (!shippingAddress || !paymentMethod || !items?.length) {
      return NextResponse.json({ success: false, message: 'Missing required order fields' }, { status: 400 });
    }

    // Validate stock for each item
    for (const item of items) {
      if (!item.product) {
        return NextResponse.json(
          { success: false, message: `Invalid product in cart. Please refresh and try again.` },
          { status: 400 }
        );
      }
      const productId = item.product?._id || item.product;
      const product = await Product.findById(productId);
      if (!product) {
        return NextResponse.json(
          { success: false, message: `Product "${item.name}" not found` },
          { status: 400 }
        );
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { success: false, message: `Insufficient stock for "${product.name}". Only ${product.stock} left.` },
          { status: 400 }
        );
      }
    }

    const order = await Order.create({
      user: user.id,
      items,
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Pending',
      itemsPrice,
      shippingPrice,
      totalAmount,
    });

    // Deduct stock — ensure stock is numeric first
    for (const item of items) {
      const productId = item.product?._id || item.product;
      // First ensure stock field is numeric, then deduct
      await Product.findByIdAndUpdate(productId, [
        { $set: { stock: { $subtract: [{ $toInt: '$stock' }, item.quantity] } } }
      ]);
    }

    // Clear cart
    await Cart.findOneAndUpdate({ user: user.id }, { items: [] });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
