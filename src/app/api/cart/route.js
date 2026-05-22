import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Cart } from '@/models/Cart';
import Product from '@/models/Product';
import { authenticate } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await authenticate(request);
    if (!user) return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    await dbConnect();
    const cart = await Cart.findOne({ user: user.id }).populate('items.product', 'name images price mrp stock isActive brand category');
    return NextResponse.json({ success: true, cart: cart || { items: [] } });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await authenticate(request);
    if (!user) return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    await dbConnect();
    const { productId, quantity = 1, customPrice = null } = await request.json();

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }
    if (product.stock < quantity) {
      return NextResponse.json({ success: false, message: 'Insufficient stock' }, { status: 400 });
    }

    // Use customPrice if provided (for kg/litre/metre units), else use product price
    const itemPrice = customPrice && customPrice > 0 ? customPrice : product.price;

    let cart = await Cart.findOne({ user: user.id });
    if (!cart) cart = new Cart({ user: user.id, items: [] });

    const existingIdx = cart.items.findIndex((i) => i.product.toString() === productId);
    if (existingIdx > -1) {
      cart.items[existingIdx].quantity += quantity;
      cart.items[existingIdx].price = itemPrice; // update price if unit changed
    } else {
      cart.items.push({ product: productId, quantity, price: itemPrice });
    }
    await cart.save();
    await cart.populate('items.product', 'name images price stock');
    return NextResponse.json({ success: true, cart });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await authenticate(request);
    if (!user) return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    await dbConnect();
    const { productId, quantity } = await request.json();

    const cart = await Cart.findOne({ user: user.id });
    if (!cart) return NextResponse.json({ success: false, message: 'Cart not found' }, { status: 404 });

    const idx = cart.items.findIndex((i) => i.product.toString() === productId);
    if (idx === -1) return NextResponse.json({ success: false, message: 'Item not in cart' }, { status: 404 });

    if (quantity <= 0) {
      cart.items.splice(idx, 1);
    } else {
      cart.items[idx].quantity = quantity;
    }
    await cart.save();
    await cart.populate('items.product', 'name images price stock');
    return NextResponse.json({ success: true, cart });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await authenticate(request);
    if (!user) return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    const cart = await Cart.findOne({ user: user.id });
    if (!cart) return NextResponse.json({ success: true, message: 'Cart already empty' });

    if (productId) {
      cart.items = cart.items.filter((i) => i.product.toString() !== productId);
    } else {
      cart.items = [];
    }
    await cart.save();
    return NextResponse.json({ success: true, message: 'Item removed', cart });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
