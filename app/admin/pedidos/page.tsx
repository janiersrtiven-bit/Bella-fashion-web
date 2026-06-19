"use client";

import { useEffect, useState } from "react";
import { ToastView, useToast } from "@/components/ui/toast";
type Pedido = {
  id: number;
  cliente: string;
  whatsapp: string;
  emailCliente?: string;
  enderecoEntrega?: string;
  produtoId: number;
  produtoNome: string;
  quantidade: number;
  valorTotal: string;
  metodoPagamento?: string;
  statusPagamento?: string;
  statusPedido?: string;
  status?: string;
  codigoRastreio?: string;
  statusEntrega?: string;
  observacoes?: string;
  dataPedido: string;
  horaPedido: string;
};

type Produto = {
  id: number;
  nome: string;
  preco: string;
  status: string;
  estoque: number;
};

function statusClasse(status: string) {
  if (status === "Pago" || status === "Pagamento confirmado" || status === "Entregue") {
    return "bg-green-100 text-green-700";
  }

  if (status === "Enviado" || status === "Em transporte") {
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

export default function PedidosAdminPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("Todos");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { toast, showToast, clearToast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    setErrorMessage(null);

    fetch("/api/pedidos")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("No se pudieron cargar los pedidos.");
        }
        return response.json();
      })
      .then((data) => setPedidos(data))
      .catch(() => {
        setPedidos([]);
        setErrorMessage("Não foi possível carregar os pedidos.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function handleDelete(pedido: Pedido) {
    const confirmar = confirm(
      "Tem certeza que deseja eliminar este pedido? O estoque será devolvido."
    );

    if (!confirmar) return;

    try {
      setDeletingId(pedido.id);
      const response = await fetch(`/api/pedidos?id=${pedido.id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok) {
        const message = data.error || "No se pudo eliminar el pedido.";
        setErrorMessage(message);
        showToast(message, "error");
        return;
      }

      const pedidosAtualizados = pedidos.filter((item) => item.id !== pedido.id);
      setPedidos(pedidosAtualizados);
      showToast("Pedido eliminado e estoque devolvido com sucesso.", "success");
    } catch {
      const message = "No se pudo conectar con el servidor.";
      setErrorMessage(message);
      showToast(message, "error");
    } finally {
      setDeletingId(null);
    }
  }

  const totalPedidos = pedidos.length;

  const totalAguardandoPagamento = pedidos.filter(
    (pedido) =>
      (pedido.statusPagamento || "Aguardando pagamento") ===
      "Aguardando pagamento"
  ).length;

  const totalPagos = pedidos.filter(
    (pedido) => pedido.statusPagamento === "Pago"
  ).length;

  const totalEnviados = pedidos.filter(
    (pedido) => (pedido.statusPedido || pedido.status) === "Enviado"
  ).length;

  const pedidosFiltrados = pedidos.filter((pedido) => {
    const textoBusca = busca.toLowerCase();
    const statusPedidoAtual = pedido.statusPedido || pedido.status || "Pedido recebido";
    const statusPagamentoAtual =
      pedido.statusPagamento || "Aguardando pagamento";

    const correspondeBusca =
      pedido.cliente.toLowerCase().includes(textoBusca) ||
      pedido.whatsapp.toLowerCase().includes(textoBusca) ||
      pedido.produtoNome.toLowerCase().includes(textoBusca) ||
      pedido.valorTotal.toLowerCase().includes(textoBusca) ||
      (pedido.metodoPagamento || "").toLowerCase().includes(textoBusca) ||
      (pedido.codigoRastreio || "").toLowerCase().includes(textoBusca);

    const correspondeFiltro =
      filtro === "Todos" ||
      statusPedidoAtual === filtro ||
      statusPagamentoAtual === filtro ||
      pedido.statusEntrega === filtro;

    return correspondeBusca && correspondeFiltro;
  });

  const pedidosOrdenados = [...pedidosFiltrados].sort((a, b) => b.id - a.id);

  return (
    <main className="min-h-screen bg-purple-50 p-6">
      <ToastView toast={toast} onClose={clearToast} />
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-500">
              Pedidos
            </p>

            <h1 className="mt-2 text-4xl font-bold text-purple-950">
              Gerenciar Pedidos
            </h1>

            <p className="mt-3 text-gray-600">
              Controle pedidos, pagamentos, entregas e rastreamento.
            </p>
            {isLoading && <p className="mt-2 text-sm text-purple-700">Carregando pedidos...</p>}
            {errorMessage && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}
          </div>

          <div className="flex gap-3">
            <a
              href="/admin"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-purple-900 shadow-sm transition hover:bg-purple-100"
            >
              Voltar
            </a>

            <a
              href="/admin/pedidos/novo"
              className="rounded-full bg-purple-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-900"
            >
              + Novo Pedido
            </a>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Total de pedidos</p>
            <h2 className="mt-2 text-3xl font-bold text-purple-950">
              {totalPedidos}
            </h2>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Aguardando pagamento</p>
            <h2 className="mt-2 text-3xl font-bold text-yellow-600">
              {totalAguardandoPagamento}
            </h2>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Pagos</p>
            <h2 className="mt-2 text-3xl font-bold text-green-600">
              {totalPagos}
            </h2>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Enviados</p>
            <h2 className="mt-2 text-3xl font-bold text-blue-600">
              {totalEnviados}
            </h2>
          </div>
        </div>

        <section className="mt-10 overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="border-b border-purple-100 p-6">
            <h2 className="text-2xl font-bold text-purple-950">
              Lista de pedidos
            </h2>
          </div>

          <div className="grid gap-4 border-b border-purple-100 p-6 md:grid-cols-2">
            <input
              type="text"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por cliente, WhatsApp, produto, pagamento ou rastreio..."
              className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none transition focus:border-purple-700"
            />

            <select
              value={filtro}
              onChange={(event) => setFiltro(event.target.value)}
              className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none transition focus:border-purple-700"
            >
              <option>Todos</option>
              <option>Aguardando pagamento</option>
              <option>Pago</option>
              <option>Reembolsado</option>
              <option>Pedido recebido</option>
              <option>Pagamento confirmado</option>
              <option>Em preparação</option>
              <option>Enviado</option>
              <option>Entregue</option>
              <option>Cancelado</option>
              <option>Aguardando envio</option>
              <option>Em transporte</option>
              <option>Saiu para entrega</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1500px] text-left">
              <thead className="bg-purple-100 text-sm text-purple-950">
                <tr>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">WhatsApp</th>
                  <th className="px-6 py-4">Produto</th>
                  <th className="px-6 py-4">Qtd.</th>
                  <th className="px-6 py-4">Valor</th>
                  <th className="px-6 py-4">Pagamento</th>
                  <th className="px-6 py-4">Status Pag.</th>
                  <th className="px-6 py-4">Pedido</th>
                  <th className="px-6 py-4">Entrega</th>
                  <th className="px-6 py-4">Rastreio</th>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>

              <tbody>
                {pedidosOrdenados.length > 0 ? (
                  pedidosOrdenados.map((pedido) => {
                    const statusPagamentoAtual =
                      pedido.statusPagamento || "Aguardando pagamento";

                    const statusPedidoAtual =
                      pedido.statusPedido || pedido.status || "Pedido recebido";

                    const statusEntregaAtual =
                      pedido.statusEntrega || "Aguardando envio";

                    return (
                      <tr
                        key={pedido.id}
                        className="border-b border-purple-50 last:border-none"
                      >
                        <td className="px-6 py-4">
                          <p className="font-bold text-purple-950">
                            {pedido.cliente}
                          </p>
                          <p className="text-sm text-gray-500">
                            {pedido.emailCliente || "Sem e-mail"}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <a
                            href={`https://wa.me/55${pedido.whatsapp}`}
                            target="_blank"
                            className="font-semibold text-green-600 hover:underline"
                          >
                            {pedido.whatsapp}
                          </a>
                        </td>

                        <td className="px-6 py-4 font-semibold text-purple-950">
                          {pedido.produtoNome}
                        </td>

                        <td className="px-6 py-4 font-bold text-purple-900">
                          {pedido.quantidade}
                        </td>

                        <td className="px-6 py-4 font-bold text-purple-900">
                          {pedido.valorTotal}
                        </td>

                        <td className="px-6 py-4">
                          {pedido.metodoPagamento || "Não informado"}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-4 py-2 text-sm font-semibold ${statusClasse(
                              statusPagamentoAtual
                            )}`}
                          >
                            {statusPagamentoAtual}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-4 py-2 text-sm font-semibold ${statusClasse(
                              statusPedidoAtual
                            )}`}
                          >
                            {statusPedidoAtual}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-4 py-2 text-sm font-semibold ${statusClasse(
                              statusEntregaAtual
                            )}`}
                          >
                            {statusEntregaAtual}
                          </span>
                        </td>

                        <td className="px-6 py-4 font-semibold text-purple-900">
                          {pedido.codigoRastreio || "-"}
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-semibold text-purple-950">
                            {pedido.dataPedido || "-"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {pedido.horaPedido || "-"}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <a
                              href={`/admin/pedidos/editar/${pedido.id}`}
                              className="rounded-full bg-purple-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-900"
                            >
                              Editar
                            </a>

                            <button
                              type="button"
                              onClick={() => handleDelete(pedido)}
                              disabled={deletingId === pedido.id}
                              className="rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-200"
                            >
                              {deletingId === pedido.id ? "Eliminando..." : "Eliminar"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={12}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      Nenhum pedido cadastrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}