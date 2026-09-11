import { createContext, useContext, useCallback, useEffect, useMemo, useState } from "react";
import { dictionaries, LANGS, localeLoaders } from "./translations";

const KEY = "teraplayer.lang";
const DEFAULT_LANG = "en";

const LangCtx = createContext(null);

function isKnownLang(code) {
  return LANGS.some((l) => l.code === code);
}

function resolveInitial() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && isKnownLang(saved)) return saved;
  } catch {
    /* storage unavailable */
  }
  return DEFAULT_LANG;
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(resolveInitial);
  // Non-English dictionaries are code-split (see translations.js) and
  // fetched on demand. Until a chunk arrives, t() falls back to English
  // per key, so the UI never renders a raw translation key.
  const [extra, setExtra] = useState({});

  useEffect(() => {
    document.documentElement.lang = lang;
    const entry = LANGS.find((l) => l.code === lang);
    document.documentElement.dir = entry && entry.rtl ? "rtl" : "ltr";
    try {
      localStorage.setItem(KEY, lang);
    } catch {
      /* noop */
    }
    if (lang !== DEFAULT_LANG && !extra[lang] && localeLoaders[lang]) {
      let cancelled = false;
      localeLoaders[lang]()
        .then((m) => {
          if (!cancelled) setExtra((prev) => ({ ...prev, [lang]: m.default || m }));
        })
        .catch(() => {
          /* keep English fallback */
        });
      return () => {
        cancelled = true;
      };
    }
    return undefined;
  }, [lang, extra]);

  const setLang = useCallback((code) => {
    if (isKnownLang(code)) setLangState(code);
  }, []);

  const active = lang === DEFAULT_LANG ? dictionaries.en : extra[lang] || dictionaries.en;

  const t = useCallback(
    (key) => active[key] ?? dictionaries.en[key] ?? key,
    [active]
  );

  const value = useMemo(() => ({ lang, setLang, t, langs: LANGS }), [lang, setLang, t]);

  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export function useLang() {
  const ctx = useContext(LangCtx);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
