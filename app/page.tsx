import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { produtosDefault } from "@/lib/produtos";

export const metadata: Metadata = {
  title: "Bella Fashion | Bodies Femininos Premium",
  description:
    "Bella Fashion - Moda feminina com bodies premium, fabricação própria, tecido 90% poliamida e 10% elastano. Entregas para todo o Brasil.",
};

const whatsapp = "5511940625832";
const instagram = "https://www.instagram.com/";

const produtos = produtosDefault;

const beneficios = [
  {
    icone: "✨",
    titulo: "Fabricação Própria",
    texto: "Produção própria com controle de qualidade.",
  },
  {
    icone: "👗",
    titulo: "Tamanho Único",
    texto: "Modelagem confortável e elegante.",
  },
  {
    icone: "💎",
    titulo: "Tecido Premium",
    texto: "90% Poliamida e 10% Elastano.",
  },
  {
    icone: "🚚",
    titulo: "Entrega Rápida",
    texto: "Enviamos para todo o Brasil.",
  },
];

const avaliacoes = [
  {
    nome: "Mariana, São Paulo",
    texto: "O tecido é maravilhoso, super confortável e veste muito bem.",
  },
  {
    nome: "Camila, Guarulhos",
    texto: "Chegou rápido e a qualidade me surpreendeu. Amei meu body!",
  },
  {
    nome: "Juliana, Campinas",
    texto: "Produto lindo, elegante e confortável. Compraria novamente.",
  },
];

const perguntas = [
  {
    pergunta: "Os bodies são tamanho único?",
    resposta:
      "Sim. Nossos modelos são tamanho único, com tecido confortável e boa elasticidade.",
  },
  {
    pergunta: "Qual é o tecido dos bodies?",
    resposta:
      "O tecido é composto por 90% Poliamida e 10% Elastano, oferecendo conforto, toque macio e excelente caimento.",
  },
  {
    pergunta: "Vocês entregam para todo o Brasil?",
    resposta:
      "Sim. Realizamos atendimento online e envio para todo o Brasil.",
  },
  {
    pergunta: "Como faço para comprar?",
    resposta:
      "Basta clicar no botão de WhatsApp, escolher o produto desejado e falar com nosso atendimento.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <a href="#inicio" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-purple-950 to-purple-600 text-lg font-black text-white shadow-md">
              BF
            </div>

            <span className="text-xl font-bold text-purple-900 md:text-2xl">
              Bella Fashion
            </span>
          </a>

          <nav className="hidden items-center gap-8 text-sm font-medium text-gray-700 md:flex">
            <a href="#inicio" className="hover:text-purple-800">
              Início
            </a>
            <a href="#sobre" className="hover:text-purple-800">
              Sobre
            </a>
            <a href="#produtos" className="hover:text-purple-800">
              Produtos
            </a>
            <a href="#galeria" className="hover:text-purple-800">
              Galeria
            </a>
            <a href="#faq" className="hover:text-purple-800">
              FAQ
            </a>
            <a href="#contato" className="hover:text-purple-800">
              Contato
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="rounded-full border border-purple-200 bg-white px-4 py-2 text-xs font-semibold text-purple-900 transition hover:bg-purple-50"
            >
              Voltar ao Admin
            </Link>

            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              className="rounded-full bg-purple-800 px-5 py-2 text-sm font-semibold text-white transition hover:bg-purple-900"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section
        id="inicio"
        className="relative overflow-hidden bg-gradient-to-b from-purple-950 via-purple-800 to-purple-700 text-white"
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute left-10 top-20 h-40 w-40 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 h-56 w-56 rounded-full bg-purple-300 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
          <div className="text-center md:text-left">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-purple-200">
              Moda feminina premium
            </p>

            <h1 className="text-5xl font-bold leading-tight md:text-7xl">
              Bella Fashion
            </h1>

            <p className="mt-6 text-xl md:text-2xl">
              Bodies que valorizam sua beleza com conforto, elegância e estilo.
            </p>

            <p className="mt-4 text-lg text-purple-100">
              Fabricação própria • 90% Poliamida • 10% Elastano
            </p>

            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row md:justify-start">
              <a
                href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
                  "Olá, tenho interesse nos bodies da Bella Fashion."
                )}`}
                target="_blank"
                className="rounded-full bg-white px-8 py-4 text-lg font-semibold text-purple-900 transition hover:scale-105"
              >
                Comprar pelo WhatsApp
              </a>

              <a
                href="#produtos"
                className="rounded-full border border-white/40 px-8 py-4 text-lg font-semibold text-white transition hover:bg-white hover:text-purple-900"
              >
                Ver coleção
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="relative h-[520px] overflow-hidden rounded-[2rem] bg-purple-200 shadow-2xl">
              <Image
                src="/produtos/body-1.jpg.jpeg"
                alt="Body Bella Fashion"
                fill
                priority
                className="object-cover"
              />
            </div>

            <div className="absolute -bottom-6 left-6 rounded-3xl bg-white px-6 py-4 text-purple-950 shadow-xl">
              <p className="text-sm font-semibold">Coleção Premium</p>
              <p className="text-2xl font-bold">R$ 89,90</p>
            </div>
          </div>
        </div>
      </section>

      {/* BANNER PROMOCIONAL */}
      <section className="bg-purple-950 px-6 py-4 text-center text-white">
        <p className="text-sm font-semibold md:text-base">
          💜 Promoção especial de lançamento: atendimento rápido pelo WhatsApp e
          envio para todo o Brasil.
        </p>
      </section>

      {/* SOBRE */}
      <section id="sobre" className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-center text-sm font-semibold uppercase tracking-[0.25em] text-purple-500">
          Sobre a marca
        </p>

        <h2 className="mt-3 text-center text-4xl font-bold text-purple-900">
          Sobre Bella Fashion
        </h2>

        <p className="mx-auto mt-8 max-w-3xl text-center text-lg text-gray-600">
          A Bella Fashion cria bodies femininos com tecido premium, modelagem
          elegante e fabricação própria. Cada peça é pensada para valorizar sua
          beleza com conforto, qualidade e sofisticação.
        </p>
      </section>

      {/* BENEFÍCIOS */}
      <section className="bg-white px-6 pb-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-4xl font-bold text-purple-900">
            Por que escolher Bella Fashion?
          </h2>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            {beneficios.map((item) => (
              <div
                key={item.titulo}
                className="rounded-3xl border border-purple-100 bg-white p-8 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="text-5xl">{item.icone}</div>
                <h3 className="mt-4 font-bold text-purple-900">
                  {item.titulo}
                </h3>
                <p className="mt-3 text-sm text-gray-600">{item.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CORES DISPONÍVEIS */}
      <section className="bg-purple-50 px-6 py-20">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-500">
            Cores disponíveis
          </p>

          <h2 className="mt-3 text-4xl font-bold text-purple-900">
            Escolha seu body favorito
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-gray-600">
            No momento, a coleção principal está disponível na cor branca. Novas
            cores serão adicionadas em breve.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <div className="rounded-full border border-gray-200 bg-white px-6 py-3 font-semibold text-gray-800 shadow-sm">
              ⚪ Branco
            </div>
            <div className="rounded-full border border-gray-200 bg-white px-6 py-3 font-semibold text-gray-400 shadow-sm">
              ⚫ Preto em breve
            </div>
            <div className="rounded-full border border-gray-200 bg-white px-6 py-3 font-semibold text-gray-400 shadow-sm">
              🟤 Nude em breve
            </div>
          </div>
        </div>
      </section>

      {/* PRODUTOS */}
      <section id="produtos" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.25em] text-purple-500">
            Coleção Bella Fashion
          </p>

          <h2 className="mt-3 mb-12 text-center text-4xl font-bold text-purple-900">
            Produtos em Destaque
          </h2>

          <div className="grid gap-8 md:grid-cols-3">
            {produtos.map((produto) => {
              const mensagem = encodeURIComponent(
                `Olá, tenho interesse no ${produto.nome} da Bella Fashion. Gostaria de saber as cores disponíveis e formas de entrega.`
              );

              return (
                <div
                  key={produto.id}
                  className="group rounded-3xl bg-white p-6 shadow-lg ring-1 ring-purple-100 transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-96 overflow-hidden rounded-2xl bg-purple-100">
                    <span className="absolute left-4 top-4 z-10 rounded-full bg-white px-4 py-2 text-xs font-bold text-purple-800 shadow">
                      {produto.destaque}
                    </span>

                    <Image
                      src={produto.imagem}
                      alt={produto.nome}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-gray-950">
                    {produto.nome}
                  </h3>

                  <p className="mt-2 text-gray-600">
                    Tamanho único • Poliamida Premium
                  </p>

                  <p className="mt-2 text-sm text-gray-500">
                    90% Poliamida • 10% Elastano
                  </p>

                  <p className="mt-3 text-sm text-gray-600">
                    {produto.descricao}
                  </p>

                  <div className="mt-5 flex items-center justify-between gap-4">
                    <p className="text-2xl font-bold text-purple-900">
                      {produto.preco}
                    </p>

                    <Link
                      href={`/checkout/${produto.id}`}
                      className="rounded-full bg-purple-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-900"
                    >
                      Comprar
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* GALERIA */}
      <section id="galeria" className="bg-purple-50 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.25em] text-purple-500">
            Galeria Bella Fashion
          </p>

          <h2 className="mt-3 text-center text-4xl font-bold text-purple-900">
            Veja os detalhes da coleção
          </h2>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {produtos.map((produto) => (
              <div
                key={produto.id}
                className="group relative h-[420px] overflow-hidden rounded-3xl bg-purple-100 shadow-md"
              >
                <Image
                  src={produto.imagem}
                  alt={produto.nome}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-110"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-80" />

                <div className="absolute bottom-6 left-6 text-white">
                  <p className="text-sm uppercase tracking-[0.2em]">
                    Bella Fashion
                  </p>
                  <h3 className="mt-1 text-2xl font-bold">{produto.nome}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INSTAGRAM */}
      <section className="bg-white px-6 py-20 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-500">
          Instagram
        </p>

        <h2 className="mt-3 text-4xl font-bold text-purple-900">
          Acompanhe nossas novidades
        </h2>

        <p className="mx-auto mt-5 max-w-2xl text-gray-600">
          Siga a Bella Fashion no Instagram para ver lançamentos, vídeos dos
          produtos, combinações de looks e novidades da loja.
        </p>

        <a
          href={instagram}
          target="_blank"
          className="mt-8 inline-block rounded-full bg-purple-800 px-8 py-4 font-semibold text-white transition hover:bg-purple-900"
        >
          Seguir no Instagram
        </a>
      </section>

      {/* AVALIAÇÕES */}
      <section id="avaliacoes" className="bg-purple-50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.25em] text-purple-500">
            Clientes satisfeitas
          </p>

          <h2 className="mt-3 text-center text-4xl font-bold text-purple-900">
            O que dizem sobre Bella Fashion
          </h2>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {avaliacoes.map((avaliacao) => (
              <div
                key={avaliacao.nome}
                className="rounded-3xl border border-purple-100 bg-white p-8 shadow-sm"
              >
                <p className="text-xl">⭐⭐⭐⭐⭐</p>
                <p className="mt-4 text-gray-700">“{avaliacao.texto}”</p>
                <p className="mt-5 font-bold text-purple-900">
                  — {avaliacao.nome}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-white px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.25em] text-purple-500">
            Perguntas frequentes
          </p>

          <h2 className="mt-3 text-center text-4xl font-bold text-purple-900">
            Dúvidas antes de comprar
          </h2>

          <div className="mt-12 space-y-5">
            {perguntas.map((item) => (
              <div
                key={item.pergunta}
                className="rounded-3xl border border-purple-100 bg-purple-50 p-6"
              >
                <h3 className="font-bold text-purple-900">{item.pergunta}</h3>
                <p className="mt-3 text-gray-600">{item.resposta}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTATO */}
      <section
        id="contato"
        className="bg-purple-950 px-6 py-20 text-center text-white"
      >
        <h2 className="text-3xl font-bold">
          Pronta para escolher seu body?
        </h2>

        <p className="mt-4 text-purple-100">
          Atendimento pelo WhatsApp para pedidos, cores disponíveis e entregas.
        </p>

        <a
          href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
            "Olá, quero falar sobre os bodies da Bella Fashion."
          )}`}
          target="_blank"
          className="mt-8 inline-block rounded-full bg-white px-8 py-4 font-semibold text-purple-900 transition hover:scale-105"
        >
          Falar no WhatsApp
        </a>
      </section>

      {/* FOOTER */}
      <footer className="bg-purple-950 text-white">
        <div className="mx-auto max-w-7xl px-6 pb-12">
          <div className="border-t border-purple-800 pt-12">
            <div className="grid gap-10 md:grid-cols-3">
              <div>
                <h3 className="text-2xl font-bold">Bella Fashion</h3>
                <p className="mt-4 text-purple-200">
                  Moda feminina com elegância, conforto e qualidade. Peças
                  desenvolvidas para valorizar sua beleza em qualquer ocasião.
                </p>
              </div>

              <div>
                <h4 className="mb-4 text-lg font-semibold">Navegação</h4>
                <ul className="space-y-2 text-purple-200">
                  <li>
                    <a href="#inicio" className="hover:text-white">
                      Início
                    </a>
                  </li>
                  <li>
                    <a href="#sobre" className="hover:text-white">
                      Sobre
                    </a>
                  </li>
                  <li>
                    <a href="#produtos" className="hover:text-white">
                      Produtos
                    </a>
                  </li>
                  <li>
                    <a href="#galeria" className="hover:text-white">
                      Galeria
                    </a>
                  </li>
                  <li>
                    <a href="#faq" className="hover:text-white">
                      FAQ
                    </a>
                  </li>
                  <li>
                    <a href="#contato" className="hover:text-white">
                      Contato
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="mb-4 text-lg font-semibold">Atendimento</h4>
                <p className="text-purple-200">WhatsApp:</p>
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  className="mt-2 block font-semibold text-white"
                >
                  +55 11 94062-5832
                </a>

                <p className="mt-4 text-purple-200">
                  Atendimento online para todo o Brasil.
                </p>

                <div className="mt-4 space-y-1 text-sm text-purple-200">
                  <p>
                    <Link href="/politica-privacidade" className="hover:text-white">
                      Política de Privacidade
                    </Link>
                  </p>
                  <p>
                    <Link href="/termos" className="hover:text-white">
                      Termos de Uso
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 border-t border-purple-800 pt-6 text-center text-sm text-purple-300">
              © 2026 Bella Fashion. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>

      {/* BOTÃO FLUTUANTE WHATSAPP */}
      <a
        href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
          "Olá, vim pelo site da Bella Fashion e gostaria de fazer um pedido."
        )}`}
        target="_blank"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-green-500 px-5 py-4 font-bold text-white shadow-2xl transition hover:scale-105 hover:bg-green-600"
      >
        <span className="text-xl">💬</span>
        <span className="hidden sm:inline">Comprar pelo WhatsApp</span>
      </a>
    </main>
  );
}