'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const BANNERS = [
  { title: '🌾 Fresh Groceries Daily', sub: 'Pachari & daily essentials at best prices', href: '/products?category=Pachari+%2F+Grocery+Items', bg: 'from-yellow-600 to-yellow-400' },
  { title: '🍎 Fresh Fruits & Vegetables', sub: 'Farm fresh produce delivered to your door', href: '/products?category=Fresh+Fruits', bg: 'from-green-700 to-green-500' },
  { title: '🥛 Dairy & Milk Products', sub: 'Arogya & Hatsun fresh dairy every day', href: '/products?category=Arogya+Milk+Products', bg: 'from-blue-700 to-blue-500' },
  { title: '🍫 Snacks & Chocolates', sub: 'Tasty treats for the whole family', href: '/products?category=Chocolates+%26+Biscuits', bg: 'from-orange-600 to-orange-400' },
];

export default function BannerCarousel() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % BANNERS.length), 4000);
    return () => clearInterval(t);
  }, []);

  const b = BANNERS[idx];

  return (
    <div className={`bg-gradient-to-r ${b.bg} rounded-xl p-8 md:p-12 text-white relative overflow-hidden min-h-[160px] flex items-center`}>
      <div className="relative z-10">
        <h2 className="text-2xl md:text-4xl font-extrabold mb-2">{b.title}</h2>
        <p className="text-sm md:text-base opacity-90 mb-4">{b.sub}</p>
        <Link href={b.href} className="inline-block bg-white text-gray-800 font-semibold px-5 py-2 rounded hover:bg-gray-100 text-sm">
          Shop Now →
        </Link>
      </div>
      <div className="absolute right-6 bottom-0 text-8xl opacity-20">🛒</div>
      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {BANNERS.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} className={`w-2 h-2 rounded-full transition-all ${i === idx ? 'bg-white w-4' : 'bg-white/50'}`} />
        ))}
      </div>
    </div>
  );
}
