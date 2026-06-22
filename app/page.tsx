import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getProdutosPublicos, getSiteConfig } from "@/lib/db";

export const metadata: Metadata = {
  title: "Bodies femininos com estilo e conforto",
  description:
    "Conheça a coleção Bella Fashion: bodies femininos de fabricação própria, atendimento direto e compra segura.",
};

export const dynamic = "force-dynamic";

function normalizeImagePath(value: string | null | undefined) {
  const image = value?.trim();
  if (!image) return null;
  if (image.startsWith("/") || /^https?:\/\//i.test(image)) return image;
  return `/produtos/${image.replace(/^\/+/, "")}`;
}

function safeInstagramUrl(value: string | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && /(^|\.)instagram\.com$/i.test(url.hostname)
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export default async function Home() {
  let config = null;
  let produtos = [] as Awaited<ReturnType<typeof getProdutosPublicos>>;

  try {
    [config, produtos] = await Promise.all([getSiteConfig(), getProdutosPublicos()]);
  } catch {
    // A vitrine continua utilizável mesmo durante uma indisponibilidade do banco.
  }

  const produtoDestaque = produtos.find((produto) => produto.estoque > 0) ?? produtos[0];
  const heroImagem = normalizeImagePath(config?.heroImagem) ?? normalizeImagePath(produtoDestaque?.imagem);
  const heroTitulo = config?.heroTitulo?.trim() || "Vista-se de confiança";
  const heroSubtitulo =
    config?.heroSubtitulo?.trim() ||
    "Bodies femininos versáteis para acompanhar você do básico ao marcante.";
  const heroMaterial =
    config?.heroMaterial?.trim() || "Fabricação própria · acabamento cuidadoso · atendimento próximo";
  const heroPrecoDestaque = config?.heroPrecoDestaque?.trim() || produtoDestaque?.preco || "";
  const heroWhatsappTexto = config?.heroWhatsappTexto?.trim() || "Falar no WhatsApp";
  const heroWhatsappNumero = config?.heroWhatsappNumero?.replace(/\D/g, "") || "";
  const whatsappLink = /^\d{10,15}$/.test(heroWhatsappNumero)
    ? `https://wa.me/55${heroWhatsappNumero.replace(/^55/, "")}?text=${encodeURIComponent("Olá! Vim pelo site da Bella Fashion e quero conhecer a coleção.")}`
    : null;
  const instagramUrl = safeInstagramUrl(process.env.NEXT_PUBLIC_INSTAGRAM_URL);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: "Bella Fashion",
    description: "Loja online de bodies femininos de fabricação própria.",
    ...(appUrl ? { url: appUrl } : {}),
    ...(instagramUrl ? { sameAs: [instagramUrl] } : {}),
  };

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />

      <header className="sticky top-0 z-50 border-b border-purple-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Link href="/" className="flex items-center gap-3" aria-label="Bella Fashion — início">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-purple-950 to-purple-600 text-lg font-black text-white shadow-md">
              BF
            </span>
            <span className="text-lg font-bold text-purple-900 sm:text-xl md:text-2xl">Bella Fashion</span>
          </Link>

          <nav aria-label="Navegação principal" className="hidden items-center gap-7 text-sm font-semibold text-purple-950 md:flex">
            <a href="#produtos" className="transition hover:text-purple-600">Coleção</a>
            <Link href="/acompanhar-pedido" className="transition hover:text-purple-600">Acompanhar pedido</Link>
            {instagramUrl && (
              <a href={instagramUrl} target="_blank" rel="noreferrer" className="transition hover:text-purple-600">
                Instagram
              </a>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/acompanhar-pedido"
              className="rounded-full border border-purple-200 px-3 py-2 text-xs font-semibold text-purple-900 md:hidden"
            >
              Pedidos
            </Link>
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-purple-800 px-4 py-2 text-xs font-semibold text-white transition hover:bg-purple-900 sm:px-5 sm:text-sm"
              >
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-purple-950 via-purple-800 to-fuchsia-700 text-white">
        <div aria-hidden="true" className="absolute inset-0 opacity-20">
          <div className="absolute left-10 top-20 h-40 w-40 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 h-56 w-56 rounded-full bg-purple-300 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
          <div className="text-center md:text-left">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-purple-200">Coleção atual</p>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl md:text-7xl">{heroTitulo}</h1>
            <p className="mt-6 text-xl text-purple-50 md:text-2xl">{heroSubtitulo}</p>
            <p className="mt-4 text-sm leading-relaxed text-purple-100 sm:text-base">{heroMaterial}</p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row md:justify-start">
              <a
                href="#produtos"
                className="rounded-full bg-white px-8 py-4 text-base font-semibold text-purple-900 transition hover:scale-[1.02] hover:bg-purple-50"
              >
                Ver coleção
              </a>
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/50 px-8 py-4 text-base font-semibold text-white transition hover:bg-white hover:text-purple-900"
                >
                  {heroWhatsappTexto}
                </a>
              )}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-purple-200 shadow-2xl">
              {heroImagem ? (
                <Image
                  src={heroImagem}
                  alt={produtoDestaque?.nome || "Coleção Bella Fashion"}
                  fill
                  priority
                  sizes="(max-width: 768px) 90vw, 448px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-purple-200 to-fuchsia-100 p-8 text-center text-purple-950">
                  <span className="text-6xl font-black">BF</span>
                  <span className="mt-3 font-semibold">Bella Fashion</span>
                </div>
              )}
            </div>

            {heroPrecoDestaque && (
              <div className="absolute -bottom-5 left-5 rounded-3xl bg-white px-6 py-4 text-purple-950 shadow-xl">
                <p className="text-xs font-semibold uppercase tracking-wider text-purple-500">A partir de</p>
                <p className="text-2xl font-bold">{heroPrecoDestaque}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section aria-label="Diferenciais" className="border-b border-purple-100 bg-purple-50 px-6 py-7">
        <div className="mx-auto grid max-w-6xl gap-6 text-center sm:grid-cols-3">
          <div><p className="font-bold text-purple-950">Fabricação própria</p><p className="mt-1 text-sm text-gray-600">Cuidado em cada detalhe</p></div>
          <div><p className="font-bold text-purple-950">Atendimento direto</p><p className="mt-1 text-sm text-gray-600">Suporte antes e depois da compra</p></div>
          <div><p className="font-bold text-purple-950">Acompanhe seu pedido</p><p className="mt-1 text-sm text-gray-600">Status disponível no site</p></div>
        </div>
      </section>

      <section id="produtos" className="scroll-mt-24 bg-white px-5 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.25em] text-purple-500">Catálogo</p>
          <h2 className="mt-3 text-center text-3xl font-bold text-purple-900 sm:text-4xl">Escolha seu favorito</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-gray-600">Peças pensadas para combinar conforto, personalidade e versatilidade.</p>

          {produtos.length === 0 ? (
            <div className="mx-auto mt-12 max-w-2xl rounded-3xl border border-purple-100 bg-purple-50 p-8 text-center">
              <p className="text-lg font-semibold text-purple-900">A nova coleção está chegando.</p>
              <p className="mt-3 text-sm text-gray-600">Volte em breve ou fale com a gente para receber as novidades.</p>
              {whatsappLink && (
                <a href={whatsappLink} target="_blank" rel="noreferrer" className="mt-6 inline-block rounded-full bg-purple-800 px-6 py-3 text-sm font-semibold text-white">
                  Quero receber novidades
                </a>
              )}
            </div>
          ) : (
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {produtos.map((produto) => {
                const image = normalizeImagePath(produto.imagem);
                const esgotado = produto.estoque <= 0;

                return (
                  <article key={produto.id} className="group overflow-hidden rounded-3xl border border-purple-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                    <div className="relative aspect-[4/5] bg-purple-100">
                      {image ? (
                        <Image src={image} alt={produto.nome} fill sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 350px" className="object-cover transition duration-500 group-hover:scale-[1.03]" unoptimized />
                      ) : (
                        <div className="flex h-full items-center justify-center p-6 text-center text-sm text-purple-700">Foto em preparação</div>
                      )}
                      <span className="absolute left-4 top-4 rounded-full bg-white px-4 py-1 text-xs font-semibold text-purple-900 shadow-sm">
                        {esgotado ? "Esgotado" : produto.destaque}
                      </span>
                    </div>

                    <div className="p-6">
                      <p className="text-xs font-semibold uppercase tracking-wider text-purple-500">{produto.categoria}</p>
                      <h3 className="mt-2 text-2xl font-bold text-purple-900">{produto.nome}</h3>
                      <p className="mt-3 line-clamp-3 text-gray-600">{produto.descricao}</p>
                      <div className="mt-6 flex items-center justify-between gap-3">
                        <span className="text-2xl font-bold text-purple-950">{produto.preco}</span>
                        {esgotado ? (
                          <span className="rounded-full bg-gray-200 px-5 py-2 text-sm font-semibold text-gray-600">Indisponível</span>
                        ) : (
                          <Link href={`/checkout/${produto.id}`} className="rounded-full bg-purple-800 px-5 py-2 text-sm font-semibold text-white transition hover:bg-purple-900">Comprar</Link>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <footer className="bg-purple-950 px-6 py-12 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 text-center md:grid-cols-3 md:text-left">
          <div><p className="text-2xl font-bold">Bella Fashion</p><p className="mt-2 text-sm text-purple-200">Moda feminina com identidade e cuidado.</p></div>
          <div className="flex flex-col gap-2 text-sm text-purple-200 md:items-center">
            <Link href="/acompanhar-pedido" className="hover:text-white">Acompanhar pedido</Link>
            <Link href="/politica-privacidade" className="hover:text-white">Política de Privacidade</Link>
            <Link href="/termos" className="hover:text-white">Termos de Uso</Link>
          </div>
          <div className="text-sm text-purple-200 md:text-right">
            {instagramUrl && <a href={instagramUrl} target="_blank" rel="noreferrer" className="block hover:text-white">Instagram</a>}
            {whatsappLink && <a href={whatsappLink} target="_blank" rel="noreferrer" className="mt-2 block hover:text-white">WhatsApp</a>}
            <p className="mt-3">© {new Date().getFullYear()} Bella Fashion</p>
          </div>
        </div>
      </footer>

      {whatsappLink && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
          aria-label="Falar com a Bella Fashion no WhatsApp"
          className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-xl font-bold text-white shadow-xl transition hover:scale-105 hover:bg-green-600 sm:w-auto sm:gap-2 sm:px-5"
        >
          <span aria-hidden="true">✆</span><span className="hidden sm:inline">WhatsApp</span>
        </a>
      )}
    </main>
  );
}
