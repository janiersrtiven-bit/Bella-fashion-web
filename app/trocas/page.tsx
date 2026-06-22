import type { Metadata } from "next";
import { InstitutionalShell } from "@/components/store/institutional-shell";
import { getSiteConfig } from "@/lib/db";

export const metadata: Metadata = { title: "Trocas e devoluções", description: "Política de trocas e devoluções da Bella Fashion." };
export const dynamic = "force-dynamic";

export default async function TrocasPage() {
  const config = await getSiteConfig().catch(() => null);
  return <InstitutionalShell eyebrow="Pós-venda" title="Trocas e devoluções" content={config?.trocasTexto} />;
}
