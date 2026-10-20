'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { english } from '@/lib/translations';

type Language = 'id' | 'en';
const LanguageContext = createContext({
  language: 'id' as Language,
  setLanguage: (value: Language) => {
    void value;
  },
  t: (text: string) => text,
});
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setValue] = useState<Language>('id');
  useEffect(() => {
    try {
      if (localStorage.getItem('mollad-language') === 'en') setValue('en');
    } catch {
      /* Browser storage can be unavailable. */
    }
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  function setLanguage(value: Language) {
    setValue(value);
    try {
      localStorage.setItem('mollad-language', value);
    } catch {
      /* Preference still applies for this visit. */
    }
  }
  const t = (text: string) =>
    language === 'en' ? english[text] || text : text;
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
export function useLanguage() {
  return useContext(LanguageContext);
}
export function Text({ children }: { children: string }) {
  const { t } = useLanguage();
  return <>{' ' + t(children) + ' '}</>;
}
