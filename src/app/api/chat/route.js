import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { messages, systemContext } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ success: false, message: 'Invalid messages' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Fallback response if no API key configured
      return NextResponse.json({
        success: true,
        reply: getFallbackReply(messages[messages.length - 1]?.content || ''),
      });
    }

    // Format messages for Claude API
    const formattedMessages = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({
        role: m.role,
        content: m.content,
      }));

    // Ensure first message is from user
    const userMessages = formattedMessages.filter(m => m.role === 'user');
    if (userMessages.length === 0) {
      return NextResponse.json({
        success: true,
        reply: '👋 Hello! How can I help you with your L MART shopping today?',
      });
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
        max_tokens: 400,
        system: systemContext || 'You are a helpful customer support assistant for L MART, a grocery and general store selling fresh fruits, vegetables, dairy, snacks, stationery, home needs and more.',
        messages: formattedMessages,
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error('Claude API error:', errData);
      return NextResponse.json({
        success: true,
        reply: getFallbackReply(messages[messages.length - 1]?.content || ''),
      });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || 'Sorry, I could not get a response. Please try again.';

    return NextResponse.json({ success: true, reply });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({
      success: true,
      reply: '😕 I\'m having a connection issue. Please contact us directly:\n📞 +91 94931 63557\n✉️ supportlmart@gmail.com',
    });
  }
}

// Smart fallback replies when no API key is set
function getFallbackReply(userMessage) {
  const msg = userMessage.toLowerCase();

  if (msg.includes('deliver') || msg.includes('shipping')) {
    return '🚚 Delivery takes 3-5 business days. Free delivery on orders above ₹999! Express delivery available in Vijayawada.';
  }
  if (msg.includes('return') || msg.includes('refund')) {
    return '↩️ We offer 10-day hassle-free returns! Contact us on WhatsApp or email for quick processing.';
  }
  if (msg.includes('payment') || msg.includes('cod') || msg.includes('pay')) {
    return '💵 We accept Cash on Delivery (COD). Pay when your order arrives at your door — no online payment needed!';
  }
  if (msg.includes('track') || msg.includes('order status')) {
    return '📦 To track your order, go to My Orders page after logging in. You can see status: Placed → Packed → Shipped → Delivered.';
  }
  if (msg.includes('grocery') || msg.includes('pachari') || msg.includes('rice') || msg.includes('dal')) {
    return '🌾 We have a wide range of Pachari & Grocery Items! Rice, dal, spices and more at best prices.';
  }
  if (msg.includes('fruit')) {
    return '🍎 We have Fresh Fruits delivered daily! Apples, bananas, mangoes and more.';
  }
  if (msg.includes('vegetable') || msg.includes('veggie')) {
    return '🥦 We have Fresh Vegetables delivered daily! Tomatoes, onions, leafy greens and more.';
  }
  if (msg.includes('milk') || msg.includes('curd') || msg.includes('dairy')) {
    return '🥛 We carry Arogya Milk Products and Hatsun Milk & Curd — fresh and quality guaranteed!';
  }
  if (msg.includes('ice cream') || msg.includes('arun')) {
    return '🍦 We have Arun Ice Cream available! Various flavors for the whole family.';
  }
  if (msg.includes('snack') || msg.includes('biscuit') || msg.includes('chocolate')) {
    return '🍫 We have Chocolates & Biscuits and Snacks Items at great prices!';
  }
  if (msg.includes('toy') || msg.includes('children') || msg.includes('kids')) {
    return '🧸 We have a great range of Children\'s Toys! Safe and fun for kids of all ages.';
  }
  if (msg.includes('purifier') || msg.includes('water')) {
    return '💧 We have Water Purifiers to keep your family healthy. Quality brands at best prices!';
  }
  if (msg.includes('medical') || msg.includes('surgical')) {
    return '💊 We carry Surgical / Medical Items. Contact us for specific requirements.';
  }
  if (msg.includes('price') || msg.includes('cost') || msg.includes('cheap') || msg.includes('offer')) {
    return '🏷️ We have great prices with up to 57% off! Check our products page for current prices and offers. All products have free delivery above ₹999.';
  }
  if (msg.includes('warranty') || msg.includes('genuine')) {
    return '✅ All our products are 100% genuine with manufacturer warranty! We source directly from authorized distributors.';
  }
  if (msg.includes('contact') || msg.includes('phone') || msg.includes('whatsapp')) {
    return '📞 You can reach us at:\n• Phone: +91 94931 63557\n• WhatsApp: +91 94931 63557\n• Email: supportlmart@gmail.com\n• Store: Agadalalanka, Eluru District';
  }
  if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey')) {
    return '👋 Hello! Welcome to L MART! I can help you with products, orders, delivery, returns and more. What are you looking for today?';
  }
  if (msg.includes('product') || msg.includes('sell') || msg.includes('available')) {
    return '🛒 We sell:\n🌾 Groceries & Pachari\n🍎 Fresh Fruits & Vegetables\n🥛 Milk & Dairy\n🍫 Snacks & Chocolates\n🎁 Gift & Fancy Items\n💊 Medical Items\n\nAnd much more — all at best prices!';
  }
  return '🤔 I\'m not sure about that specific query. Please contact us directly:\n📞 +91 94931 63557\n💬 WhatsApp: +91 94931 63557\nWe\'re happy to help!';
}
