'use client';
import { useLang } from '@/lib/LanguageContext';;
export const dynamic = 'force-dynamic';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import StoreLayout from '@/components/layout/StoreLayout';
import { useApp } from '@/lib/AppContext';
import { FiTrash2, FiShoppingBag, FiShield, FiTruck, FiArrowLeft } from 'react-icons/fi';

export default function CartPage() {
  const { t } = useLang();
  const { cart, updateCartQty, removeFromCart, user, loading } = useApp();
  const router = useRouter();
  const items = cart?.items || [];

  const subtotal = items.reduce((s, i) => s + (i.price || i.product?.price || 0) * i.quantity, 0);
  const total = subtotal; // Always FREE delivery

  if (!loading && !user) {
    return (
      <StoreLayout>
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Please Login</h2>
          <p className="text-gray-500 mb-6">Login to view your cart</p>
          <Link href="/login" className="bg-em-blue text-white px-8 py-3 rounded font-semibold hover:bg-em-blue-dark">Login Now</Link>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-em-blue">
            <FiArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-800">
            My Cart {items.length > 0 && <span className="text-gray-400 font-normal text-base">({items.length} item{items.length !== 1 ? 's' : ''})</span>}
          </h1>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded shadow-card p-16 text-center">
            <div className="text-7xl mb-4">🛒</div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">{t('emptyCart')}</h2>
            <p className="text-gray-500 mb-6">Add products to get started</p>
            <Link href="/products" className="bg-em-blue text-white px-8 py-3 rounded font-semibold hover:bg-em-blue-dark inline-block">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Cart Items - Flipkart style */}
            <div className="lg:col-span-2 space-y-3">
              {items.map((item) => {
                const prod = item.product || {};
                const imgUrl = prod.images?.[0]?.url;
                const itemPrice = item.price || prod.price || 0;
                const unitLabel = prod.unit && prod.unit !== 'piece' ? prod.unit : null;
                return (
                  <div key={item._id || prod._id} className="bg-white rounded shadow-card p-4">
                    <div className="flex gap-4">
                      {/* Image */}
                      <Link href={`/products/${prod._id}`} className="flex-shrink-0">
                        <div className="relative w-28 h-28 bg-gray-50 rounded border overflow-hidden">
                          {imgUrl
                            ? <Image src={imgUrl} alt={prod.name || ''} fill className="object-contain p-2" sizes="112px" />
                            : <div className="w-full h-full flex items-center justify-center text-3xl">🛒</div>}
                        </div>
                      </Link>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${prod._id}`}>
                          <h3 className="text-sm font-semibold text-gray-800 hover:text-em-blue line-clamp-2">{prod.name}</h3>
                        </Link>
                        {prod.brand && <p className="text-xs text-gray-400 mt-0.5">{prod.brand}</p>}
                        {unitLabel && <p className="text-xs text-blue-600 mt-0.5 font-medium">Per {unitLabel}</p>}

                        {/* Price */}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="font-bold text-gray-900 text-base">₹{itemPrice.toLocaleString('en-IN')}</span>
                          {prod.mrp > itemPrice && (
                            <span className="text-xs text-gray-400 line-through">₹{prod.mrp?.toLocaleString('en-IN')}</span>
                          )}
                          {prod.mrp > itemPrice && (
                            <span className="text-xs text-green-600 font-medium">{Math.round(((prod.mrp - itemPrice) / prod.mrp) * 100)}% off</span>
                          )}
                        </div>

                        {/* Delivery badge */}
                        <p className="text-xs text-green-600 font-medium mt-1">🚚 FREE Delivery</p>

                        {/* Quantity + Remove row */}
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                            <button onClick={() => updateCartQty(prod._id?.toString(), item.quantity - 1)}
                              className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 font-bold text-lg">−</button>
                            <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                            <button onClick={() => updateCartQty(prod._id?.toString(), item.quantity + 1)}
                              disabled={item.quantity >= (prod.stock || 99)}
                              className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 font-bold text-lg disabled:opacity-40">+</button>
                          </div>
                          <button onClick={() => removeFromCart(prod._id?.toString())}
                            className="flex items-center gap-1 text-red-500 hover:text-red-600 text-xs font-semibold border border-red-200 px-3 py-1.5 rounded hover:bg-red-50">
                            <FiTrash2 size={12} /> REMOVE
                          </button>
                        </div>
                      </div>

                      {/* Line total */}
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-gray-900">₹{(itemPrice * item.quantity).toLocaleString('en-IN')}</p>
                        {item.quantity > 1 && <p className="text-xs text-gray-400">×{item.quantity}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary - Flipkart style */}
            <div className="space-y-3">
              {/* Price Details */}
              <div className="bg-white rounded shadow-card p-5">
                <h2 className="font-bold text-gray-500 text-sm uppercase tracking-widest mb-4 border-b pb-3">{t('priceDetails')}</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-700">
                    <span>Price ({items.reduce((s, i) => s + i.quantity, 0)} item{items.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''})</span>
                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>{t('deliveryCharges')}</span>
                    <span className="text-green-600 font-bold">{t('free')}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-bold text-base text-gray-900">
                    <span>{t('totalAmount')}</span>
                    <span>₹{total.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-green-50 text-green-700 text-xs font-medium px-3 py-2 rounded text-center">
                    🎉 FREE Delivery on this order!
                  </div>
                </div>

                <button onClick={() => router.push('/checkout')}
                  className="w-full bg-em-orange hover:bg-orange-600 text-white font-bold py-3 rounded mt-4 transition-colors text-sm">
                  PLACE ORDER
                </button>

                <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-gray-400">
                  <FiShield size={11} className="text-green-500" />
                  Safe and Secure Payments. 100% Trusted.
                </div>
              </div>

              {/* Delivery info */}
              <div className="bg-white rounded shadow-card p-4 flex items-center gap-3 text-sm">
                <FiTruck size={20} className="text-em-blue flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-800">30-Minute Delivery</p>
                  <p className="text-xs text-gray-500">L MART — Agadalalanka, Eluru</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
