'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import axios from 'axios';
import Script from 'next/script';
import { useLang } from '@/lib/LanguageContext';
import StoreLayout from '@/components/layout/StoreLayout';
import { useApp } from '@/lib/AppContext';
import { FiMapPin, FiCheck, FiShield, FiCreditCard } from 'react-icons/fi';
import toast from 'react-hot-toast';

const P = '#4E2A4F';
const PD = '#2D1E2F';
const G = '#D4AF6A';

const PAYMENT_METHODS = [
  { id: 'COD', label: 'Cash on Delivery', sub: 'Pay cash when order arrives', icon: '💵' },
  { id: 'UPI', label: 'UPI Payment', sub: 'PhonePe • GPay • Paytm • Any UPI', icon: '📱' },
  { id: 'CARD', label: 'Debit / Credit Card', sub: 'Visa • Mastercard • RuPay', icon: '💳' },
  { id: 'NETBANKING', label: 'Net Banking', sub: 'All major Indian banks', icon: '🏦' },
];

function CheckoutContent() {
  const { t } = useLang();
  const { cart, user, loading, getAuthHeaders, fetchCart } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isBuyNow = searchParams.get('mode') === 'buynow';

  const [step, setStep] = useState(1);
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [buyNowItem, setBuyNowItem] = useState(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [address, setAddress] = useState({ name:'', phone:'', street:'', city:'', state:'Andhra Pradesh', pincode:'' });

  useEffect(() => {
    if (isBuyNow && user) {
      axios.get('/api/checkout/buy-now', { headers: getAuthHeaders() })
        .then(({ data }) => {
          if (data.success) setBuyNowItem(data.item);
          else { toast.error('Session expired'); router.push('/products'); }
        }).catch(() => { toast.error('Session expired'); router.push('/products'); });
    }
  }, [isBuyNow, user, getAuthHeaders, router]);

  useEffect(() => {
    if (user) {
      const saved = user.addresses?.find(a => a.isDefault) || user.addresses?.[0];
      setAddress({
        name: saved?.name || user.name || '',
        phone: saved?.phone || user.phone || '',
        street: saved?.street || '',
        city: saved?.city || '',
        state: saved?.state || 'Andhra Pradesh',
        pincode: saved?.pincode || '',
      });
    }
  }, [user]);

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [loading, user, router]);

  const cartItems = cart?.items || [];
  const items = isBuyNow ? (buyNowItem ? [buyNowItem] : []) : cartItems;
  const subtotal = items.reduce((s, i) => s + (i.price || 0) * i.quantity, 0);
  const total = subtotal;

  const validate = () => {
    if (!address.name || !address.phone || !address.street || !address.city || !address.pincode) { toast.error('Fill all address fields'); return false; }
    if (!/^[6-9]\d{9}$/.test(address.phone)) { toast.error('Enter valid 10-digit mobile number'); return false; }
    if (!/^\d{6}$/.test(address.pincode)) { toast.error('Enter valid 6-digit pincode'); return false; }
    return true;
  };

  const createOrder = async (razorpayPaymentId = null) => {
    const orderItems = items.map(i => ({
      product: i.product?._id || i.product,
      name: i.product?.name || 'Product',
      image: i.product?.images?.[0]?.url || '',
      price: i.price || i.product?.price || 0,
      quantity: i.quantity,
    }));
    const { data } = await axios.post('/api/orders', {
      shippingAddress: address,
      paymentMethod: razorpayPaymentId ? paymentMethod : 'COD',
      paymentId: razorpayPaymentId,
      isPaid: !!razorpayPaymentId,
      items: orderItems,
      itemsPrice: subtotal,
      shippingPrice: 0,
      totalAmount: total,
      isBuyNow,
    }, { headers: getAuthHeaders() });
    if (!data.success) throw new Error(data.message);
    return data;
  };

  const handleRazorpay = async () => {
    if (!razorpayLoaded && !window.Razorpay) { toast.error('Payment loading, please wait...'); return; }
    setPlacing(true);
    try {
      // Create Razorpay order
      const { data } = await axios.post('/api/payment/create-order', { amount: total }, { headers: getAuthHeaders() });
      if (!data.success) { toast.error(data.message); setPlacing(false); return; }

      const options = {
        key: data.keyId,
        amount: data.order.amount,
        currency: 'INR',
        name: 'L MART',
        description: 'Order Payment',
        image: '/logo.jpg',
        order_id: data.order.id,
        handler: async (response) => {
          try {
            // Verify payment
            const verify = await axios.post('/api/payment/verify', response, { headers: getAuthHeaders() });
            if (verify.data.success) {
              const orderData = await createOrder(verify.data.paymentId);
              if (isBuyNow) await axios.delete('/api/checkout/buy-now', { headers: getAuthHeaders() }).catch(() => {});
              else await fetchCart();
              toast.success('🎉 Payment successful! Order placed.');
              router.push(`/orders?success=1&orderId=${orderData.order._id}`);
            } else {
              toast.error('Payment verification failed. Contact support.');
            }
          } catch (e) {
            toast.error('Order creation failed. Contact support with payment ID: ' + response.razorpay_payment_id);
          }
          setPlacing(false);
        },
        prefill: { name: address.name, contact: address.phone },
        notes: { address: `${address.street}, ${address.city}` },
        theme: { color: P },
        modal: {
          ondismiss: () => { toast.error('Payment cancelled'); setPlacing(false); },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (res) => { toast.error('Payment failed: ' + res.error.description); setPlacing(false); });
      rzp.open();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Payment setup failed');
      setPlacing(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;
    if (paymentMethod !== 'COD') { handleRazorpay(); return; }
    setPlacing(true);
    try {
      const data = await createOrder();
      if (isBuyNow) await axios.delete('/api/checkout/buy-now', { headers: getAuthHeaders() }).catch(() => {});
      else await fetchCart();
      toast.success('🎉 Order placed! We will deliver soon.');
      router.push(`/orders?success=1&orderId=${data.order._id}`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Order failed. Try again.');
    }
    setPlacing(false);
  };

  if (loading || !user) return null;
  if (isBuyNow && !buyNowItem) return <StoreLayout><div style={{ textAlign:'center', padding:80 }}>⏳ Loading...</div></StoreLayout>;
  if (items.length === 0) { router.push(isBuyNow ? '/products' : '/cart'); return null; }

  const inputStyle = { width:'100%', border:'1.5px solid #e2d5e2', borderRadius:8, padding:'10px 14px', fontSize:14, outline:'none', transition:'border 0.2s', color: PD };

  return (
    <StoreLayout>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" onLoad={() => setRazorpayLoaded(true)} strategy="afterInteractive" />
      <div style={{ maxWidth:1000, margin:'0 auto', padding:'16px 16px 40px' }}>
        <h1 style={{ fontSize:20, fontWeight:800, color: PD, marginBottom:20 }}>
          {isBuyNow ? '⚡ Buy Now — Checkout' : '🛒 Checkout'}
        </h1>

        {/* Steps */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:24 }}>
          {[{n:1,label:'Address'},{n:2,label:'Payment'},{n:3,label:'Review'}].map(({n,label},i,arr) => (
            <div key={n} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:30, height:30, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13, background: step >= n ? `linear-gradient(135deg,${P},${PD})` : '#e5dde5', color: step >= n ? 'white' : '#888', boxShadow: step >= n ? '0 3px 10px rgba(78,42,79,0.3)' : 'none', transition:'all 0.3s' }}>
                {step > n ? '✓' : n}
              </div>
              <span style={{ fontSize:13, fontWeight: step >= n ? 600 : 400, color: step >= n ? P : '#999' }}>{label}</span>
              {i < arr.length - 1 && <div style={{ width:40, height:2, background: step > n ? P : '#e5dde5', borderRadius:2, transition:'background 0.3s' }} />}
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr min(320px,35%)', gap:20, alignItems:'start' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* ── Address ── */}
            <div style={{ background:'white', borderRadius:14, boxShadow:'0 2px 12px rgba(45,30,47,0.08)', border:'1px solid rgba(78,42,79,0.08)', overflow:'hidden' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 18px', borderBottom:'1px solid #f5f0f6', background: step > 1 ? '#fdf8fe' : 'white' }}>
                <FiMapPin size={18} color={ step > 1 ? '#22c55e' : P } />
                <span style={{ fontWeight:700, fontSize:15, color: PD }}>Delivery Address</span>
                {step > 1 && <button onClick={() => setStep(1)} style={{ marginLeft:'auto', fontSize:12, color: P, background:'none', border:`1px solid ${P}`, borderRadius:6, padding:'3px 10px', cursor:'pointer', fontWeight:600 }}>Edit</button>}
              </div>
              {step === 1 ? (
                <div style={{ padding:18 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    {[{n:'name',l:'Full Name *',p:'Your full name'},{n:'phone',l:'Mobile *',p:'10-digit number'}].map(f => (
                      <div key={f.n}>
                        <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#555', marginBottom:5 }}>{f.l}</label>
                        <input name={f.n} value={address[f.n]} onChange={e => setAddress(a => ({...a,[e.target.name]:e.target.value}))} placeholder={f.p} style={inputStyle} onFocus={e => e.target.style.borderColor=P} onBlur={e => e.target.style.borderColor='#e2d5e2'} />
                      </div>
                    ))}
                    <div style={{ gridColumn:'1/-1' }}>
                      <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#555', marginBottom:5 }}>Street Address *</label>
                      <input name="street" value={address.street} onChange={e => setAddress(a => ({...a,street:e.target.value}))} placeholder="House no., street, area..." style={inputStyle} onFocus={e => e.target.style.borderColor=P} onBlur={e => e.target.style.borderColor='#e2d5e2'} />
                    </div>
                    {[{n:'city',l:'City *',p:'City'},{n:'state',l:'State',p:'State'},{n:'pincode',l:'Pincode *',p:'6-digit pincode'}].map(f => (
                      <div key={f.n}>
                        <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#555', marginBottom:5 }}>{f.l}</label>
                        <input name={f.n} value={address[f.n]} onChange={e => setAddress(a => ({...a,[e.target.name]:e.target.value}))} placeholder={f.p} style={inputStyle} onFocus={e => e.target.style.borderColor=P} onBlur={e => e.target.style.borderColor='#e2d5e2'} />
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { if(validate()) setStep(2); }}
                    style={{ marginTop:16, background:`linear-gradient(135deg,${P},${PD})`, color:'white', padding:'11px 32px', borderRadius:10, border:'none', cursor:'pointer', fontWeight:700, fontSize:14, boxShadow:`0 4px 14px rgba(78,42,79,0.25)` }}>
                    Continue to Payment →
                  </button>
                </div>
              ) : (
                <div style={{ padding:'12px 18px', fontSize:13 }}>
                  <p style={{ fontWeight:700, color: PD, margin:'0 0 3px' }}>{address.name} • {address.phone}</p>
                  <p style={{ color:'#666', margin:0 }}>{address.street}, {address.city}, {address.state} – {address.pincode}</p>
                </div>
              )}
            </div>

            {/* ── Payment ── */}
            {step >= 2 && (
              <div style={{ background:'white', borderRadius:14, boxShadow:'0 2px 12px rgba(45,30,47,0.08)', border:'1px solid rgba(78,42,79,0.08)', overflow:'hidden' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 18px', borderBottom:'1px solid #f5f0f6' }}>
                  <FiCreditCard size={18} color={P} />
                  <span style={{ fontWeight:700, fontSize:15, color: PD }}>Payment Method</span>
                </div>
                <div style={{ padding:18 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                    {PAYMENT_METHODS.map(m => (
                      <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                        style={{
                          border: paymentMethod === m.id ? `2px solid ${P}` : '2px solid #e5dde5',
                          borderRadius:12, padding:'12px 14px', background: paymentMethod === m.id ? '#faf5fb' : 'white',
                          cursor:'pointer', textAlign:'left', transition:'all 0.2s',
                          boxShadow: paymentMethod === m.id ? `0 4px 14px rgba(78,42,79,0.15)` : 'none',
                        }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                          <span style={{ fontSize:22 }}>{m.icon}</span>
                          {paymentMethod === m.id && <div style={{ marginLeft:'auto', width:18, height:18, borderRadius:'50%', background:`linear-gradient(135deg,${P},${PD})`, display:'flex', alignItems:'center', justifyContent:'center' }}><FiCheck size={11} color="white" /></div>}
                        </div>
                        <p style={{ margin:0, fontSize:13, fontWeight:700, color: PD }}>{m.label}</p>
                        <p style={{ margin:'2px 0 0', fontSize:11, color:'#888' }}>{m.sub}</p>
                      </button>
                    ))}
                  </div>
                  {paymentMethod !== 'COD' && (
                    <div style={{ background:'#f0faf0', border:'1px solid #bbf7d0', borderRadius:10, padding:'10px 14px', fontSize:12, color:'#166534', display:'flex', alignItems:'center', gap:8 }}>
                      🔒 Secure payment powered by Razorpay. Supports PhonePe, GPay, Paytm & all UPI apps.
                    </div>
                  )}
                  <button onClick={() => setStep(3)} style={{ marginTop:14, background:`linear-gradient(135deg,${P},${PD})`, color:'white', padding:'11px 32px', borderRadius:10, border:'none', cursor:'pointer', fontWeight:700, fontSize:14 }}>
                    Review Order →
                  </button>
                </div>
              </div>
            )}

            {/* ── Order Review ── */}
            {step >= 3 && (
              <div style={{ background:'white', borderRadius:14, boxShadow:'0 2px 12px rgba(45,30,47,0.08)', border:'1px solid rgba(78,42,79,0.08)', overflow:'hidden' }}>
                <div style={{ padding:'14px 18px', borderBottom:'1px solid #f5f0f6' }}>
                  <span style={{ fontWeight:700, fontSize:15, color: PD }}>📦 Order Items</span>
                </div>
                <div style={{ padding:18 }}>
                  {items.map((item, i) => {
                    const prod = item.product || {};
                    return (
                      <div key={i} style={{ display:'flex', gap:12, alignItems:'center', padding:'10px 0', borderBottom: i < items.length-1 ? '1px solid #f5f0f6' : 'none' }}>
                        <div style={{ width:52, height:52, borderRadius:10, background:'#f8f4f9', overflow:'hidden', position:'relative', flexShrink:0, border:'1px solid #e5dde5' }}>
                          {prod.images?.[0]?.url ? <Image src={prod.images[0].url} alt={prod.name||''} fill style={{objectFit:'contain',padding:4}} sizes="52px" /> : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>🛒</div>}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ margin:'0 0 3px', fontSize:14, fontWeight:600, color: PD, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{prod.name}</p>
                          <p style={{ margin:0, fontSize:12, color:'#888' }}>Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}</p>
                        </div>
                        <p style={{ fontWeight:700, fontSize:14, color: PD, flexShrink:0 }}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Summary Sidebar ── */}
          <div style={{ position:'sticky', top:80 }}>
            <div style={{ background:'white', borderRadius:14, boxShadow:'0 4px 20px rgba(45,30,47,0.10)', border:'1px solid rgba(78,42,79,0.08)', overflow:'hidden' }}>
              <div style={{ background:`linear-gradient(135deg,${PD},${P})`, padding:'14px 18px' }}>
                <p style={{ margin:0, fontSize:13, fontWeight:700, color: G, letterSpacing:1, textTransform:'uppercase' }}>Price Details</p>
              </div>
              <div style={{ padding:18 }}>
                <div style={{ marginBottom:12, display:'flex', flexDirection:'column', gap:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, color:'#555' }}>
                    <span>Items ({items.reduce((s,i)=>s+i.quantity,0)})</span>
                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, color:'#555' }}>
                    <span>Delivery</span>
                    <span style={{ color:'#16a34a', fontWeight:700 }}>FREE 🚚</span>
                  </div>
                  <hr style={{ border:'none', borderTop:'1px dashed #e5dde5', margin:0 }} />
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:16, fontWeight:800, color: PD }}>
                    <span>Total</span>
                    <span>₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {step === 3 && (
                  <button onClick={handlePlaceOrder} disabled={placing}
                    style={{
                      width:'100%', padding:'13px', borderRadius:10, border:'none', cursor: placing ? 'wait' : 'pointer',
                      background: placing ? '#ccc' : `linear-gradient(135deg, ${G}, #B8942E)`,
                      color: PD, fontWeight:800, fontSize:15,
                      boxShadow: placing ? 'none' : `0 6px 20px rgba(212,175,106,0.40)`,
                      transition:'all 0.2s',
                    }}>
                    {placing ? '⏳ Processing...' : paymentMethod === 'COD' ? '🎉 Place Order' : '💳 Pay Now'}
                  </button>
                )}

                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:12, color:'#888', fontSize:11 }}>
                  <FiShield size={12} color="#22c55e" />
                  100% Secure. Trusted by customers.
                </div>

                {paymentMethod !== 'COD' && (
                  <div style={{ marginTop:12, textAlign:'center' }}>
                    <p style={{ fontSize:10, color:'#aaa', margin:'0 0 6px' }}>Powered by</p>
                    <div style={{ display:'flex', justifyContent:'center', gap:8, flexWrap:'wrap' }}>
                      {['📱 PhonePe','🔵 GPay','💙 Paytm','💳 Cards'].map(p => (
                        <span key={p} style={{ fontSize:11, color:'#666', background:'#f5f0f6', padding:'3px 8px', borderRadius:6 }}>{p}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'#888'}}>Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
