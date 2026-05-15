'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useApp } from '@/lib/AppContext';
import { FiGrid, FiPackage, FiShoppingBag, FiStar, FiUpload, FiLogOut, FiMenu, FiX } from 'react-icons/fi';

const NAV = [
  { href: '/admin/dashboard', icon: FiGrid, label: 'Dashboard' },
  { href: '/admin/products', icon: FiPackage, label: 'Products' },
  { href: '/admin/orders', icon: FiShoppingBag, label: 'Orders' },
  { href: '/admin/reviews', icon: FiStar, label: 'Reviews' },
  { href: '/admin/bulk-upload', icon: FiUpload, label: 'Bulk Upload' },
];

export default function AdminLayout({ children }) {
  const { logout, user } = useApp();
  const pathname = usePathname();
  const [sideOpen, setSideOpen] = useState(false);

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-em-blue text-white w-64">
      <div className="p-4 border-b border-blue-800 flex items-center gap-3">
        <div className="w-9 h-9 relative flex-shrink-0">
          <Image src="/logo.jpg" alt="L MART" fill className="object-contain rounded" />
        </div>
        <div>
          <p className="font-bold text-sm">L MART Admin</p>
          <p className="text-xs text-blue-300">Management Panel</p>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} onClick={() => setSideOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors ${pathname === href ? 'bg-blue-800 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'}`}>
            <Icon size={17} />{label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-blue-800">
        <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded text-sm text-blue-200 hover:text-white hover:bg-blue-800 mb-1">🏪 View Store</Link>
        <button onClick={logout} className="flex items-center gap-3 px-3 py-2 rounded text-sm text-red-300 hover:text-white hover:bg-red-700 w-full">
          <FiLogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-shrink-0"><Sidebar /></div>

      {/* Mobile sidebar */}
      {sideOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="flex-shrink-0"><Sidebar /></div>
          <div className="flex-1 bg-black/50" onClick={() => setSideOpen(false)} />
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3 md:hidden">
          <button onClick={() => setSideOpen(true)}><FiMenu size={20} /></button>
          <span className="font-bold text-em-blue">L MART Admin</span>
        </div>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
