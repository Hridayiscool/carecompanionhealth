import { Link } from "@tanstack/react-router";
import { Search, Pill, Users, Languages, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import logo from "@/assets/logo.png";
import { useApp } from "@/lib/app-state";

export function AppShell({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useApp();
  const nav = [
    { to: "/", label: t.navSearch, icon: Search },
    { to: "/medications", label: t.navMeds, icon: Pill },
    { to: "/family", label: t.navFamily, icon: Users },
  ] as const;

  return (
    <div className="min-h-screen bg-background pb-32 text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="" width={44} height={44} className="h-11 w-11" />
            <span className="font-display text-xl font-bold text-primary sm:text-2xl">{t.appName}</span>
          </Link>
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="btn-soft shrink-0 px-3"
            aria-label="Change language"
          >
            <Languages className="h-6 w-6 max-sm:hidden" />
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
        <div className="disclaimer">
          <ShieldAlert className="h-7 w-7 shrink-0" />
          <p>{t.disclaimer}</p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card print:hidden">
        <div className="mx-auto grid max-w-2xl grid-cols-3">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="nav-item"
              activeProps={{ className: "nav-item-active" }}
              activeOptions={{ exact: true }}
            >
              <Icon className="h-8 w-8" />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
