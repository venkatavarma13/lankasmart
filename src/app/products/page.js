'use client';
import { useLang } from '@/lib/LanguageContext';;
export const dynamic = 'force-dynamic';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import StoreLayout from '@/components/layout/StoreLayout';
import ProductCard from '@/components/product/ProductCard';
import { ProductGridSkeleton } from '@/components/ui/Skeletons';
import { FiFilter, FiChevronDown, FiX } from 'react-icons/fi';

const CATEGORIES = ['All', 'Pachari / Grocery Items', 'Stationery Items', 'Fancy Items', 'Home Needs', 'Jewellery Accessories', 'Gift Articles', 'Fresh Fruits', 'Dry Fruits', 'Fresh Vegetables', 'Disposable Items', 'Cool Drinks', 'Chocolates & Biscuits', "Children's Toys", 'Snacks Items', 'Hot Food Items', 'Arun Ice Cream', 'Arogya Milk Products', 'Hatsun Milk & Curd', 'Tailoring Items', 'Water Purifiers', 'Bike Spare Parts', 'Surgical / Medical Items'];
const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating-desc', label: 'Top Rated' },
  { value: 'popular-desc', label: 'Most Popular' },
];

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="text-gray-500">Loading products...</div></div>}>
      <ProductsContent />
    </Suspense>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const { t, catName } = useLang();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sort, setSort] = useState('createdAt-desc');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  const [error, setError] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [sortField, sortOrder] = sort.split('-');
      const params = new URLSearchParams({
        page, limit: 12, sort: sortField, order: sortOrder,
        ...(category && category !== 'All' && { category }),
        ...(search && { search }),
        ...(priceRange.min && { minPrice: priceRange.min }),
        ...(priceRange.max && { maxPrice: priceRange.max }),
      });
      const { data } = await axios.get(`/api/products?${params}`);
      if (data.success) { setProducts(data.products); setPagination(data.pagination); }
      else setError(data.message || 'Failed to load products');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to connect to server');
    }
    setLoading(false);
  }, [category, search, sort, page, priceRange]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => {
    setCategory(searchParams.get('category') || 'All');
    setSearch(searchParams.get('search') || '');
    setPage(1);
  }, [searchParams]);

  const clearFilters = () => { setCategory('All'); setSearch(''); setPriceRange({ min: '', max: '' }); setSort('createdAt-desc'); setPage(1); };

  return (
    <StoreLayout>
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {search ? `Results for "${search}"` : category !== 'All' ? category : 'All Products'}
            </h1>
            {!loading && <p className="text-sm text-gray-500">{pagination.total} products found</p>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 border border-gray-300 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
              <FiFilter size={14} /> Filters
            </button>
            <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="border border-gray-300 px-3 py-1.5 rounded text-sm outline-none bg-white">
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-4">
          {/* Sidebar filters */}
          <aside className={`${showFilters ? 'block' : 'hidden'} md:block w-56 flex-shrink-0`}>
            <div className="bg-white rounded shadow-card p-4 space-y-5 sticky top-20">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Filters</h3>
                <button onClick={clearFilters} className="text-xs text-em-blue hover:underline">Clear All</button>
              </div>

              {/* Category */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Category</h4>
                <div className="space-y-1">
                  {CATEGORIES.map((cat) => (
                    <label key={cat} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="category" checked={category === cat}
                        onChange={() => { setCategory(cat); setPage(1); }}
                        className="accent-em-blue" />
                      <span className="text-sm text-gray-700">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Price Range (₹)</h4>
                <div className="flex gap-2">
                  <input type="number" placeholder="Min" value={priceRange.min}
                    onChange={(e) => setPriceRange((p) => ({ ...p, min: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs outline-none" />
                  <input type="number" placeholder="Max" value={priceRange.max}
                    onChange={(e) => setPriceRange((p) => ({ ...p, max: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs outline-none" />
                </div>
                <button onClick={() => setPage(1)}
                  className="mt-2 w-full bg-em-blue text-white text-xs py-1.5 rounded hover:bg-em-blue-dark">
                  Apply
                </button>
              </div>

              {/* Mobile close */}
              <button onClick={() => setShowFilters(false)} className="md:hidden w-full border border-gray-300 text-sm py-1.5 rounded">
                Close Filters
              </button>
            </div>
          </aside>

          {/* Products grid */}
          <div className="flex-1 min-w-0">
            {/* Active filters */}
            {(category !== 'All' || search || priceRange.min || priceRange.max) && (
              <div className="flex flex-wrap gap-2 mb-3">
                {category !== 'All' && (
                  <span className="flex items-center gap-1 bg-blue-50 text-em-blue text-xs px-2 py-1 rounded-full">
                    {category} <button onClick={() => setCategory('All')}><FiX size={12} /></button>
                  </span>
                )}
                {search && (
                  <span className="flex items-center gap-1 bg-blue-50 text-em-blue text-xs px-2 py-1 rounded-full">
                    Search: {search} <button onClick={() => setSearch('')}><FiX size={12} /></button>
                  </span>
                )}
              </div>
            )}

            {loading ? <ProductGridSkeleton count={12} /> : error ? (
              <div className="bg-white rounded shadow-card p-12 text-center">
                <p className="text-5xl mb-4">⚠️</p>
                <h3 className="text-lg font-bold text-gray-700 mb-2">Failed to load products</h3>
                <p className="text-red-500 text-sm mb-4">{error}</p>
                <button onClick={fetchProducts} className="bg-em-blue text-white px-6 py-2 rounded text-sm hover:bg-em-blue-dark">Try Again</button>
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded shadow-card p-12 text-center">
                <p className="text-5xl mb-4">🔍</p>
                <h3 className="text-lg font-bold text-gray-700 mb-2">No products found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
                <button onClick={clearFilters} className="bg-em-blue text-white px-6 py-2 rounded text-sm hover:bg-em-blue-dark">
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map((p) => <ProductCard key={p._id} product={p} />)}
                </div>
                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    <button disabled={page === 1} onClick={() => setPage(page - 1)}
                      className="px-4 py-2 border rounded text-sm disabled:opacity-40 hover:bg-gray-50">← Prev</button>
                    {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => i + 1).map((p) => (
                      <button key={p} onClick={() => setPage(p)}
                        className={`px-3 py-2 border rounded text-sm ${page === p ? 'bg-em-blue text-white border-em-blue' : 'hover:bg-gray-50'}`}>
                        {p}
                      </button>
                    ))}
                    <button disabled={page === pagination.pages} onClick={() => setPage(page + 1)}
                      className="px-4 py-2 border rounded text-sm disabled:opacity-40 hover:bg-gray-50">Next →</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
