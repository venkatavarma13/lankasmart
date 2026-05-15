'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AppContext = createContext({});

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [cart, setCart] = useState({ items: [] });
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = useCallback(() => {
    const t = token || (typeof window !== 'undefined' ? localStorage.getItem('lmart_token') : null);
    return t ? { Authorization: `Bearer ${t}` } : {};
  }, [token]);

  useEffect(() => {
    const savedToken = localStorage.getItem('lmart_token');
    const savedUser = localStorage.getItem('lmart_user');
    const savedWishlist = localStorage.getItem('lmart_wishlist');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user && token) fetchCart();
  }, [user, token]);

  const fetchCart = async () => {
    try {
      const { data } = await axios.get('/api/cart', { headers: getAuthHeaders() });
      if (data.success) setCart(data.cart || { items: [] });
    } catch {}
  };

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('lmart_token', userToken);
    localStorage.setItem('lmart_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setCart({ items: [] });
    localStorage.removeItem('lmart_token');
    localStorage.removeItem('lmart_user');
  };

  const updateCartQty = async (productId, quantity) => {
    try {
      const { data } = await axios.put('/api/cart', { productId, quantity }, { headers: getAuthHeaders() });
      if (data.success) setCart(data.cart);
    } catch {}
  };

  const removeFromCart = async (productId) => {
    try {
      const { data } = await axios.delete(`/api/cart?productId=${productId}`, { headers: getAuthHeaders() });
      if (data.success) setCart(data.cart);
    } catch {}
  };

  const addToCart = async (productId, quantity = 1, customPrice = null) => {
    try {
      const { data } = await axios.post('/api/cart', { productId, quantity, customPrice }, { headers: getAuthHeaders() });
      if (data.success) setCart(data.cart);
      return data.success;
    } catch { return false; }
  };

  const toggleWishlist = (productId) => {
    setWishlist(prev => {
      const next = prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId];
      localStorage.setItem('lmart_wishlist', JSON.stringify(next));
      return next;
    });
  };

  const cartCount = cart?.items?.reduce((s, i) => s + i.quantity, 0) || 0;
  const wishlistIds = new Set(wishlist.map(id => id?.toString()));

  return (
    <AppContext.Provider value={{ user, token, cart, wishlist, wishlistIds, loading, cartCount, login, logout, addToCart, updateCartQty, removeFromCart, toggleWishlist, getAuthHeaders, fetchCart }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) return { user: null, token: null, cart: null, wishlist: [], wishlistIds: new Set(), loading: false, cartCount: 0, login: () => {}, logout: () => {}, addToCart: () => {}, updateCartQty: () => {}, removeFromCart: () => {}, toggleWishlist: () => {}, getAuthHeaders: () => ({}), fetchCart: () => {} };
  return ctx;
};
