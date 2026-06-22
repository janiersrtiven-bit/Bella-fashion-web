import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type PedidoItem = {
  id: number;
  nome: string;
  quantidade: number;
};

type PageProps = {
  params: {
    id: string;
  };
};

function statusBadgeClass(status: string) {
  if (["Pago", "Entrega concluída", "Entregue"].includes(status)) {
    return "bg-green-100 text-green-700";
  }
  if (["Em transporte", "Saiu para entrega", "Em preparo", "Pedido recebido"].includes(status)) {
    return "bg-blue-100 text-blue-700";
  }
  if (["Cancelado", "Reembolsado"].includes(status)) {
    return "bg-red-100 text-red-700";
  }
  return "bg-yellow-100 text-yellow-700";
}

export default async function PedidoDetalhePage({ params }: PageProps) {
  const cliente = await getCurrentCustomer();
  if (!cliente) {
    redirect("/conta/login");
  }

  const pedidoId = Number(params.id);
  if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
    notFound();
  }

  const pedido = await prisma.pedido.findFirst({
    where: {
      id: pedidoId,
      OR: [
        { clienteId: cliente.id },
        { emailCliente: cliente.email },
      ],
    },
    include: {
      itens: {
        select: {
          id: true,
          nome: true,
          quantidade: true,
        },
        orderBy: { id: "asc" },
      },
      produto: {
        select: {
          slug: true,
        },
      },
    },
  });

  if (!pedido) {
    notFound();
  }

  const pedidoItems: PedidoItem[] =
    pedido.itens.length > 0
      ? pedido.itens
      : [{ id: 0, nome: pedido.produtoNome, quantidade: pedido.quantidade }];

  const reorderHref = pedido.produto?.slug ? `/produto/${pedido.produto.slug}` : "/";
  const reorderLabel = pedido.produto?.slug ? "Comprar novamente" : "Continuar comprando";

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 rounded-3xl border border-purple-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-purple-700">Detalhe do pedido</p>
              <h1 className="mt-3 text-3xl font-bold text-purple-950">Pedido #{pedido.id}</h1>
              <p className="mt-2 text-sm text-gray-600">Informações do pedido vinculado à sua conta.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/conta/pedidos"
                className="rounded-full border border-purple-200 bg-white px-5 py-3 text-sm font-semibold text-purple-950 transition hover:bg-purple-50"
              >
                Voltar
              </Link>
              <Link
                href="/acompanhar-pedido"
                className="rounded-full bg-purple-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-800"
              >
                Acompanhar pedido
              </Link>
              <Link
                href={reorderHref}
                className="rounded-full bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
              >
                {reorderLabel}
              </Link>
            </div>
          </div>
        </div>

        <section className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="space-y-6">
              <div className="rounded-3xl bg-purple-50 p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">Resumo</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-sm text-gray-500">Data</p>
                    <p className="mt-1 text-gray-900">{pedido.dataPedido} • {pedido.horaPedido}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Valor total</p>
                    <p className="mt-1 text-gray-900">{pedido.valorTotal}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status pagamento</p>
                    <p className="mt-1 text-gray-900">{pedido.statusPagamento}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-purple-50 p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-500">Status pedido</p>
                    <p className={`mt-1 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${statusBadgeClass(pedido.statusPedido)}`}>
                      {pedido.statusPedido}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status entrega</p>
                    <p className={`mt-1 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${statusBadgeClass(pedido.statusEntrega)}`}>
                      {pedido.statusEntrega}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-purple-50 p-6">
                <p className="text-sm text-gray-500">Código de rastreio</p>
                <p className="mt-2 text-gray-900">{pedido.codigoRastreio || "Ainda não disponível"}</p>
              </div>

              {pedido.observacoes ? (
                <div className="rounded-3xl bg-purple-50 p-6">
                  <p className="text-sm text-gray-500">Observações</p>
                  <p className="mt-2 text-gray-900 whitespace-pre-line">{pedido.observacoes}</p>
                </div>
              ) : null}
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-purple-100 p-6">
                <p className="text-sm font-semibold text-gray-500">Produtos</p>
                <div className="mt-5 space-y-4">
                  {pedidoItems.map((item) => (
                    <div key={item.id} className="rounded-3xl bg-white p-4 shadow-sm">
                      <p className="font-semibold text-purple-950">{item.nome}</p>
                      <p className="mt-1 text-sm text-gray-600">Quantidade: {item.quantidade}</p>
                    </div>
                  ))}
                </div>
              </div>

              {pedido.enderecoEntrega ? (
                <div className="rounded-3xl border border-purple-100 p-6">
                  <p className="text-sm font-semibold text-gray-500">Endereço de entrega</p>
                  <p className="mt-3 text-gray-900">{pedido.enderecoEntrega}</p>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
