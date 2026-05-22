'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, CATEGORY_TRANSLATIONS } from './translations';

const LangCtx = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('lmart_lang');
      if (saved === 'te') setLang('te');
    } catch {}
  }, []);

  const toggleLang = useCallback(() => {
    setLang(prev => {
      const next = prev === 'en' ? 'te' : 'en';
      try { localStorage.setItem('lmart_lang', next); } catch {}
      return next;
    });
  }, []);

  const t = useCallback((key) => {
    return translations[lang]?.[key] || translations.en[key] || key;
  }, [lang]);

  const catName = useCallback((name) => {
    if (lang === 'te') return CATEGORY_TRANSLATIONS[name] || name;
    return name;
  }, [lang]);

  return (
    <LangCtx.Provider value={{ lang, toggleLang, t, catName }}>
      {children}
    </LangCtx.Provider>
  );
}

export const useLang = () => {
  const ctx = useContext(LangCtx);
  if (!ctx) return { lang:'en', toggleLang:()=>{}, t:(k)=>k, catName:(n)=>n };
  return ctx;
};
