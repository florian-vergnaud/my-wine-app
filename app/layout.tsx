import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Ma Cave Virtuelle",
  description:
    "Gestion personnelle de cave à vin : inventaire, accords mets-vins et notes de dégustation.",
};

export const viewport: Viewport = {
  themeColor: "#7a2e49",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
