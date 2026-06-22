"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-purple-50 p-6 text-center">
      <div className="max-w-lg rounded-3xl bg-white p-10 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-500">Bella Fashion</p>
        <h1 className="mt-3 text-3xl font-bold text-purple-950">Algo não saiu como esperado</h1>
        <p className="mt-4 text-gray-600">Tente novamente. Se o problema continuar, fale com nosso atendimento.</p>
        <button type="button" onClick={reset} className="mt-8 rounded-full bg-purple-800 px-7 py-3 font-semibold text-white hover:bg-purple-900">
          Tentar novamente
        </button>
      </div>
    </main>
  );
}
