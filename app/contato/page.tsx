import type { Metadata } from "next";
import { InstitutionalShell } from "@/components/store/institutional-shell";
import { getSiteConfig } from "@/lib/db";

export const metadata: Metadata = { title: "Contato", description: "Canais oficiais de atendimento da Bella Fashion." };
export const dynamic = "force-dynamic";

export default async function ContatoPage() {
  const config = await getSiteConfig().catch(() => null);
  const whatsapp = config?.whatsappContato?.replace(/\D/g, "") || config?.heroWhatsappNumero?.replace(/\D/g, "");
  const whatsappUrl = whatsapp && /^\d{10,15}$/.test(whatsapp) ? `https://wa.me/${whatsapp.startsWith("55") ? whatsapp : `55${whatsapp}`}` : null;

  return (
    <InstitutionalShell eyebrow="Atendimento" title="Fale com a Bella Fashion" content={config?.sobreTexto}>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noreferrer" className="rounded-2xl border border-purple-100 p-5 font-semibold text-purple-900">Atendimento pelo WhatsApp</a>}
        {config?.emailContato && <a href={`mailto:${config.emailContato}`} className="rounded-2xl border border-purple-100 p-5 font-semibold text-purple-900">{config.emailContato}</a>}
        {config?.instagramUrl && <a href={config.instagramUrl} target="_blank" rel="noreferrer" className="rounded-2xl border border-purple-100 p-5 font-semibold text-purple-900">Instagram oficial</a>}
      </div>
    </InstitutionalShell>
  );
}
