import type { Metadata } from "next";
import { InstitutionalShell } from "@/components/store/institutional-shell";
import { getSiteConfig } from "@/lib/db";

export const metadata: Metadata = { title: "Envios", description: "Política e informações de envio da Bella Fashion." };
export const dynamic = "force-dynamic";

export default async function EnviosPage() {
  const config = await getSiteConfig().catch(() => null);
  return <InstitutionalShell eyebrow="Sua compra" title="Envios e entrega" content={config?.enviosTexto} />;
}
