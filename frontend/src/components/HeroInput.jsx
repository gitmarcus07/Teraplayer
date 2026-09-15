import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Link2,
  Loader2,
  ClipboardPaste,
  AlertCircle,
} from "lucide-react";
import { sanitizeUrl, isLikelyTeraBoxUrl } from "../utils/url";
import { useLang } from "../i18n/LanguageContext";

const HeroInput = forwardRef(function HeroInput(
  { onSubmit, loading, defaultValue = "" },
  ref
) {
  const { t } = useLang();
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const autoSubmitTimerRef = useRef(null);

  useEffect(() => () => {
    if (autoSubmitTimerRef.current) clearTimeout(autoSubmitTimerRef.current);
  }, []);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
      inputRef.current?.select();
    },
  }));

  const submitValue = (raw) => {
    const clean = sanitizeUrl(raw);

    if (!clean) {
      setError(t("input.emptyErr"));
      return;
    }

    if (!isLikelyTeraBoxUrl(clean)) {
      setError(t("input.invalidErr"));
      return;
    }

    setError(null);
    onSubmit?.(clean);
  };

  const submit = (e) => {
    e.preventDefault();
    if (loading) return;
    // Empty-submit acts as Paste (mirrors the reference single-button pill):
    // pull the clipboard in, then continue straight to resolving.
    if (!value.trim()) {
      pasteAndGo();
      return;
    }
    submitValue(value);
  };

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const clean = sanitizeUrl(text);
        setValue(clean);
        setError(null);
        inputRef.current?.focus();
        return clean;
      }
    } catch {
      // Clipboard permission denied or unavailable — normal input still works.
    }
    return "";
  };

  const pasteAndGo = async () => {
    if (loading) return;
    const pasted = await paste();
    if (pasted) submitValue(pasted);
    else if (!value.trim()) setError(t("input.emptyErr"));
  };

  const handleChange = (e) => {
    const next = e.target.value;
    const prevLen = value.length;
    setValue(next);
    if (error) setError(null);

    // Fallback for paste methods that don't fire onPaste reliably
    // (mobile long-press, autofill, password managers): when the value jumps
    // from empty/short to a full valid link in one change, auto-resolve it
    // just like fastvideosave-style UX. Typing char-by-char never triggers
    // this because submitValue runs debounced and only on a length jump.
    if (!loading && next.length - prevLen > 10) {
      const clean = sanitizeUrl(next);
      if (clean && isLikelyTeraBoxUrl(clean)) {
        if (autoSubmitTimerRef.current) clearTimeout(autoSubmitTimerRef.current);
        autoSubmitTimerRef.current = setTimeout(() => {
          setValue(clean);
          submitValue(clean);
        }, 500);
      }
    }
  };

  const handlePaste = (e) => {
    if (loading) return;
    const pastedText = e.clipboardData?.getData("text") || "";
    if (!pastedText) return;
    // Compute what the input will hold after this paste (respects cursor /
    // selection) so a paste into an empty or occupied field both work.
    const el = inputRef.current;
    let nextValue = pastedText;
    try {
      const start = el?.selectionStart ?? value.length;
      const end = el?.selectionEnd ?? value.length;
      nextValue = value.slice(0, start) + pastedText + value.slice(end);
    } catch {
      nextValue = value ? `${value}${pastedText}` : pastedText;
    }
    const clean = sanitizeUrl(nextValue.trim());
    if (!clean) return;
    // Only hijack the paste when it looks like a link — otherwise let the
    // user keep editing normally.
    if (!/https?:\/\//i.test(clean) && !isLikelyTeraBoxUrl(clean)) return;
    e.preventDefault();
    if (autoSubmitTimerRef.current) clearTimeout(autoSubmitTimerRef.current);
    setValue(clean);
    setError(null);
    // Let the input paint the pasted value first, then auto-start resolving
    // so the user sees the link before the loader takes over.
    autoSubmitTimerRef.current = setTimeout(() => {
      submitValue(clean);
    }, 150);
  };

  const hasText = value.trim().length > 0;

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
        delay: 0.15,
      }}
      className="mx-auto w-full max-w-2xl"
      data-testid="hero-form"
      noValidate
    >
      <label htmlFor="terabox-link-input" className="sr-only">
        {t("input.label")}
      </label>
      {/* Reference-style pill: link icon, input, gradient action button inside. */}
      <div
        className={`group relative flex w-full items-center bg-white p-1 backdrop-blur-md transition-all duration-300 rounded-full shadow-indigo-900/5 ${error ? "border border-red-500" : "border border-indigo-200 focus-within:border-indigo-500"
          }`}
      >
        <div className="flex items-center justify-center pl-4 pr-2 text-slate-400 transition-colors duration-300 group-focus-within:text-indigo-500">
          <Link2 className="h-5 w-5" aria-hidden="true" />
        </div>
        <input
          ref={inputRef}
          id="terabox-link-input"
          type="text"
          inputMode="url"
          autoComplete="off"
          data-testid="paste-input"
          value={value}
          onChange={handleChange}
          onPaste={handlePaste}
          placeholder={t("input.placeholder")}
          aria-label={t("input.label")}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? "hero-input-error" : "hero-input-hint"}
          className="h-14 w-full min-w-0 flex-1 bg-transparent px-2 text-base font-medium text-slate-900 outline-none transition-colors placeholder:text-slate-400 md:text-lg"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
        />
        <div className="flex items-center gap-2 pr-1">
          <button
            type="button"
            onClick={paste}
            data-testid="paste-clipboard-btn"
            aria-label={t("input.pasteAria")}
            title={t("input.pasteAria")}
            className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full text-slate-400 transition-all duration-300 hover:bg-slate-100 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:flex"
          >
            <ClipboardPaste className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="submit"
            data-testid="hero-submit-btn"
            disabled={loading}
            aria-busy={loading || undefined}
            className="btn-gradient flex h-12 shrink-0 items-center justify-center gap-2 rounded-full px-6 font-semibold text-white"
          >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              <span className="hidden sm:inline">{t("input.loading")}</span>
            </>
          ) : hasText ? (
            <>
              {t("input.watchBtn")}
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </>
          ) : (
            <>
              <ClipboardPaste className="h-5 w-5" aria-hidden="true" />
              <span>{t("input.pasteBtn")}</span>
            </>
          )}
          </button>
        </div>
      </div>

      {/* Reserved line so an inline validation error never shifts the layout. */}
      <div className="mt-2 min-h-[1.35rem] text-center" aria-live="polite">
        {error ? (
          <p
            id="hero-input-error"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-destructive"
            data-testid="hero-input-error"
            role="alert"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        ) : (
          <p id="hero-input-hint" className="text-xs text-slate-400">
            {t("input.hint")}
          </p>
        )}
      </div>

      <div className="sr-only">
        {t("input.srHelp")}
      </div>
    </motion.form>
  );
});

export default HeroInput;
