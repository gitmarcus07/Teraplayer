/**
 * FaqCards — shared reference-style FAQ grid used across all public pages.
 * Two-column glass cards with "?" badges, matching the homepage pattern.
 * `items` shape: [{ q, a }]. Copy always stays page-original.
 */
export default function FaqCards({ items }) {
  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2" data-testid="faq-grid">
      {items.map((item) => (
        <li
          key={item.q}
          className="glass-panel rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:bg-white/60"
        >
          <h3 className="mb-3 flex items-start gap-3 text-base font-bold text-slate-900 sm:text-lg">
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs text-indigo-600"
            >
              ?
            </span>
            {item.q}
          </h3>
          <p className="pl-9 text-sm leading-relaxed text-slate-600">{item.a}</p>
        </li>
      ))}
    </ul>
  );
}
