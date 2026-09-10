import { createContext, useContext, useCallback, useEffect, useMemo, useState } from "react";
import { dictionaries, LANGS } from "./translations";

const KEY = "teraplayer.lang";
const DEFAULT_LANG = "en";

const LangCtx = createContext(null);

function resolveInitial() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && dictionaries[saved]) return saved;
  } catch {
    /* storage unavailable */
  }
  return DEFAULT_LANG;
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(resolveInitial);

  useEffect(() => {
    document.documentElement.lang = lang;
    const entry = LANGS.find((l) => l.code === lang);
    document.documentElement.dir = entry && entry.rtl ? "rtl" : "ltr";
    try {
      localStorage.setItem(KEY, lang);
    } catch {
      /* noop */
    }
  }, [lang]);

  const setLang = useCallback((code) => {
    if (dictionaries[code]) setLangState(code);
  }, []);

  const t = useCallback(
    (key) => dictionaries[lang][key] ?? dictionaries[DEFAULT_LANG][key] ?? key,
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t, langs: LANGS }), [lang, setLang, t]);

  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export function useLang() {
  const ctx = useContext(LangCtx);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
