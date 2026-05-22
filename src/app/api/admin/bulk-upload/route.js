import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Product from '@/models/Product';
import { authenticate } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { products } = await request.json();

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ success: false, message: 'No products provided' }, { status: 400 });
    }

    let successCount = 0;
    let failCount = 0;
    const errors = [];

    for (const row of products) {
      try {
        const productData = {
          name: String(row.name || '').trim(),
          brand: String(row.brand || '').trim(),
          category: String(row.category || 'Pachari / Grocery Items').trim(),
          price: parseFloat(row.price) || 0,
          mrp: parseFloat(row.mrp) || parseFloat(row.price) || 0,
          stock: parseInt(row.stock) || 0,
          description: String(row.description || '').trim(),
          unit: String(row.unit || 'piece').trim(),
          featured: String(row.featured || '').toLowerCase() === 'true',
          trending: String(row.trending || '').toLowerCase() === 'true',
          isActive: true,
          images: [],
          specifications: [],
        };

        if (!productData.name) { errors.push(`Row skipped: name is required`); failCount++; continue; }
        if (productData.price <= 0) { errors.push(`${productData.name}: invalid price`); failCount++; continue; }

        await Product.create(productData);
        successCount++;
      } catch (err) {
        errors.push(`${row.name || 'Unknown'}: ${err.message}`);
        failCount++;
      }
    }

    return NextResponse.json({
      success: true,
      successCount,
      failCount,
      errors: errors.slice(0, 10),
      message: `${successCount} products uploaded, ${failCount} failed`,
    });
  } catch (error) {
    console.error('[Bulk Upload Error]', error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
