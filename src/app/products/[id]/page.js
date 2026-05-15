'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import { useLang } from '@/lib/LanguageContext';
import StoreLayout from '@/components/layout/StoreLayout';
import { useApp } from '@/lib/AppContext';
import ReviewsSection from '@/components/product/ReviewsSection';
import { FiHeart, FiShoppingCart, FiStar, FiTruck, FiShield, FiChevronRight, FiMinus, FiPlus, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t, catName } = useLang();
  const { addToCart, toggleWishlist, wishlistIds, user, getAuthHeaders } = useApp();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addingCart, setAddingCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    if (!id) return;
    axios.get(`/api/products/${id}`)
      .then(({ data }) => {
        if (data.success) {
          setProduct(data.product);
          if (data.product.variants?.length > 0) {
            setSelectedVariant(data.product.variants[0]);
          }
        } else {
          toast.error('Product not found');
          router.push('/products');
        }
      })
      .catch(() => { toast.error('Product not found'); router.push('/products'); })
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) return (
    <StoreLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          <div className="bg-gray-200 rounded h-96" />
          <div className="space-y-4">
            <div className="bg-gray-200 rounded h-8 w-3/4" />
            <div className="bg-gray-200 rounded h-6 w-1/2" />
            <div className="bg-gray-200 rounded h-12 w-1/3" />
          </div>
        </div>
      </div>
    </StoreLayout>
  );

  if (!product) return null;

  const hasVariants = product.variants?.length > 0;
  const activeVariant = hasVariants ? selectedVariant : null;

  // Price comes from selected variant OR product base price
  const currentPrice = activeVariant ? activeVariant.price : product.price;
  const currentMrp = activeVariant ? activeVariant.mrp : product.mrp;
  const currentStock = activeVariant ? activeVariant.stock : product.stock;
  const discountPct = currentMrp > currentPrice ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100) : 0;

  const isWished = wishlistIds?.has(product._id?.toString()) || false;
  const imgs = product.images?.length ? product.images : [];
  const inStock = currentStock > 0;

  const handleAddToCart = async () => {
    if (!user) { toast.error('Please login first'); router.push('/login'); return; }
    setAddingCart(true);
    const ok = await addToCart(product._id, quantity, currentPrice);
    if (ok) {
      setAddedToCart(true);
      toast.success('Added to cart! 🛒');
      setTimeout(() => setAddedToCart(false), 2000);
    } else {
      toast.error('Failed to add to cart');
    }
    setAddingCart(false);
  };

  const handleBuyNow = async () => {
    if (!user) { router.push('/login'); return; }
    setBuyingNow(true);
    try {
      // Use separate buy-now session — NEVER touches the cart
      const { data } = await axios.post('/api/checkout/buy-now',
        { productId: product._id, quantity, price: currentPrice },
        { headers: getAuthHeaders() }
      );
      if (data.success) {
        router.push('/checkout?mode=buynow');
      } else {
        toast.error(data.message || 'Could not process. Please try again.');
      }
    } catch (e) {
      console.error('Buy now error:', e?.response?.data || e.message);
      toast.error('Something went wrong. Please try again.');
    }
    setBuyingNow(false);
  };

  return (
    <StoreLayout>
      <div className="max-w-7xl mx-auto px-4 py-4">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-xs text-gray-500 mb-4 flex-wrap">
          <Link href="/" className="hover:text-em-blue">Home</Link>
          <FiChevronRight size={11} />
          <Link href="/products" className="hover:text-em-blue">Products</Link>
          <FiChevronRight size={11} />
          <Link href={`/products?category=${encodeURIComponent(product.category)}`} className="hover:text-em-blue">{product.category}</Link>
          <FiChevronRight size={11} />
          <span className="text-gray-700 line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* ── LEFT: Images ── */}
          <div className="bg-white rounded-lg shadow-card p-4">
            <div className="relative h-80 mb-3 bg-gray-50 rounded-lg overflow-hidden">
              {imgs.length > 0
                ? <Image src={imgs[selectedImg]?.url} alt={product.name} fill className="object-contain p-4" sizes="(max-width:768px) 100vw,50vw" priority />
                : <div className="w-full h-full flex items-center justify-center text-8xl">🛒</div>
              }
              {discountPct > 0 && (
                <span className="absolute top-2 left-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-md">{discountPct}% OFF</span>
              )}
              {/* Wishlist button */}
              <button onClick={() => toggleWishlist(product._id?.toString())}
                className={`absolute top-2 right-2 w-9 h-9 rounded-full flex items-center justify-center shadow transition-colors ${isWished ? 'bg-red-50' : 'bg-white'}`}>
                <FiHeart size={17} className={isWished ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
              </button>
            </div>

            {/* Thumbnail strip */}
            {imgs.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {imgs.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImg(i)}
                    className={`relative w-14 h-14 flex-shrink-0 border-2 rounded-md overflow-hidden ${i === selectedImg ? 'border-em-blue' : 'border-gray-200'}`}>
                    <Image src={img.url} alt="" fill className="object-contain p-1" sizes="56px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Details ── */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-card p-5">

              {product.brand && <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">{product.brand}</p>}
              <h1 className="text-xl font-bold text-gray-800 mb-3 leading-snug">{product.name}</h1>

              {/* Rating */}
              {product.ratings > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-green-600 text-white text-sm px-2 py-0.5 rounded font-bold">{product.ratings.toFixed(1)} ★</span>
                  <span className="text-sm text-gray-500">({product.numReviews} ratings)</span>
                </div>
              )}

              <hr className="my-3" />

              {/* ── VARIANT SELECTOR (if has variants) ── */}
              {hasVariants && (
                <div className="mb-4">
                  <p className="text-sm font-bold text-gray-700 mb-2">Select Pack Size:</p>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v, i) => {
                      const isSelected = selectedVariant?.label === v.label;
                      const vDiscount = v.mrp > v.price ? Math.round(((v.mrp - v.price) / v.mrp) * 100) : 0;
                      return (
                        <button key={i} onClick={() => { setSelectedVariant(v); setQuantity(1); }}
                          className={`border-2 rounded-lg px-3 py-2 text-left transition-all min-w-[90px] ${isSelected ? 'border-em-blue bg-blue-50' : 'border-gray-200 hover:border-gray-400'} ${v.stock === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                          disabled={v.stock === 0}>
                          <p className={`text-sm font-bold ${isSelected ? 'text-em-blue' : 'text-gray-800'}`}>{v.label}</p>
                          <p className="text-sm font-bold text-gray-900 mt-0.5">₹{v.price}</p>
                          {vDiscount > 0 && <p className="text-xs text-green-600">{vDiscount}% off</p>}
                          {v.stock === 0 && <p className="text-xs text-red-500">Out of stock</p>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── PRICE ── */}
              <div className="flex items-baseline gap-3 mb-1 flex-wrap">
                <span className="text-3xl font-bold text-gray-900">₹{currentPrice?.toLocaleString('en-IN')}</span>
                {!hasVariants && product.unit && product.unit !== 'piece' && (
                  <span className="text-sm bg-blue-50 text-em-blue font-semibold px-2 py-0.5 rounded">per {product.unit}</span>
                )}
                {currentMrp > currentPrice && (
                  <span className="text-lg text-gray-400 line-through">₹{currentMrp?.toLocaleString('en-IN')}</span>
                )}
                {discountPct > 0 && (
                  <span className="text-base text-green-600 font-bold">{discountPct}% off</span>
                )}
              </div>
              {discountPct > 0 && (
                <p className="text-sm text-green-700 font-medium mb-3">You save ₹{(currentMrp - currentPrice).toLocaleString('en-IN')}!</p>
              )}

              {/* Stock status */}
              <div className="mb-4">
                {inStock
                  ? currentStock <= 10
                    ? <span className="text-xs font-semibold bg-orange-50 text-orange-600 px-2 py-1 rounded">⚠ Only {currentStock} left</span>
                    : <span className="text-xs font-semibold bg-green-50 text-green-600 px-2 py-1 rounded">✓ In Stock</span>
                  : <span className="text-xs font-semibold bg-red-50 text-red-600 px-2 py-1 rounded">✗ Out of Stock</span>
                }
              </div>

              {/* ── QUANTITY SELECTOR ── */}
              {inStock && (
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-sm font-semibold text-gray-700">Qty:</span>
                  <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors">
                      <FiMinus size={13} />
                    </button>
                    <span className="w-10 text-center font-bold text-sm">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                      className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors">
                      <FiPlus size={13} />
                    </button>
                  </div>
                  <span className="text-xs text-gray-400">Max {currentStock}</span>
                </div>
              )}

              {/* ── CTA BUTTONS (Flipkart / Blinkit style) ── */}
              <div className="flex gap-3 mb-4">
                <button onClick={handleAddToCart} disabled={!inStock || addingCart}
                  className={`flex-1 flex items-center justify-center gap-2 font-bold py-3 rounded-lg transition-all text-sm border-2 ${addedToCart ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-em-orange text-em-orange hover:bg-orange-50'} disabled:opacity-40 disabled:cursor-not-allowed`}>
                  {addedToCart ? <><FiCheck size={16} /> Added!</> : <><FiShoppingCart size={16} /> ADD TO CART</>}
                </button>
                <button onClick={handleBuyNow} disabled={!inStock || buyingNow}
                  className="flex-1 flex items-center justify-center gap-2 bg-em-blue hover:bg-em-blue-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors text-sm">
                  {buyingNow ? 'Please wait...' : '⚡ BUY NOW'}
                </button>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-2 border-t pt-3 text-center">
                <div className="flex flex-col items-center gap-1 text-xs text-gray-500">
                  <FiTruck size={15} className="text-em-blue" />
                  <span>30 Min<br/>Delivery</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-xs text-gray-500">
                  <FiShield size={15} className="text-green-600" />
                  <span>100%<br/>Trusted</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-xs text-gray-500">
                  <FiShield size={15} className="text-orange-500" />
                  <span>Genuine<br/>Product</span>
                </div>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="bg-white rounded-lg shadow-card p-5">
                <h2 className="font-bold text-gray-800 mb-2">About this product</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <ReviewsSection productId={product._id} />
      </div>
    </StoreLayout>
  );
}
