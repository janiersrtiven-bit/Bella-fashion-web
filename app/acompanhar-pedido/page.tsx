"use client";

import Link from "next/link";
import { useState } from "react";

type Pedido = {
  id: number;
  cliente: string;
  produtoNome: string;
  quantidade: number;
  valorTotal: string;
  metodoPagamento: string;
  statusPagamento: string;
  statusPedido: string;
  statusEntrega: string;
  codigoRastreio?: string;
  enderecoEntrega?: string;
  dataPedido?: string;
  horaPedido?: string;
};

function statusClasse(status: string) {
  if (["Pago", "Pagamento confirmado", "Entregue"].includes(status)) {
    return "bg-green-100 text-green-700";
  }
  if (["Enviado", "Em transporte", "Saiu para entrega"].includes(status)) {
    return "bg-blue-100 text-blue-700";
  }
  if (["Cancelado", "Reembolsado"].includes(status)) {
    return "bg-red-100 text-red-700";
  }
  if (status === "Em preparação") return "bg-purple-100 text-purple-800";
  return "bg-yellow-100 text-yellow-700";
}

export default function AcompanharPedidoPage() {
  const [pedidoId, setPedidoId] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [pesquisou, setPesquisou] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBuscar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = Number(pedidoId);
    const whatsappLimpo = whatsapp.replace(/\D/g, "");

    if (!Number.isInteger(id) || id <= 0) {
      setError("Informe um número de pedido válido.");
      return;
    }
    if (!/^\d{10,15}$/.test(whatsappLimpo)) {
      setError("Informe o WhatsApp com DDD usado na compra.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/pedidos?id=${id}&whatsapp=${encodeURIComponent(whatsappLimpo)}`
      );
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Erro ao buscar pedido.");
      setPedido(data);
      setPesquisou(true);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Falha ao buscar pedido.");
      setPedido(null);
      setPesquisou(true);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-purple-50 p-4 py-8 sm:p-6">
      <div className="mx-auto max-w-4xl">
        <section className="rounded-3xl bg-white p-6 text-center shadow-sm sm:p-8">
          <Link href="/" className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-500">
            Bella Fashion
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-purple-950 sm:text-4xl">Acompanhar pedido</h1>
          <p className="mx-auto mt-4 max-w-2xl text-gray-600">
            Por segurança, informe os dois dados usados no pedido.
          </p>

          <form onSubmit={handleBuscar} className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
            <label className="text-left text-sm font-semibold text-purple-950">
              Número do pedido
              <input
                required
                inputMode="numeric"
                value={pedidoId}
                onChange={(event) => setPedidoId(event.target.value)}
                placeholder="Ex: 123"
                className="mt-2 w-full rounded-full border border-purple-100 px-5 py-4 font-normal outline-none focus:border-purple-700"
              />
            </label>
            <label className="text-left text-sm font-semibold text-purple-950">
              WhatsApp com DDD
              <input
                required
                type="tel"
                autoComplete="tel"
                value={whatsapp}
                onChange={(event) => setWhatsapp(event.target.value)}
                placeholder="Ex: 11940625832"
                className="mt-2 w-full rounded-full border border-purple-100 px-5 py-4 font-normal outline-none focus:border-purple-700"
              />
            </label>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-full bg-purple-800 px-8 py-4 font-semibold text-white transition hover:bg-purple-900 disabled:bg-gray-400 sm:col-span-2"
            >
              {isLoading ? "Consultando…" : "Consultar pedido"}
            </button>
          </form>
          {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
        </section>

        {pesquisou && !pedido && !error && (
          <section className="mt-8 rounded-3xl bg-white p-8 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-purple-950">Pedido não encontrado</h2>
            <p className="mt-3 text-gray-600">Confira o número e o WhatsApp e tente novamente.</p>
          </section>
        )}

        {pedido && (
          <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="text-sm font-semibold text-purple-500">Pedido #{pedido.id}</p>
                <h2 className="mt-2 text-3xl font-bold text-purple-950">{pedido.produtoNome}</h2>
                <p className="mt-2 text-gray-600">Cliente: {pedido.cliente}</p>
              </div>
              <div className="rounded-2xl bg-purple-50 px-5 py-4 sm:text-right">
                <p className="text-sm text-gray-500">Subtotal</p>
                <p className="text-2xl font-bold text-purple-950">{pedido.valorTotal}</p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                ["Pagamento", pedido.statusPagamento],
                ["Pedido", pedido.statusPedido],
                ["Entrega", pedido.statusEntrega],
              ].map(([label, status]) => (
                <div key={label} className="rounded-2xl bg-purple-50 p-5">
                  <p className="text-sm font-semibold text-gray-500">{label}</p>
                  <span className={`mt-3 inline-block rounded-full px-4 py-2 text-sm font-semibold ${statusClasse(status)}`}>
                    {status}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-purple-100 p-5">
                <p className="text-sm font-semibold text-gray-500">Quantidade e pagamento</p>
                <p className="mt-2 text-gray-700">{pedido.quantidade} un. · {pedido.metodoPagamento}</p>
              </div>
              <div className="rounded-2xl border border-purple-100 p-5">
                <p className="text-sm font-semibold text-gray-500">Data do pedido</p>
                <p className="mt-2 text-gray-700">{pedido.dataPedido || "-"} · {pedido.horaPedido || "-"}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-purple-100 p-5">
              <p className="text-sm font-semibold text-gray-500">Código de rastreio</p>
              <p className="mt-2 font-bold text-purple-950">{pedido.codigoRastreio || "Ainda não informado"}</p>
              {pedido.codigoRastreio && (
                <a
                  href="https://rastreamento.correios.com.br/app/index.php"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block rounded-full bg-purple-800 px-6 py-3 text-sm font-semibold text-white hover:bg-purple-900"
                >
                  Abrir rastreamento
                </a>
              )}
            </div>

            {pedido.enderecoEntrega && (
              <div className="mt-6 rounded-2xl border border-purple-100 p-5">
                <p className="text-sm font-semibold text-gray-500">Endereço de entrega</p>
                <p className="mt-2 text-gray-700">{pedido.enderecoEntrega}</p>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
