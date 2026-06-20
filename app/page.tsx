import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getProdutosPublicos, getSiteConfig } from "@/lib/db";

export const metadata: Metadata = {
  title: "Bella Fashion | Loja",
  description: "Loja oficial Bella Fashion.",
};

export const dynamic = "force-dynamic";

function normalizeImagePath(value: string | null | undefined) {
  const image = value?.trim();

  if (!image) return null;

  if (image.startsWith("/produtos/") || /^https?:\/\//i.test(image)) {
    return image;
  }

  return `/produtos/${image.replace(/^\/+/, "")}`;
}

export default async function Home() {
  let config = null;
  let produtos = [] as Awaited<ReturnType<typeof getProdutosPublicos>>;

  try {
    [config, produtos] = await Promise.all([getSiteConfig(), getProdutosPublicos()]);
  } catch {
    config = null;
    produtos = [];
  }

  const heroImagem = normalizeImagePath(config?.heroImagem);
  const heroTitulo = config?.heroTitulo?.trim() || "";
  const heroSubtitulo = config?.heroSubtitulo?.trim() || "";
  const heroMaterial = config?.heroMaterial?.trim() || "";
  const heroPrecoDestaque = config?.heroPrecoDestaque?.trim() || "";
  const heroWhatsappTexto = config?.heroWhatsappTexto?.trim() || "Falar no WhatsApp";
  const heroWhatsappNumero = config?.heroWhatsappNumero?.trim() || "";

  const hasHeroContent = Boolean(
    heroImagem ||
    heroTitulo ||
    heroSubtitulo ||
    heroMaterial ||
    heroPrecoDestaque ||
    heroWhatsappNumero
  );

  const whatsappLink = heroWhatsappNumero
    ? `https://wa.me/${heroWhatsappNumero.replace(/\D/g, "")}`
    : null;

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-50 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-purple-950 to-purple-600 text-lg font-black text-white shadow-md">
              BF
            </div>
            <span className="text-xl font-bold text-purple-900 md:text-2xl">Bella Fashion</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="rounded-full border border-purple-200 bg-white px-4 py-2 text-xs font-semibold text-purple-900 transition hover:bg-purple-50"
            >
              Voltar ao Admin
            </Link>

            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                className="rounded-full bg-purple-800 px-5 py-2 text-sm font-semibold text-white transition hover:bg-purple-900"
              >
                {heroWhatsappTexto}
              </a>
            )}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-b from-purple-950 via-purple-800 to-purple-700 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute left-10 top-20 h-40 w-40 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 h-56 w-56 rounded-full bg-purple-300 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
          <div className="text-center md:text-left">
            {hasHeroContent ? (
              <>
                <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-purple-200">
                  Coleção atual
                </p>

                <h1 className="text-5xl font-bold leading-tight md:text-7xl">
                  {heroTitulo || "Bella Fashion"}
                </h1>

                {heroSubtitulo && <p className="mt-6 text-xl md:text-2xl">{heroSubtitulo}</p>}
                {heroMaterial && <p className="mt-4 text-lg text-purple-100">{heroMaterial}</p>}

                <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row md:justify-start">
                  {whatsappLink && (
                    <a
                      href={whatsappLink}
                      target="_blank"
                      className="rounded-full bg-white px-8 py-4 text-lg font-semibold text-purple-900 transition hover:scale-105"
                    >
                      {heroWhatsappTexto}
                    </a>
                  )}

                  <a
                    href="#produtos"
                    className="rounded-full border border-white/40 px-8 py-4 text-lg font-semibold text-white transition hover:bg-white hover:text-purple-900"
                  >
                    Ver coleção
                  </a>
                </div>
              </>
            ) : (
              <div className="rounded-3xl border border-white/25 bg-white/10 p-8 text-left backdrop-blur-sm">
                <h1 className="text-3xl font-bold">Home pronto para configuração</h1>
                <p className="mt-4 text-purple-100">
                  Configure imagem, título, subtítulo, material, preço e WhatsApp em Admin &gt; Configurações.
                </p>
                <Link
                  href="/admin/configuracoes"
                  className="mt-6 inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-purple-900 transition hover:bg-purple-100"
                >
                  Abrir configurações do site
                </Link>
              </div>
            )}
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="relative h-[520px] overflow-hidden rounded-[2rem] bg-purple-200 shadow-2xl">
              {heroImagem ? (
                <Image src={heroImagem} alt="Hero Bella Fashion" fill priority className="object-cover" unoptimized />
              ) : (
                <div className="flex h-full items-center justify-center p-8 text-center text-purple-900">
                  Imagem principal não configurada
                </div>
              )}
            </div>

            {heroPrecoDestaque && (
              <div className="absolute -bottom-6 left-6 rounded-3xl bg-white px-6 py-4 text-purple-950 shadow-xl">
                <p className="text-sm font-semibold">Preço em destaque</p>
                <p className="text-2xl font-bold">{heroPrecoDestaque}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="produtos" className="bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.25em] text-purple-500">Catálogo</p>
          <h2 className="mt-3 text-center text-4xl font-bold text-purple-900">Produtos disponíveis</h2>

          {produtos.length === 0 ? (
            <div className="mx-auto mt-12 max-w-2xl rounded-3xl border border-purple-100 bg-purple-50 p-8 text-center">
              <p className="text-lg font-semibold text-purple-900">Nenhum produto publicado no momento.</p>
              <p className="mt-3 text-sm text-gray-600">
                Cadastre produtos no painel admin para que apareçam automaticamente aqui.
              </p>
              <Link
                href="/admin/produtos/novo"
                className="mt-6 inline-block rounded-full bg-purple-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-900"
              >
                Cadastrar primeiro produto
              </Link>
            </div>
          ) : (
            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {produtos.map((produto) => (
                <article
                  key={produto.id}
                  className="overflow-hidden rounded-3xl border border-purple-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="relative h-96 bg-purple-100">
                    {normalizeImagePath(produto.imagem) ? (
                      <Image
                        src={normalizeImagePath(produto.imagem)!}
                        alt={produto.nome}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-purple-700">
                        Produto sem imagem cadastrada
                      </div>
                    )}

                    {produto.destaque && (
                      <span className="absolute left-4 top-4 rounded-full bg-white px-4 py-1 text-xs font-semibold text-purple-900 shadow-sm">
                        {produto.destaque}
                      </span>
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-purple-900">{produto.nome}</h3>
                    <p className="mt-3 text-gray-600">{produto.descricao || "Sem descrição."}</p>

                    <div className="mt-6 flex items-center justify-between gap-3">
                      <span className="text-2xl font-bold text-purple-950">{produto.preco}</span>
                      <Link
                        href={`/checkout/${produto.id}`}
                        className="rounded-full bg-purple-800 px-5 py-2 text-sm font-semibold text-white transition hover:bg-purple-900"
                      >
                        Comprar
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="bg-purple-950 px-6 py-10 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 text-center md:flex-row md:items-center md:justify-between md:text-left">
          <div>
            <p className="text-2xl font-bold">Bella Fashion</p>
            <p className="mt-2 text-sm text-purple-200">Loja gerenciada por catálogo real via admin</p>
          </div>

          <div className="text-sm text-purple-200">
            <a href="/politica-privacidade" className="hover:text-white">
              Política de Privacidade
            </a>
            <span className="mx-2">•</span>
            <a href="/termos" className="hover:text-white">
              Termos de Uso
            </a>
          </div>

          <p className="text-sm text-purple-200">© {new Date().getFullYear()} Bella Fashion</p>
        </div>
      </footer>

      {whatsappLink && (
        <a
          href={whatsappLink}
          target="_blank"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full bg-green-500 px-5 py-3 font-semibold text-white shadow-xl transition hover:scale-105 hover:bg-green-600"
        >
          <span className="text-xl">💬</span>
          <span className="hidden sm:inline">{heroWhatsappTexto}</span>
        </a>
      )}
    </main>
  );
}