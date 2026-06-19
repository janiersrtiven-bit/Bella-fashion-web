"use client";

import { useState } from "react";

type Pedido = {
  id: number;
  cliente: string;
  whatsapp: string;
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
  status?: string;
};

function limparTexto(valor: string) {
  return valor.trim().toLowerCase();
}

function limparWhatsApp(valor: string) {
  return valor.replace(/\D/g, "");
}

function statusClasse(status: string) {
  if (status === "Pago" || status === "Pagamento confirmado" || status === "Entregue") {
    return "bg-green-100 text-green-700";
  }

  if (status === "Enviado" || status === "Em transporte" || status === "Saiu para entrega") {
    return "bg-blue-100 text-blue-700";
  }

  if (status === "Cancelado" || status === "Reembolsado") {
    return "bg-red-100 text-red-700";
  }

  if (status === "Em preparação") {
    return "bg-purple-100 text-purple-800";
  }

  return "bg-yellow-100 text-yellow-700";
}

export default function AcompanharPedidoPage() {
  const [busca, setBusca] = useState("");
  const [resultado, setResultado] = useState<Pedido[]>([]);
  const [pesquisou, setPesquisou] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBuscar() {
    const valorBusca = limparTexto(busca);
    const whatsappBusca = limparWhatsApp(busca);

    if (!valorBusca) {
      setError("Digite seu WhatsApp ou número do pedido.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const isId = /^[0-9]+$/.test(valorBusca);
      const query = isId ? `?id=${valorBusca}` : `?whatsapp=${encodeURIComponent(whatsappBusca)}`;

      const response = await fetch(`/api/pedidos${query}`);
      if (!response.ok) {
        throw new Error("Erro ao buscar pedidos.");
      }

      const data = await response.json();
      const pedidosEncontrados = Array.isArray(data) ? data : data ? [data] : [];

      setResultado(pedidosEncontrados);
      setPesquisou(true);
    } catch (fetchError) {
      setError("Falha ao buscar pedidos. Tente novamente.");
      setResultado([]);
      setPesquisou(true);
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <main className="min-h-screen bg-purple-50 p-6">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-500">
            Bella Fashion
          </p>

          <h1 className="mt-3 text-4xl font-bold text-purple-950">
            Acompanhar Pedido
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-gray-600">
            Digite seu WhatsApp ou o número do pedido para consultar o status,
            pagamento e entrega.
          </p>

          <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 md:flex-row">
            <input
              type="text"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Ex: 11940625832 ou número do pedido"
              className="w-full rounded-full border border-purple-100 px-5 py-4 outline-none focus:border-purple-700"
            />

            <button
              type="button"
              onClick={handleBuscar}
              className="rounded-full bg-purple-800 px-8 py-4 font-semibold text-white transition hover:bg-purple-900"
            >
              Consultar
            </button>
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </section>

        {pesquisou && resultado.length === 0 && (
          <section className="mt-8 rounded-3xl bg-white p-8 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-purple-950">
              Pedido não encontrado
            </h2>

            <p className="mt-3 text-gray-600">
              Confira o WhatsApp ou número do pedido e tente novamente.
            </p>

            <a
              href="https://wa.me/5511940625832"
              target="_blank"
              className="mt-6 inline-block rounded-full bg-green-600 px-8 py-4 font-semibold text-white transition hover:bg-green-700"
            >
              Falar com a Bella Fashion
            </a>
          </section>
        )}

        <div className="mt-8 space-y-6">
          {resultado.map((pedido) => {
            const statusPagamento =
              pedido.statusPagamento || "Aguardando pagamento";
            const statusPedido =
              pedido.statusPedido || pedido.status || "Pedido recebido";
            const statusEntrega = pedido.statusEntrega || "Aguardando envio";

            return (
              <section
                key={pedido.id}
                className="rounded-3xl bg-white p-8 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <p className="text-sm font-semibold text-purple-500">
                      Pedido #{pedido.id}
                    </p>

                    <h2 className="mt-2 text-3xl font-bold text-purple-950">
                      {pedido.produtoNome}
                    </h2>

                    <p className="mt-2 text-gray-600">
                      Cliente: {pedido.cliente}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-purple-50 px-5 py-4 text-right">
                    <p className="text-sm text-gray-500">Valor total</p>
                    <p className="text-2xl font-bold text-purple-950">
                      {pedido.valorTotal}
                    </p>
                  </div>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-purple-50 p-5">
                    <p className="text-sm font-semibold text-gray-500">
                      Pagamento
                    </p>
                    <p className="mt-2 text-sm text-gray-600">
                      {pedido.metodoPagamento || "Não informado"}
                    </p>
                    <span
                      className={`mt-3 inline-block rounded-full px-4 py-2 text-sm font-semibold ${statusClasse(
                        statusPagamento
                      )}`}
                    >
                      {statusPagamento}
                    </span>
                  </div>

                  <div className="rounded-2xl bg-purple-50 p-5">
                    <p className="text-sm font-semibold text-gray-500">
                      Status do pedido
                    </p>
                    <span
                      className={`mt-3 inline-block rounded-full px-4 py-2 text-sm font-semibold ${statusClasse(
                        statusPedido
                      )}`}
                    >
                      {statusPedido}
                    </span>
                  </div>

                  <div className="rounded-2xl bg-purple-50 p-5">
                    <p className="text-sm font-semibold text-gray-500">
                      Entrega
                    </p>
                    <span
                      className={`mt-3 inline-block rounded-full px-4 py-2 text-sm font-semibold ${statusClasse(
                        statusEntrega
                      )}`}
                    >
                      {statusEntrega}
                    </span>
                  </div>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-purple-100 p-5">
                    <p className="text-sm font-semibold text-gray-500">
                      Produto
                    </p>
                    <p className="mt-2 font-bold text-purple-950">
                      {pedido.produtoNome}
                    </p>
                    <p className="text-gray-600">
                      Quantidade: {pedido.quantidade}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-purple-100 p-5">
                    <p className="text-sm font-semibold text-gray-500">
                      Data do pedido
                    </p>
                    <p className="mt-2 font-bold text-purple-950">
                      {pedido.dataPedido || "-"}
                    </p>
                    <p className="text-gray-600">
                      {pedido.horaPedido || "-"}
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-purple-100 p-5">
                  <p className="text-sm font-semibold text-gray-500">
                    Código de rastreio
                  </p>

                  <p className="mt-2 font-bold text-purple-950">
                    {pedido.codigoRastreio || "Ainda não informado"}
                  </p>

                  {pedido.codigoRastreio && (
                    <a
                      href={`https://rastreamento.correios.com.br/app/index.php`}
                      target="_blank"
                      className="mt-4 inline-block rounded-full bg-purple-800 px-6 py-3 text-sm font-semibold text-white hover:bg-purple-900"
                    >
                      Abrir rastreamento
                    </a>
                  )}
                </div>

                {pedido.enderecoEntrega && (
                  <div className="mt-6 rounded-2xl border border-purple-100 p-5">
                    <p className="text-sm font-semibold text-gray-500">
                      Endereço de entrega
                    </p>
                    <p className="mt-2 text-gray-700">
                      {pedido.enderecoEntrega}
                    </p>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}