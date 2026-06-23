import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default async function AdminPage() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    totalProdutos,
    totalProdutosAtivos,
    totalPedidos,
    pedidosNovos,
    pagamentosPendentes,
    clientes,
    estoqueBaixo,
    pedidosPagosHoje,
    ultimosPedidos,
  ] = await Promise.all([
    prisma.produto.count(),
    prisma.produto.count({ where: { status: "Ativo" } }),
    prisma.pedido.count(),
    prisma.pedido.count({ where: { statusPedido: "Pedido recebido" } }),
    prisma.pedido.count({ where: { statusPagamento: "Aguardando pagamento" } }),
    prisma.cliente.count(),
    prisma.produto.count({ where: { status: "Ativo", estoque: { lte: 5 } } }),
    prisma.pedido.findMany({
      where: {
        statusPagamento: "Pago",
        createdAt: { gte: startOfDay },
      },
      select: { totalCentavos: true, valorTotal: true },
    }),
    prisma.pedido.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        cliente: true,
        valorTotal: true,
        statusPagamento: true,
        statusPedido: true,
        createdAt: true,
      },
    }),
  ]);

  const vendasHojeCentavos = pedidosPagosHoje.reduce((total, pedido) => {
    if (typeof pedido.totalCentavos === "number" && pedido.totalCentavos > 0) {
      return total + pedido.totalCentavos;
    }
    return total;
  }, 0);

  const cards = [
    { label: "Pedidos novos", value: pedidosNovos, href: "/admin/pedidos", tone: "text-purple-950" },
    { label: "Pagos pendentes", value: pagamentosPendentes, href: "/admin/pedidos", tone: "text-yellow-600" },
    { label: "Vendas do dia", value: formatCurrency(vendasHojeCentavos), href: "/admin/pedidos", tone: "text-green-600" },
    { label: "Stock baixo", value: estoqueBaixo, href: "/admin/produtos", tone: "text-red-600" },
    { label: "Produtos ativos", value: totalProdutosAtivos, href: "/admin/produtos", tone: "text-purple-950" },
    { label: "Clientes", value: clientes, href: "/admin", tone: "text-purple-950" },
  ];

  return (
    <main className="min-h-screen bg-purple-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-500">
              Painel Administrativo
            </p>
            <h1 className="mt-2 text-4xl font-bold text-purple-950">
              Bella Fashion Admin
            </h1>
            <p className="mt-3 text-gray-600">
              Loja online, pedidos, pagamentos, estoque e configurações em um só lugar.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-purple-900 shadow-sm transition hover:bg-purple-100"
            >
              Ver loja
            </Link>
            <a
              href="/api/admin/logout"
              className="rounded-full bg-purple-100 px-5 py-3 text-sm font-semibold text-purple-900 shadow-sm transition hover:bg-purple-200"
            >
              Sair
            </a>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 xl:grid-cols-6">
          {cards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <p className="text-sm text-gray-500">{card.label}</p>
              <h2 className={`mt-2 text-3xl font-bold ${card.tone}`}>{card.value}</h2>
            </Link>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-purple-950">Pedidos recentes</h2>
                <p className="mt-1 text-sm text-gray-500">{totalPedidos} pedidos no total.</p>
              </div>
              <Link href="/admin/pedidos" className="rounded-full bg-purple-900 px-5 py-3 text-sm font-semibold text-white">
                Ver todos
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              {ultimosPedidos.length > 0 ? (
                ultimosPedidos.map((pedido) => (
                  <Link
                    key={pedido.id}
                    href={`/admin/pedidos/editar/${pedido.id}`}
                    className="block rounded-3xl border border-purple-100 p-4 transition hover:bg-purple-50"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-bold text-purple-950">Pedido #{pedido.id} · {pedido.cliente}</p>
                        <p className="mt-1 text-sm text-gray-500">
                          {pedido.createdAt.toLocaleDateString("pt-BR")} · {pedido.statusPedido}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="font-bold text-purple-950">{pedido.valorTotal}</p>
                        <p className="text-sm text-gray-500">{pedido.statusPagamento}</p>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="rounded-3xl bg-purple-50 p-6 text-center text-gray-500">
                  Ainda não há pedidos registrados.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-purple-950">Ações rápidas</h2>
            <div className="mt-6 grid gap-3">
              <Link href="/admin/produtos/novo" className="rounded-2xl bg-purple-800 px-5 py-4 text-center font-semibold text-white hover:bg-purple-900">
                Adicionar produto
              </Link>
              <Link href="/admin/produtos" className="rounded-2xl bg-purple-100 px-5 py-4 text-center font-semibold text-purple-900 hover:bg-purple-200">
                Catálogo admin
              </Link>
              <Link href="/admin/pedidos" className="rounded-2xl bg-purple-100 px-5 py-4 text-center font-semibold text-purple-900 hover:bg-purple-200">
                Pedidos e rastreio
              </Link>
              <Link href="/admin/configuracoes" className="rounded-2xl bg-purple-100 px-5 py-4 text-center font-semibold text-purple-900 hover:bg-purple-200">
                Configurar site
              </Link>
            </div>

            <div className="mt-6 rounded-3xl bg-purple-50 p-5 text-sm text-gray-700">
              <p className="font-semibold text-purple-950">Checklist rápido</p>
              <ul className="mt-3 space-y-2">
                <li>• Produtos sem demo e com fotos reais.</li>
                <li>• Pagamentos Stripe ativos em produção.</li>
                <li>• Rastreio manual atualizado pelo admin.</li>
                <li>• Políticas e contato revisados em Configurações.</li>
              </ul>
            </div>
          </section>
        </div>

        <div className="mt-10 rounded-3xl bg-white p-6 text-sm text-gray-500 shadow-sm">
          <p>
            Status da loja: <span className="font-semibold text-green-700">online</span>. Produtos cadastrados:{" "}
            <span className="font-semibold text-purple-950">{totalProdutos}</span>.
          </p>
        </div>
      </div>
    </main>
  );
}
