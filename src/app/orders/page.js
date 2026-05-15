'use client';
import { useLang } from '@/lib/LanguageContext';;
export const dynamic = 'force-dynamic';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';
import StoreLayout from '@/components/layout/StoreLayout';
import { useApp } from '@/lib/AppContext';
import { FiPackage, FiCheck, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Delivered'];
const STATUS_COLORS = {
  Placed: 'bg-blue-100 text-blue-700',
  Confirmed: 'bg-indigo-100 text-indigo-700',
  Packed: 'bg-orange-100 text-orange-700',
  Shipped: 'bg-purple-100 text-purple-700',
  Delivered: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
};

function TrackingBar({ status }) {
  const currentStep = STATUS_STEPS.indexOf(status);
  return (
    <div className="relative flex items-center mt-4 mb-2">
      <div className="absolute top-3.5 left-0 right-0 h-0.5 bg-gray-200 z-0">
        <div
          className="h-full bg-green-500 transition-all duration-500"
          style={{ width: currentStep < 0 ? '0%' : `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%` }}
        />
      </div>
      {STATUS_STEPS.map((s, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <div key={s} className="flex-1 flex flex-col items-center relative z-10">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-colors
              ${done ? 'bg-green-500 border-green-500 text-white' :
                active ? 'bg-em-blue border-em-blue text-white' :
                'bg-white border-gray-300 text-gray-400'}`}>
              {done ? <FiCheck size={13} /> : i + 1}
            </div>
            <span className={`text-[10px] mt-1 text-center font-medium
              ${active ? 'text-em-blue' : done ? 'text-green-600' : 'text-gray-400'}`}>
              {s}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="text-gray-500">Loading orders...</div></div>}>
      <OrdersContent />
    </Suspense>
  );
}

function OrdersContent() {
  const { t } = useLang();
  const { user, loading, getAuthHeaders } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const showSuccess = searchParams.get('success') === '1';

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  const fetchOrders = async () => {
    if (!user) return;
    try {
      const { data } = await axios.get('/api/orders', { headers: getAuthHeaders() });
      if (data.success) setOrders(data.orders);
    } catch {}
    setFetching(false);
  };

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const openCancelModal = (orderId) => {
    setCancelOrderId(orderId);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleCancelOrder = async () => {
    if (!cancelReason) { toast.error('Please select a reason'); return; }
    setCancellingId(cancelOrderId);
    try {
      const { data } = await axios.put(
        `/api/orders/${cancelOrderId}/cancel`,
        { reason: cancelReason },
        { headers: getAuthHeaders() }
      );
      if (data.success) {
        toast.success('Order cancelled successfully');
        setShowCancelModal(false);
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed');
    }
    setCancellingId(null);
  };

  const toggleExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const canCancel = (status) => ['Placed', t('confirmed')].includes(status);

  if (loading || !user) return null;

  return (
    <StoreLayout>
      <div className="max-w-4xl mx-auto px-4 py-4">
        <h1 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FiPackage /> My Orders
        </h1>

        {showSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-start gap-3">
            <div className="text-3xl">🎉</div>
            <div>
              <p className="font-bold text-green-800">Order Placed Successfully!</p>
              <p className="text-sm text-green-700">
                Thank you for shopping with L MART. Your order will be delivered in 3–5 business days.
              </p>
            </div>
          </div>
        )}

        {fetching ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded shadow-card p-4 animate-pulse">
                <div className="skeleton h-5 w-40 mb-3" />
                <div className="skeleton h-16 w-full" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded shadow-card p-16 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">{t('noOrders')}</h2>
            <p className="text-gray-500 mb-6">Start shopping and your orders will appear here</p>
            <Link href="/products"
              className="bg-em-blue text-white px-8 py-3 rounded font-semibold hover:bg-em-blue-dark inline-block">
              Shop Now
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded shadow-card overflow-hidden">

                {/* Order Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b flex-wrap gap-2">
                  <div>
                    <span className="text-xs text-gray-500">ORDER # </span>
                    <span className="text-xs font-bold text-gray-700">{order.orderNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}>
                      {order.status}
                    </span>
                    {canCancel(order.status) && (
                      <button
                        onClick={() => openCancelModal(order._id)}
                        className="text-xs text-red-500 border border-red-300 px-2 py-0.5 rounded hover:bg-red-50 font-medium transition-colors">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  {/* Items Preview */}
                  {order.items.slice(0, 2).map((item, idx) => {
                    const img = item.image || item.product?.images?.[0]?.url;
                    return (
                      <div key={idx} className="flex gap-3 mb-3 items-center">
                        <div className="relative w-16 h-16 bg-gray-50 rounded flex-shrink-0 product-img-placeholder">
                          {img
                            ? <Image src={img} alt={item.name} fill className="object-contain p-1" sizes="64px" />
                            : <div className="w-full h-full flex items-center justify-center text-2xl">⚡</div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.name}</p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}</p>
                        </div>
                        <p className="font-bold text-sm text-gray-900">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </p>
                      </div>
                    );
                  })}
                  {order.items.length > 2 && (
                    <p className="text-xs text-gray-500 mb-2">
                      +{order.items.length - 2} more item{order.items.length - 2 > 1 ? 's' : ''}
                    </p>
                  )}

                  {/* Tracking */}
                  {order.status !== 'Cancelled'
                    ? <TrackingBar status={order.status} />
                    : (
                      <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-600 mb-3 flex items-start gap-2">
                        <FiX size={16} className="flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">Order Cancelled</p>
                          {order.cancelReason && <p className="text-xs mt-0.5">Reason: {order.cancelReason}</p>}
                        </div>
                      </div>
                    )
                  }

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t mt-2 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-xs text-gray-500">Total: </span>
                        <span className="font-bold text-gray-900">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
                      </div>
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                        💵 COD
                      </span>
                    </div>
                    <button
                      onClick={() => toggleExpand(order._id)}
                      className="flex items-center gap-1 text-xs text-em-blue font-medium border border-em-blue px-3 py-1.5 rounded hover:bg-blue-50 transition-colors">
                      {expandedOrder === order._id
                        ? <><FiChevronUp size={14} /> Hide Details</>
                        : <><FiChevronDown size={14} /> View Details</>
                      }
                    </button>
                  </div>

                  {/* Expanded Details */}
                  {expandedOrder === order._id && (
                    <div className="mt-4 pt-4 border-t space-y-4">

                      {/* All Items */}
                      <div>
                        <h3 className="font-bold text-gray-800 text-sm mb-3">All Items ({order.items.length})</h3>
                        <div className="space-y-2">
                          {order.items.map((item, idx) => {
                            const img = item.image || item.product?.images?.[0]?.url;
                            return (
                              <div key={idx} className="flex gap-3 items-center bg-gray-50 rounded-lg p-3">
                                <div className="relative w-14 h-14 bg-white rounded flex-shrink-0">
                                  {img
                                    ? <Image src={img} alt={item.name} fill className="object-contain p-1" sizes="56px" />
                                    : <div className="w-full h-full flex items-center justify-center text-xl">⚡</div>
                                  }
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}
                                  </p>
                                </div>
                                <p className="font-bold text-sm">
                                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Price Breakdown */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-bold text-gray-800 text-sm mb-3">💰 Price Details</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between text-gray-600">
                            <span>Items Total</span>
                            <span>₹{order.itemsPrice?.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-gray-600">
                            <span>Delivery Charges</span>
                            <span className={order.shippingPrice === 0 ? 'text-green-600 font-medium' : ''}>
                              {order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice}`}
                            </span>
                          </div>
                          <div className="flex justify-between font-bold text-gray-900 pt-2 border-t">
                            <span>Total Amount</span>
                            <span>₹{order.totalAmount?.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-gray-600">
                            <span>Payment</span>
                            <span className="font-medium">💵 Cash on Delivery</span>
                          </div>
                          <div className="flex justify-between text-gray-600">
                            <span>Payment Status</span>
                            <span className={`font-medium ${order.paymentStatus === 'Paid' ? 'text-green-600' : 'text-orange-500'}`}>
                              {order.paymentStatus || 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Delivery Address */}
                      {order.shippingAddress && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-bold text-gray-800 text-sm mb-2">📍 Delivery Address</h3>
                          <div className="text-sm text-gray-600 space-y-0.5">
                            <p className="font-semibold text-gray-800">{order.shippingAddress.name}</p>
                            <p>{order.shippingAddress.phone}</p>
                            <p>{order.shippingAddress.street}</p>
                            <p>{order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.pincode}</p>
                          </div>
                        </div>
                      )}

                      {/* Order Timeline */}
                      {order.statusHistory?.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-bold text-gray-800 text-sm mb-3">📋 Order Timeline</h3>
                          <div className="space-y-2">
                            {order.statusHistory.map((h, i) => (
                              <div key={i} className="flex items-start gap-3 text-sm">
                                <div className="w-2 h-2 rounded-full bg-em-blue mt-1.5 flex-shrink-0" />
                                <div>
                                  <span className="font-semibold text-gray-800">{h.status}</span>
                                  <span className="text-gray-500 text-xs ml-2">
                                    {new Date(h.timestamp).toLocaleString('en-IN', {
                                      day: 'numeric', month: 'short',
                                      hour: '2-digit', minute: '2-digit'
                                    })}
                                  </span>
                                  {h.note && <p className="text-xs text-gray-500 mt-0.5">{h.note}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Cancel Button Inside Details */}
                      {canCancel(order.status) && (
                        <button
                          onClick={() => openCancelModal(order._id)}
                          className="w-full border-2 border-red-400 text-red-500 hover:bg-red-50 py-2.5 rounded font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                          <FiX size={16} /> Cancel This Order
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="font-bold text-xl text-gray-800 mb-1">{t('cancelOrder')}</h2>
            <p className="text-sm text-gray-500 mb-4">Please tell us why you want to cancel</p>
            <div className="space-y-2 mb-5">
              {[
                'I want to change the delivery address',
                'I ordered by mistake',
                'I want to change the product',
                'Delivery is taking too long',
                'Found better price elsewhere',
                'Other reason',
              ].map((reason) => (
                <label key={reason}
                  className={`flex items-center gap-3 border-2 rounded-lg p-3 cursor-pointer transition-colors
                    ${cancelReason === reason ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input
                    type="radio"
                    name="cancelReason"
                    value={reason}
                    checked={cancelReason === reason}
                    onChange={() => setCancelReason(reason)}
                    className="accent-red-500"
                  />
                  <span className="text-sm text-gray-700">{reason}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 border border-gray-300 py-2.5 rounded font-semibold text-sm hover:bg-gray-50">
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={!cancelReason || !!cancellingId}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white py-2.5 rounded font-bold text-sm transition-colors">
                {cancellingId ? 'Cancelling...' : t('cancelOrder')}
              </button>
            </div>
          </div>
        </div>
      )}
    </StoreLayout>
  );
}
