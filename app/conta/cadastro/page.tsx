"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CadastroPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [endereco, setEndereco] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/cliente/cadastro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nome, email, whatsapp, password, endereco }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.error || "Não foi possível criar a conta.");
        return;
      }

      router.replace("/conta");
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-white px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 rounded-3xl border border-purple-100 bg-purple-50 p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-purple-700">Nova cliente</p>
          <h1 className="mt-3 text-3xl font-bold text-purple-950">Criar conta</h1>
          <p className="mt-2 text-sm text-gray-600">Cadastre-se para acessar sua conta e informações de endereço principal.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-purple-100 bg-white p-6 shadow-sm">
          <div>
            <label className="block text-sm font-semibold text-purple-900">Nome completo</label>
            <input
              type="text"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none transition focus:border-purple-700"
              autoComplete="name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-purple-900">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none transition focus:border-purple-700"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-purple-900">WhatsApp</label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(event) => setWhatsapp(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none transition focus:border-purple-700"
              autoComplete="tel"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-purple-900">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none transition focus:border-purple-700"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-purple-900">Endereço principal (opcional)</label>
            <textarea
              value={endereco}
              onChange={(event) => setEndereco(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none transition focus:border-purple-700"
              rows={4}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-purple-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Cadastrando..." : "Criar conta"}
          </button>

          <p className="text-sm text-gray-600">
            Já tem conta?{' '}
            <Link href="/conta/login" className="font-semibold text-purple-900 hover:underline">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
