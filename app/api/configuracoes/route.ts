import { NextResponse } from "next/server";
import { getSiteConfig, upsertSiteConfig } from "@/lib/db";
import { siteConfigSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

function normalizeOptional(value?: string) {
    return value?.trim() ? value.trim() : null;
}

export async function GET() {
    try {
        const config = await getSiteConfig();

        return NextResponse.json({
            heroImagem: config?.heroImagem ?? null,
            heroTitulo: config?.heroTitulo ?? null,
            heroSubtitulo: config?.heroSubtitulo ?? null,
            heroMaterial: config?.heroMaterial ?? null,
            heroPrecoDestaque: config?.heroPrecoDestaque ?? null,
            heroWhatsappTexto: config?.heroWhatsappTexto ?? null,
            heroWhatsappNumero: config?.heroWhatsappNumero ?? null,
        });
    } catch {
        return NextResponse.json({
            heroImagem: null,
            heroTitulo: null,
            heroSubtitulo: null,
            heroMaterial: null,
            heroPrecoDestaque: null,
            heroWhatsappTexto: null,
            heroWhatsappNumero: null,
        });
    }
}

export async function PUT(request: Request) {
    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
    }

    const parsed = siteConfigSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.errors.map((item) => item.message).join(" | ") },
            { status: 400 }
        );
    }

    const payload = parsed.data;

    try {
        const updated = await upsertSiteConfig({
            heroImagem: normalizeOptional(payload.heroImagem) ?? undefined,
            heroTitulo: normalizeOptional(payload.heroTitulo) ?? undefined,
            heroSubtitulo: normalizeOptional(payload.heroSubtitulo) ?? undefined,
            heroMaterial: normalizeOptional(payload.heroMaterial) ?? undefined,
            heroPrecoDestaque: normalizeOptional(payload.heroPrecoDestaque) ?? undefined,
            heroWhatsappTexto: normalizeOptional(payload.heroWhatsappTexto) ?? undefined,
            heroWhatsappNumero: normalizeOptional(payload.heroWhatsappNumero)?.replace(/\D/g, "") ?? undefined,
        });

        return NextResponse.json(updated);
    } catch {
        return NextResponse.json({ error: "Não foi possível salvar configurações." }, { status: 500 });
    }
}
