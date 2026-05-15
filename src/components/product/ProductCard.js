'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { FiHeart, FiShoppingCart, FiStar } from 'react-icons/fi';
import { useApp } from '@/lib/AppContext';
import { useLang } from '@/lib/LanguageContext';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const { addToCart, toggleWishlist, wishlist, user } = useApp();
  const { t } = useLang();
  const [adding, setAdding] = useState(false);
  const isWishlisted = wishlist.includes(product._id);
  const discount = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  const image = product.images?.[0]?.url ||"/no-image.png";

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to add to cart'); return; }
    if (product.stock === 0) { toast.error('Out of stock'); return; }
    setAdding(true);
    const ok = await addToCart(product._id);
    if (ok) toast.success('Added to cart!');
    else toast.error('Failed to add');
    setAdding(false);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    toggleWishlist(product._id);
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist!');
  };

  return (
    <Link href={`/products/${product._id}`} className="bg-white rounded-lg shadow-card overflow-hidden hover:shadow-md transition-shadow group block">
      <div className="relative">
        <div className="relative h-48 bg-gray-50">
          <Image src={image} alt={product.name} fill className="object-contain p-2 group-hover:scale-105 transition-transform" sizes="(max-width:768px) 50vw, 25vw" />
        </div>
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded">{discount}% OFF</span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-800 text-xs font-bold px-3 py-1 rounded">{t('outOfStock')}</span>
          </div>
        )}
        <button onClick={handleWishlist} className={`absolute top-2 right-2 p-1.5 rounded-full bg-white shadow ${isWishlisted ? 'text-red-500' : 'text-gray-400'} hover:text-red-500 transition-colors`}>
          <FiHeart size={14} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="p-3">
        <p className="text-xs text-gray-400 mb-0.5">{product.brand || product.category}</p>
        <p className="text-sm font-semibold text-gray-800 line-clamp-2 mb-1">{product.name}</p>
        {product.ratings > 0 && (
          <div className="flex items-center gap-1 mb-1">
            <FiStar size={11} className="text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-gray-500">{product.ratings.toFixed(1)} ({product.numReviews})</span>
          </div>
        )}
        <div className="flex items-center gap-2 mb-2">
          <span className="font-bold text-gray-900">₹{product.price.toLocaleString('en-IN')}</span>
          {product.unit && product.unit !== 'piece' && <span className="text-xs text-em-blue font-medium">/{product.unit}</span>}
          {discount > 0 && <span className="text-xs text-gray-400 line-through">₹{product.mrp.toLocaleString('en-IN')}</span>}
        </div>
        <button onClick={handleAddToCart} disabled={adding || product.stock === 0}
          className="w-full flex items-center justify-center gap-1.5 bg-em-blue text-white text-xs font-semibold py-2 rounded hover:bg-em-blue-dark disabled:opacity-50 transition-colors">
          <FiShoppingCart size={13} />
          {adding ? '...' : product.stock === 0 ? t('outOfStock') : t('addToCart')}
        </button>
      </div>
    </Link>
  );
}
