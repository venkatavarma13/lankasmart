'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/AppContext';
import { FiShoppingCart, FiUser, FiHeart, FiMenu, FiX, FiSearch, FiLogOut, FiPackage, FiSettings, FiChevronDown } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { useLang } from '@/lib/LanguageContext';
import ChatBot from '@/components/ui/ChatBot';

const P = '#4E2A4F';
const PD = '#2D1E2F';
const G = '#D4AF6A';

const NAV_CATS = [
  '🌾 Grocery','🍎 Fruits','🥦 Vegetables','🥛 Dairy','🍦 Ice Cream',
  '🍫 Snacks','🎁 Gift Items','💊 Medical','🧵 Tailoring','🔧 Bike Parts',
];
const NAV_MAP = {
  '🌾 Grocery':'Pachari / Grocery Items','🍎 Fruits':'Fresh Fruits',
  '🥦 Vegetables':'Fresh Vegetables','🥛 Dairy':'Arogya Milk Products',
  '🍦 Ice Cream':'Arun Ice Cream','🍫 Snacks':'Snacks Items',
  '🎁 Gift Items':'Gift Articles','💊 Medical':'Surgical / Medical Items',
  '🧵 Tailoring':'Tailoring Items','🔧 Bike Parts':'Bike Spare Parts',
};

export default function StoreLayout({ children }) {
  const { user, logout, cartCount, wishlist } = useApp();
  const { lang, toggleLang, t } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropOpen, setDropOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) { router.push(`/products?search=${encodeURIComponent(search.trim())}`); setSearch(''); setMenuOpen(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', background:'#F8F4F9' }}>

      {/* ── Top Ticker ── */}
      <div style={{ background: PD, padding:'6px 16px', textAlign:'center', fontSize:12, color: G, fontWeight:500, letterSpacing:0.3 }}>
        🚚 30-Minute Delivery &nbsp;•&nbsp; ✅ 100% Trusted Products &nbsp;•&nbsp; 📞 +91 94931 63557
        &nbsp;•&nbsp;
        <a href="https://wa.me/919493163557" target="_blank" rel="noopener noreferrer"
          style={{ color:'#4ade80', fontWeight:700, textDecoration:'none' }}>
          💬 WhatsApp Us
        </a>
      </div>

      {/* ── Main Header ── */}
      <header style={{
        background: `linear-gradient(135deg, ${PD} 0%, ${P} 100%)`,
        position:'sticky', top:0, zIndex:100,
        boxShadow: scrolled ? '0 6px 32px rgba(45,30,47,0.45)' : '0 2px 12px rgba(45,30,47,0.25)',
        transition:'box-shadow 0.3s ease',
      }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'10px 16px', display:'flex', alignItems:'center', gap:12 }}>

          {/* Logo */}
          <Link href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none', flexShrink:0 }}>
            <div style={{
              width:44, height:44, borderRadius:10, overflow:'hidden', position:'relative',
              border:`2px solid ${G}`, background:'white', flexShrink:0,
              boxShadow:`0 2px 12px rgba(212,175,106,0.30)`,
            }}>
              <Image src="/logo.jpg" alt="L MART" fill style={{ objectFit:'contain', padding:2 }} />
            </div>
            <div className="hidden sm:block">
              <p style={{ fontFamily:"Georgia,'Times New Roman',serif", fontWeight:900, color: G, fontSize:21, margin:0, lineHeight:1.1, letterSpacing:0.5 }}>L MART</p>
              <p style={{ fontSize:9, color:'rgba(255,255,255,0.5)', margin:0, letterSpacing:2, textTransform:'uppercase' }}>Global Growth · Local Fresh</p>
            </div>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} style={{ flex:1, maxWidth:540, display:'flex', borderRadius:10, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.15)' }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search groceries, fruits, snacks..."
              style={{
                flex:1, padding:'10px 16px', fontSize:13, border:'none',
                background:'rgba(255,255,255,0.14)', color:'white', outline:'none',
              }}
            />
            <button type="submit" style={{ background: G, color: PD, padding:'10px 18px', border:'none', cursor:'pointer', fontWeight:700, display:'flex', alignItems:'center', gap:6, fontSize:13, transition:'background 0.2s' }}>
              <FiSearch size={16} /> <span className="hidden sm:inline">Search</span>
            </button>
          </form>

          {/* Right Actions */}
          <div style={{ display:'flex', alignItems:'center', gap:4, marginLeft:'auto', flexShrink:0 }}>

            {/* Wishlist */}
            <Link href="/wishlist" style={{ position:'relative', padding:'8px 10px', color:'rgba(255,255,255,0.85)', display:'flex', textDecoration:'none', borderRadius:8, transition:'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <FiHeart size={22} />
              {wishlist.length > 0 && (
                <span style={{ position:'absolute', top:4, right:4, background:'#ef4444', color:'white', fontSize:9, fontWeight:800, borderRadius:'50%', width:16, height:16, display:'flex', alignItems:'center', justifyContent:'center' }}>{wishlist.length}</span>
              )}
            </Link>

            {/* Lang toggle */}
            <button onClick={toggleLang} style={{
              fontSize:11, fontWeight:700, padding:'5px 9px', borderRadius:7,
              border:`1.5px solid rgba(212,175,106,0.5)`, color: G,
              background:'rgba(212,175,106,0.08)', cursor:'pointer', whiteSpace:'nowrap',
              transition:'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(212,175,106,0.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(212,175,106,0.08)'; }}>
              <span style={{display:'flex',alignItems:'center',gap:4}}>{lang === 'en' ? <><span>🇮🇳</span><span>తెలుగు</span></> : <><span>🇬🇧</span><span>English</span></>}</span>
            </button>

            {/* Cart */}
            <Link href="/cart" style={{ position:'relative', padding:'8px 10px', color:'rgba(255,255,255,0.85)', display:'flex', textDecoration:'none', borderRadius:8, transition:'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <FiShoppingCart size={22} />
              {cartCount > 0 && (
                <span style={{ position:'absolute', top:4, right:4, background: G, color: PD, fontSize:9, fontWeight:800, borderRadius:'50%', width:16, height:16, display:'flex', alignItems:'center', justifyContent:'center' }}>{cartCount}</span>
              )}
            </Link>

            {/* User */}
            {user ? (
              <div style={{ position:'relative' }}>
                <button onClick={() => setDropOpen(v => !v)} style={{
                  display:'flex', alignItems:'center', gap:6, padding:'6px 12px',
                  background:'rgba(212,175,106,0.15)', border:`1px solid rgba(212,175,106,0.3)`,
                  borderRadius:8, cursor:'pointer', color: G, fontSize:12, fontWeight:600,
                  transition:'all 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(212,175,106,0.25)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(212,175,106,0.15)'}>
                  <FiUser size={16} />
                  <span className="hidden sm:inline" style={{ maxWidth:80, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.name?.split(' ')[0]}</span>
                  <FiChevronDown size={12} style={{ transition:'transform 0.2s', transform: dropOpen ? 'rotate(180deg)' : 'none' }} />
                </button>
                {dropOpen && (
                  <div style={{
                    position:'absolute', right:0, top:'calc(100% + 8px)',
                    width:208, background:'white', borderRadius:12,
                    boxShadow:'0 12px 40px rgba(45,30,47,0.22)',
                    border:'1px solid rgba(78,42,79,0.10)', zIndex:200, overflow:'hidden',
                    animation:'fadeIn 0.15s ease',
                  }}>
                    <div style={{ padding:'12px 16px', background:'#faf5fb', borderBottom:'1px solid #f0e8f1' }}>
                      <p style={{ margin:0, fontSize:14, fontWeight:700, color: PD }}>{user.name}</p>
                      <p style={{ margin:0, fontSize:11, color:'#888' }}>{user.email || user.phone}</p>
                    </div>
                    {user.role === 'admin' && (
                      <Link href="/admin/dashboard" onClick={() => setDropOpen(false)}
                        style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px', fontSize:13, color: PD, textDecoration:'none', borderBottom:'1px solid #f5f0f6', transition:'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background='#faf5fb'}
                        onMouseLeave={e => e.currentTarget.style.background='white'}>
                        <FiSettings size={14} style={{ color: P }} /> Admin Panel
                      </Link>
                    )}
                    <Link href="/orders" onClick={() => setDropOpen(false)}
                      style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px', fontSize:13, color: PD, textDecoration:'none', borderBottom:'1px solid #f5f0f6', transition:'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background='#faf5fb'}
                      onMouseLeave={e => e.currentTarget.style.background='white'}>
                      <FiPackage size={14} style={{ color: P }} /> {t('orders')}
                    </Link>
                    <button onClick={() => { logout(); setDropOpen(false); }}
                      style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px', fontSize:13, color:'#e53e3e', background:'none', border:'none', cursor:'pointer', width:'100%', transition:'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background='#fff5f5'}
                      onMouseLeave={e => e.currentTarget.style.background='none'}>
                      <FiLogOut size={14} /> {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" style={{
                background:`linear-gradient(135deg, ${G}, #B8942E)`,
                color: PD, fontSize:13, fontWeight:700, padding:'8px 18px',
                borderRadius:8, textDecoration:'none',
                boxShadow:'0 3px 12px rgba(212,175,106,0.35)',
                transition:'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 5px 18px rgba(212,175,106,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 3px 12px rgba(212,175,106,0.35)'; }}>
                {t('login')}
              </Link>
            )}

            {/* Hamburger */}
            <button onClick={() => setMenuOpen(v => !v)}
              style={{ padding:8, color:'white', background:'none', border:'none', cursor:'pointer', display:'block', borderRadius:6, transition:'background 0.2s' }}
              className="sm:hidden"
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background='none'}>
              {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>
        </div>

        {/* ── Desktop Category Nav ── */}
        <nav style={{ background:'rgba(0,0,0,0.18)', borderTop:'1px solid rgba(255,255,255,0.08)' }} className="hidden sm:block">
          <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 16px', display:'flex', overflowX:'auto', gap:2 }}>
            {NAV_CATS.map(label => (
              <Link key={label} href={`/products?category=${encodeURIComponent(NAV_MAP[label] || label)}`}
                style={{ fontSize:12, color:'rgba(255,255,255,0.80)', whiteSpace:'nowrap', padding:'9px 13px', textDecoration:'none', fontWeight:500, borderBottom:'2px solid transparent', transition:'all 0.18s', display:'block' }}
                onMouseEnter={e => { e.currentTarget.style.color = G; e.currentTarget.style.borderBottomColor = G; e.currentTarget.style.background='rgba(212,175,106,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.color='rgba(255,255,255,0.80)'; e.currentTarget.style.borderBottomColor='transparent'; e.currentTarget.style.background='transparent'; }}>
                {label}
              </Link>
            ))}
            <Link href="/products"
              style={{ fontSize:12, color: G, whiteSpace:'nowrap', padding:'9px 14px', textDecoration:'none', fontWeight:800, borderBottom:'2px solid transparent', marginLeft:'auto' }}>
              All Categories →
            </Link>
          </div>
        </nav>

        {/* ── Mobile Menu ── */}
        {menuOpen && (
          <div style={{ background:'white', borderTop:`2px solid ${P}`, padding:16 }} className="sm:hidden">
            <form onSubmit={handleSearch} style={{ display:'flex', marginBottom:14, borderRadius:10, overflow:'hidden', border:`1.5px solid ${P}` }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
                style={{ flex:1, padding:'10px 14px', fontSize:13, border:'none', outline:'none', color: PD }} />
              <button type="submit" style={{ background: P, color:'white', padding:'10px 16px', border:'none', cursor:'pointer' }}>
                <FiSearch size={15} />
              </button>
            </form>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {NAV_CATS.slice(0,8).map(label => (
                <Link key={label} href={`/products?category=${encodeURIComponent(NAV_MAP[label] || label)}`}
                  onClick={() => setMenuOpen(false)}
                  style={{ display:'block', fontSize:13, color: PD, padding:'9px 12px', textDecoration:'none', background:'#faf5fb', borderRadius:8, border:`1px solid rgba(78,42,79,0.10)`, fontWeight:500 }}>
                  {label}
                </Link>
              ))}
            </div>
            <Link href="/products" onClick={() => setMenuOpen(false)}
              style={{ display:'block', marginTop:12, textAlign:'center', background:`linear-gradient(135deg,${P},${PD})`, color:'white', padding:'11px', borderRadius:10, textDecoration:'none', fontWeight:700, fontSize:14 }}>
              View All Categories →
            </Link>
          </div>
        )}
      </header>

      {/* ── Main ── */}
      <main style={{ flex:1 }}>{children}</main>

      {/* ── Footer ── */}
      <footer style={{ background:`linear-gradient(135deg, ${PD} 0%, ${P} 100%)`, color:'white', marginTop:40 }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'48px 16px 24px', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:36 }}>

          {/* Brand */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <div style={{ width:44, height:44, borderRadius:10, overflow:'hidden', position:'relative', border:`2px solid ${G}`, background:'white', flexShrink:0 }}>
                <Image src="/logo.jpg" alt="L MART" fill style={{ objectFit:'contain', padding:2 }} />
              </div>
              <div>
                <p style={{ fontFamily:"Georgia,serif", fontWeight:900, color: G, fontSize:20, margin:0, lineHeight:1.1 }}>L MART</p>
                <p style={{ fontSize:9, color:'rgba(255,255,255,0.45)', margin:0, letterSpacing:1.5, textTransform:'uppercase' }}>Global Growth · Local Fresh</p>
              </div>
            </div>
            <p style={{ color:'rgba(255,255,255,0.68)', fontSize:13, lineHeight:1.7, margin:'0 0 18px' }}>
              Your trusted local store for fresh groceries, produce, dairy and daily needs in Agadalalanka, Eluru District.
            </p>
            {/* Social icons */}
            <div style={{ display:'flex', gap:10 }}>
              {[
                { href:'https://wa.me/919493163557', bg:'#25d366', icon:<FaWhatsapp size={16} /> },
                { href:'https://facebook.com', bg:'#1877f2', icon:<svg width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg> },
                { href:'https://instagram.com', bg:'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', icon:<svg width="14" height="14" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none"/></svg> },
              ].map((s, i) => (
                <a key={i} href={s.href} target="_blank" rel="noopener noreferrer"
                  style={{ width:36, height:36, borderRadius:'50%', background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', color:'white', flexShrink:0, transition:'transform 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 6px 16px rgba(0,0,0,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ color: G, fontWeight:700, fontSize:13, margin:'0 0 16px', letterSpacing:1, textTransform:'uppercase' }}>Quick Links</h4>
            {[['🏠 Home','/'],['🛍️ Products','/products'],['📦 My Orders','/orders'],['❤️ Wishlist','/wishlist'],['❓ Help','/help']].map(([label,href]) => (
              <a key={href} href={href}
                style={{ display:'flex', alignItems:'center', gap:8, color:'rgba(255,255,255,0.68)', fontSize:13, marginBottom:10, textDecoration:'none', transition:'color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.color=G; e.currentTarget.style.paddingLeft='4px'; e.currentTarget.style.transition='all 0.15s'; }}
                onMouseLeave={e => { e.currentTarget.style.color='rgba(255,255,255,0.68)'; e.currentTarget.style.paddingLeft='0'; }}>
                {label}
              </a>
            ))}
          </div>

          {/* Top Categories */}
          <div>
            <h4 style={{ color: G, fontWeight:700, fontSize:13, margin:'0 0 16px', letterSpacing:1, textTransform:'uppercase' }}>Top Categories</h4>
            {[['🌾 Grocery','Pachari / Grocery Items'],['🍎 Fresh Fruits','Fresh Fruits'],['🥦 Vegetables','Fresh Vegetables'],['🥛 Dairy','Arogya Milk Products'],['🍦 Ice Cream','Arun Ice Cream'],['🍫 Snacks','Snacks Items']].map(([label,cat]) => (
              <a key={cat} href={`/products?category=${encodeURIComponent(cat)}`}
                style={{ display:'flex', alignItems:'center', gap:8, color:'rgba(255,255,255,0.68)', fontSize:13, marginBottom:10, textDecoration:'none', transition:'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.color=G; e.currentTarget.style.paddingLeft='4px'; }}
                onMouseLeave={e => { e.currentTarget.style.color='rgba(255,255,255,0.68)'; e.currentTarget.style.paddingLeft='0'; }}>
                {label}
              </a>
            ))}
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ color: G, fontWeight:700, fontSize:13, margin:'0 0 16px', letterSpacing:1, textTransform:'uppercase' }}>Contact Us</h4>
            {[
              { emoji:'📞', text:'+91 94931 63557', href:'tel:+919493163557' },
              { emoji:'✉️', text:'supportlmart@gmail.com', href:'mailto:supportlmart@gmail.com' },
              { emoji:'📍', text:'Agadalalanka, Eluru Dist, 534427, AP', href:'https://share.google/Zas4MOrUe5CCG6uR8' },
            ].map((c,i) => (
              <a key={i} href={c.href} target="_blank" rel="noopener noreferrer"
                style={{ display:'flex', alignItems:'flex-start', gap:10, color:'rgba(255,255,255,0.68)', fontSize:13, marginBottom:12, textDecoration:'none', transition:'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color='white'}
                onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.68)'}>
                <span style={{ flexShrink:0 }}>{c.emoji}</span>{c.text}
              </a>
            ))}
            <a href="https://wa.me/919493163557" target="_blank" rel="noopener noreferrer"
              style={{ display:'inline-flex', alignItems:'center', gap:8, marginTop:6, background:'#25d366', color:'white', padding:'9px 18px', borderRadius:8, fontSize:13, fontWeight:700, textDecoration:'none', boxShadow:'0 3px 12px rgba(37,211,102,0.3)', transition:'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(37,211,102,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 3px 12px rgba(37,211,102,0.3)'; }}>
              <FaWhatsapp size={16} /> Chat on WhatsApp
            </a>
          </div>
        </div>

        <div style={{ borderTop:'1px solid rgba(255,255,255,0.10)', padding:'14px 16px', textAlign:'center', color:'rgba(255,255,255,0.4)', fontSize:11 }}>
          © {new Date().getFullYear()} L MART — Agadalalanka, Eluru District, Andhra Pradesh. All rights reserved.
        </div>
      </footer>

      {/* AI ChatBot */}
      <ChatBot user={user} />
    </div>
  );
}
