import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/cart/cart-provider";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "Bella Fashion | Bodies Femininos",
    template: "%s | Bella Fashion",
  },
  description:
    "Bella Fashion - moda feminina, bodies elegantes, fabricação própria, conforto e qualidade.",
  applicationName: "Bella Fashion",
  keywords: ["body feminino", "bodies femininos", "moda feminina", "Bella Fashion"],
  authors: [{ name: "Bella Fashion" }],
  category: "fashion",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Bella Fashion",
    title: "Bella Fashion | Bodies Femininos",
    description: "Bodies femininos de fabricação própria, estilo e conforto.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Bella Fashion" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bella Fashion | Bodies Femininos",
    description: "Bodies femininos de fabricação própria, estilo e conforto.",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col"><CartProvider>{children}</CartProvider></body>
    </html>
  );
}
