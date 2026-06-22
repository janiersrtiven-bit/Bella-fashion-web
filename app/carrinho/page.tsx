"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-provider";

function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export default function CarrinhoPage() {
  const { items, hydrated, subtotalCents, updateQuantity, removeItem } = useCart();

  if (!hydrated) {
    return <main className="flex min-h-screen items-center justify-center bg-purple-50 text-purple-900">Carregando sua sacola...</main>;
  }

  return (
    <main className="min-h-screen bg-purple-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-500">Sua seleção</p>
            <h1 className="mt-2 text-3xl font-bold text-purple-950 sm:text-4xl">Minha sacola</h1>
          </div>
          <Link href="/#produtos" className="rounded-full border border-purple-200 bg-white px-5 py-3 text-sm font-semibold text-purple-900">← Continuar comprando</Link>
        </div>

        {items.length === 0 ? (
          <section className="mt-10 rounded-[2rem] bg-white p-10 text-center shadow-sm">
            <p className="text-2xl font-bold text-purple-950">Sua sacola está vazia</p>
            <p className="mt-3 text-gray-600">Escolha um produto real do catálogo para começar.</p>
            <Link href="/#produtos" className="mt-7 inline-flex rounded-full bg-purple-900 px-7 py-4 font-semibold text-white">Ver catálogo</Link>
          </section>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
            <section className="space-y-4">
              {items.map((item) => (
                <article key={item.key} className="grid grid-cols-[96px_1fr] gap-4 rounded-3xl bg-white p-4 shadow-sm sm:grid-cols-[128px_1fr_auto] sm:items-center">
                  <Link href={`/produto/${item.slug}`} className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-purple-50">
                    {item.image ? <Image src={item.image} alt={item.name} fill sizes="128px" className="object-cover" unoptimized /> : <span className="flex h-full items-center justify-center text-xs text-purple-600">Sem foto</span>}
                  </Link>
                  <div>
                    <Link href={`/produto/${item.slug}`} className="text-lg font-bold text-purple-950">{item.name}</Link>
                    {item.variantLabel && <p className="mt-1 text-sm text-gray-500">{item.variantLabel}</p>}
                    <p className="mt-2 font-bold text-purple-900">{money(item.priceCents)}</p>
                    <button type="button" onClick={() => removeItem(item.key)} className="mt-3 text-sm font-semibold text-red-600 sm:hidden">Remover</button>
                  </div>
                  <div className="col-span-2 flex items-center justify-between gap-3 border-t border-purple-50 pt-4 sm:col-span-1 sm:block sm:border-0 sm:pt-0 sm:text-right">
                    <label className="text-sm font-semibold text-gray-600">
                      Qtd.
                      <select value={item.quantity} onChange={(event) => updateQuantity(item.key, Number(event.target.value))} className="ml-2 rounded-xl border border-purple-100 bg-white px-3 py-2">
                        {Array.from({ length: Math.min(item.stock, 10) }, (_, index) => index + 1).map((value) => <option key={value}>{value}</option>)}
                      </select>
                    </label>
                    <p className="font-bold text-purple-950 sm:mt-3">{money(item.priceCents * item.quantity)}</p>
                    <button type="button" onClick={() => removeItem(item.key)} className="mt-3 hidden text-sm font-semibold text-red-600 sm:inline">Remover</button>
                  </div>
                </article>
              ))}
            </section>

            <aside className="h-fit rounded-[2rem] bg-white p-6 shadow-sm lg:sticky lg:top-6">
              <h2 className="text-xl font-bold text-purple-950">Resumo</h2>
              <div className="mt-5 flex justify-between text-gray-600"><span>Subtotal</span><span>{money(subtotalCents)}</span></div>
              <div className="mt-3 flex justify-between text-gray-600"><span>Frete</span><span>Calculado no checkout</span></div>
              <div className="mt-5 flex justify-between border-t border-purple-100 pt-5 text-xl font-black text-purple-950"><span>Total parcial</span><span>{money(subtotalCents)}</span></div>
              <Link href="/checkout" className="mt-6 block rounded-full bg-purple-900 px-6 py-4 text-center font-bold text-white transition hover:bg-purple-800">Continuar para checkout</Link>
              <p className="mt-4 text-center text-xs leading-5 text-gray-500">Preços e estoque serão confirmados com segurança no servidor.</p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
