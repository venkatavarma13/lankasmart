'use client';
export const dynamic = 'force-dynamic';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import AdminLayout from '@/components/admin/AdminLayout';
import { useApp } from '@/lib/AppContext';
import {
  FiUpload, FiDownload, FiCheck, FiX, FiAlertTriangle,
  FiFileText, FiRefreshCw, FiPackage, FiInfo,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const CATEGORIES = ['Pachari / Grocery Items', 'Stationery Items', 'Fancy Items', 'Home Needs', 'Jewellery Accessories', 'Gift Articles', 'Fresh Fruits', 'Dry Fruits', 'Fresh Vegetables', 'Disposable Items', 'Cool Drinks', 'Chocolates & Biscuits', "Children's Toys", 'Snacks Items', 'Hot Food Items', 'Arun Ice Cream', 'Arogya Milk Products', 'Hatsun Milk & Curd', 'Tailoring Items', 'Water Purifiers', 'Bike Spare Parts', 'Surgical / Medical Items'];

const SAMPLE_PRODUCTS = [
  {
    name: 'Havells Standard Ceiling Fan 1200mm',
    brand: 'Havells',
    category: 'Pachari / Grocery Items',
    price: 1299,
    mrp: 1899,
    stock: 24,
    description: 'High-speed 1200mm ceiling fan with BEE 5-star rating. Aerodynamic blade design ensures maximum air delivery.',
    featured: 'Yes',
    trending: 'Yes',
    imageUrl: '',
    tags: 'fan,ceiling fan,havells',
    specifications: 'Sweep Size:1200mm|Speed:380 RPM|Wattage:75W|Warranty:2 Years',
  },
  {
    name: 'Philips 9W LED Bulb Pack of 6',
    brand: 'Philips',
    category: 'Lights',
    price: 349,
    mrp: 599,
    stock: 200,
    description: 'Cool daylight 6500K LED bulbs. Energy-saving with 15000 hours lifespan.',
    featured: 'Yes',
    trending: 'No',
    imageUrl: '',
    tags: 'led,bulb,philips',
    specifications: 'Wattage:9W|Lumens:900lm|Color Temp:6500K|Lifespan:15000 hrs',
  },
  {
    name: 'Kent Grand Plus RO Purifier 8L',
    brand: 'Kent',
    category: 'Water Purifiers',
    price: 14999,
    mrp: 19999,
    stock: 10,
    description: 'Advanced RO+UV+UF purifier with TDS controller. 8L storage, 20L/hr purification.',
    featured: 'Yes',
    trending: 'Yes',
    imageUrl: '',
    tags: 'ro,purifier,kent,water',
    specifications: 'Purification:RO+UV+UF|Storage:8 Litres|Rate:20 L/hr|Warranty:1 Year',
  },
];

// Convert array of objects to CSV
function toCSV(data) {
  if (!data.length) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const val = String(row[h] ?? '');
      return val.includes(',') ? `"${val}"` : val;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

// Parse CSV string to array of objects
function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
      else { current += char; }
    }
    values.push(current.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] ?? ''; });
    return obj;
  });
}

export default function BulkUploadPage() {
  const { user, loading, getAuthHeaders } = useApp();
  const router = useRouter();
  const fileRef = useRef();

  const [step, setStep] = useState(1); // 1=upload, 2=preview, 3=result
  const [fileName, setFileName] = useState('');
  const [parsedData, setParsedData] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState([]);

  if (!loading && (!user || user.role !== 'admin')) {
    router.push('/login');
    return null;
  }

  // Download sample CSV template
  const downloadTemplate = () => {
    const csv = toCSV(SAMPLE_PRODUCTS);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lmart_products_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded! Fill it with your products and upload.');
  };

  // Handle file selection
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'txt'].includes(ext)) {
      toast.error('Please upload a CSV file (.csv)');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target.result;
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          toast.error('File is empty or has no data rows');
          return;
        }

        // Validate structure
        const required = ['name', 'brand', 'category', 'price', 'mrp', 'stock', 'description'];
        const headers = Object.keys(parsed[0]);
        const missing = required.filter(r => !headers.includes(r));
        if (missing.length > 0) {
          toast.error(`Missing columns: ${missing.join(', ')}`);
          return;
        }

        // Quick validation preview
        const errs = [];
        parsed.forEach((row, i) => {
          const rowNum = i + 2;
          if (!row.name) errs.push(`Row ${rowNum}: Name is missing`);
          if (!row.brand) errs.push(`Row ${rowNum}: Brand is missing`);
          if (!CATEGORIES.includes(row.category)) errs.push(`Row ${rowNum}: Invalid category "${row.category}"`);
          if (isNaN(Number(row.price)) || Number(row.price) <= 0) errs.push(`Row ${rowNum}: Invalid price`);
          if (isNaN(Number(row.mrp)) || Number(row.mrp) <= 0) errs.push(`Row ${rowNum}: Invalid MRP`);
          if (isNaN(Number(row.stock)) || Number(row.stock) < 0) errs.push(`Row ${rowNum}: Invalid stock`);
        });

        setErrors(errs);
        setParsedData(parsed);
        setStep(2);
        toast.success(`${parsed.length} products loaded! Review and upload.`);
      } catch (err) {
        toast.error('Failed to parse file. Make sure it is a valid CSV.');
      }
    };
    reader.readAsText(file);
  };

  // Upload to server
  const handleUpload = async () => {
    if (errors.length > 0) {
      toast.error('Please fix errors before uploading');
      return;
    }
    setUploading(true);
    try {
      const { data } = await axios.post(
        '/api/admin/bulk-upload',
        { products: parsedData },
        { headers: getAuthHeaders() }
      );
      if (data.success) {
        setResult(data);
        setStep(3);
        toast.success(`✅ ${data.successCount} products uploaded successfully!`);
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed. Please try again.');
    }
    setUploading(false);
  };

  const reset = () => {
    setStep(1);
    setFileName('');
    setParsedData([]);
    setErrors([]);
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
              <FiUpload className="text-em-blue" /> Bulk Product Upload
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Upload hundreds of products at once using a CSV file
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/products')}
            className="text-sm text-em-blue hover:underline font-medium">
            ← Back to Products
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8">
          {[
            { n: 1, label: 'Upload File' },
            { n: 2, label: 'Review Data' },
            { n: 3, label: 'Done' },
          ].map(({ n, label }, i, arr) => (
            <div key={n} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                step > n ? 'bg-green-500 text-white' :
                step === n ? 'bg-em-blue text-white' :
                'bg-gray-200 text-gray-400'
              }`}>
                {step > n ? <FiCheck size={15} /> : n}
              </div>
              <span className={`text-sm font-medium ${step >= n ? 'text-gray-800' : 'text-gray-400'}`}>
                {label}
              </span>
              {i < arr.length - 1 && (
                <div className={`w-16 h-0.5 mx-1 ${step > n ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* ── STEP 1: UPLOAD ─────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            {/* How it works */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                <FiInfo size={16} /> How Bulk Upload Works
              </h3>
              <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
                <li>Download the sample CSV template below</li>
                <li>Open it in <strong>Excel, Google Sheets, or Notepad</strong></li>
                <li>Fill in your products (one per row)</li>
                <li>Save as CSV format</li>
                <li>Upload here — all products added instantly!</li>
              </ol>
            </div>

            {/* Download Template */}
            <div className="bg-white border-2 border-dashed border-green-300 rounded-xl p-6 text-center">
              <FiDownload size={32} className="text-green-500 mx-auto mb-3" />
              <h3 className="font-bold text-gray-800 mb-2">Step 1 — Download Template</h3>
              <p className="text-sm text-gray-500 mb-4">
                Get the CSV template with correct column headers and 3 sample products
              </p>
              <button onClick={downloadTemplate}
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-2.5 rounded-lg transition-colors">
                <FiDownload size={16} /> Download CSV Template
              </button>
            </div>

            {/* Upload File */}
            <div
              className="bg-white border-2 border-dashed border-em-blue rounded-xl p-8 text-center cursor-pointer hover:bg-blue-50 transition-colors"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) { fileRef.current.files = e.dataTransfer.files; handleFile({ target: { files: [file] } }); }
              }}>
              <FiUpload size={40} className="text-em-blue mx-auto mb-3" />
              <h3 className="font-bold text-gray-800 mb-2">Step 2 — Upload Your CSV File</h3>
              <p className="text-sm text-gray-500 mb-4">
                Click to browse or drag & drop your CSV file here
              </p>
              <div className="inline-flex items-center gap-2 bg-em-blue hover:bg-em-blue-dark text-white font-bold px-6 py-2.5 rounded-lg transition-colors">
                <FiUpload size={16} /> Choose CSV File
              </div>
              <p className="text-xs text-gray-400 mt-3">Supports .csv files · Max 500 products per file</p>
              <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
            </div>

            {/* CSV Column Reference */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <FiFileText size={15} /> CSV Column Reference
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-em-blue text-white text-xs">
                      <th className="px-4 py-2.5 text-left">Column Name</th>
                      <th className="px-4 py-2.5 text-left">Required?</th>
                      <th className="px-4 py-2.5 text-left">Example</th>
                      <th className="px-4 py-2.5 text-left">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      { col: 'name', req: true, ex: 'Havells Ceiling Fan', note: 'Product full name' },
                      { col: 'brand', req: true, ex: 'Havells', note: 'Brand name' },
                      { col: 'category', req: true, ex: 'Pachari / Grocery Items', note: 'Must match exactly: ' + CATEGORIES.slice(0, 3).join(', ') + '...' },
                      { col: 'price', req: true, ex: '1299', note: 'Selling price in ₹ (numbers only)' },
                      { col: 'mrp', req: true, ex: '1899', note: 'Original MRP in ₹ (numbers only)' },
                      { col: 'stock', req: true, ex: '24', note: 'Available quantity (0 or more)' },
                      { col: 'description', req: true, ex: 'High speed fan...', note: 'Product description' },
                      { col: 'featured', req: false, ex: 'Yes', note: 'Yes or No (shows on home page)' },
                      { col: 'trending', req: false, ex: 'No', note: 'Yes or No (shows in trending)' },
                      { col: 'imageUrl', req: false, ex: 'https://...jpg', note: 'Direct image URL (optional)' },
                      { col: 'tags', req: false, ex: 'fan,ceiling,havells', note: 'Comma separated tags' },
                      { col: 'specifications', req: false, ex: 'Wattage:75W|Speed:380 RPM', note: 'Key:Value pairs separated by |' },
                    ].map(({ col, req, ex, note }) => (
                      <tr key={col} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-mono text-xs font-bold text-em-blue">{col}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${req ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                            {req ? 'Required' : 'Optional'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-600 font-mono">{ex}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">{note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Valid Categories Box */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <h3 className="font-bold text-yellow-800 text-sm mb-2 flex items-center gap-2">
                <FiAlertTriangle size={15} /> Valid Category Names (copy exactly)
              </h3>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(c => (
                  <span key={c} className="bg-white border border-yellow-300 text-yellow-800 text-xs font-bold px-3 py-1 rounded-lg">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: PREVIEW ──────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'File Name', value: fileName, color: 'text-gray-800' },
                { label: 'Total Rows', value: parsedData.length, color: 'text-em-blue' },
                { label: 'Errors Found', value: errors.length, color: errors.length > 0 ? 'text-red-500' : 'text-green-600' },
                { label: 'Ready to Upload', value: parsedData.length - errors.length, color: 'text-green-600' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className={`text-xl font-extrabold ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Errors */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h3 className="font-bold text-red-700 mb-2 flex items-center gap-2">
                  <FiX size={16} /> {errors.length} Error{errors.length > 1 ? 's' : ''} Found — Fix before uploading
                </h3>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                      <span className="mt-0.5">⚠</span> {err}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Data Preview Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b flex items-center justify-between">
                <h3 className="font-bold text-gray-800 text-sm">
                  Preview — {parsedData.length} Products
                </h3>
                <span className="text-xs text-gray-400">Showing first 10 rows</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {['#', 'Name', 'Brand', 'Category', 'Price', 'MRP', 'Stock', 'Featured', 'Status'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsedData.slice(0, 10).map((row, i) => {
                      const hasError = errors.some(e => e.includes(`Row ${i + 2}:`));
                      return (
                        <tr key={i} className={hasError ? 'bg-red-50' : 'hover:bg-gray-50'}>
                          <td className="px-3 py-2 text-gray-400">{i + 2}</td>
                          <td className="px-3 py-2 font-medium text-gray-800 max-w-[180px] truncate">{row.name || '—'}</td>
                          <td className="px-3 py-2 text-gray-600">{row.brand || '—'}</td>
                          <td className="px-3 py-2">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                              CATEGORIES.includes(row.category) ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-600'
                            }`}>
                              {row.category || '—'}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-semibold">₹{row.price || '—'}</td>
                          <td className="px-3 py-2 text-gray-500">₹{row.mrp || '—'}</td>
                          <td className="px-3 py-2">{row.stock || '—'}</td>
                          <td className="px-3 py-2">
                            <span className={`text-xs font-bold ${
                              String(row.featured).toLowerCase() === 'yes' ? 'text-green-600' : 'text-gray-400'
                            }`}>
                              {String(row.featured).toLowerCase() === 'yes' ? '⭐ Yes' : 'No'}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            {hasError
                              ? <span className="text-red-500 font-bold">❌ Error</span>
                              : <span className="text-green-600 font-bold">✅ OK</span>
                            }
                          </td>
                        </tr>
                      );
                    })}
                    {parsedData.length > 10 && (
                      <tr>
                        <td colSpan={9} className="px-3 py-2 text-center text-gray-400 text-xs">
                          ... and {parsedData.length - 10} more rows
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button onClick={reset}
                className="flex items-center gap-2 border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-50 font-semibold text-sm transition-colors">
                <FiRefreshCw size={15} /> Start Over
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || errors.length > 0}
                className="flex-1 flex items-center justify-center gap-2 bg-em-blue hover:bg-em-blue-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg transition-colors text-sm">
                {uploading ? (
                  <><FiRefreshCw size={15} className="animate-spin" /> Uploading {parsedData.length} products...</>
                ) : (
                  <><FiUpload size={15} /> Upload {parsedData.length} Products Now</>
                )}
              </button>
            </div>

            {errors.length > 0 && (
              <p className="text-sm text-red-500 text-center font-medium">
                ⚠️ Fix the {errors.length} error{errors.length > 1 ? 's' : ''} in your CSV file and re-upload
              </p>
            )}
          </div>
        )}

        {/* ── STEP 3: RESULT ───────────────────────────────────────────────── */}
        {step === 3 && result && (
          <div className="space-y-5">
            {/* Success banner */}
            <div className={`rounded-xl p-6 text-center border-2 ${
              result.failedCount === 0
                ? 'bg-green-50 border-green-300'
                : 'bg-yellow-50 border-yellow-300'
            }`}>
              <div className="text-5xl mb-3">{result.failedCount === 0 ? '🎉' : '⚠️'}</div>
              <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Upload Complete!</h2>
              <p className="text-gray-600">{result.message}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
                <FiCheck size={28} className="text-green-500 mx-auto mb-2" />
                <p className="text-4xl font-extrabold text-green-600">{result.successCount}</p>
                <p className="text-sm text-green-700 font-semibold mt-1">Products Added Successfully</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
                <FiX size={28} className="text-red-400 mx-auto mb-2" />
                <p className="text-4xl font-extrabold text-red-500">{result.failedCount}</p>
                <p className="text-sm text-red-600 font-semibold mt-1">Products Failed</p>
              </div>
            </div>

            {/* Failed items detail */}
            {result.failed?.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h3 className="font-bold text-red-700 mb-3 flex items-center gap-2">
                  <FiAlertTriangle size={16} /> Failed Products — Fix and Re-upload
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {result.failed.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm bg-white rounded-lg p-2.5 border border-red-100">
                      <span className="text-red-400 mt-0.5">✗</span>
                      <div>
                        <span className="font-semibold text-gray-800">Row {f.row}: {f.name}</span>
                        <p className="text-xs text-red-600 mt-0.5">{f.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button onClick={reset}
                className="flex-1 flex items-center justify-center gap-2 border-2 border-em-blue text-em-blue hover:bg-blue-50 font-bold py-3 rounded-lg transition-colors text-sm">
                <FiUpload size={15} /> Upload More Products
              </button>
              <button onClick={() => router.push('/admin/products')}
                className="flex-1 flex items-center justify-center gap-2 bg-em-blue hover:bg-em-blue-dark text-white font-bold py-3 rounded-lg transition-colors text-sm">
                <FiPackage size={15} /> View All Products
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
