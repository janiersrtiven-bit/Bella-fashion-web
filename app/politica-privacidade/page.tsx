import type { Metadata } from "next";
import { InstitutionalShell } from "@/components/store/institutional-shell";
import { getSiteConfig } from "@/lib/db";

export const metadata: Metadata = { title: "Política de Privacidade", description: "Política de privacidade da Bella Fashion." };
export const dynamic = "force-dynamic";

export default async function PoliticaPrivacidadePage() {
  const config = await getSiteConfig().catch(() => null);
  return <InstitutionalShell eyebrow="Seus dados" title="Política de Privacidade" content={config?.privacidadeTexto} />;
}
