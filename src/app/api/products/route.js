import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Product from '@/models/Product';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';
    const featured = searchParams.get('featured');
    const trending = searchParams.get('trending');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    const query = { isActive: { $ne: false } }; // show all products even if isActive not set
    if (category && category !== 'All') query.category = category;
    if (featured === 'true') query.featured = true;
    if (trending === 'true') query.trending = true;
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const sortObj = {};
    if (sort === 'price') sortObj.price = order === 'asc' ? 1 : -1;
    else if (sort === 'rating') sortObj.ratings = -1;
    else if (sort === 'popular') sortObj.numReviews = -1;
    else sortObj.createdAt = -1;

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find(query).select("name brand category price mrp stock unit images ratings numReviews featured trending").sort(sortObj).skip(skip).limit(limit).lean(),
      Product.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[Products API Error]', error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
