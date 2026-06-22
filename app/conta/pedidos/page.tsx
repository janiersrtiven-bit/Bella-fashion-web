import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/db";

export default async function ContaPedidosPage() {
  const cliente = await getCurrentCustomer();
  if (!cliente) {
    redirect("/conta/login");
  }

  const pedidos = await prisma.pedido.findMany({
    where: {
      OR: [
        { clienteId: cliente.id },
        { emailCliente: cliente.email },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      valorTotal: true,
      statusPagamento: true,
      statusPedido: true,
      statusEntrega: true,
      codigoRastreio: true,
      dataPedido: true,
      horaPedido: true,
      produtoNome: true,
      enderecoEntrega: true,
    },
  });

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 rounded-3xl border border-purple-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-purple-700">Meus pedidos</p>
              <h1 className="mt-3 text-3xl font-bold text-purple-950">Histórico de compras</h1>
              <p className="mt-2 text-sm text-gray-600">Exiba pedidos vinculados ao e-mail da sua conta.</p>
            </div>
            <Link
              href="/conta"
              className="inline-flex items-center justify-center rounded-full bg-purple-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-800"
            >
              Voltar à conta
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          {pedidos.length === 0 ? (
            <div className="rounded-3xl border border-purple-100 bg-white p-8 text-center shadow-sm">
              <p className="text-lg font-semibold text-purple-950">Nenhum pedido encontrado.</p>
              <p className="mt-2 text-sm text-gray-600">Se você já fez compras, elas podem ser encontradas pelo e-mail associado à sua conta.</p>
              <Link
                href="/"
                className="mt-6 inline-flex items-center justify-center rounded-full bg-purple-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-800"
              >
                Continuar comprando
              </Link>
            </div>
          ) : (
            pedidos.map((pedido) => (
              <article key={pedido.id} className="overflow-hidden rounded-3xl border border-purple-100 bg-white shadow-sm">
                <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">Pedido #{pedido.id}</p>
                    <p className="mt-2 text-xl font-bold text-purple-950">{pedido.produtoNome}</p>
                    <p className="mt-1 text-sm text-gray-600">{pedido.dataPedido} • {pedido.horaPedido}</p>
                  </div>
                  <div className="space-y-2 text-right">
                    <p className="text-sm text-gray-500">Valor</p>
                    <p className="text-lg font-semibold text-purple-950">{pedido.valorTotal}</p>
                  </div>
                </div>

                <div className="grid gap-4 border-t border-purple-100 bg-purple-50 px-6 py-5 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-semibold text-purple-950">Pagamento</p>
                    <p className="mt-1 text-sm text-gray-600">{pedido.statusPagamento}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-purple-950">Pedido</p>
                    <p className="mt-1 text-sm text-gray-600">{pedido.statusPedido}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-purple-950">Entrega</p>
                    <p className="mt-1 text-sm text-gray-600">{pedido.statusEntrega}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-purple-950">Rastreio</p>
                    <p className="mt-1 text-sm text-gray-600">{pedido.codigoRastreio || "Não disponível"}</p>
                  </div>
                </div>

                {pedido.enderecoEntrega ? (
                  <div className="border-t border-purple-100 px-6 py-5">
                    <p className="text-sm font-semibold text-purple-950">Endereço de entrega</p>
                    <p className="mt-1 text-sm text-gray-600">{pedido.enderecoEntrega}</p>
                  </div>
                ) : null}
                <div className="border-t border-purple-100 px-6 py-5">
                  <Link
                    href={`/conta/pedidos/${pedido.id}`}
                    className="inline-flex rounded-full bg-purple-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-800"
                  >
                    Ver detalhes
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
