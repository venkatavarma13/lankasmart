'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import axios from 'axios';
import AdminLayout from '@/components/admin/AdminLayout';
import { useApp } from '@/lib/AppContext';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiUpload, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';

const CATS = ['Pachari / Grocery Items','Stationery Items','Fancy Items','Home Needs','Jewellery Accessories','Gift Articles','Fresh Fruits','Dry Fruits','Fresh Vegetables','Disposable Items','Cool Drinks','Chocolates & Biscuits',"Children's Toys",'Snacks Items','Hot Food Items','Arun Ice Cream','Arogya Milk Products','Hatsun Milk & Curd','Tailoring Items','Water Purifiers','Bike Spare Parts','Surgical / Medical Items'];
const UNITS = [
  { value: 'piece', label: 'Piece (nos)' },
  { value: 'kg', label: 'kg (Kilogram)' },
  { value: 'g', label: 'g (Gram)' },
  { value: 'litre', label: 'Litre (L)' },
  { value: 'ml', label: 'ml (Millilitre)' },
  { value: 'metre', label: 'Metre (m)' },
  { value: 'cm', label: 'cm (Centimetre)' },
  { value: 'pack', label: 'Pack' },
];
const EMPTY = { name:'', brand:'', category:'Pachari / Grocery Items', price:'', mrp:'', description:'', stock:'', unit:'piece', variants:[], featured:false, trending:false, images:[], specifications:[], barcode:'' };
const EMPTY_VARIANT = { label:'', value:'', price:'', mrp:'', stock:'' };

export default function AdminProducts() {
  const { user, loading, getAuthHeaders } = useApp();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [fetching, setFetching] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [useVariants, setUseVariants] = useState(false);
  const fileRef = useRef();

  useEffect(() => { if (!loading && (!user || user.role !== 'admin')) router.push('/login'); }, [loading, user, router]);

  const fetchProducts = async () => {
    setFetching(true);
    try {
      const { data } = await axios.get(`/api/admin/products?page=${page}&limit=15&search=${search}`, { headers: getAuthHeaders() });
      if (data.success) { setProducts(data.products); setTotal(data.total); setPages(data.pages); }
    } catch {}
    setFetching(false);
  };

  useEffect(() => { if (user?.role === 'admin') fetchProducts(); }, [user, page, search]);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setUseVariants(false); setShowModal(true); };
  const openEdit = (p) => {
    setEditing(p._id);
    setForm({ ...p, price: p.price.toString(), mrp: p.mrp.toString(), stock: p.stock.toString(),
      variants: (p.variants || []).map(v => ({ ...v, price: v.price.toString(), mrp: v.mrp.toString(), stock: v.stock.toString(), value: v.value.toString() })) });
    setUseVariants((p.variants || []).length > 0);
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditing(null); setForm(EMPTY); };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = 5 - form.images.length;
    if (remaining <= 0) { toast.error('Max 5 images'); return; }
    setUploading(true);
    let uploaded = 0;
    for (const file of files.slice(0, remaining)) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const base64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = ev => res(ev.target.result); r.onerror = rej; r.readAsDataURL(file); });
        const { data } = await axios.post('/api/upload', { image: base64 }, { headers: getAuthHeaders() });
        if (data.success) { setForm(f => ({ ...f, images: [...f.images, { url: data.url, publicId: data.publicId }] })); uploaded++; }
        else toast.error(data.message);
      } catch (err) { toast.error('Upload failed: ' + (err.response?.data?.message || err.message)); }
    }
    if (uploaded > 0) toast.success(`${uploaded} image(s) uploaded!`);
    setUploading(false);
    e.target.value = '';
  };

  const removeImage = (i) => setForm(f => ({ ...f, images: f.images.filter((_,idx) => idx !== i) }));

  // Variants
  const addVariant = () => setForm(f => ({ ...f, variants: [...f.variants, { ...EMPTY_VARIANT }] }));
  const updateVariant = (i, field, val) => setForm(f => ({ ...f, variants: f.variants.map((v,idx) => idx === i ? { ...v, [field]: val } : v) }));
  const removeVariant = (i) => setForm(f => ({ ...f, variants: f.variants.filter((_,idx) => idx !== i) }));

  const handleSave = async () => {
    if (!form.name || !form.description || !form.category) { toast.error('Fill name, description, category'); return; }
    if (!useVariants && (!form.price || !form.mrp || !form.stock)) { toast.error('Fill price, MRP, stock'); return; }
    if (useVariants && form.variants.length === 0) { toast.error('Add at least one variant'); return; }
    setSaving(true);
    try {
      const parsedVariants = form.variants.map(v => ({ ...v, value: Number(v.value), price: Number(v.price), mrp: Number(v.mrp), stock: Number(v.stock) }));
      const basePrice = useVariants ? Number(parsedVariants[0]?.price || 0) : Number(form.price);
      const baseMrp = useVariants ? Number(parsedVariants[0]?.mrp || 0) : Number(form.mrp);
      const baseStock = useVariants ? parsedVariants.reduce((s,v) => s + v.stock, 0) : Number(form.stock);
      const payload = { ...form, price: basePrice, mrp: baseMrp, stock: baseStock, variants: useVariants ? parsedVariants : [] };
      const url = editing ? `/api/admin/products?id=${editing}` : '/api/admin/products';
      const method = editing ? 'put' : 'post';
      const { data } = await axios[method](url, payload, { headers: getAuthHeaders() });
      if (data.success) { toast.success(editing ? 'Updated!' : 'Product added!'); closeModal(); fetchProducts(); }
      else toast.error(data.message);
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    setSaving(false);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try { await axios.delete(`/api/admin/products?id=${id}`, { headers: getAuthHeaders() }); toast.success('Deleted'); fetchProducts(); }
    catch { toast.error('Delete failed'); }
  };

  if (loading || !user) return null;

  const unitLabel = UNITS.find(u => u.value === form.unit)?.label || form.unit;

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Products</h1>
            <p className="text-gray-500 text-sm">{total} total products</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => router.push('/admin/bulk-upload')} className="flex items-center gap-2 border-2 border-em-blue text-em-blue px-4 py-2 rounded font-semibold text-sm">📊 Bulk Upload</button>
            <button onClick={openAdd} className="flex items-center gap-2 bg-em-blue text-white px-4 py-2 rounded font-semibold text-sm"><FiPlus size={16}/> Add Product</button>
          </div>
        </div>

        <div className="relative mb-4 max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search products..."
            className="w-full border rounded px-3 py-2 pl-9 text-sm outline-none focus:border-em-blue"/>
        </div>

        <div className="bg-white rounded-lg shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Stock</th>
                  <th className="px-4 py-3 text-center">Variants</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fetching ? Array.from({length:8}).map((_,i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="skeleton h-4 rounded"/></td></tr>
                )) : products.map(p => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 bg-gray-100 rounded flex-shrink-0">
                          {p.images?.[0]?.url ? <Image src={p.images[0].url} alt={p.name} fill className="object-contain p-1 rounded" sizes="40px"/>
                            : <div className="w-full h-full flex items-center justify-center text-base">🛒</div>}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 line-clamp-1">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.brand} · {p.unit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{p.category}</td>
                    <td className="px-4 py-3 text-right font-semibold">₹{p.price.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right"><span className={`font-semibold ${p.stock===0?'text-red-500':p.stock<10?'text-orange-500':'text-green-600'}`}>{p.stock}</span></td>
                    <td className="px-4 py-3 text-center text-xs">{p.variants?.length > 0 ? <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{p.variants.length} variants</span> : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEdit(p)} className="p-1.5 text-em-blue hover:bg-green-50 rounded"><FiEdit2 size={14}/></button>
                        <button onClick={() => handleDelete(p._id, p.name)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><FiTrash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t">
              {Array.from({length: Math.min(pages,5)}, (_,i) => i+1).map(p => (
                <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded text-sm ${page===p?'bg-em-blue text-white':'border hover:bg-gray-50'}`}>{p}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
              <h2 className="font-bold text-xl">{editing ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><FiX size={20}/></button>
            </div>
            <div className="p-5 space-y-5">

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Product Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="w-full border rounded px-3 py-2 text-sm outline-none focus:border-em-blue" placeholder="e.g. Sona Masoori Rice"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Brand</label>
                  <input value={form.brand} onChange={e => setForm(f => ({...f, brand: e.target.value}))} className="w-full border rounded px-3 py-2 text-sm outline-none focus:border-em-blue" placeholder="Brand name"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Category *</label>
                  <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className="w-full border rounded px-3 py-2 text-sm outline-none focus:border-em-blue bg-white">
                    {CATS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description *</label>
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={3} className="w-full border rounded px-3 py-2 text-sm outline-none focus:border-em-blue resize-none" placeholder="Product description..."/>
              </div>

              {/* Unit */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Unit / Measurement</label>
                <select value={form.unit} onChange={e => setForm(f => ({...f, unit: e.target.value}))} className="w-full border rounded px-3 py-2 text-sm outline-none focus:border-em-blue bg-white">
                  {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>

              {/* Variant toggle */}
              <div className="border-2 border-dashed rounded-xl p-4" style={{ borderColor: useVariants ? '#1a5c2a' : '#e5e7eb' }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-sm text-gray-800">📦 Variant Pricing (like Blinkit / Instamart)</p>
                    <p className="text-xs text-gray-500 mt-0.5">Add different sizes with different prices (e.g. 500g = ₹45, 1kg = ₹85)</p>
                  </div>
                  <button type="button" onClick={() => { setUseVariants(v => !v); if (!useVariants && form.variants.length === 0) addVariant(); }}
                    className={`relative w-12 h-6 rounded-full transition-colors ${useVariants ? 'bg-green-600' : 'bg-gray-300'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${useVariants ? 'left-6' : 'left-0.5'}`}/>
                  </button>
                </div>

                {useVariants ? (
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="grid grid-cols-5 gap-2 text-xs font-semibold text-gray-500 px-1">
                      <span>Label</span><span>Value</span><span>Price ₹</span><span>MRP ₹</span><span>Stock</span>
                    </div>
                    {form.variants.map((v, i) => (
                      <div key={i} className="grid grid-cols-5 gap-2 items-center bg-gray-50 rounded-lg p-2">
                        <input value={v.label} onChange={e => updateVariant(i,'label',e.target.value)}
                          className="border rounded px-2 py-1.5 text-xs outline-none focus:border-em-blue" placeholder={`e.g. 500${form.unit}`}/>
                        <input type="number" value={v.value} onChange={e => updateVariant(i,'value',e.target.value)}
                          className="border rounded px-2 py-1.5 text-xs outline-none focus:border-em-blue" placeholder="500"/>
                        <input type="number" value={v.price} onChange={e => updateVariant(i,'price',e.target.value)}
                          className="border rounded px-2 py-1.5 text-xs outline-none focus:border-em-blue" placeholder="45"/>
                        <input type="number" value={v.mrp} onChange={e => updateVariant(i,'mrp',e.target.value)}
                          className="border rounded px-2 py-1.5 text-xs outline-none focus:border-em-blue" placeholder="50"/>
                        <div className="flex gap-1">
                          <input type="number" value={v.stock} onChange={e => updateVariant(i,'stock',e.target.value)}
                            className="flex-1 border rounded px-2 py-1.5 text-xs outline-none focus:border-em-blue" placeholder="10"/>
                          <button onClick={() => removeVariant(i)} className="text-red-400 hover:text-red-600 px-1"><FiX size={12}/></button>
                        </div>
                      </div>
                    ))}
                    <button onClick={addVariant} className="text-sm font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 border-dashed transition-colors" style={{ color: '#1a5c2a', borderColor: '#1a5c2a' }}>
                      <FiPlus size={14}/> Add Variant
                    </button>
                    <div className="text-xs text-gray-400 bg-blue-50 p-2 rounded">
                      💡 Tip: Label = what customer sees (e.g. "500g"), Value = number (500). First variant price becomes the base price.
                    </div>
                  </div>
                ) : (
                  /* Simple price */
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Selling Price ₹ *</label>
                      <input type="number" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} className="w-full border rounded px-3 py-2 text-sm outline-none focus:border-em-blue" placeholder="0"/>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">MRP ₹ *</label>
                      <input type="number" value={form.mrp} onChange={e => setForm(f => ({...f, mrp: e.target.value}))} className="w-full border rounded px-3 py-2 text-sm outline-none focus:border-em-blue" placeholder="0"/>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Stock *</label>
                      <input type="number" value={form.stock} onChange={e => setForm(f => ({...f, stock: e.target.value}))} className="w-full border rounded px-3 py-2 text-sm outline-none focus:border-em-blue" placeholder="0"/>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({...f, featured: e.target.checked}))} className="accent-em-blue"/>
                  <span className="text-sm font-medium">⭐ Featured</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.trending} onChange={e => setForm(f => ({...f, trending: e.target.checked}))} className="accent-em-blue"/>
                  <span className="text-sm font-medium">🔥 Trending</span>
                </label>
              </div>

              {/* Images */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  Product Images <span className="text-gray-400 font-normal">(Min 1, Max 5 — {form.images.length}/5)</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.images.map((img,i) => (
                    <div key={i} className="relative w-16 h-16 bg-gray-100 rounded overflow-hidden border">
                      <Image src={img.url} alt="" fill className="object-contain p-1" sizes="64px"/>
                      <button onClick={() => removeImage(i)} className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center text-xs rounded-bl">×</button>
                    </div>
                  ))}
                  {form.images.length < 5 && (
                    <button onClick={() => fileRef.current?.click()} disabled={uploading}
                      className="w-16 h-16 border-2 border-dashed rounded flex flex-col items-center justify-center text-gray-400 text-xs hover:border-em-blue hover:text-em-blue disabled:opacity-50">
                      {uploading ? '⏳' : <><FiUpload size={14}/><span className="mt-0.5 leading-tight text-center">Add<br/>Photo</span></>}
                    </button>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden"/>
                </div>
                {uploading && <p className="text-xs text-blue-600">⏳ Uploading image to Cloudinary...</p>}
              </div>

              {/* Specs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-600">Specifications</label>
                  {/* Barcode */}
              <div style={{ border:'2px solid #e5e7eb', borderRadius:12, padding:16 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:8 }}>
                  🔲 Product Barcode / SKU
                </label>
                <div style={{ display:'flex', gap:8 }}>
                  <input
                    value={form.barcode}
                    onChange={e => setForm(f => ({...f, barcode: e.target.value}))}
                    placeholder="Scan or type barcode number (e.g. 8901030874321)"
                    style={{
                      flex:1, border:'1.5px solid #d1d5db', borderRadius:8,
                      padding:'10px 14px', fontSize:14, outline:'none',
                      fontFamily:'monospace', letterSpacing:1,
                    }}
                    onFocus={e => e.target.style.borderColor='#1a5c2a'}
                    onBlur={e => e.target.style.borderColor='#d1d5db'}
                  />
                  {form.barcode && (
                    <button
                      onClick={() => setForm(f => ({...f, barcode:''}))}
                      style={{ padding:'0 12px', background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:13 }}>
                      ✕ Clear
                    </button>
                  )}
                </div>
                {form.barcode && (
                  <div style={{ marginTop:10, padding:'8px 12px', background:'#f0fdf4', borderRadius:8, border:'1px solid #bbf7d0', display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:20 }}>✅</span>
                    <div>
                      <span style={{ fontSize:11, color:'#15803d', fontWeight:700 }}>Barcode saved: </span>
                      <span style={{ fontSize:13, fontFamily:'monospace', fontWeight:700, color:'#14532d', letterSpacing:1 }}>{form.barcode}</span>
                    </div>
                  </div>
                )}
                <p style={{ fontSize:11, color:'#9ca3af', marginTop:8 }}>
                  💡 Tip: Use a USB barcode scanner — click this box, then scan the product. Or type the number manually.
                </p>
              </div>
                  <button onClick={() => setForm(f => ({...f, specifications: [...f.specifications, {key:'',value:''}]}))} className="text-xs text-em-blue hover:underline">+ Add Row</button>
                </div>
                {form.specifications.map((spec,i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input value={spec.key} onChange={e => setForm(f => ({...f, specifications: f.specifications.map((s,idx) => idx===i ? {...s,key:e.target.value} : s)}))} placeholder="e.g. Weight" className="flex-1 border rounded px-2 py-1.5 text-xs outline-none focus:border-em-blue"/>
                    <input value={spec.value} onChange={e => setForm(f => ({...f, specifications: f.specifications.map((s,idx) => idx===i ? {...s,value:e.target.value} : s)}))} placeholder="e.g. 500g" className="flex-1 border rounded px-2 py-1.5 text-xs outline-none focus:border-em-blue"/>
                    <button onClick={() => setForm(f => ({...f, specifications: f.specifications.filter((_,idx) => idx!==i)}))} className="text-red-400 px-1"><FiX size={14}/></button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2 border-t">
                <button onClick={closeModal} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded font-semibold text-sm">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 bg-em-blue text-white py-2.5 rounded font-bold text-sm disabled:bg-gray-300">
                  {saving ? 'Saving...' : editing ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
