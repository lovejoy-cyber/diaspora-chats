import { createContext, useContext, useState, useCallback } from "react";
import { t as translate, getLang, setLang as saveLang } from "../lib/translations";

// A real shared context — the actual fix for the language toggle not updating live.
// The previous approach called useTranslation() separately in Profile.jsx and
// Dashboard.jsx, each getting its OWN independent state. A custom window event was
// supposed to sync them, but relying on manual event dispatch/listen across separate
// component instances is fragile — a single shared context (same proven pattern as
// AuthContext) is the reliable fix: one source of truth, every component using it
// re-renders together automatically, no custom events needed at all.

const LanguageContext = createContext(null);
export function useLanguage() { return useContext(LanguageContext); }

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getLang());

  const setLang = useCallback((newLang) => {
    saveLang(newLang);
    setLangState(newLang);
  }, []);

  const t = useCallback((key) => translate(key), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
