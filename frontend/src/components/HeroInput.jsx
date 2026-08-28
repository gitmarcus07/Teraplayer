import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Link2,
  Loader2,
  ClipboardPaste,
  AlertCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import { sanitizeUrl, isLikelyTeraBoxUrl } from "../utils/url";

const EXAMPLES = [
  "https://terabox.com/s/1abcXYZ",
  "https://1024terabox.com/s/1xyz",
  "https://terasharelink.com/s/1qw",
];

const HeroInput = forwardRef(function HeroInput(
  { onSubmit, loading, defaultValue = "" },
  ref
) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
      inputRef.current?.select();
    },
  }));

  useEffect(() => {
    const id = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % EXAMPLES.length);
    }, 3200);

    return () => clearInterval(id);
  }, []);

  const submit = (e) => {
    e.preventDefault();

    if (loading) return;

    const clean = sanitizeUrl(value);

    if (!clean) {
      setError("Paste a TeraBox link to get started.");
      return;
    }

    if (!isLikelyTeraBoxUrl(clean)) {
      setError("That doesn't look like a valid TeraBox link.");
      return;
    }

    setError(null);
    onSubmit?.(clean);
  };

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const clean = sanitizeUrl(text);
        setValue(clean);
        setError(null);
        inputRef.current?.focus();
      }
    } catch {
      // Clipboard permission denied or unavailable — normal input still works.
    }
  };

  const handleChange = (e) => {
    setValue(e.target.value);
    if (error) setError(null);
  };

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-0">
        <div className="flex min-w-0 items-center rounded-2xl border border-border bg-surface-raised shadow-2xl shadow-primary/5 focus-within:border-primary focus-within:ring-2 focus-within:ring-accent/20 transition-colors duration-300 sm:flex-1">
          <button
            type="button"
            onClick={paste}
            data-testid="paste-clipboard-btn"
            className="flex h-16 shrink-0 items-center justify-center gap-2 rounded-l-2xl px-4 text-base font-medium text-muted-foreground transition-colors duration-200 hover:bg-surface-overlay hover:text-foreground sm:h-20 sm:px-5 sm:text-lg"
            aria-label="Paste from clipboard"
          >
            <ClipboardPaste className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Paste</span>
          </button>
          <div className="flex min-w-0 items-center px-3 sm:px-5">
            <Link2 className="mr-2 h-4 w-4 shrink-0 text-muted-foreground sm:mr-3 sm:h-5 sm:w-5" />
            <input
              ref={inputRef}
              type="text"
              inputMode="url"
              autoComplete="off"
              data-testid="paste-input"
              value={value}
              onChange={handleChange}
              placeholder="Paste your TeraBox link..."
              aria-label="TeraBox link"
              aria-invalid={error ? "true" : undefined}
              className="min-w-0 flex-1 bg-transparent py-4 text-base outline-none placeholder:text-muted-foreground sm:py-5 sm:text-lg"
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
            />
          </div>
        </div>

        <Button
          type="submit"
          data-testid="hero-submit-btn"
          disabled={loading || !value.trim()}
          className="h-14 w-full rounded-2xl text-base font-semibold text-white shadow-lg shadow-primary/20 transition-[box-shadow,transform] duration-300 ease-out hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] sm:h-20 sm:w-auto sm:rounded-l-none sm:rounded-r-2xl sm:px-8 sm:text-lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Preparing…
            </>
          ) : (
            <>
              Watch Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {/* Reserved line so an inline validation error never shifts the layout. */}
      <div className="mt-2 min-h-[1.35rem]" aria-live="polite">
        {error && (
          <p
            className="flex items-center gap-1.5 text-xs text-destructive"
            data-testid="hero-input-error"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}
      </div>

      <div className="sr-only">
        Paste your public TeraBox link below and click Watch Now
      </div>
    </motion.form>
  );
});

export default HeroInput;
