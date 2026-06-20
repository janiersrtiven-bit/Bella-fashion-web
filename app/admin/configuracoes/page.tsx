"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
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
};

const initialConfig: SiteConfig = {
    heroImagem: "",
    heroTitulo: "",
    heroSubtitulo: "",
    heroMaterial: "",
    heroPrecoDestaque: "",
    heroWhatsappTexto: "",
    heroWhatsappNumero: "",
};

function normalizeImagePath(value: string) {
    const image = value.trim();

    if (!image) return "";

    if (
        image.startsWith("/produtos/") ||
        /^https?:\/\//i.test(image) ||
        image.startsWith("blob:") ||
        image.startsWith("data:")
    ) {
        return image;
    }

    return `/produtos/${image.replace(/^\/+/, "")}`;
}

export default function ConfiguracoesAdminPage() {
    const [config, setConfig] = useState<SiteConfig>(initialConfig);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingHeroImage, setIsUploadingHeroImage] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const { toast, showToast, clearToast } = useToast();

    const heroPreview = useMemo(() => normalizeImagePath(config.heroImagem), [config.heroImagem]);

    useEffect(() => {
        setIsLoading(true);
        setErrorMessage(null);

        fetch("/api/configuracoes")
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error("Falha ao carregar configurações");
                }

                return response.json();
            })
            .then((data) => {
                setConfig({
                    heroImagem: data.heroImagem ?? "",
                    heroTitulo: data.heroTitulo ?? "",
                    heroSubtitulo: data.heroSubtitulo ?? "",
                    heroMaterial: data.heroMaterial ?? "",
                    heroPrecoDestaque: data.heroPrecoDestaque ?? "",
                    heroWhatsappTexto: data.heroWhatsappTexto ?? "",
                    heroWhatsappNumero: data.heroWhatsappNumero ?? "",
                });
            })
            .catch(() => {
                setErrorMessage("Não foi possível carregar as configurações do site.");
                setConfig(initialConfig);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    function updateField(field: keyof SiteConfig, value: string) {
        setConfig((previous) => ({
            ...previous,
            [field]: value,
        }));
    }

    async function handleHeroImageFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setIsUploadingHeroImage(true);
            const uploadedUrl = await uploadImageToServer(file);
            updateField("heroImagem", uploadedUrl);
            showToast("Imagem do Hero enviada com sucesso.", "success");
        } catch (error) {
            const rawMessage = error instanceof Error ? error.message : "";
            const message = toUserFacingError(
                rawMessage,
                "Nao foi possivel enviar a imagem agora. Tente novamente."
            );
            showToast(message, "error");
        } finally {
            setIsUploadingHeroImage(false);
            event.currentTarget.value = "";
        }
    }

    async function handleSave(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (isInvalidImageValue(config.heroImagem)) {
            const message = "A imagem do Hero deve ser URL persistente. blob: e data: não são permitidos.";
            setErrorMessage(message);
            showToast(message, "error");
            return;
        }

        setIsSaving(true);
        setErrorMessage(null);

        try {
            const response = await fetch("/api/configuracoes", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(config),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                const message = toUserFacingError(
                    data?.error,
                    "Nao foi possivel salvar as configuracoes. Tente novamente."
                );
                setErrorMessage(message);
                showToast(message, "error");
                setIsSaving(false);
                return;
            }

            setConfig({
                heroImagem: data.heroImagem ?? "",
                heroTitulo: data.heroTitulo ?? "",
                heroSubtitulo: data.heroSubtitulo ?? "",
                heroMaterial: data.heroMaterial ?? "",
                heroPrecoDestaque: data.heroPrecoDestaque ?? "",
                heroWhatsappTexto: data.heroWhatsappTexto ?? "",
                heroWhatsappNumero: data.heroWhatsappNumero ?? "",
            });

            showToast("Configurações do site salvas com sucesso.", "success");
        } catch {
            const message = "Sem conexao com o servidor. Tente novamente.";
            setErrorMessage(message);
            showToast(message, "error");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <main className="min-h-screen bg-purple-50 p-6">
            <ToastView toast={toast} onClose={clearToast} />
            <div className="mx-auto max-w-6xl">
                <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-500">
                            Configurações
                        </p>

                        <h1 className="mt-2 text-4xl font-bold text-purple-950">
                            Configuração do Site
                        </h1>

                        <p className="mt-3 text-gray-600">
                            Defina o conteúdo principal do Home sem depender de dados fixos no código.
                        </p>
                        {isLoading && <p className="mt-2 text-sm text-purple-700">Carregando configurações...</p>}
                        {errorMessage && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}
                    </div>

                    <a
                        href="/admin"
                        className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-purple-900 shadow-sm transition hover:bg-purple-100"
                    >
                        Voltar
                    </a>
                </div>

                <form onSubmit={handleSave} className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                    <section className="rounded-3xl bg-white p-6 shadow-sm">
                        <h2 className="text-2xl font-bold text-purple-950">Hero do Home</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Esses dados são exibidos no topo da página inicial.
                        </p>

                        <div className="mt-6 grid gap-5">
                            <label className="block">
                                <span className="mb-2 block text-sm font-semibold text-purple-950">Imagem principal</span>
                                <input
                                    type="text"
                                    value={config.heroImagem}
                                    onChange={(event) => updateField("heroImagem", event.target.value)}
                                    placeholder="/produtos/minha-foto.jpg"
                                    className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none transition focus:border-purple-700"
                                />
                                <p className="mt-2 text-xs text-gray-500">
                                    Use URL completa ou caminho de arquivo em public/produtos.
                                </p>

                                <input
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                    onChange={handleHeroImageFileChange}
                                    disabled={isUploadingHeroImage}
                                    className="mt-3 rounded-full bg-white px-5 py-3 text-sm text-gray-600"
                                />
                                {isUploadingHeroImage && (
                                    <p className="mt-2 text-sm text-purple-700">Enviando imagem para storage...</p>
                                )}
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-sm font-semibold text-purple-950">Título principal</span>
                                <input
                                    type="text"
                                    value={config.heroTitulo}
                                    onChange={(event) => updateField("heroTitulo", event.target.value)}
                                    placeholder="Ex: Nova coleção Bella Fashion"
                                    className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none transition focus:border-purple-700"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-sm font-semibold text-purple-950">Subtítulo</span>
                                <textarea
                                    rows={3}
                                    value={config.heroSubtitulo}
                                    onChange={(event) => updateField("heroSubtitulo", event.target.value)}
                                    placeholder="Ex: Elegância e conforto para o seu dia a dia."
                                    className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none transition focus:border-purple-700"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-sm font-semibold text-purple-950">Texto de material</span>
                                <input
                                    type="text"
                                    value={config.heroMaterial}
                                    onChange={(event) => updateField("heroMaterial", event.target.value)}
                                    placeholder="Ex: 90% Poliamida • 10% Elastano"
                                    className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none transition focus:border-purple-700"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-sm font-semibold text-purple-950">Preço destacado</span>
                                <input
                                    type="text"
                                    value={config.heroPrecoDestaque}
                                    onChange={(event) => updateField("heroPrecoDestaque", event.target.value)}
                                    placeholder="Ex: R$ 89,90"
                                    className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none transition focus:border-purple-700"
                                />
                            </label>

                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="block">
                                    <span className="mb-2 block text-sm font-semibold text-purple-950">Texto botão WhatsApp</span>
                                    <input
                                        type="text"
                                        value={config.heroWhatsappTexto}
                                        onChange={(event) => updateField("heroWhatsappTexto", event.target.value)}
                                        placeholder="Ex: Comprar pelo WhatsApp"
                                        className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none transition focus:border-purple-700"
                                    />
                                </label>

                                <label className="block">
                                    <span className="mb-2 block text-sm font-semibold text-purple-950">Número WhatsApp</span>
                                    <input
                                        type="text"
                                        value={config.heroWhatsappNumero}
                                        onChange={(event) => updateField("heroWhatsappNumero", event.target.value)}
                                        placeholder="Ex: 5511999999999"
                                        className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none transition focus:border-purple-700"
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSaving || isLoading || isUploadingHeroImage}
                                className="rounded-full bg-purple-800 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-900 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSaving ? "Salvando..." : "Salvar configurações"}
                            </button>
                        </div>
                    </section>

                    <section className="rounded-3xl bg-white p-6 shadow-sm">
                        <h2 className="text-2xl font-bold text-purple-950">Pré-visualização</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Visão rápida do Hero com os valores atuais.
                        </p>

                        <div className="mt-6 rounded-3xl bg-purple-50 p-5">
                            <div className="relative h-64 overflow-hidden rounded-2xl bg-purple-100">
                                {heroPreview ? (
                                    isInvalidImageValue(heroPreview) ? (
                                        <div className="flex h-full items-center justify-center text-center text-sm text-red-600">
                                            URL de imagem inválida (blob/data). Faça upload real ou use URL persistente.
                                        </div>
                                    ) : (
                                        <Image src={heroPreview} alt="Preview Hero" fill className="object-cover" unoptimized />
                                    )
                                ) : (
                                    <div className="flex h-full items-center justify-center text-center text-sm text-purple-700">
                                        Sem imagem configurada
                                    </div>
                                )}
                            </div>

                            <h3 className="mt-4 text-xl font-bold text-purple-950">
                                {config.heroTitulo || "Título principal não configurado"}
                            </h3>

                            <p className="mt-2 text-sm text-gray-600">
                                {config.heroSubtitulo || "Subtítulo não configurado"}
                            </p>

                            {config.heroMaterial && (
                                <p className="mt-3 text-sm font-semibold text-purple-800">{config.heroMaterial}</p>
                            )}

                            {config.heroPrecoDestaque && (
                                <p className="mt-3 text-2xl font-bold text-purple-950">{config.heroPrecoDestaque}</p>
                            )}

                            <div className="mt-4 rounded-full bg-purple-800 px-5 py-3 text-center text-sm font-semibold text-white">
                                {config.heroWhatsappTexto || "Botão WhatsApp"}
                            </div>
                        </div>
                    </section>
                </form>
            </div>
        </main>
    );
}
