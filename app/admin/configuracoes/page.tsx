"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ToastView, useToast } from "@/components/ui/toast";
import { toUserFacingError } from "@/lib/ui-error";
import { isInvalidImageValue, uploadImageToServer } from "@/lib/upload-client";

type SiteConfig = {
  heroImagem: string;
  heroTitulo: string;
  heroSubtitulo: string;
  heroMaterial: string;
  heroPrecoDestaque: string;
  heroWhatsappTexto: string;
  heroWhatsappNumero: string;
  avisoTopo: string;
  instagramUrl: string;
  emailContato: string;
  whatsappContato: string;
  sobreTexto: string;
  enviosTexto: string;
  trocasTexto: string;
  privacidadeTexto: string;
  termosTexto: string;
  instrucoesPix: string;
  freteFixoCentavos: number;
};

const initialConfig: SiteConfig = {
  heroImagem: "",
  heroTitulo: "",
  heroSubtitulo: "",
  heroMaterial: "",
  heroPrecoDestaque: "",
  heroWhatsappTexto: "",
  heroWhatsappNumero: "",
  avisoTopo: "",
  instagramUrl: "",
  emailContato: "",
  whatsappContato: "",
  sobreTexto: "",
  enviosTexto: "",
  trocasTexto: "",
  privacidadeTexto: "",
  termosTexto: "",
  instrucoesPix: "",
  freteFixoCentavos: 0,
};

function normalizeImagePath(value: string) {
  const image = value.trim();
  if (!image) return "";
  if (image.startsWith("/") || /^https?:\/\//i.test(image)) return image;
  return `/produtos/${image.replace(/^\/+/, "")}`;
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "url";
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-purple-950">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none transition focus:border-purple-700"
      />
    </label>
  );
}

function LongTextField({
  label,
  value,
  onChange,
  help,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  help?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-purple-950">{label}</span>
      <textarea
        rows={6}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none transition focus:border-purple-700"
      />
      {help && <span className="mt-2 block text-xs text-gray-500">{help}</span>}
    </label>
  );
}

export default function ConfiguracoesAdminPage() {
  const [config, setConfig] = useState(initialConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast, showToast, clearToast } = useToast();
  const heroPreview = useMemo(() => normalizeImagePath(config.heroImagem), [config.heroImagem]);

  useEffect(() => {
    fetch("/api/configuracoes")
      .then(async (response) => {
        if (!response.ok) throw new Error("Falha ao carregar configurações");
        return response.json();
      })
      .then((data) => {
        setConfig({
          ...initialConfig,
          ...Object.fromEntries(
            Object.entries(initialConfig).map(([key, fallback]) => [key, data[key] ?? fallback])
          ),
        });
      })
      .catch(() => showToast("Não foi possível carregar as configurações.", "error"))
      .finally(() => setIsLoading(false));
  // A carga inicial ocorre uma vez; o toast não faz parte da identidade da requisição.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateField<K extends keyof SiteConfig>(field: K, value: SiteConfig[K]) {
    setConfig((previous) => ({ ...previous, [field]: value }));
  }

  async function uploadHero(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      updateField("heroImagem", await uploadImageToServer(file));
      showToast("Imagem principal enviada.", "success");
    } catch (error) {
      showToast(
        toUserFacingError(error instanceof Error ? error.message : "", "Não foi possível enviar a imagem."),
        "error"
      );
    } finally {
      setIsUploading(false);
      event.currentTarget.value = "";
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isInvalidImageValue(config.heroImagem)) {
      showToast("A imagem deve ter uma URL persistente.", "error");
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch("/api/configuracoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Falha ao salvar");
      setConfig({ ...initialConfig, ...data });
      showToast("Configurações publicadas com sucesso.", "success");
    } catch (error) {
      showToast(
        toUserFacingError(error instanceof Error ? error.message : "", "Não foi possível salvar."),
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-purple-50 px-4 py-8 sm:px-6">
      <ToastView toast={toast} onClose={clearToast} />
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-500">Conteúdo</p>
            <h1 className="mt-2 text-3xl font-bold text-purple-950 sm:text-4xl">Configuração da loja</h1>
            <p className="mt-2 text-gray-600">Home, canais, frete e políticas em um único lugar.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/" target="_blank" className="rounded-full border border-purple-200 bg-white px-5 py-3 text-sm font-semibold text-purple-900">
              Ver loja
            </Link>
            <Link href="/admin" className="rounded-full bg-purple-900 px-5 py-3 text-sm font-semibold text-white">
              Voltar ao admin
            </Link>
          </div>
        </header>

        <form onSubmit={save} className="space-y-8">
          <section className="grid gap-8 rounded-3xl bg-white p-6 shadow-sm lg:grid-cols-[1.25fr_0.75fr]">
            <div>
              <h2 className="text-2xl font-bold text-purple-950">Página inicial</h2>
              <div className="mt-6 grid gap-5">
                <TextField label="Aviso no topo" value={config.avisoTopo} onChange={(value) => updateField("avisoTopo", value)} placeholder="Frete, lançamento ou comunicado atual" />
                <TextField label="Imagem principal" value={config.heroImagem} onChange={(value) => updateField("heroImagem", value)} placeholder="URL HTTPS da imagem" />
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadHero} disabled={isUploading} className="text-sm text-gray-600" />
                <TextField label="Título principal" value={config.heroTitulo} onChange={(value) => updateField("heroTitulo", value)} />
                <LongTextField label="Subtítulo" value={config.heroSubtitulo} onChange={(value) => updateField("heroSubtitulo", value)} />
                <TextField label="Material ou diferencial" value={config.heroMaterial} onChange={(value) => updateField("heroMaterial", value)} />
                <TextField label="Preço destacado" value={config.heroPrecoDestaque} onChange={(value) => updateField("heroPrecoDestaque", value)} />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-purple-950">Prévia</h3>
              <div className="mt-4 overflow-hidden rounded-3xl bg-purple-50 p-4">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-purple-100">
                  {heroPreview && !isInvalidImageValue(heroPreview) ? (
                    <Image src={heroPreview} alt="Prévia da imagem principal" fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-purple-700">Sem imagem publicada</div>
                  )}
                </div>
                <p className="mt-4 text-xl font-bold text-purple-950">{config.heroTitulo || "Título ainda não publicado"}</p>
                {config.heroSubtitulo && <p className="mt-2 text-sm text-gray-600">{config.heroSubtitulo}</p>}
              </div>
            </div>
          </section>

          <section className="grid gap-8 rounded-3xl bg-white p-6 shadow-sm lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold text-purple-950">Canais oficiais</h2>
              <div className="mt-6 grid gap-5">
                <TextField label="Instagram" type="url" value={config.instagramUrl} onChange={(value) => updateField("instagramUrl", value)} placeholder="https://www.instagram.com/perfil" />
                <TextField label="E-mail de contato" type="email" value={config.emailContato} onChange={(value) => updateField("emailContato", value)} />
                <TextField label="WhatsApp de contato" value={config.whatsappContato} onChange={(value) => updateField("whatsappContato", value)} placeholder="Código do país + DDD + número" />
                <TextField label="Texto do botão WhatsApp" value={config.heroWhatsappTexto} onChange={(value) => updateField("heroWhatsappTexto", value)} />
                <TextField label="WhatsApp do botão principal" value={config.heroWhatsappNumero} onChange={(value) => updateField("heroWhatsappNumero", value)} />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-purple-950">Institucional</h2>
              <div className="mt-6">
                <LongTextField label="Sobre a Bella Fashion" value={config.sobreTexto} onChange={(value) => updateField("sobreTexto", value)} help="Exibido na página inicial e no rodapé." />
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-purple-950">Operação e políticas</h2>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <LongTextField label="Política de envios" value={config.enviosTexto} onChange={(value) => updateField("enviosTexto", value)} />
              <LongTextField label="Trocas e devoluções" value={config.trocasTexto} onChange={(value) => updateField("trocasTexto", value)} />
              <LongTextField label="Política de privacidade" value={config.privacidadeTexto} onChange={(value) => updateField("privacidadeTexto", value)} />
              <LongTextField label="Termos de uso e compra" value={config.termosTexto} onChange={(value) => updateField("termosTexto", value)} />
              <LongTextField label="Instruções do Pix" value={config.instrucoesPix} onChange={(value) => updateField("instrucoesPix", value)} help="Só será mostrado ao cliente quando estiver preenchido." />
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-purple-950">Frete manual fixo (R$)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={(config.freteFixoCentavos / 100).toFixed(2)}
                  onChange={(event) => updateField("freteFixoCentavos", Math.max(0, Math.round(Number(event.target.value || 0) * 100)))}
                  className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none transition focus:border-purple-700"
                />
              </label>
            </div>
          </section>

          <div className="sticky bottom-4 flex justify-end">
            <button type="submit" disabled={isLoading || isSaving || isUploading} className="rounded-full bg-purple-900 px-7 py-4 font-semibold text-white shadow-xl disabled:opacity-60">
              {isSaving ? "Publicando..." : "Salvar e publicar"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
