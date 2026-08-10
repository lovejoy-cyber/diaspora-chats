import { useState, useEffect, useCallback } from "react";
import { t as translate, getLang, setLang as saveLang } from "./translations";

// Small hook so components using t() actually re-render when the language changes —
// plain function calls to translations.js alone wouldn't trigger a re-render on their own.
export function useTranslation() {
  const [lang, setLangState] = useState(getLang());

  useEffect(() => {
    const onStorage = () => setLangState(getLang());
    window.addEventListener("dl_lang_change", onStorage);
    return () => window.removeEventListener("dl_lang_change", onStorage);
  }, []);

  const changeLang = useCallback((newLang) => {
    saveLang(newLang);
    setLangState(newLang);
    window.dispatchEvent(new Event("dl_lang_change"));
  }, []);

  const t = useCallback((key) => translate(key), [lang]);

  return { t, lang, setLang: changeLang };
}
