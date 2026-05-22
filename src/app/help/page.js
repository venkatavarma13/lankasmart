'use client';
export const dynamic = 'force-dynamic';
import { useState } from 'react';
import { useLang } from '@/lib/LanguageContext';
import StoreLayout from '@/components/layout/StoreLayout';
import { FiChevronDown, FiMail, FiPhone, FiMessageCircle, FiMapPin, FiSend } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';

const FAQS = [
  { q: 'How do I track my order?', a: 'Go to "My Orders" from the top navigation. Each order shows a live tracking bar with statuses: Placed → Confirmed → Packed → Shipped → Delivered.' },
  { q: 'What payment methods are accepted?', a: 'We accept Cash on Delivery (COD). Pay safely when your order is delivered to your door.' },
  { q: 'How long does delivery take?', a: 'We deliver within 30 minutes for local areas in Agadalalanka and nearby. Contact us on WhatsApp for exact timing.' },
  { q: 'Are the products genuine?', a: 'Yes, 100%! All our products are genuine and trusted. We source directly from authorized distributors.' },
  { q: 'What if I receive a damaged product?', a: 'Contact us within 48 hours via WhatsApp or email with photos. We will arrange an immediate replacement.' },
  { q: 'Is there a minimum order value for free delivery?', a: 'Free delivery available! Contact us on WhatsApp for delivery details in your area.' },
  { q: 'Can I change my order after placing it?', a: 'You can cancel or modify the order within 2 hours of placing it. Contact us immediately via WhatsApp.' },
  { q: 'Do you sell fresh fruits and vegetables?', a: 'Yes! We have fresh fruits, fresh vegetables, and dairy products available daily. Check our product categories.' },
  { q: 'What grocery items do you sell?', a: 'We sell Pachari/Grocery items, dry fruits, snacks, cool drinks, chocolates, biscuits, and much more.' },
  { q: 'Do you have Arun Ice Cream and milk products?', a: 'Yes! We have Arun Ice Cream, Arogya Milk Products, and Hatsun Milk & Curd available fresh daily.' },
];

export default function HelpPage() {
  const { t, catName } = useLang();
  const [openFaq, setOpenFaq] = useState(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [sending, setSending] = useState(false);

  const toggleFaq = (i) => setOpenFaq(openFaq === i ? null : i);

  const handleContact = async (e) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) { toast.error('Please fill all required fields'); return; }
    setSending(true);
    await new Promise((r) => setTimeout(r, 1000));
    toast.success("Message sent! We'll get back to you within 24 hours.");
    setContactForm({ name: '', email: '', phone: '', message: '' });
    setSending(false);
  };

  return (
    <StoreLayout>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">{t('helpTitle')}</h1>
        <p className="text-gray-500 mb-6">We're here to help you — anytime, anywhere.</p>

        {/* Contact cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { icon: FaWhatsapp, label: 'WhatsApp', value: 'Chat Instantly', color: 'text-green-500', href: 'https://wa.me/919493163557', bg: 'bg-green-50' },
            { icon: FiPhone, label: 'Call Us', value: '+91 94931 63557', color: 'text-em-blue', href: 'tel:+919493163557', bg: 'bg-blue-50' },
            { icon: FiMail, label: 'Email', value: 'supportlmart@gmail.com', color: 'text-orange-500', href: 'mailto:supportlmart@gmail.com', bg: 'bg-orange-50' },
            { icon: FiMapPin, label: 'Visit Store', value: 'Agadalalanka, Eluru Dist', color: 'text-purple-500', href: 'https://share.google/Zas4MOrUe5CCG6uR8', bg: 'bg-purple-50' },
          ].map(({ icon: Icon, label, value, color, href, bg }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer"
              className={`${bg} rounded-lg p-4 flex flex-col items-center text-center hover:shadow-md transition-shadow`}>
              <Icon size={24} className={`${color} mb-2`} />
              <p className="text-xs font-bold text-gray-800">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{value}</p>
            </a>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* FAQ */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">{t('faq')}</h2>
            <div className="space-y-2">
              {FAQS.map((faq, i) => (
                <div key={i} className="bg-white rounded shadow-card overflow-hidden">
                  <button onClick={() => toggleFaq(i)}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-gray-50 transition-colors">
                    <span className="text-sm font-semibold text-gray-800 pr-4">{faq.q}</span>
                    <FiChevronDown size={16} className={`flex-shrink-0 text-gray-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100">{faq.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">{t('sendMessage')}</h2>
            <div className="bg-white rounded shadow-card p-5">
              <form onSubmit={handleContact} className="space-y-4">
                {[
                  { name: 'name', label: 'Your Name *', type: 'text', placeholder: 'Full name' },
                  { name: 'email', label: 'Email *', type: 'email', placeholder: 'your@email.com' },
                  { name: 'phone', label: 'Phone (optional)', type: 'tel', placeholder: 'Mobile number' },
                ].map((f) => (
                  <div key={f.name}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">{f.label}</label>
                    <input type={f.type} value={contactForm[f.name]} onChange={(e) => setContactForm((c) => ({ ...c, [f.name]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-em-blue" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Message *</label>
                  <textarea value={contactForm.message} onChange={(e) => setContactForm((c) => ({ ...c, message: e.target.value }))}
                    placeholder="Tell us how we can help you..."
                    rows={4} className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-em-blue resize-none" />
                </div>
                <button type="submit" disabled={sending}
                  className="w-full bg-em-blue hover:bg-em-blue-dark disabled:bg-gray-300 text-white font-bold py-2.5 rounded transition-colors text-sm flex items-center justify-center gap-2">
                  <FiSend size={15} />
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>

            {/* WhatsApp CTA */}
            <a href="https://wa.me/919493163557?text=Hi%21+I+need+help+with+L+MART."
              target="_blank" rel="noopener noreferrer"
              className="mt-4 flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white rounded-lg p-4 transition-colors">
              <FaWhatsapp size={28} />
              <div>
                <p className="font-bold text-sm">Fastest Support: WhatsApp</p>
                <p className="text-xs opacity-90">Usually replies within minutes</p>
              </div>
            </a>
          </div>
        </div>

        {/* Store Info + Google Map */}
        <div className="mt-8 bg-white rounded shadow-card overflow-hidden">
          <div className="p-5 border-b">
            <h2 className="text-lg font-bold text-gray-800 mb-1">📍 Visit Our Store</h2>
            <p className="text-sm text-gray-600">Agadalalanka, Eluru District, 534427, Andhra Pradesh</p>
            <p className="text-sm text-gray-600 mt-1">📞 +91 94931 63557 &nbsp;|&nbsp; ✉️ supportlmart@gmail.com</p>
            <a href="https://share.google/Zas4MOrUe5CCG6uR8" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 bg-em-blue text-white text-sm font-semibold px-4 py-2 rounded hover:bg-em-blue-dark transition-colors">
              <FiMapPin size={15} /> Get Directions on Google Maps
            </a>
          </div>
          {/* Embedded Google Map iframe */}
          <div className="w-full h-72">
            <iframe
              src="https://maps.google.com/maps?q=Agadalalanka,Eluru+District,Andhra+Pradesh,534427&output=embed&z=14"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

      </div>
    </StoreLayout>
  );
}
