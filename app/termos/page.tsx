import type { Metadata } from "next";
import { InstitutionalShell } from "@/components/store/institutional-shell";
import { getSiteConfig } from "@/lib/db";

export const metadata: Metadata = { title: "Termos de Uso", description: "Termos de uso e compra da Bella Fashion." };
export const dynamic = "force-dynamic";

export default async function TermosPage() {
  const config = await getSiteConfig().catch(() => null);
  return <InstitutionalShell eyebrow="Condições da loja" title="Termos de Uso e Compra" content={config?.termosTexto} />;
}
