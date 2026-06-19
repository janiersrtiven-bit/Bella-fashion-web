"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Pedido = {
    id: number;
    cliente: string;
    whatsapp: string;
    emailCliente?: string;
    enderecoEntrega?: string;
    produtoNome: string;
    quantidade: number;
    valorTotal: string;
    metodoPagamento: string;
    statusPagamento: string;
    statusPedido: string;
    statusEntrega: string;
    codigoRastreio?: string;
    dataPedido?: string;
    horaPedido?: string;
};

export default function PedidoSucessoPage() {
    const router = useRouter();
    const [pedido, setPedido] = useState<Pedido | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const searchParams = new URLSearchParams(window.location.search);
        const idParam = searchParams.get("id");
        if (!idParam) {
            setLoading(false);
            return;
        }

        fetch(`/api/pedidos?id=${idParam}`)
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error("Pedido não encontrado.");
                }
                return response.json();
            })
            .then((data) => setPedido(data))
            .catch(() => setPedido(null))
            .finally(() => setLoading(false));
    }, []);

    return (
        <main className="min-h-screen bg-purple-50 p-6">
            <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-sm">
                <h1 className="text-4xl font-bold text-purple-950">Pedido finalizado!</h1>
                <p className="mt-4 text-gray-600">
                    Seu pedido foi registrado com sucesso. Abaixo estão os detalhes para o seu acompanhamento.
                </p>

                {pedido ? (
                    <div className="mt-8 grid gap-6 rounded-3xl bg-purple-50 p-6">
                        <div className="rounded-3xl bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-purple-950">Pedido #{pedido.id}</h2>
                            <p className="mt-2 text-gray-600">Cliente: {pedido.cliente}</p>
                            <p className="mt-2 text-gray-600">WhatsApp: {pedido.whatsapp}</p>
                            <p className="mt-2 text-gray-600">E-mail: {pedido.emailCliente || "Não informado"}</p>
                        </div>

                        <div className="rounded-3xl bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-purple-950">Produtos</h2>
                            <p className="mt-2 text-gray-600">{pedido.produtoNome}</p>
                            <p className="mt-2 text-gray-600">Quantidade: {pedido.quantidade}</p>
                            <p className="mt-2 text-gray-600">Total: {pedido.valorTotal}</p>
                        </div>

                        <div className="rounded-3xl bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-purple-950">Entrega</h2>
                            <p className="mt-2 text-gray-600">{pedido.enderecoEntrega || "Endereço não informado"}</p>
                            <p className="mt-2 text-gray-600">Status: {pedido.statusEntrega}</p>
                        </div>

                        <div className="rounded-3xl bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-purple-950">Pagamento</h2>
                            <p className="mt-2 text-gray-600">Método: {pedido.metodoPagamento}</p>
                            <p className="mt-2 text-gray-600">Status: {pedido.statusPagamento}</p>
                        </div>
                    </div>
                ) : (
                    <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
                        <p className="text-gray-600">
                            Não foi possível encontrar os detalhes do pedido. Verifique o número do pedido ou volte à loja.
                        </p>
                    </div>
                )}

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                        type="button"
                        onClick={() => router.push("/")}
                        className="rounded-full bg-purple-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-900"
                    >
                        Voltar à loja
                    </button>
                    <button
                        type="button"
                        onClick={() => router.push("/acompanhar-pedido")}
                        className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-purple-900 shadow-sm transition hover:bg-purple-100"
                    >
                        Acompanhar pedido
                    </button>
                </div>
            </div>
        </main>
    );
}
