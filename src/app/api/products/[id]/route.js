import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Product from '@/models/Product';

export async function GET(req, context) {
  try {
    await dbConnect();

    const params = await context.params;
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'No ID provided' },
        { status: 400 }
      );
    }

    const product = await Product.findById(id).lean();

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, message: 'Server Error' },
      { status: 500 }
    );
  }
}