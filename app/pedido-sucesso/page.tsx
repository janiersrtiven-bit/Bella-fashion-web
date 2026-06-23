"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Pedido = {
    id: number;
    cliente: string;
    enderecoEntrega?: string;
    produtoNome: string;
    quantidade: number;
    valorTotal: string;
    metodoPagamento: string;
    statusPagamento: string;
    statusPedido: string;
    statusEntrega: string;
    itens?: Array<{
        id: number;
        nome: string;
        quantidade: number;
    }>;
};

type AccessData = { id: number; whatsapp: string };

export default function PedidoSucessoPage() {
    const [pedido, setPedido] = useState<Pedido | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        async function loadPedido() {
            try {
                const id = Number(new URLSearchParams(window.location.search).get("id"));
                const stored = sessionStorage.getItem("bella_order_access");
                const access = stored ? (JSON.parse(stored) as AccessData) : null;

                if (
                    !Number.isInteger(id) ||
                    id <= 0 ||
                    !access ||
                    access.id !== id ||
                    !/^\d{10,15}$/.test(access.whatsapp)
                ) {
                    setMessage(
                        "Por segurança, consulte o pedido usando o número e o WhatsApp da compra."
                    );
                    return;
                }

                const response = await fetch(
                    `/api/pedidos?id=${id}&whatsapp=${encodeURIComponent(access.whatsapp)}`
                );
                if (!response.ok) throw new Error("Pedido não encontrado.");

                const data = (await response.json()) as Pedido | null;
                setPedido(data);
                if (!data) setMessage("Não foi possível localizar este pedido.");
            } catch {
                setMessage("Não foi possível carregar os detalhes do pedido.");
            } finally {
                setIsLoading(false);
            }
        }

        void loadPedido();
    }, []);

    return (
        <main className="min-h-screen bg-purple-50 p-4 py-8 sm:p-6">
            <div className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-sm sm:p-8">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">
                    ✓
                </div>
                <h1 className="mt-5 text-center text-3xl font-bold text-purple-950 sm:text-4xl">
                    Pedido registrado!
                </h1>

                {isLoading && (
                    <p className="mt-6 text-center text-gray-600">Carregando os detalhes…</p>
                )}

                {pedido && (
                    <div className="mt-8 grid gap-5">
                        <section className="rounded-3xl bg-purple-50 p-6 text-center">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-500">
                                Guarde este número
                            </p>
                            <p className="mt-2 text-4xl font-black text-purple-950">#{pedido.id}</p>
                            <p className="mt-3 text-gray-600">Pedido de {pedido.cliente}</p>
                        </section>

                        {pedido.metodoPagamento === "Pix" && pedido.statusPagamento !== "Pago" && (
                            <section className="rounded-3xl border border-yellow-200 bg-yellow-50 p-6 text-yellow-900">
                                <h2 className="font-bold">Pagamento Pix pendente</h2>
                                <p className="mt-2 text-sm">
                                    A loja confirmará os dados de pagamento e o frete pelo WhatsApp informado no pedido. Não faça transferências para contatos diferentes dos canais oficiais.
                                </p>
                            </section>
                        )}

                        <div className="grid gap-5 sm:grid-cols-2">
                            <section className="rounded-3xl border border-purple-100 p-5">
                                <h2 className="font-bold text-purple-950">Produtos</h2>
                                <div className="mt-3 space-y-3">
                                    {(pedido.itens?.length
                                        ? pedido.itens
                                        : [{ id: 0, nome: pedido.produtoNome, quantidade: pedido.quantidade }]
                                    ).map((item) => (
                                        <div key={item.id} className="rounded-2xl bg-purple-50 p-3">
                                            <p className="text-gray-700">{item.nome}</p>
                                            <p className="text-sm text-gray-600">Quantidade: {item.quantidade}</p>
                                        </div>
                                    ))}
                                </div>
                                <p className="mt-3 font-bold text-purple-950">{pedido.valorTotal}</p>
                            </section>
                            <section className="rounded-3xl border border-purple-100 p-5">
                                <h2 className="font-bold text-purple-950">Situação</h2>
                                <p className="mt-2 text-gray-600">{pedido.statusPedido}</p>
                                <p className="text-gray-600">Pagamento: {pedido.statusPagamento}</p>
                                <p className="text-gray-600">Entrega: {pedido.statusEntrega}</p>
                            </section>
                        </div>
                    </div>
                )}

                {!isLoading && !pedido && (
                    <p role="alert" className="mt-8 rounded-3xl bg-yellow-50 p-6 text-center text-yellow-900">
                        {message}
                    </p>
                )}

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Link
                        href="/"
                        className="rounded-full bg-purple-800 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-purple-900"
                    >
                        Continuar comprando
                    </Link>
                    <Link
                        href="/acompanhar-pedido"
                        className="rounded-full bg-purple-100 px-6 py-3 text-center text-sm font-semibold text-purple-900 transition hover:bg-purple-200"
                    >
                        Acompanhar pedido
                    </Link>
                </div>
            </div>
        </main>
    );
}
