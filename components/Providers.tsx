"use client";

import { CellarProvider } from "@/lib/cellarContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <CellarProvider>{children}</CellarProvider>;
}
