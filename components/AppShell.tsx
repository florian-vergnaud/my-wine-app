"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCellar } from "@/lib/cellarContext";
import { useAuth } from "@/lib/authContext";

const NAV = [
  { href: "/", label: "Tableau de bord", icon: "🏠" },
  { href: "/cave", label: "Ma cave", icon: "🍷" },
  { href: "/quoi-boire", label: "Quoi boire ?", icon: "🍽️" },
  { href: "/historique", label: "Dégustations", icon: "📖" },
  { href: "/stats", label: "Statistiques", icon: "📊" },
];

function LogoutButton() {
  const { supabaseEnabled, authed, email, signOut } = useAuth();
  if (!supabaseEnabled || !authed) return null;
  return (
    <button
      onClick={() => signOut()}
      className="btn btn-ghost px-2 py-1 text-xs"
      title={email || undefined}
    >
      Déconnexion
    </button>
  );
}

function ModeBadge() {
  const { mode, ready } = useCellar();
  if (!ready) return null;
  return mode === "demo" ? (
    <span
      className="chip bg-amber-100 text-amber-800"
      title="Données stockées localement dans ce navigateur. Configurez Supabase pour la persistance multi-appareils."
    >
      Mode démo
    </span>
  ) : (
    <span className="chip bg-green-100 text-green-800">Synchronisé</span>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-wine-100 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🍇</span>
            <span className="font-serif text-lg font-bold text-wine-800">
              Ma Cave Virtuelle
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <ModeBadge />
            <LogoutButton />
          </div>
        </div>
        <nav className="mx-auto max-w-6xl overflow-x-auto px-2 pb-2">
          <ul className="flex gap-1 whitespace-nowrap">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-wine-700 text-white"
                      : "text-wine-700 hover:bg-wine-100"
                  }`}
                >
                  <span aria-hidden>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-wine-400">
        Ma Cave Virtuelle · usage personnel
      </footer>
    </div>
  );
}
