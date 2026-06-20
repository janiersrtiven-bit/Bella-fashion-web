import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AdminPage() {
  let totalProdutos = 0;
  let totalPedidos = 0;

  try {
    [totalProdutos, totalPedidos] = await Promise.all([
      prisma.produto.count(),
      prisma.pedido.count(),
    ]);
  } catch {
    totalProdutos = 0;
    totalPedidos = 0;
  }

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
              Gerencie produtos, pedidos, clientes e configurações da loja.
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

        <div className="grid gap-6 md:grid-cols-4">
          <Link
            href="/admin/produtos"
            className="rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <p className="text-sm text-gray-500">Produtos</p>
            <h2 className="mt-2 text-3xl font-bold text-purple-950">{totalProdutos}</h2>
          </Link>

          <Link
            href="/admin/pedidos"
            className="rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <p className="text-sm text-gray-500">Pedidos</p>
            <h2 className="mt-2 text-3xl font-bold text-purple-950">{totalPedidos}</h2>
          </Link>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Clientes</p>
            <h2 className="mt-2 text-3xl font-bold text-purple-950">0</h2>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Status</p>
            <h2 className="mt-2 text-2xl font-bold text-green-600">Online</h2>
          </div>

          <Link
            href="/admin/configuracoes"
            className="rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <p className="text-sm text-gray-500">Configurações</p>
            <h2 className="mt-2 text-2xl font-bold text-purple-950">Site</h2>
          </Link>
        </div>

        <section className="mt-10 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-purple-950">
            Ações rápidas
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <a
              href="/admin/produtos/novo"
              className="rounded-2xl bg-purple-800 px-5 py-4 text-center font-semibold text-white transition hover:bg-purple-900"
            >
              Adicionar produto
            </a>

            <a
              href="/admin/produtos"
              className="rounded-2xl bg-purple-100 px-5 py-4 text-center font-semibold text-purple-900 transition hover:bg-purple-200"
            >
              Ver produtos
            </a>

            <a
              href="/admin/pedidos"
              className="rounded-2xl bg-purple-100 px-5 py-4 text-center font-semibold text-purple-900 transition hover:bg-purple-200"
            >
              Ver pedidos
            </a>

            <a
              href="/admin/configuracoes"
              className="rounded-2xl bg-purple-100 px-5 py-4 text-center font-semibold text-purple-900 transition hover:bg-purple-200"
            >
              Configurações
            </a>

            <a
              href="/admin/configuracoes"
              className="rounded-2xl bg-purple-100 px-5 py-4 text-center font-semibold text-purple-900 transition hover:bg-purple-200"
            >
              Configurar Home
            </a>
          </div>
        </section>

        <section className="mt-10 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-purple-950">
            Próximos módulos
          </h2>

          <ul className="mt-5 space-y-3 text-gray-600">
            <li>✅ Cadastro de produtos</li>
            <li>⏳ Upload de fotos</li>
            <li>⏳ Controle de pedidos</li>
            <li>⏳ Clientes</li>
            <li>✅ Login protegido para administrador</li>
          </ul>
        </section>
      </div>
    </main>
  );
}