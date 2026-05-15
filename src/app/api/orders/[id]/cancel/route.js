import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { authenticate } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    await dbConnect();
    const { reason } = await request.json();

    // Find order belonging to this user
    const order = await Order.findOne({ _id: params.id, user: user.id });
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    // Only allow cancel if Placed or Confirmed
    if (!['Placed', 'Confirmed'].includes(order.status)) {
      return NextResponse.json({
        success: false,
        message: `Cannot cancel order. Order is already ${order.status}.`
      }, { status: 400 });
    }

    // Restore stock for each item
    for (const item of order.items) {
      const productId = item.product?._id || item.product;
      if (productId) {
        await Product.findByIdAndUpdate(productId, [
          { $set: { stock: { $add: [{ $toInt: '$stock' }, item.quantity] } } }
        ]);
      }
    }

    // Update order status to Cancelled
    order.status = 'Cancelled';
    order.cancelReason = reason || 'Cancelled by customer';
    order.statusHistory.push({
      status: 'Cancelled',
      timestamp: new Date(),
      note: reason || 'Cancelled by customer',
    });
    await order.save();

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      order,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
