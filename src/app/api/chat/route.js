import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Product from '@/models/Product';
import Order from '@/models/Order';
import { authenticate } from '@/lib/auth';

// Build dynamic context from DB
async function buildSystemContext(userPayload) {
  let context = `You are the L MART AI Assistant — a friendly, helpful customer support bot for L MART, an online grocery and general store based in Agadalalanka, Eluru District, Andhra Pradesh, India.

Store Info:
- Name: L MART (also called LankaSmart)
- Location: Agadalalanka, Eluru District, AP - 534427
- Phone / WhatsApp: +91 94931 63557
- Email: supportlmart@gmail.com
- Delivery: 3-5 business days | Free delivery on all orders
- Payment: Cash on Delivery (COD) only
- Returns: 10-day hassle-free return policy
- Order statuses: Placed → Confirmed → Packed → Shipped → Delivered

Product Categories: Pachari/Grocery, Fresh Fruits, Fresh Vegetables, Arogya Milk Products, Hatsun Milk & Curd, Arun Ice Cream, Snacks, Chocolates & Biscuits, Stationery, Home Needs, Children's Toys, Water Purifiers, Surgical/Medical Items, Gift & Fancy Items, Tailoring Items, Bike Parts.

Guidelines:
- Be warm, concise, and helpful. Use emojis naturally.
- For product availability/price, say users can check the Products page or search on the site.
- For order issues, ask for their order number if not provided.
- Never make up product prices or stock levels.
- If you cannot help, direct them to WhatsApp (+91 94931 63557) or email.
- Always respond in the same language the user writes in (English or Telugu supported).
- Keep responses under 150 words unless detail is truly needed.`;

  // Add logged-in user context
  if (userPayload?.id) {
    try {
      await dbConnect();
      const orders = await Order.find({ user: userPayload.id })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      if (orders.length > 0) {
        context += `\n\nCurrent User: ${userPayload.name} (logged in)\nRecent Orders:\n`;
        orders.forEach(o => {
          context += `- Order #${o.orderNumber}: ${o.items.length} item(s), ₹${o.totalAmount}, Status: ${o.status}, Date: ${new Date(o.createdAt).toLocaleDateString('en-IN')}\n`;
        });
        context += `\nIf the user asks about their orders, use this information to help them.`;
      } else {
        context += `\n\nCurrent User: ${userPayload.name} (logged in, no orders yet)`;
      }
    } catch (e) {
      // continue without order context
    }
  }

  return context;
}

// Detect if user is asking about a specific product
async function tryProductSearch(userMessage) {
  const msg = userMessage.toLowerCase();
  // Skip if clearly not a product query
  if (msg.includes('order') || msg.includes('deliver') || msg.includes('return') || msg.includes('refund') || msg.includes('payment') || msg.includes('contact') || msg.includes('address')) {
    return null;
  }

  const searchTerms = userMessage.match(/(?:do you have|show me|search for|find|price of|cost of|available|stock of|buy)\s+([^?!.]+)/i);
  const searchQuery = searchTerms?.[1]?.trim() || null;

  if (!searchQuery || searchQuery.length < 2) return null;

  try {
    await dbConnect();
    const products = await Product.find({
      isActive: { $ne: false },
      $or: [
        { name: { $regex: searchQuery, $options: 'i' } },
        { brand: { $regex: searchQuery, $options: 'i' } },
        { category: { $regex: searchQuery, $options: 'i' } },
      ],
    }).select('name brand category price mrp stock unit').limit(5).lean();

    if (products.length > 0) {
      let info = `\n\nLIVE PRODUCT DATA for "${searchQuery}":\n`;
      products.forEach(p => {
        const discount = p.mrp > p.price ? ` (${Math.round((1 - p.price / p.mrp) * 100)}% off MRP ₹${p.mrp})` : '';
        info += `• ${p.name}${p.brand ? ' by ' + p.brand : ''} — ₹${p.price}${discount}, Stock: ${p.stock > 0 ? p.stock + ' ' + p.unit : '⚠️ Out of stock'}\n`;
      });
      info += `\nUse this live data to answer the user's product query accurately.`;
      return info;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

export async function POST(request) {
  try {
    const { messages, user: userPayload } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ success: false, message: 'Invalid messages' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        reply: getFallbackReply(messages[messages.length - 1]?.content || ''),
      });
    }

    const lastUserMsg = messages.filter(m => m.role === 'user').slice(-1)[0]?.content || '';

    // Build system context
    let systemContext = await buildSystemContext(userPayload);

    // Try to inject live product data if relevant
    const productData = await tryProductSearch(lastUserMsg);
    if (productData) systemContext += productData;

    // Format messages
    const formattedMessages = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role, content: m.content }));

    if (formattedMessages.filter(m => m.role === 'user').length === 0) {
      return NextResponse.json({ success: true, reply: '👋 Hello! How can I help you today?' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: systemContext,
        messages: formattedMessages,
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error('Claude API error:', errData);
      return NextResponse.json({
        success: true,
        reply: getFallbackReply(lastUserMsg),
      });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || 'Sorry, I could not get a response. Please try again.';
    return NextResponse.json({ success: true, reply });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({
      success: true,
      reply: '😕 I\'m having a connection issue. Please contact us:\n📞 +91 94931 63557\n✉️ supportlmart@gmail.com',
    });
  }
}

function getFallbackReply(userMessage) {
  const msg = userMessage.toLowerCase();
  if (msg.includes('deliver') || msg.includes('shipping')) return '🚚 Delivery takes 3-5 business days. Free delivery on orders above ₹999!';
  if (msg.includes('return') || msg.includes('refund')) return '↩️ We offer 10-day hassle-free returns! Contact us on WhatsApp for quick processing.';
  if (msg.includes('payment') || msg.includes('cod') || msg.includes('pay')) return '💵 We accept Cash on Delivery (COD). Pay when your order arrives!';
  if (msg.includes('track') || msg.includes('order status')) return '📦 Go to My Orders page after logging in to track your order status.';
  if (msg.includes('price') || msg.includes('cost') || msg.includes('offer')) return '🏷️ We have great prices with up to 57% off! Check our products page for current prices.';
  if (msg.includes('contact') || msg.includes('phone') || msg.includes('whatsapp')) return '📞 Reach us at:\n• Phone/WhatsApp: +91 94931 63557\n• Email: supportlmart@gmail.com';
  if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey')) return '👋 Hello! Welcome to L MART! How can I help you today?';
  if (msg.includes('product') || msg.includes('sell') || msg.includes('available')) return '🛒 We sell Groceries, Fresh Fruits & Vegetables, Dairy, Snacks, Medical Items and much more!';
  return '🤔 For this query, please contact us:\n📞 +91 94931 63557\n💬 WhatsApp: +91 94931 63557\nWe\'re happy to help!';
}
