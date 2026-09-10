import { Zap } from "lucide-react";

export default function Logo() {
  return (
    <span
      data-testid="brand-link"
      aria-label="TeraPlayer Home"
      className="group flex min-h-[44px] items-center rounded-lg cursor-pointer"
      onClick={() => window.location.reload(true)}
    >
      <span className="flex items-center">
        <Zap
          className="h-7 w-7 text-indigo-600"
          strokeWidth={2.5}
          fill="currentColor"
          aria-hidden="true"
        />
        <span className="text-xl font-black leading-none tracking-tighter text-slate-900 sm:text-2xl">
          Tera<span className="text-gradient">Player</span>
          <span className="text-sm font-bold text-slate-400">.in</span>
        </span>
      </span>
    </span>
  );
}
