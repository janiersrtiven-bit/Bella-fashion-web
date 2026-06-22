import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/db";
import ClienteAccount from "@/components/cliente/cliente-account";

export default async function ContaPage() {
  const cliente = await getCurrentCustomer();
  if (!cliente) {
    redirect("/conta/login");
  }

  const enderecoPrincipal = await prisma.enderecoCliente.findFirst({
    where: {
      clienteId: cliente.id,
      principal: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-white px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-col gap-3 rounded-3xl border border-purple-100 bg-purple-50 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-purple-700">Minha conta</p>
            <h1 className="mt-3 text-3xl font-bold text-purple-950">Olá, {cliente.nome}</h1>
            <p className="mt-2 text-sm text-gray-600">Atualize seus dados básicos e a sua referência de endereço principal.</p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-purple-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-800"
          >
            Voltar à loja
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-purple-950">Dados da conta</h2>
            <p className="mt-2 text-sm text-gray-600">Edite seu nome e WhatsApp. O e-mail permanece fixo como identificador da conta.</p>
            <ClienteAccount cliente={cliente} enderecoPrincipal={enderecoPrincipal} />
          </section>

          <section className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-purple-950">Precisa de ajuda?</h2>
            <p className="mt-3 text-sm leading-7 text-gray-600">
              Se quiser atualizar outros dados ou alterar seu login, entre em contato com a loja pelo WhatsApp oficial.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
