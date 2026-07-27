import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Link2, Loader2 } from "lucide-react";
import { Button } from "./ui/button";

const EXAMPLES = [
  "https://terabox.com/s/1abcXYZ",
  "https://1024terabox.com/s/1xyz",
  "https://terasharelink.com/s/1qw",
];

export default function HeroInput({ onSubmit, loading, defaultValue = "" }) {
  const [value, setValue] = useState(defaultValue);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setPlaceholderIndex((i) => (i + 1) % EXAMPLES.length), 3200);
    return () => clearInterval(id);
  }, []);

  const submit = (e) => {
    e?.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    onSubmit?.(trimmed);
  };

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setValue(text.trim());
        inputRef.current?.focus();
      }
    } catch {
      /* silent */
    }
  };

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      className="relative mx-auto w-full max-w-3xl"
      data-testid="hero-form"
    >
      <div className="group relative flex items-stretch overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/5 transition-colors duration-300 focus-within:border-primary/70 focus-within:shadow-primary/20">
        <div className="hidden shrink-0 items-center justify-center pl-6 pr-2 text-muted-foreground sm:flex">
          <Link2 className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <input
          ref={inputRef}
          data-testid="paste-input"
          type="url"
          inputMode="url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={`Paste TeraBox link… ${EXAMPLES[placeholderIndex]}`}
          className="w-full min-w-0 flex-1 bg-transparent px-4 py-4 text-sm text-foreground outline-none placeholder:text-muted-foreground sm:py-6 sm:pl-2 sm:pr-4 sm:text-lg"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
        />
        <button
          type="button"
          onClick={paste}
          data-testid="paste-clipboard-btn"
          className="mx-2 my-2 hidden shrink-0 items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors duration-200 hover:bg-secondary/80 hover:text-foreground sm:flex"
        >
          Paste
        </button>
        <Button
          type="submit"
          data-testid="hero-submit-btn"
          disabled={loading || !value.trim()}
          className="m-1.5 h-auto shrink-0 rounded-xl px-3 text-sm font-semibold sm:m-2 sm:px-6 sm:text-base"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
              <span className="hidden sm:inline">Analyzing</span>
            </>
          ) : (
            <>
              <span className="hidden sm:inline">Preview</span>
              <ArrowRight className="h-4 w-4 sm:ml-2" />
            </>
          )}
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-2 text-center text-[11px] text-muted-foreground sm:text-xs">
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-primary sm:h-3.5 sm:w-3.5" /> Instant preview, watch &amp; download
        </span>
        <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/40 sm:block" />
        <span>Supports terabox.com and mirrors</span>
      </div>
    </motion.form>
  );
}
