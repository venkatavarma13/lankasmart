'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import StoreLayout from '@/components/layout/StoreLayout';
import { useLang } from '@/lib/LanguageContext';
import BannerCarousel from '@/components/ui/BannerCarousel';
import ProductCard from '@/components/product/ProductCard';
import { ProductGridSkeleton } from '@/components/ui/Skeletons';
import { FiArrowRight, FiTruck, FiShield, FiRefreshCw, FiHeadphones } from 'react-icons/fi';

const CATEGORIES = [
  { name: 'Pachari / Grocery Items', emoji: '🌾', color: 'bg-yellow-50 hover:bg-yellow-100' },
  { name: 'Stationery Items', emoji: '✏️', color: 'bg-blue-50 hover:bg-blue-100' },
  { name: 'Fancy Items', emoji: '✨', color: 'bg-pink-50 hover:bg-pink-100' },
  { name: 'Home Needs', emoji: '🏠', color: 'bg-green-50 hover:bg-green-100' },
  { name: 'Jewellery Accessories', emoji: '💍', color: 'bg-purple-50 hover:bg-purple-100' },
  { name: 'Gift Articles', emoji: '🎁', color: 'bg-red-50 hover:bg-red-100' },
  { name: 'Fresh Fruits', emoji: '🍎', color: 'bg-orange-50 hover:bg-orange-100' },
  { name: 'Dry Fruits', emoji: '🥜', color: 'bg-amber-50 hover:bg-amber-100' },
  { name: 'Fresh Vegetables', emoji: '🥦', color: 'bg-emerald-50 hover:bg-emerald-100' },
  { name: 'Disposable Items', emoji: '🧴', color: 'bg-gray-50 hover:bg-gray-100' },
  { name: 'Cool Drinks', emoji: '🥤', color: 'bg-cyan-50 hover:bg-cyan-100' },
  { name: 'Chocolates & Biscuits', emoji: '🍫', color: 'bg-yellow-50 hover:bg-yellow-100' },
  { name: "Children's Toys", emoji: '🧸', color: 'bg-indigo-50 hover:bg-indigo-100' },
  { name: 'Snacks Items', emoji: '🍿', color: 'bg-orange-50 hover:bg-orange-100' },
  { name: 'Hot Food Items', emoji: '🍛', color: 'bg-red-50 hover:bg-red-100' },
  { name: 'Arun Ice Cream', emoji: '🍦', color: 'bg-sky-50 hover:bg-sky-100' },
  { name: 'Arogya Milk Products', emoji: '🥛', color: 'bg-blue-50 hover:bg-blue-100' },
  { name: 'Hatsun Milk & Curd', emoji: '🫙', color: 'bg-teal-50 hover:bg-teal-100' },
  { name: 'Tailoring Items', emoji: '🧵', color: 'bg-violet-50 hover:bg-violet-100' },
  { name: 'Water Purifiers', emoji: '💧', color: 'bg-teal-50 hover:bg-teal-100' },
  { name: 'Bike Spare Parts', emoji: '🔧', color: 'bg-slate-50 hover:bg-slate-100' },
  { name: 'Surgical / Medical Items', emoji: '💊', color: 'bg-green-50 hover:bg-green-100' },
];

const TRUST_BADGES = [
  { icon: FiTruck, title: '🚚 Delivery in 30 Minutes', sub: 'FREE Delivery | L MART' },
  { icon: FiShield, title: '100% Trusted Products', sub: 'All products verified' },
  { icon: FiShield, title: 'Genuine Products', sub: 'Quality guaranteed' },
  { icon: FiHeadphones, title: '24/7 Support', sub: 'Always here for you' },
];

export default function HomePage() {
  const { t } = useLang();
  const [trending, setTrending] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [tRes, f] = await Promise.all([
          axios.get('/api/products?trending=true&limit=8'),
          axios.get('/api/products?featured=true&limit=8'),
        ]);
        setTrending(tRes.data.products || []);
        setFeatured(f.data.products || []);
      } catch {}
      setLoading(false);
    };
    fetchProducts();
  }, []);

  return (
    <StoreLayout>
      <div className="max-w-7xl mx-auto px-4 py-4 space-y-6">
        {/* Banner */}
        <BannerCarousel />

        {/* Trust badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TRUST_BADGES.map(({ icon: Icon, title, sub }) => (
            <div key={title} className="bg-white rounded shadow-card flex items-center gap-3 px-4 py-3">
              <div className="bg-em-blue/10 rounded-full p-2 flex-shrink-0">
                <Icon className="text-em-blue" size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{title}</p>
                <p className="text-xs text-gray-500">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Categories */}
        <section className="bg-white rounded shadow-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">{t('shopByCategory')}</h2>
            <Link href="/products" className="text-em-blue text-sm font-medium hover:underline flex items-center gap-1">
              View All <FiArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {CATEGORIES.map((cat) => (
              <Link key={cat.name} href={`/products?category=${encodeURIComponent(cat.name)}`}
                className={`${cat.color} rounded-lg p-3 flex flex-col items-center gap-1.5 transition-colors cursor-pointer`}>
                <span className="text-2xl md:text-3xl">{cat.emoji}</span>
                <span className="text-xs font-medium text-gray-700 text-center leading-tight">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Offer strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { title: '🚚 Delivery in 30 Minutes', sub: 'FREE Delivery | L MART', href: '/products', bg: 'bg-gradient-to-r from-blue-700 to-indigo-700' },
            { title: '🔥 Fresh Daily', sub: 'Fresh fruits & vegetables every day', href: '/products?category=Fresh+Fruits', bg: 'bg-gradient-to-r from-orange-500 to-red-500' },
            { title: '✅ 100% Trusted Products', sub: 'Quality & genuine guaranteed', href: '/products', bg: 'bg-gradient-to-r from-green-500 to-teal-500' },
          ].map((offer) => (
            <Link key={offer.title} href={offer.href}
              className={`${offer.bg} text-white rounded-lg p-4 hover:opacity-90 transition-opacity`}>
              <h3 className="font-bold text-base mb-0.5">{offer.title}</h3>
              <p className="text-sm opacity-90">{offer.sub}</p>
            </Link>
          ))}
        </div>

        {/* Trending products */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-800">🔥 Trending Products</h2>
            <Link href="/products?trending=true" className="text-em-blue text-sm font-medium hover:underline flex items-center gap-1">
              View All <FiArrowRight size={14} />
            </Link>
          </div>
          {loading ? <ProductGridSkeleton count={8} /> : (
            trending.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {trending.map((p) => <ProductCard key={p._id} product={p} />)}
              </div>
            ) : (
              <div className="bg-white rounded shadow-card p-8 text-center text-gray-400">
                <p className="text-4xl mb-3">🛍️</p>
                <p className="font-semibold">No trending products yet</p>
                <p className="text-sm">Check back soon!</p>
              </div>
            )
          )}
        </section>

        {/* Featured products */}
        {(featured.length > 0 || loading) && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-800">⭐ Featured Deals</h2>
              <Link href="/products?featured=true" className="text-em-blue text-sm font-medium hover:underline flex items-center gap-1">
                View All <FiArrowRight size={14} />
              </Link>
            </div>
            {loading ? <ProductGridSkeleton count={4} /> : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {featured.map((p) => <ProductCard key={p._id} product={p} />)}
              </div>
            )}
          </section>
        )}

        {/* Bottom CTA */}
        <div className="bg-em-blue rounded-lg px-6 py-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">{t('welcome')}</h2>
          <p className="text-green-200 mb-4">{t('welcomeSub')}</p>
          <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919493163557'}`}
            className="inline-block bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2.5 rounded transition-colors">
            💬 Chat on WhatsApp
          </a>
        </div>
      </div>
    </StoreLayout>
  );
}
