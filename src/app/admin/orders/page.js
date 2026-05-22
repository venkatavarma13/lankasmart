'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import axios from 'axios';
import AdminLayout from '@/components/admin/AdminLayout';
import { useApp } from '@/lib/AppContext';
import {
  FiEdit2, FiEye, FiX, FiMapPin, FiPhone,
  FiMail, FiUser, FiPackage, FiPrinter, FiCheck,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const STATUS_OPTS = ['All', 'Placed', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];
const STATUS_COLORS = {
  Placed: 'bg-blue-100 text-blue-700',
  Confirmed: 'bg-indigo-100 text-indigo-700',
  Packed: 'bg-orange-100 text-orange-700',
  Shipped: 'bg-purple-100 text-purple-700',
  Delivered: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
};

// ─── Invoice Component (printable) ───────────────────────────────────────────
function InvoicePrint({ order, onClose }) {
  const invoiceRef = useRef();

  const handlePrint = () => {
    const content = invoiceRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${order.orderNumber}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; background: #fff; }
          .invoice { max-width: 700px; margin: 0 auto; padding: 32px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; border-bottom: 3px solid #2874f0; padding-bottom: 20px; }
          .logo-section h1 { font-size: 26px; font-weight: 900; color: #2874f0; }
          .logo-section h1 span { color: #fb641b; }
          .logo-section p { font-size: 11px; color: #888; margin-top: 3px; }
          .invoice-meta { text-align: right; }
          .invoice-meta h2 { font-size: 22px; font-weight: 800; color: #2874f0; text-transform: uppercase; letter-spacing: 2px; }
          .invoice-meta p { font-size: 12px; color: #555; margin-top: 4px; }
          .invoice-meta .inv-num { font-size: 14px; font-weight: 700; color: #1a1a1a; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
          .box { background: #f8f9ff; border: 1px solid #e0e8ff; border-radius: 8px; padding: 14px 16px; }
          .box h3 { font-size: 11px; text-transform: uppercase; color: #2874f0; font-weight: 700; letter-spacing: 1px; margin-bottom: 8px; }
          .box p { font-size: 13px; color: #333; line-height: 1.6; }
          .box .name { font-weight: 700; font-size: 14px; color: #1a1a1a; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          thead tr { background: #2874f0; color: #fff; }
          thead th { padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 600; }
          thead th:last-child { text-align: right; }
          tbody tr { border-bottom: 1px solid #f0f0f0; }
          tbody tr:nth-child(even) { background: #fafafa; }
          tbody td { padding: 10px 12px; font-size: 13px; color: #333; }
          tbody td:last-child { text-align: right; font-weight: 600; }
          .totals { margin-left: auto; width: 260px; }
          .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #555; }
          .total-row.grand { border-top: 2px solid #2874f0; margin-top: 8px; padding-top: 10px; font-size: 16px; font-weight: 900; color: #1a1a1a; }
          .total-row.saving { color: #1a8a1a; font-weight: 600; }
          .footer-note { margin-top: 28px; border-top: 1px solid #eee; padding-top: 16px; text-align: center; }
          .footer-note p { font-size: 12px; color: #888; line-height: 1.6; }
          .footer-note .thanks { font-size: 15px; font-weight: 700; color: #2874f0; margin-bottom: 4px; }
          .status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; background: #e8f5e8; color: #1a8a1a; }
          .payment-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; background: #fff8e1; color: #e65100; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const addr = order.shippingAddress || {};
  const subtotal = order.itemsPrice || order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = order.shippingPrice || 0;
  const total = order.totalAmount || subtotal + shipping;
  const savings = order.items.reduce((s, i) => {
    const prod = i.product || {};
    const mrp = prod.mrp || i.price;
    return s + (mrp - i.price) * i.quantity;
  }, 0);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b bg-gray-50 rounded-t-2xl">
          <div>
            <h2 className="font-extrabold text-xl text-gray-800 flex items-center gap-2">
              <FiPrinter className="text-em-blue" /> Invoice — #{order.orderNumber}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Click Print to download or print this invoice</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePrint}
              className="flex items-center gap-2 bg-em-blue hover:bg-em-blue-dark text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-colors">
              <FiPrinter size={16} /> Print / Download
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Invoice Preview */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          <div ref={invoiceRef} className="invoice">
            {/* Invoice Header */}
            <div className="header">
              <div className="logo-section">
                <h1>🛒 L MART</h1>
                <p>Agadalalanka, Eluru District, AP 534427</p>
                <p style={{ marginTop: 8, fontSize: 12, color: '#555' }}>
                  Agadalalanka, Eluru District, Andhra Pradesh – 520001<br />
                  📞 +91 94931 63557 · ✉️ supportlmart@gmail.com
                </p>
              </div>
              <div className="invoice-meta">
                <h2>Invoice</h2>
                <p className="inv-num">#{order.orderNumber}</p>
                <p>Date: {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p style={{ marginTop: 6 }}>
                  <span className="status-badge">{order.status}</span>
                  &nbsp;
                  <span className="payment-badge">💵 {order.paymentMethod}</span>
                </p>
              </div>
            </div>

            {/* Customer + Delivery Address */}
            <div className="grid-2">
              <div className="box">
                <h3>👤 Customer Details</h3>
                <p className="name">{order.user?.name || addr.name || '—'}</p>
                <p>📧 {order.user?.email || '—'}</p>
                <p>📞 {order.user?.phone || addr.phone || '—'}</p>
              </div>
              <div className="box">
                <h3>📍 Delivery Address</h3>
                <p className="name">{addr.name || '—'}</p>
                <p>📞 {addr.phone || '—'}</p>
                <p>{addr.street || '—'}</p>
                <p>{addr.city}{addr.state ? `, ${addr.state}` : ''}{addr.pincode ? ` – ${addr.pincode}` : ''}</p>
              </div>
            </div>

            {/* Items Table */}
            <table>
              <thead>
                <tr>
                  <th style={{ width: '5%' }}>#</th>
                  <th style={{ width: '45%' }}>Product</th>
                  <th style={{ width: '15%' }}>Price</th>
                  <th style={{ width: '15%' }}>Qty</th>
                  <th style={{ width: '20%' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={i}>
                    <td style={{ color: '#999' }}>{i + 1}</td>
                    <td>
                      <strong>{item.name}</strong>
                      {item.product?.brand && (
                        <span style={{ display: 'block', fontSize: 11, color: '#999' }}>{item.product.brand}</span>
                      )}
                    </td>
                    <td>₹{item.price?.toLocaleString('en-IN')}</td>
                    <td>{item.quantity}</td>
                    <td>₹{(item.price * item.quantity).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="totals">
              <div className="total-row">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="total-row">
                <span>Delivery Charges</span>
                <span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
              </div>
              {savings > 0 && (
                <div className="total-row saving">
                  <span>You Saved</span>
                  <span>−₹{savings.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="total-row grand">
                <span>Grand Total</span>
                <span>₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="footer-note">
              <p className="thanks">🙏 Thank you for shopping with L MART!</p>
              <p>For returns, exchanges or support: 📞 +91 94931 63557 · 💬 WhatsApp: +91 94931 63557</p>
              <p style={{ marginTop: 6, color: '#aaa', fontSize: 11 }}>
                This is a computer-generated invoice. No signature required.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Order Detail Modal ───────────────────────────────────────────────────────
function OrderDetailModal({ order, onClose, onStatusUpdate, getAuthHeaders }) {
  const [newStatus, setNewStatus] = useState(order.status);
  const [updating, setUpdating] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const addr = order.shippingAddress || {};

  const handleUpdate = async () => {
    if (newStatus === order.status) return;
    setUpdating(true);
    try {
      const { data } = await axios.put(
        `/api/admin/orders/${order._id}`,
        { status: newStatus },
        { headers: getAuthHeaders() }
      );
      if (data.success) {
        toast.success(`✅ Status updated to ${newStatus}`);
        onStatusUpdate();
        onClose();
      } else {
        toast.error(data.message || 'Update failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
      console.error('Status update error:', err.response?.data);
    }
    setUpdating(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 flex items-start justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mt-4 mb-4">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b bg-gray-50 rounded-t-2xl">
            <div>
              <h2 className="font-extrabold text-xl text-gray-800">Order Details</h2>
              <p className="text-sm text-gray-500">#{order.orderNumber}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowInvoice(true)}
                className="flex items-center gap-1.5 border border-em-blue text-em-blue px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors">
                <FiPrinter size={15} /> Invoice
              </button>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <FiX size={20} />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Status + Date */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>
                  {order.status}
                </span>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-semibold">
                  💵 {order.paymentMethod}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(order.createdAt).toLocaleString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
              <span className="text-lg font-extrabold text-gray-900">
                ₹{order.totalAmount?.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Customer Details */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <h3 className="font-bold text-blue-800 text-sm mb-3 flex items-center gap-2">
                <FiUser size={15} /> Customer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <FiUser size={13} className="text-blue-500 flex-shrink-0" />
                  <span className="font-semibold text-gray-800">{order.user?.name || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiMail size={13} className="text-blue-500 flex-shrink-0" />
                  <span className="text-gray-700">{order.user?.email || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiPhone size={13} className="text-blue-500 flex-shrink-0" />
                  <span className="text-gray-700">{order.user?.phone || addr.phone || '—'}</span>
                </div>
              </div>
            </div>

            {/* Delivery Address — FULL DETAILS */}
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <h3 className="font-bold text-green-800 text-sm mb-3 flex items-center gap-2">
                <FiMapPin size={15} /> Delivery Address
              </h3>
              <div className="text-sm space-y-1.5">
                <div className="flex items-start gap-2">
                  <FiUser size={13} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="font-bold text-gray-900 text-base">{addr.name || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiPhone size={13} className="text-green-600 flex-shrink-0" />
                  <span className="text-gray-700 font-semibold">{addr.phone || '—'}</span>
                  {addr.phone && (
                    <a href={`tel:${addr.phone}`}
                      className="text-xs text-em-blue hover:underline ml-1">Call</a>
                  )}
                  {addr.phone && (
                    <a href={`https://wa.me/91${addr.phone}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-green-600 hover:underline">WhatsApp</a>
                  )}
                </div>
                <div className="flex items-start gap-2">
                  <FiMapPin size={13} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-800 font-medium">{addr.street || '—'}</p>
                    <p className="text-gray-700">
                      {[addr.city, addr.state].filter(Boolean).join(', ')}
                      {addr.pincode ? ` – ${addr.pincode}` : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ordered Items */}
            <div>
              <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
                <FiPackage size={15} /> Ordered Items ({order.items.length})
              </h3>
              <div className="space-y-2">
                {order.items.map((item, i) => {
                  const img = item.image || item.product?.images?.[0]?.url;
                  return (
                    <div key={i} className="flex gap-3 items-center bg-gray-50 rounded-lg p-3">
                      <div className="relative w-12 h-12 bg-white rounded flex-shrink-0 border border-gray-200">
                        {img
                          ? <Image src={img} alt={item.name} fill className="object-contain p-1" sizes="48px" />
                          : <div className="w-full h-full flex items-center justify-center text-xl">⚡</div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 line-clamp-1">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <p className="font-bold text-sm text-gray-900 flex-shrink-0">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Price Summary */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-bold text-gray-800 text-sm mb-3">💰 Price Summary</h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Items Total</span>
                  <span>₹{order.itemsPrice?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span className={order.shippingPrice === 0 ? 'text-green-600 font-medium' : ''}>
                    {order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice}`}
                  </span>
                </div>
                <div className="flex justify-between font-extrabold text-base text-gray-900 pt-2 border-t border-gray-200 mt-2">
                  <span>Grand Total</span>
                  <span>₹{order.totalAmount?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Update Status */}
            {order.status !== 'Cancelled' && order.status !== 'Delivered' && (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-4">
                <h3 className="font-bold text-gray-800 text-sm mb-3">📦 Update Order Status</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                  {['Placed', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'].map((s) => (
                    <label key={s}
                      className={`flex items-center gap-2 border-2 rounded-lg p-2.5 cursor-pointer transition-all text-sm ${
                        newStatus === s
                          ? 'border-em-blue bg-blue-50 font-semibold'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <input type="radio" name="status" value={s}
                        checked={newStatus === s} onChange={() => setNewStatus(s)}
                        className="accent-em-blue" />
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[s] || ''}`}>
                        {s}
                      </span>
                    </label>
                  ))}
                </div>
                <button onClick={handleUpdate}
                  disabled={updating || newStatus === order.status}
                  className="w-full bg-em-blue hover:bg-em-blue-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
                  {updating
                    ? '⏳ Updating...'
                    : <><FiCheck size={15} /> Update to "{newStatus}"</>
                  }
                </button>
              </div>
            )}

            {/* Order Timeline */}
            {order.statusHistory?.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-800 text-sm mb-2">📋 Order Timeline</h3>
                <div className="space-y-2">
                  {[...order.statusHistory].reverse().map((h, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-em-blue mt-1.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-gray-800">{h.status}</span>
                        <span className="text-gray-400 text-xs ml-2">
                          {new Date(h.timestamp).toLocaleString('en-IN', {
                            day: 'numeric', month: 'short',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                        {h.note && <p className="text-xs text-gray-500 mt-0.5">{h.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoice && (
        <InvoicePrint order={order} onClose={() => setShowInvoice(false)} />
      )}
    </>
  );
}

// ─── Main Admin Orders Page ───────────────────────────────────────────────────
export default function AdminOrders() {
  const { user, loading, getAuthHeaders } = useApp();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('All');
  const [fetching, setFetching] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showInvoiceDirect, setShowInvoiceDirect] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) router.push('/login');
  }, [loading, user, router]);

  const fetchOrders = async () => {
    setFetching(true);
    try {
      const params = new URLSearchParams({
        page, limit: 15,
        ...(statusFilter !== 'All' && { status: statusFilter }),
      });
      const { data } = await axios.get(`/api/admin/orders?${params}`, { headers: getAuthHeaders() });
      if (data.success) { setOrders(data.orders); setTotal(data.total); setPages(data.pages); }
    } catch {}
    setFetching(false);
  };

  useEffect(() => { if (user?.role === 'admin') fetchOrders(); }, [user, page, statusFilter]);

  const openDetail = (order) => { setSelectedOrder(order); setShowDetail(true); };
  const openInvoice = (order) => { setSelectedOrder(order); setShowInvoiceDirect(true); };

  if (loading || !user) return null;

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total orders</p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          {STATUS_OPTS.map((s) => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === s
                  ? 'bg-em-blue text-white shadow-sm'
                  : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}>
              {s}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Order</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Delivery Address</th>
                  <th className="px-4 py-3 text-left">Items</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fetching ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-4 py-3">
                        <div className="skeleton h-4 rounded" />
                      </td>
                    </tr>
                  ))
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <div className="text-4xl mb-3">📦</div>
                      <p className="text-gray-400 font-medium">No orders found</p>
                    </td>
                  </tr>
                ) : orders.map((order) => {
                  const addr = order.shippingAddress || {};
                  return (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      {/* Order ID + Date */}
                      <td className="px-4 py-3">
                        <p className="font-bold text-xs text-gray-800">#{order.orderNumber}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </p>
                      </td>

                      {/* Customer Name + Phone */}
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800 text-sm">{order.user?.name || '—'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">📞 {addr.phone || order.user?.phone || '—'}</p>
                        <p className="text-xs text-gray-400">{order.user?.email || '—'}</p>
                      </td>

                      {/* FULL DELIVERY ADDRESS */}
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800 text-xs">{addr.name || '—'}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{addr.street || '—'}</p>
                        <p className="text-xs text-gray-600">
                          {[addr.city, addr.state].filter(Boolean).join(', ')}
                        </p>
                        {addr.pincode && (
                          <p className="text-xs font-semibold text-em-blue">📍 PIN: {addr.pincode}</p>
                        )}
                      </td>

                      {/* Items */}
                      <td className="px-4 py-3">
                        {order.items?.slice(0, 2).map((item, i) => (
                          <p key={i} className="text-xs text-gray-600 line-clamp-1">
                            • {item.name} ×{item.quantity}
                          </p>
                        ))}
                        {order.items?.length > 2 && (
                          <p className="text-xs text-gray-400">+{order.items.length - 2} more</p>
                        )}
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3 text-right">
                        <p className="font-bold text-gray-900">₹{order.totalAmount?.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-yellow-600 mt-0.5">💵 COD</p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}>
                          {order.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => openDetail(order)}
                            title="View Full Details"
                            className="p-1.5 text-em-blue hover:bg-blue-50 rounded-lg transition-colors"
                            aria-label="View order details">
                            <FiEye size={15} />
                          </button>
                          <button onClick={() => openInvoice(order)}
                            title="Print Invoice"
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            aria-label="Print invoice">
                            <FiPrinter size={15} />
                          </button>
                          <button onClick={() => openDetail(order)}
                            title="Update Status"
                            className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                            aria-label="Update status">
                            <FiEdit2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t">
              <button disabled={page === 1} onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 border rounded text-sm disabled:opacity-40 hover:bg-gray-50">
                ← Prev
              </button>
              {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded text-sm font-semibold ${
                    page === p ? 'bg-em-blue text-white' : 'border hover:bg-gray-50'
                  }`}>
                  {p}
                </button>
              ))}
              <button disabled={page === pages} onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 border rounded text-sm disabled:opacity-40 hover:bg-gray-50">
                Next →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {showDetail && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => { setShowDetail(false); setSelectedOrder(null); }}
          onStatusUpdate={fetchOrders}
          getAuthHeaders={getAuthHeaders}
        />
      )}

      {/* Direct Invoice Modal */}
      {showInvoiceDirect && selectedOrder && (
        <InvoicePrint
          order={selectedOrder}
          onClose={() => { setShowInvoiceDirect(false); setSelectedOrder(null); }}
        />
      )}
    </AdminLayout>
  );
}
