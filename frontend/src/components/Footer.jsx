import { Mail } from "lucide-react";
import { Link } from "react-router-dom";

const LEGAL_LINKS = [
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/terms", label: "Terms of Service" },
  { to: "/about-teraplayer", label: "About TeraPlayer" },
  { to: "/copyright", label: "Copyright" },
];

const POPULAR_LINKS = [
  { to: "/terabox-video-player", label: "TeraBox Video Player" },
  { to: "/terabox-video-downloader", label: "TeraBox Video Downloader" },
  { to: "/terabox-public-link", label: "Open a TeraBox Link" },
  { to: "/terabox-zip-download", label: "TeraBox ZIP Download" },
  { to: "/how-to-watch-terabox-videos", label: "How to Watch TeraBox Videos" },
];

export function FooterLegalLinks() {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-border/40 pt-5 text-xs text-muted-foreground">
      {LEGAL_LINKS.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          className="transition-colors duration-200 hover:text-foreground"
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-surface-raised/50">
      <div className="tp-container py-10">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <div className="flex items-center gap-2">
              <span className="font-display text-base font-semibold text-foreground">
                Tera<span className="text-primary">Player</span>
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-sm text-muted-foreground">Free to use · no account required</span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="mailto:teraplayer.contact@gmail.com"
                className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
              >
                <Mail className="h-4 w-4" />
                Contact
              </a>
              <Link to="/about" className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground">
                About
              </Link>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Popular
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              {POPULAR_LINKS.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="transition-colors duration-200 hover:text-foreground"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <FooterLegalLinks />

          <div className="mt-6 text-center text-xs text-muted-foreground opacity-70">
            Only supports public TeraBox links. Respect the original owners.
          </div>
        </div>
      </div>
    </footer>
  );
}