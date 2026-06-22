import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-purple-50 p-6 text-center">
      <div className="max-w-lg rounded-3xl bg-white p-10 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-500">Erro 404</p>
        <h1 className="mt-3 text-4xl font-bold text-purple-950">Página não encontrada</h1>
        <p className="mt-4 text-gray-600">O endereço pode ter mudado ou não existe mais.</p>
        <Link href="/" className="mt-8 inline-block rounded-full bg-purple-800 px-7 py-3 font-semibold text-white hover:bg-purple-900">
          Voltar à loja
        </Link>
      </div>
    </main>
  );
}
