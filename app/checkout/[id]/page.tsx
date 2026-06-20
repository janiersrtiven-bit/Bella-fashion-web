"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

type CheckoutPageProps = {
    params: {
        id: string;
    };
};

export default function CheckoutPage({ params }: CheckoutPageProps) {
    const router = useRouter();
    const cardPaymentEnabled = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
    const [produto, setProduto] = useState<Produto | null>(null);
    const [quantidade, setQuantidade] = useState("1");
    const [cliente, setCliente] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [emailCliente, setEmailCliente] = useState("");
    const [enderecoEntrega, setEnderecoEntrega] = useState("");
    const [metodoPagamento, setMetodoPagamento] = useState("Pix");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!cardPaymentEnabled && metodoPagamento === "Cartão") {
            setMetodoPagamento("Pix");
        }
    }, [cardPaymentEnabled, metodoPagamento]);

    useEffect(() => {
        const id = Number(params.id);
        if (!id) {
            setProduto(null);
            return;
        }

        fetch(`/api/produtos?id=${id}`)
            .then(async (response) => {
                if (!response.ok) {
                    return null;
                }
                return response.json();
            })
            .then((data) => setProduto(data))
            .catch(() => {
                setProduto(null);
            });
    }, [params.id]);

    const quantidadeNumero = Number(quantidade);
    const valorUnitario = produto ? parsePreco(produto.preco) : 0;

    const valorTotal = useMemo(() => {
        if (!produto || quantidadeNumero <= 0) return 0;
        return valorUnitario * quantidadeNumero;
    }, [produto, quantidadeNumero, valorUnitario]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!produto) return;

        const whatsappLimpo = whatsapp.replace(/\D/g, "");

        if (!cliente.trim()) {
            alert("Preencha o nome do cliente.");
            return;
        }

        if (whatsappLimpo.length < 10) {
            alert("Preencha um WhatsApp válido.");
            return;
        }

        if (quantidadeNumero <= 0 || !Number.isInteger(quantidadeNumero)) {
            alert("Preencha uma quantidade válida.");
            return;
        }

        if ((produto.estoque ?? 0) < quantidadeNumero) {
            alert("Quantidade maior que o estoque disponível.");
            return;
        }

        setIsSubmitting(true);
        setErrorMessage(null);

        const payload = {
            cliente: cliente.trim(),
            whatsapp: whatsappLimpo,
            emailCliente: emailCliente.trim() || undefined,
            enderecoEntrega: enderecoEntrega.trim() || undefined,
            produtoId: produto.id,
            quantidade: quantidadeNumero,
            valorTotal: formatarMoeda(valorTotal),
            metodoPagamento,
            statusPagamento: "Aguardando pagamento",
            statusPedido: "Pedido recebido",
            statusEntrega: "Aguardando envio",
            observacoes: undefined,
        };

        try {
            const response = await fetch("/api/pedidos", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorMessage(data.error || "Falha ao criar pedido.");
                setIsSubmitting(false);
                return;
            }

            if (metodoPagamento === "Cartão") {
                if (!cardPaymentEnabled) {
                    setErrorMessage("Pagamento por cartão indisponível no momento. Use Pix, Transferência ou Boleto.");
                    setIsSubmitting(false);
                    return;
                }

                const amountInCents = Math.round(valorTotal * 100);
                const stripeResponse = await fetch("/api/stripe", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        amount: amountInCents,
                        productName: produto.nome,
                        whatsapp: whatsappLimpo,
                        cliente: cliente.trim(),
                        pedidoId: data.id,
                        cancelPath: `/checkout/${produto.id}`,
                    }),
                });

                const stripeData = await stripeResponse.json();

                if (!stripeResponse.ok || !stripeData.url) {
                    setErrorMessage(stripeData.error || "Falha ao criar sessão de pagamento.");
                    setIsSubmitting(false);
                    return;
                }

                window.location.href = stripeData.url;
                return;
            }

            router.push(`/pedido-sucesso?id=${data.id}`);
        } catch (error) {
            setErrorMessage("Falha ao conectar com o servidor. Tente novamente mais tarde.");
            setIsSubmitting(false);
        }
    }

    if (!produto) {
        return (
            <main className="min-h-screen bg-purple-50 p-6">
                <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-sm">
                    <h1 className="text-3xl font-bold text-purple-950">Produto não encontrado</h1>
                    <p className="mt-4 text-gray-600">
                        Não foi possível localizar o produto selecionado. Por favor, volte à loja e tente novamente.
                    </p>
                    <button
                        type="button"
                        onClick={() => router.push("/")}
                        className="mt-8 rounded-full bg-purple-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-900"
                    >
                        Voltar à loja
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-purple-50 p-6">
            <div className="mx-auto max-w-5xl">
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-500">
                            Checkout
                        </p>
                        <h1 className="mt-2 text-4xl font-bold text-purple-950">
                            Finalizar compra
                        </h1>
                        <p className="mt-3 text-gray-600">
                            Confirme seus dados e finalize o pedido do produto selecionado.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => router.push("/")}
                        className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-purple-900 shadow-sm transition hover:bg-purple-100"
                    >
                        Voltar à loja
                    </button>
                </div>

                <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
                    <section className="rounded-3xl bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-6">
                            <div className="relative h-40 w-40 overflow-hidden rounded-3xl bg-purple-100">
                                <img
                                    src={produto.imagem}
                                    alt={produto.nome}
                                    className="h-full w-full object-cover"
                                />
                            </div>

                            <div>
                                <p className="text-sm uppercase tracking-[0.25em] text-purple-500">
                                    {produto.destaque}
                                </p>
                                <h2 className="mt-3 text-3xl font-bold text-purple-950">
                                    {produto.nome}
                                </h2>
                                <p className="mt-3 text-gray-600">{produto.descricao}</p>
                            </div>
                        </div>

                        <div className="mt-8 rounded-3xl bg-purple-50 p-6">
                            <div className="flex items-center justify-between text-sm text-gray-600">
                                <span>Preço unitário</span>
                                <span>{produto.preco}</span>
                            </div>
                            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                                <span>Estoque disponível</span>
                                <span>{produto.estoque ?? 0} un.</span>
                            </div>

                            <div className="mt-6 flex items-center justify-between gap-4 rounded-3xl bg-white p-4 shadow-sm">
                                <div>
                                    <p className="text-sm text-gray-500">Quantidade</p>
                                    <p className="text-3xl font-bold text-purple-950">{quantidadeNumero}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setQuantidade(String(Math.max(1, quantidadeNumero - 1)))}
                                        className="h-11 w-11 rounded-full bg-purple-100 text-purple-900 transition hover:bg-purple-200"
                                    >
                                        −
                                    </button>
                                    <input
                                        type="number"
                                        min="1"
                                        max={produto.estoque ?? 1}
                                        value={quantidade}
                                        onChange={(event) => setQuantidade(event.target.value)}
                                        className="w-20 rounded-2xl border border-purple-100 bg-white px-4 py-3 text-center outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setQuantidade(String(Math.min((produto.estoque ?? 1), quantidadeNumero + 1)))}
                                        className="h-11 w-11 rounded-full bg-purple-100 text-purple-900 transition hover:bg-purple-200"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between border-t border-purple-100 pt-4 text-lg font-semibold text-purple-950">
                                <span>Total</span>
                                <span>{formatarMoeda(valorTotal)}</span>
                            </div>
                        </div>
                    </section>

                    <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-6 shadow-sm">
                        <h2 className="text-2xl font-bold text-purple-950">Dados do cliente</h2>

                        <div className="mt-6 space-y-4">
                            <label className="block">
                                <span className="text-sm font-semibold text-purple-950">Nome completo</span>
                                <input
                                    type="text"
                                    value={cliente}
                                    onChange={(event) => setCliente(event.target.value)}
                                    placeholder="Nome da cliente"
                                    className="mt-2 w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none focus:border-purple-700"
                                />
                            </label>

                            <label className="block">
                                <span className="text-sm font-semibold text-purple-950">WhatsApp</span>
                                <input
                                    type="tel"
                                    value={whatsapp}
                                    onChange={(event) => setWhatsapp(event.target.value)}
                                    placeholder="Ex: 11940625832"
                                    className="mt-2 w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none focus:border-purple-700"
                                />
                            </label>

                            <label className="block">
                                <span className="text-sm font-semibold text-purple-950">E-mail</span>
                                <input
                                    type="email"
                                    value={emailCliente}
                                    onChange={(event) => setEmailCliente(event.target.value)}
                                    placeholder="cliente@email.com"
                                    className="mt-2 w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none focus:border-purple-700"
                                />
                            </label>

                            <label className="block">
                                <span className="text-sm font-semibold text-purple-950">Endereço de entrega</span>
                                <input
                                    type="text"
                                    value={enderecoEntrega}
                                    onChange={(event) => setEnderecoEntrega(event.target.value)}
                                    placeholder="Rua, número, bairro, cidade"
                                    className="mt-2 w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none focus:border-purple-700"
                                />
                            </label>

                            <label className="block">
                                <span className="text-sm font-semibold text-purple-950">Forma de pagamento</span>
                                <select
                                    value={metodoPagamento}
                                    onChange={(event) => setMetodoPagamento(event.target.value)}
                                    className="mt-2 w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none focus:border-purple-700"
                                >
                                    <option>Pix</option>
                                    <option>Transferência</option>
                                    {cardPaymentEnabled ? <option>Cartão</option> : null}
                                    <option>Boleto</option>
                                </select>
                            </label>

                            {!cardPaymentEnabled ? (
                                <p className="rounded-2xl bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                                    Cartão temporariamente indisponível. Configure Stripe para habilitar este método.
                                </p>
                            ) : null}

                            {errorMessage ? (
                                <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {errorMessage}
                                </p>
                            ) : null}
                        </div>

                        <button
                            type="submit"
                            className="mt-8 w-full rounded-full bg-purple-800 px-6 py-4 text-sm font-semibold text-white transition hover:bg-purple-900"
                        >
                            Finalizar pedido
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
