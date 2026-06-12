"use client";

import { AuthProvider, useAuth } from "@/lib/authContext";
import { CellarProvider } from "@/lib/cellarContext";
import AppShell from "@/components/AppShell";
import LoginScreen from "@/components/LoginScreen";

function Gate({ children }: { children: React.ReactNode }) {
  const { ready, authed } = useAuth();
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-wine-500">
        Chargement…
      </div>
    );
  }
  if (!authed) return <LoginScreen />;
  return (
    <CellarProvider>
      <AppShell>{children}</AppShell>
    </CellarProvider>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Gate>{children}</Gate>
    </AuthProvider>
  );
}
