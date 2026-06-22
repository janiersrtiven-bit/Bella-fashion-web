"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";

type Variant = { id: number; tamanho: string; cor: string; estoque: number };

export type ProductPurchaseData = {
  id: number;
  slug: string;
  name: string;
  description: string;
  category: string;
  highlight: string;
  priceLabel: string;
  priceCents: number;
  stock: number;
  images: string[];
  variants: Variant[];
};

export function ProductPurchasePanel({ product, whatsappUrl }: { product: ProductPurchaseData; whatsappUrl?: string | null }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [selectedImage, setSelectedImage] = useState(product.images[0] || "");
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(product.variants.find((item) => item.estoque > 0)?.id ?? null);
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState("");
  const selectedVariant = useMemo(() => product.variants.find((item) => item.id === selectedVariantId) ?? null, [product.variants, selectedVariantId]);
  const availableStock = selectedVariant?.estoque ?? product.stock;
  const unavailable = availableStock <= 0 || (product.variants.length > 0 && !selectedVariant);

  function add(goToCart: boolean) {
    if (unavailable) return;
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id ?? null,
      name: product.name,
      slug: product.slug,
      image: product.images[0] || "",
      priceCents: product.priceCents,
      stock: availableStock,
      variantLabel: selectedVariant ? `${selectedVariant.cor} · ${selectedVariant.tamanho}` : undefined,
    }, quantity);
    setFeedback("Produto adicionado à sacola.");
    if (goToCart) router.push("/carrinho");
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-6 sm:py-10">
        <div className="mb-8 flex items-center justify-between gap-3">
          <Link href="/#produtos" className="rounded-full border border-purple-200 px-5 py-2 text-sm font-semibold text-purple-900">← Voltar</Link>
          <Link href="/carrinho" className="rounded-full bg-purple-50 px-5 py-2 text-sm font-semibold text-purple-900">Ver sacola</Link>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
          <section aria-label="Fotos do produto">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-purple-50">
              {selectedImage ? (
                <Image src={selectedImage} alt={product.name} fill priority sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" unoptimized />
              ) : (
                <div className="flex h-full items-center justify-center text-purple-700">Imagem não publicada</div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-6">
                {product.images.map((image) => (
                  <button key={image} type="button" onClick={() => setSelectedImage(image)} className={`relative aspect-square overflow-hidden rounded-2xl border-2 ${image === selectedImage ? "border-purple-800" : "border-transparent"}`}>
                    <Image src={image} alt="" fill sizes="120px" className="object-cover" unoptimized />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="lg:sticky lg:top-8 lg:self-start">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-500">{product.category}</p>
            <h1 className="mt-3 text-4xl font-bold leading-tight text-purple-950 sm:text-5xl">{product.name}</h1>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <p className="text-3xl font-black text-purple-950">{product.priceLabel}</p>
              {product.highlight && <span className="rounded-full bg-purple-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-purple-800">{product.highlight}</span>}
            </div>
            <p className="mt-7 whitespace-pre-line leading-8 text-gray-700">{product.description}</p>

            {product.variants.length > 0 && (
              <fieldset className="mt-8">
                <legend className="text-sm font-bold text-purple-950">Escolha cor e tamanho</legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {product.variants.map((variant) => (
                    <button key={variant.id} type="button" disabled={variant.estoque <= 0} onClick={() => { setSelectedVariantId(variant.id); setQuantity(1); }} className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${selectedVariantId === variant.id ? "border-purple-800 bg-purple-50 text-purple-950" : "border-gray-200"} disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400`}>
                      <span className="font-semibold">{variant.cor} · {variant.tamanho}</span>
                      <span className="mt-1 block text-xs">{variant.estoque > 0 ? `${variant.estoque} disponíveis` : "Esgotado"}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            <div className="mt-8 flex items-end gap-4">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-purple-950">Quantidade</span>
                <select value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} disabled={unavailable} className="rounded-2xl border border-purple-200 bg-white px-5 py-3">
                  {Array.from({ length: Math.min(availableStock, 10) }, (_, index) => index + 1).map((value) => <option key={value}>{value}</option>)}
                </select>
              </label>
              <p className="pb-3 text-sm text-gray-500">{unavailable ? "Produto indisponível" : `${availableStock} em estoque`}</p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => add(false)} disabled={unavailable} className="rounded-full border-2 border-purple-800 px-6 py-4 font-bold text-purple-900 transition hover:bg-purple-50 disabled:border-gray-200 disabled:text-gray-400">Adicionar à sacola</button>
              <button type="button" onClick={() => add(true)} disabled={unavailable} className="rounded-full bg-purple-900 px-6 py-4 font-bold text-white transition hover:bg-purple-800 disabled:bg-gray-300">Comprar agora</button>
            </div>
            {feedback && <p className="mt-3 text-sm font-semibold text-green-700" role="status">{feedback}</p>}
            {whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-4 block text-center text-sm font-semibold text-green-700">Tirar dúvida pelo WhatsApp</a>}

            <div className="mt-8 grid gap-3 rounded-3xl bg-purple-50 p-5 text-sm text-gray-700 sm:grid-cols-2">
              <Link href="/envios" className="font-semibold text-purple-900">Consulte envios →</Link>
              <Link href="/trocas" className="font-semibold text-purple-900">Veja trocas e devoluções →</Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
