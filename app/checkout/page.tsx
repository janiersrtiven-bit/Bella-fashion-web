"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotalCents, hydrated, clearCart } = useCart();
  const [cliente, setCliente] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [emailCliente, setEmailCliente] = useState("");
  const [enderecoEntrega, setEnderecoEntrega] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [metodoPagamento, setMetodoPagamento] = useState("Pix");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const subtotalDisplay = formatCurrency(subtotalCents / 100);

  const whatsappLimpo = whatsapp.replace(/\D/g, "");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    if (!acceptedTerms) {
      setErrorMessage("Confirme que leu os termos e a política de privacidade.");
      return;
    }

    if (!cliente.trim()) {
      setErrorMessage("Preencha o nome completo.");
      return;
    }

    if (!/^\d{10,15}$/.test(whatsappLimpo)) {
      setErrorMessage("Preencha um WhatsApp válido com DDD.");
      return;
    }

    if (!emailCliente.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailCliente.trim())) {
      setErrorMessage("Preencha um e-mail válido.");
      return;
    }

    if (!enderecoEntrega.trim()) {
      setErrorMessage("Informe o endereço completo, incluindo CEP.");
      return;
    }

    if (items.length === 0) {
      setErrorMessage("Seu carrinho está vazio. Adicione produtos antes de finalizar.");
      return;
    }

    const payload = {
      cliente: cliente.trim(),
      whatsapp: whatsappLimpo,
      emailCliente: emailCliente.trim(),
      enderecoEntrega: enderecoEntrega.trim(),
      observacoes: observacoes.trim() || undefined,
      metodoPagamento,
      itens: items.map((item) => ({
        produtoId: item.productId,
        varianteId: item.variantId,
        quantidade: item.quantity,
      })),
    };

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/pedidos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrorMessage(
          data?.error
            ? `${data.error} Se o pedido multiproduto não estiver disponível ainda, tente comprar um produto por vez.`
            : "Falha ao criar o pedido. Por favor, tente novamente mais tarde."
        );
        return;
      }

      clearCart();

      if (metodoPagamento === "Cartão") {
        const stripeResponse = await fetch("/api/stripe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pedidoId: data.id, cancelPath: "/checkout" }),
        });
        const stripeData = await stripeResponse.json();
        if (stripeResponse.ok && stripeData.url) {
          window.location.assign(stripeData.url);
          return;
        }

        setErrorMessage(
          stripeData?.error || `O pedido #${data.id} foi salvo, mas não foi possível iniciar o pagamento.`
        );
        return;
      }

      router.push(`/pedido-sucesso?id=${data.id}`);
    } catch {
      setErrorMessage("Falha ao conectar com o servidor. Tente novamente mais tarde.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!hydrated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-purple-50 p-6">
        <p className="rounded-full bg-white px-6 py-3 font-medium text-purple-900 shadow-sm">
          Carregando seu carrinho…
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-purple-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-500">Checkout</p>
            <h1 className="mt-2 text-3xl font-bold text-purple-950 sm:text-4xl">Finalizar compra</h1>
            <p className="mt-3 text-gray-600">Revise seu carrinho e informe seus dados para concluir.</p>
          </div>
          <Link
            href="/"
            className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-purple-900 shadow-sm transition hover:bg-purple-100"
          >
            Voltar à loja
          </Link>
        </div>

        {items.length === 0 ? (
          <section className="rounded-[2rem] bg-white p-10 text-center shadow-sm">
            <p className="text-2xl font-bold text-purple-950">Seu carrinho está vazio</p>
            <p className="mt-3 text-gray-600">Adicione produtos ao carrinho para continuar.</p>
            <Link
              href="/"
              className="mt-7 inline-flex rounded-full bg-purple-900 px-7 py-4 font-semibold text-white hover:bg-purple-800"
            >
              Ver catálogo
            </Link>
          </section>
        ) : (
          <div className="grid gap-8 xl:grid-cols-[1.6fr_1fr]">
            <section className="space-y-6">
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-purple-950">Produtos no carrinho</h2>
                <div className="mt-6 space-y-4">
                  {items.map((item) => (
                    <div key={item.key} className="grid gap-4 rounded-3xl border border-purple-100 p-4 sm:grid-cols-[120px_1fr_120px] sm:items-center">
                      <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-purple-50 sm:h-32">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="(max-width: 640px) 100vw, 120px"
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center text-xs text-purple-600">Sem foto</span>
                        )}
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-purple-950">{item.name}</p>
                        {item.variantLabel ? <p className="mt-1 text-sm text-gray-500">{item.variantLabel}</p> : null}
                        <p className="mt-3 text-sm text-gray-500">Preço unitário</p>
                        <p className="font-bold text-purple-900">{formatCurrency(item.priceCents / 100)}</p>
                        <p className="mt-2 text-sm text-gray-500">Qtd. {item.quantity}</p>
                      </div>
                      <div className="rounded-3xl bg-purple-50 p-4 text-right">
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="mt-2 text-lg font-bold text-purple-950">{formatCurrency((item.priceCents * item.quantity) / 100)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-purple-950">Informações do pedido</h2>
                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-semibold text-purple-900">Nome completo</span>
                      <input
                        type="text"
                        value={cliente}
                        onChange={(event) => setCliente(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-purple-100 bg-purple-50 px-4 py-3 outline-none focus:border-purple-700"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-purple-900">WhatsApp</span>
                      <input
                        type="tel"
                        value={whatsapp}
                        onChange={(event) => setWhatsapp(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-purple-100 bg-purple-50 px-4 py-3 outline-none focus:border-purple-700"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block sm:col-span-2">
                      <span className="text-sm font-semibold text-purple-900">E-mail</span>
                      <input
                        type="email"
                        value={emailCliente}
                        onChange={(event) => setEmailCliente(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-purple-100 bg-purple-50 px-4 py-3 outline-none focus:border-purple-700"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-sm font-semibold text-purple-900">Endereço completo</span>
                    <textarea
                      value={enderecoEntrega}
                      onChange={(event) => setEnderecoEntrega(event.target.value)}
                      rows={4}
                      className="mt-2 w-full rounded-3xl border border-purple-100 bg-purple-50 px-4 py-3 outline-none focus:border-purple-700"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-purple-900">Observações</span>
                    <textarea
                      value={observacoes}
                      onChange={(event) => setObservacoes(event.target.value)}
                      rows={3}
                      className="mt-2 w-full rounded-3xl border border-purple-100 bg-purple-50 px-4 py-3 outline-none focus:border-purple-700"
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-semibold text-purple-900">Método de pagamento</span>
                      <select
                        value={metodoPagamento}
                        onChange={(event) => setMetodoPagamento(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-purple-100 bg-purple-50 px-4 py-3 outline-none focus:border-purple-700"
                      >
                        <option>Pix</option>
                        <option>Cartão</option>
                      </select>
                    </label>
                    <label className="flex items-start gap-3 rounded-3xl border border-purple-100 bg-purple-50 p-4">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(event) => setAcceptedTerms(event.target.checked)}
                        className="mt-1 h-5 w-5 rounded-lg border-purple-300 text-purple-900 focus:ring-purple-700"
                      />
                      <span className="text-sm text-gray-700">
                        Li e concordo com os termos e a política de privacidade.
                      </span>
                    </label>
                  </div>

                  {errorMessage ? (
                    <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                      {errorMessage}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex w-full items-center justify-center rounded-full bg-purple-900 px-6 py-4 text-base font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? "Processando pedido…" : "Enviar pedido"}
                  </button>
                </form>
              </div>
            </section>

            <aside className="rounded-[2rem] bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-purple-950">Resumo do pedido</h2>
              <div className="mt-5 space-y-4">
                <div className="rounded-3xl bg-purple-50 p-4">
                  <p className="text-sm text-gray-500">Subtotal</p>
                  <p className="mt-2 text-3xl font-bold text-purple-950">{subtotalDisplay}</p>
                </div>
                <div className="rounded-3xl bg-purple-50 p-4">
                  <p className="text-sm text-gray-500">Frete</p>
                  <p className="mt-2 text-purple-950">Calculado no checkout</p>
                </div>
                <div className="rounded-3xl bg-white p-4 shadow-sm">
                  <p className="text-sm text-gray-500">Total parcial</p>
                  <p className="mt-2 text-3xl font-bold text-purple-950">{subtotalDisplay}</p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
