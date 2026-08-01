import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Link2,
  Loader2,
  ShieldCheck,
  FolderOpen,
  Film,
  ClipboardPaste,
} from "lucide-react";
import { Button } from "./ui/button";

const EXAMPLES = [
  "https://terabox.com/s/1abcXYZ",
  "https://1024terabox.com/s/1xyz",
  "https://terasharelink.com/s/1qw",
];

export default function HeroInput({
  onSubmit,
  loading,
  defaultValue = "",
}) {
  const [value, setValue] = useState(defaultValue);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % EXAMPLES.length);
    }, 3200);

    return () => clearInterval(id);
  }, []);

  const submit = (e) => {
    e.preventDefault();

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
    } catch { }
  };

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
        delay: 0.1,
      }}
      className="relative mx-auto w-full max-w-md sm:max-w-3xl"
      data-testid="hero-form"
    >
      <div className="mb-4 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          Paste your public TeraBox link below
        </p>
      </div>

      {/* INPUT */}
      <div className="rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex h-14 items-center px-4">
          <Link2 className="mr-3 h-5 w-5 shrink-0 text-muted-foreground" />

          <input
            ref={inputRef}
            type="url"
            inputMode="url"
            data-testid="paste-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`Paste your TeraBox link... ${EXAMPLES[placeholderIndex]}`}
            className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
          />
        </div>
      </div>

      {/* BUTTONS */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={paste}
          data-testid="paste-clipboard-btn"
          className="flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-secondary font-semibold text-muted-foreground transition hover:bg-secondary/80 hover:text-foreground"
        >
          <ClipboardPaste className="h-4 w-4" />
          Paste
        </button>

        <Button
          type="submit"
          data-testid="hero-submit-btn"
          disabled={loading || !value.trim()}
          className="h-12 rounded-xl text-base font-semibold"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading
            </>
          ) : (
            <>
              Watch Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {/* FEATURES */}
      <div className="mx-auto mt-4 flex max-w-sm flex-wrap items-center justify-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <Film className="h-3.5 w-3.5 text-primary" />
          HD Streaming
        </span>

        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <FolderOpen className="h-3.5 w-3.5 text-primary" />
          Folder Support
        </span>

        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          No Login Required
        </span>
      </div>
    </motion.form>
  );
}