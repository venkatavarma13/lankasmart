'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import AdminLayout from '@/components/admin/AdminLayout';
import { useApp } from '@/lib/AppContext';
import { FiShoppingBag, FiDollarSign, FiPackage, FiUsers, FiAlertTriangle } from 'react-icons/fi';

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-lg shadow-card p-5 flex items-start gap-4">
      <div className={`p-3 rounded-lg ${color}`}><Icon size={22} className="text-white" /></div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, loading, getAuthHeaders } = useApp();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) router.push('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    axios.get('/api/admin/stats', { headers: getAuthHeaders() })
      .then(({ data }) => { if (data.success) setStats(data.stats); })
      .finally(() => setFetching(false));
  }, [user, getAuthHeaders]);

  if (loading || !user) return null;

  const STATUS_COLORS = {
    Placed: 'bg-blue-100 text-blue-700', Confirmed: 'bg-indigo-100 text-indigo-700',
    Packed: 'bg-orange-100 text-orange-700', Shipped: 'bg-purple-100 text-purple-700',
    Delivered: 'bg-green-100 text-green-700', Cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Welcome back, {user.name}! Here's what's happening today.</p>
        </div>

        {fetching ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1,2,3,4].map((i) => <div key={i} className="skeleton h-24 rounded-lg" />)}
          </div>
        ) : stats && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard icon={FiShoppingBag} label="Total Orders" value={stats.totalOrders} sub={`${stats.pendingOrders} pending`} color="bg-em-blue" />
              <StatCard icon={FiDollarSign} label="Total Revenue" value={`₹${(stats.totalRevenue / 1000).toFixed(1)}K`} sub="Lifetime sales" color="bg-green-500" />
              <StatCard icon={FiPackage} label="Products" value={stats.totalProducts} sub="Active listings" color="bg-em-orange" />
              <StatCard icon={FiUsers} label="Customers" value={stats.totalUsers} sub="Registered users" color="bg-purple-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Orders */}
              <div className="bg-white rounded-lg shadow-card p-5">
                <h2 className="font-bold text-gray-800 mb-4">Recent Orders</h2>
                {stats.recentOrders?.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recentOrders.map((order) => (
                      <div key={order._id} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-semibold text-gray-800">{order.user?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">#{order.orderNumber} · ₹{order.totalAmount?.toLocaleString('en-IN')}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}>{order.status}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-gray-500 text-sm">No orders yet</p>}
              </div>

              {/* Low Stock Alert */}
              <div className="bg-white rounded-lg shadow-card p-5">
                <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FiAlertTriangle className="text-orange-500" size={17} /> Low Stock Alerts
                </h2>
                {stats.lowStockProducts?.length > 0 ? (
                  <div className="space-y-3">
                    {stats.lowStockProducts.map((p) => (
                      <div key={p._id} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium text-gray-800 line-clamp-1">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.category}</p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${p.stock === 0 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                          {p.stock === 0 ? 'Out of Stock' : `${p.stock} left`}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-2xl mb-1">✅</p>
                    <p className="text-sm text-gray-500">All products are well-stocked</p>
                  </div>
                )}
              </div>

              {/* Category Stats */}
              <div className="bg-white rounded-lg shadow-card p-5 lg:col-span-2">
                <h2 className="font-bold text-gray-800 mb-4">Products by Category</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {stats.categoryStats?.map((c) => (
                    <div key={c._id} className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xl font-extrabold text-em-blue">{c.count}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{c._id}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
