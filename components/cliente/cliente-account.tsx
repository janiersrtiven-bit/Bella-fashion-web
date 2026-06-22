"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EnderecoCliente, Cliente } from "@prisma/client";

type ClienteAccountProps = {
  cliente: Pick<Cliente, "id" | "nome" | "email" | "whatsapp">;
  enderecoPrincipal: EnderecoCliente | null;
};

export default function ClienteAccount({ cliente, enderecoPrincipal }: ClienteAccountProps) {
  const router = useRouter();
  const [nome, setNome] = useState(cliente.nome);
  const [whatsapp, setWhatsapp] = useState(cliente.whatsapp);
  const [endereco, setEndereco] = useState(enderecoPrincipal?.endereco ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  async function handleUpdateAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    try {
      setIsSavingAccount(true);
      const response = await fetch("/api/cliente/atualizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, whatsapp }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.error || "Não foi possível atualizar os dados.");
        return;
      }

      setMessage("Dados atualizados com sucesso.");
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setIsSavingAccount(false);
    }
  }

  async function handleSaveAddress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    try {
      setIsSavingAddress(true);
      const response = await fetch("/api/cliente/endereco", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endereco }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.error || "Não foi possível salvar o endereço.");
        return;
      }

      setMessage("Endereço principal salvo com sucesso.");
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setIsSavingAddress(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/cliente/logout", { method: "POST" });
    } finally {
      router.replace("/");
      router.refresh();
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-purple-100 bg-purple-50 p-6 shadow-sm">
        <h3 className="text-xl font-bold text-purple-950">Informações da conta</h3>
        <p className="mt-2 text-sm text-gray-600">E-mail utilizado para login e dados básicos da conta.</p>
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-purple-900">E-mail</p>
            <p className="mt-1 text-sm text-gray-700">{cliente.email}</p>
          </div>

          <form onSubmit={handleUpdateAccount} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-purple-900">Nome</label>
              <input
                type="text"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none transition focus:border-purple-700"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-purple-900">WhatsApp</label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(event) => setWhatsapp(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none transition focus:border-purple-700"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingAccount}
              className="rounded-2xl bg-purple-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingAccount ? "Salvando..." : "Atualizar dados"}
            </button>
          </form>
        </div>
      </div>

      <div className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-bold text-purple-950">Endereço principal</h3>
        <p className="mt-2 text-sm text-gray-600">Use este endereço como referência para entrega e contato com a lojista.</p>

        <form onSubmit={handleSaveAddress} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-purple-900">Endereço completo</label>
            <textarea
              value={endereco}
              onChange={(event) => setEndereco(event.target.value)}
              rows={4}
              className="mt-2 w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none transition focus:border-purple-700"
            />
          </div>

          <button
            type="submit"
            disabled={isSavingAddress}
            className="rounded-2xl bg-purple-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingAddress ? "Salvando..." : "Salvar endereço"}
          </button>
        </form>
      </div>

      <div className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
        >
          Sair da conta
        </button>
      </div>

      {(message || error) && (
        <div className={`rounded-3xl border p-4 ${message ? "border-green-200 bg-green-50 text-green-900" : "border-red-200 bg-red-50 text-red-900"}`}>
          <p className="text-sm">{message || error}</p>
        </div>
      )}
    </div>
  );
}
