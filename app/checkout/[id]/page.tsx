"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Produto } from "@/lib/produtos";

function parsePreco(preco: string) {
    const valorLimpo = preco
        .replace("R$", "")
        .replace(/\s/g, "")
        .replace(/\./g, "")
        .replace(",", ".");

    const numero = Number(valorLimpo);
    return Number.isNaN(numero) ? 0 : numero;
}

function formatarMoeda(valor: number) {
    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

function normalizeImagePath(value: string) {
    const image = value.trim();
    if (image.startsWith("/") || /^https?:\/\//i.test(image)) return image;
    return `/produtos/${image}`;
}

export default function CheckoutPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const productId = Number(params.id);
    const hasValidProductId = Number.isInteger(productId) && productId > 0;
    const cardPaymentEnabled = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
    const [produto, setProduto] = useState<Produto | null>(null);
    const [isLoadingProduto, setIsLoadingProduto] = useState(hasValidProductId);
    const [quantidade, setQuantidade] = useState("1");
    const [cliente, setCliente] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [emailCliente, setEmailCliente] = useState("");
    const [enderecoEntrega, setEnderecoEntrega] = useState("");
    const [observacoes, setObservacoes] = useState("");
    const [metodoPagamento, setMetodoPagamento] = useState("Pix");
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!hasValidProductId) return;

        const controller = new AbortController();

        async function loadProduto() {
            try {
                const response = await fetch(`/api/produtos?id=${productId}`, {
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error("Produto não encontrado.");
                }

                const data = (await response.json()) as Produto;
                setProduto(data);
            } catch (error) {
                if (error instanceof DOMException && error.name === "AbortError") return;
                setProduto(null);
            } finally {
                if (!controller.signal.aborted) setIsLoadingProduto(false);
            }
        }

        void loadProduto();
        return () => controller.abort();
    }, [hasValidProductId, productId]);

    const quantidadeNumero = Number(quantidade);
    const valorUnitario = produto ? parsePreco(produto.preco) : 0;
    const valorTotal = useMemo(() => {
        if (!produto || quantidadeNumero <= 0) return 0;
        return valorUnitario * quantidadeNumero;
    }, [produto, quantidadeNumero, valorUnitario]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!produto || isSubmitting) return;

        const whatsappLimpo = whatsapp.replace(/\D/g, "");

        if (!cliente.trim()) {
            setErrorMessage("Preencha o nome completo.");
            return;
        }
        if (!/^\d{10,15}$/.test(whatsappLimpo)) {
            setErrorMessage("Preencha um WhatsApp válido com DDD.");
            return;
        }
        if (!enderecoEntrega.trim()) {
            setErrorMessage("Informe o endereço completo, incluindo CEP.");
            return;
        }
        if (!Number.isInteger(quantidadeNumero) || quantidadeNumero <= 0) {
            setErrorMessage("Preencha uma quantidade válida.");
            return;
        }
        if ((produto.estoque ?? 0) < quantidadeNumero) {
            setErrorMessage("A quantidade escolhida não está mais disponível.");
            return;
        }
        if (!acceptedTerms) {
            setErrorMessage("Confirme que leu os termos e a política de privacidade.");
            return;
        }

        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            const response = await fetch("/api/pedidos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cliente: cliente.trim(),
                    whatsapp: whatsappLimpo,
                    emailCliente: emailCliente.trim() || undefined,
                    enderecoEntrega: enderecoEntrega.trim(),
                    produtoId: produto.id,
                    quantidade: quantidadeNumero,
                    valorTotal: formatarMoeda(valorTotal),
                    metodoPagamento,
                    observacoes: observacoes.trim() || undefined,
                    aceitouTermos: acceptedTerms,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                setErrorMessage(data.error || "Falha ao criar pedido.");
                return;
            }

            sessionStorage.setItem(
                "bella_order_access",
                JSON.stringify({ id: data.id, whatsapp: whatsappLimpo })
            );

            if (metodoPagamento === "Cartão") {
                const stripeResponse = await fetch("/api/stripe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        pedidoId: data.id,
                        cancelPath: `/checkout/${produto.id}`,
                    }),
                });
                const stripeData = await stripeResponse.json();

                if (!stripeResponse.ok || !stripeData.url) {
                    setErrorMessage(
                        stripeData.error ||
                            `O pedido #${data.id} foi salvo, mas o pagamento não abriu.`
                    );
                    return;
                }

                window.location.assign(stripeData.url);
                return;
            }

            router.push(`/pedido-sucesso?id=${data.id}`);
        } catch {
            setErrorMessage("Falha ao conectar com o servidor. Tente novamente mais tarde.");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoadingProduto) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-purple-50 p-6">
                <p className="rounded-full bg-white px-6 py-3 font-medium text-purple-900 shadow-sm">
                    Carregando produto…
                </p>
            </main>
        );
    }

    if (!produto) {
        return (
            <main className="min-h-screen bg-purple-50 p-6">
                <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 text-center shadow-sm">
                    <h1 className="text-3xl font-bold text-purple-950">Produto não encontrado</h1>
                    <p className="mt-4 text-gray-600">
                        O produto pode ter sido retirado do catálogo ou estar indisponível.
                    </p>
                    <Link
                        href="/"
                        className="mt-8 inline-block rounded-full bg-purple-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-900"
                    >
                        Voltar à loja
                    </Link>
                </div>
            </main>
        );
    }

    const estoqueDisponivel = produto.estoque ?? 0;
    const semEstoque = estoqueDisponivel <= 0;

    return (
        <main className="min-h-screen bg-purple-50 p-4 py-8 sm:p-6">
            <div className="mx-auto max-w-5xl">
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-500">
                            Checkout seguro
                        </p>
                        <h1 className="mt-2 text-3xl font-bold text-purple-950 sm:text-4xl">
                            Finalizar compra
                        </h1>
                        <p className="mt-3 text-gray-600">Revise o produto e informe seus dados.</p>
                    </div>
                    <Link
                        href="/"
                        className="self-start rounded-full bg-white px-5 py-3 text-sm font-semibold text-purple-900 shadow-sm transition hover:bg-purple-100"
                    >
                        Voltar à loja
                    </Link>
                </div>

                <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
                    <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                            <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-purple-100 sm:h-40 sm:w-40 sm:shrink-0">
                                <Image
                                    src={normalizeImagePath(produto.imagem)}
                                    alt={produto.nome}
                                    fill
                                    sizes="(max-width: 640px) 90vw, 160px"
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>
                            <div>
                                <p className="text-sm uppercase tracking-[0.25em] text-purple-500">
                                    {produto.categoria}
                                </p>
                                <h2 className="mt-3 text-3xl font-bold text-purple-950">
                                    {produto.nome}
                                </h2>
                                <p className="mt-3 text-gray-600">{produto.descricao}</p>
                            </div>
                        </div>

                        <div className="mt-8 rounded-3xl bg-purple-50 p-5 sm:p-6">
                            <div className="flex items-center justify-between text-sm text-gray-600">
                                <span>Preço unitário</span>
                                <span>{produto.preco}</span>
                            </div>
                            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                                <span>Disponibilidade</span>
                                <span>{semEstoque ? "Esgotado" : `${estoqueDisponivel} un.`}</span>
                            </div>

                            {!semEstoque && (
                                <div className="mt-6 flex flex-col gap-4 rounded-3xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Quantidade</p>
                                        <p className="text-3xl font-bold text-purple-950">{quantidadeNumero}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            aria-label="Diminuir quantidade"
                                            onClick={() =>
                                                setQuantidade(String(Math.max(1, quantidadeNumero - 1)))
                                            }
                                            className="h-11 w-11 rounded-full bg-purple-100 text-purple-900 transition hover:bg-purple-200"
                                        >
                                            −
                                        </button>
                                        <input
                                            aria-label="Quantidade"
                                            type="number"
                                            min="1"
                                            max={estoqueDisponivel}
                                            value={quantidade}
                                            onChange={(event) => setQuantidade(event.target.value)}
                                            className="w-20 rounded-2xl border border-purple-100 bg-white px-4 py-3 text-center outline-none"
                                        />
                                        <button
                                            type="button"
                                            aria-label="Aumentar quantidade"
                                            onClick={() =>
                                                setQuantidade(
                                                    String(Math.min(estoqueDisponivel, quantidadeNumero + 1))
                                                )
                                            }
                                            className="h-11 w-11 rounded-full bg-purple-100 text-purple-900 transition hover:bg-purple-200"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 flex items-center justify-between border-t border-purple-100 pt-4 text-lg font-semibold text-purple-950">
                                <span>Subtotal</span>
                                <span>{formatarMoeda(valorTotal)}</span>
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                                O valor e o prazo do frete serão confirmados pela loja.
                            </p>
                        </div>
                    </section>

                    <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                        <h2 className="text-2xl font-bold text-purple-950">Dados da cliente</h2>
                        <div className="mt-6 space-y-4">
                            <label className="block text-sm font-semibold text-purple-950">
                                Nome completo
                                <input
                                    required
                                    autoComplete="name"
                                    value={cliente}
                                    onChange={(event) => setCliente(event.target.value)}
                                    className="mt-2 w-full rounded-2xl border border-purple-100 px-4 py-3 font-normal outline-none focus:border-purple-700"
                                />
                            </label>
                            <label className="block text-sm font-semibold text-purple-950">
                                WhatsApp com DDD
                                <input
                                    required
                                    type="tel"
                                    inputMode="tel"
                                    autoComplete="tel"
                                    value={whatsapp}
                                    onChange={(event) => setWhatsapp(event.target.value)}
                                    placeholder="Ex: 11940625832"
                                    className="mt-2 w-full rounded-2xl border border-purple-100 px-4 py-3 font-normal outline-none focus:border-purple-700"
                                />
                            </label>
                            <label className="block text-sm font-semibold text-purple-950">
                                E-mail (opcional)
                                <input
                                    type="email"
                                    autoComplete="email"
                                    value={emailCliente}
                                    onChange={(event) => setEmailCliente(event.target.value)}
                                    className="mt-2 w-full rounded-2xl border border-purple-100 px-4 py-3 font-normal outline-none focus:border-purple-700"
                                />
                            </label>
                            <label className="block text-sm font-semibold text-purple-950">
                                Endereço completo e CEP
                                <textarea
                                    required
                                    autoComplete="street-address"
                                    rows={3}
                                    value={enderecoEntrega}
                                    onChange={(event) => setEnderecoEntrega(event.target.value)}
                                    placeholder="Rua, número, bairro, cidade, estado e CEP"
                                    className="mt-2 w-full rounded-2xl border border-purple-100 px-4 py-3 font-normal outline-none focus:border-purple-700"
                                />
                            </label>
                            <label className="block text-sm font-semibold text-purple-950">
                                Tamanho, cor ou observação (opcional)
                                <input
                                    value={observacoes}
                                    onChange={(event) => setObservacoes(event.target.value)}
                                    placeholder="Ex: tamanho M, cor preta"
                                    className="mt-2 w-full rounded-2xl border border-purple-100 px-4 py-3 font-normal outline-none focus:border-purple-700"
                                />
                            </label>
                            <label className="block text-sm font-semibold text-purple-950">
                                Forma de pagamento
                                <select
                                    value={metodoPagamento}
                                    onChange={(event) => setMetodoPagamento(event.target.value)}
                                    className="mt-2 w-full rounded-2xl border border-purple-100 px-4 py-3 font-normal outline-none focus:border-purple-700"
                                >
                                    <option value="Pix">Pix (confirmação pelo WhatsApp)</option>
                                    {cardPaymentEnabled && (
                                        <option value="Cartão">Cartão — ambiente seguro Stripe</option>
                                    )}
                                </select>
                            </label>

                            <label className="flex items-start gap-3 rounded-2xl bg-purple-50 p-4 text-sm text-gray-700">
                                <input
                                    required
                                    type="checkbox"
                                    checked={acceptedTerms}
                                    onChange={(event) => setAcceptedTerms(event.target.checked)}
                                    className="mt-1 h-4 w-4 accent-purple-800"
                                />
                                <span>
                                    Li e aceito os <Link className="underline" href="/termos">Termos</Link> e a{" "}
                                    <Link className="underline" href="/politica-privacidade">Política de Privacidade</Link>.
                                </span>
                            </label>

                            {errorMessage && (
                                <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {errorMessage}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={semEstoque || isSubmitting}
                            className="mt-8 w-full rounded-full bg-purple-800 px-6 py-4 text-sm font-semibold text-white transition hover:bg-purple-900 disabled:cursor-not-allowed disabled:bg-gray-400"
                        >
                            {semEstoque
                                ? "Produto esgotado"
                                : isSubmitting
                                  ? "Registrando pedido…"
                                  : metodoPagamento === "Cartão"
                                    ? "Ir para pagamento seguro"
                                    : "Enviar pedido"}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
