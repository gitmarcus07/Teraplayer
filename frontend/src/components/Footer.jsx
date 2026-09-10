import { Mail } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import { useLang } from "../i18n/LanguageContext";

const LEGAL_LINKS = [
  { to: "/privacy", key: "footer.privacy" },
  { to: "/terms", key: "footer.terms" },
  { to: "/about-teraplayer", key: "footer.aboutTp" },
  { to: "/copyright", key: "footer.copyright" },
];

const TOOL_LINKS = [
  { to: "/terabox-video-player", key: "explore.player" },
  { to: "/terabox-video-downloader", key: "explore.downloader" },
  { to: "/help-center", key: "explore.help" },
  { to: "/about-teraplayer", key: "footer.aboutTp" },
];

const SUPPORT_LINKS = [
  { to: "/contact", key: "footer.contactUs" },
  { to: "/about", key: "footer.about" },
  { to: "/help-center", key: "footer.support" },
];

export function FooterLegalLinks() {
  const { t } = useLang();
  return (
    <nav aria-label="Legal" className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-border/40 pt-5 text-xs text-muted-foreground">
      {LEGAL_LINKS.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          className="min-h-[32px] rounded-md px-1 py-1 transition-colors duration-fast hover:text-foreground"
        >
          {t(l.key)}
        </Link>
      ))}
    </nav>
  );
}

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12">
          <div className="col-span-1 md:col-span-1">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              {t("footer.tagline")}
            </p>
            <a
              href="mailto:teraplayer.contact@gmail.com"
              className="mt-4 inline-flex min-h-[40px] items-center gap-1.5 rounded-lg text-sm text-slate-600 transition-colors hover:text-indigo-600"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              teraplayer.contact@gmail.com
            </a>
          </div>
          <div className="col-span-1 flex flex-col gap-8 md:col-span-2 md:flex-row md:gap-16 md:justify-end">
            <nav aria-label={t("footer.tools")}>
              <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">{t("footer.tools")}</p>
              <ul className="space-y-3">
                {TOOL_LINKS.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="text-sm text-slate-600 transition-colors hover:text-indigo-600"
                    >
                      {t(l.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-label={t("footer.legal")}>
              <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">{t("footer.legal")}</p>
              <ul className="space-y-3">
                {LEGAL_LINKS.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="text-sm text-slate-600 transition-colors hover:text-indigo-600"
                    >
                      {t(l.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-label={t("footer.support")}>
              <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">{t("footer.support")}</p>
              <ul className="space-y-3">
                {SUPPORT_LINKS.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="text-sm text-slate-600 transition-colors hover:text-indigo-600"
                    >
                      {t(l.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 md:flex-row">
          <p className="max-w-2xl text-center text-xs text-slate-500 md:text-left">
            <strong>TeraPlayer</strong> {t("footer.dis1b")}<br /><br />
            {t("footer.dis2")}
          </p>
          <p className="whitespace-nowrap text-xs text-slate-500">{t("footer.rights").replace("{year}", String(new Date().getFullYear()))}</p>
        </div>
      </div>
    </footer>
  );
}