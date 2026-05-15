import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Product from '@/models/Product';
import Order from '@/models/Order';
import User from '@/models/User';
import { authenticate } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    await dbConnect();
    const [totalOrders, totalProducts, totalUsers, pendingOrders, revenueData, recentOrders, lowStockProducts, categoryStats] = await Promise.all([
      Order.countDocuments(),
      Product.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'user' }),
      Order.countDocuments({ status: { $in: ['Placed', 'Confirmed', 'Packed'] } }),
      Order.aggregate([{ $match: { status: { $ne: 'Cancelled' } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name').lean(),
      Product.find({ stock: { $lte: 5 }, isActive: true }).sort({ stock: 1 }).limit(8).lean(),
      Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    ]);
    return NextResponse.json({ success: true, stats: { totalOrders, totalProducts, totalUsers, pendingOrders, totalRevenue: revenueData[0]?.total || 0, recentOrders, lowStockProducts, categoryStats } });
  } catch (error) { return NextResponse.json({ success: false, message: error.message }, { status: 500 }); }
}
