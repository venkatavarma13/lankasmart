'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import StoreLayout from '@/components/layout/StoreLayout';
import ProductCard from '@/components/product/ProductCard';
import { useApp } from '@/lib/AppContext';
import { ProductGridSkeleton } from '@/components/ui/Skeletons';
import { FiHeart } from 'react-icons/fi';

export default function WishlistPage() {
  const { user, loading, getAuthHeaders } = useApp();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        const { data } = await axios.get('/api/wishlist', { headers: getAuthHeaders() });
        if (data.success) setProducts(data.wishlist.products || []);
      } catch {}
      setFetching(false);
    };
    fetch();
  }, [user, getAuthHeaders]);

  if (loading || !user) return null;

  return (
    <StoreLayout>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <h1 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FiHeart className="text-red-500" /> My Wishlist
          {products.length > 0 && <span className="text-gray-400 font-normal text-base">({products.length} item{products.length !== 1 ? 's' : ''})</span>}
        </h1>

        {fetching ? <ProductGridSkeleton count={8} /> : products.length === 0 ? (
          <div className="bg-white rounded shadow-card p-16 text-center">
            <div className="text-6xl mb-4">🤍</div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-6">Save products you love and shop them later</p>
            <Link href="/products" className="bg-em-blue text-white px-8 py-3 rounded font-semibold hover:bg-em-blue-dark inline-block">
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
