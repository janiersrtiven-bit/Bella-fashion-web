import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPurchasePanel } from "@/components/store/product-purchase-panel";
import { getProdutoPublicoBySlugOrId, getSiteConfig, parsePriceToCents } from "@/lib/db";

export const dynamic = "force-dynamic";

function imageUrl(value: string) {
  const image = value.trim();
  if (!image) return "";
  return image.startsWith("/") || /^https?:\/\//i.test(image) ? image : `/produtos/${image.replace(/^\/+/, "")}`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProdutoPublicoBySlugOrId(slug).catch(() => null);
  if (!product) return { title: "Produto não encontrado" };
  const image = imageUrl(product.imagem);
  return {
    title: product.nome,
    description: product.descricao.slice(0, 155),
    openGraph: image ? { images: [{ url: image }], title: product.nome, description: product.descricao.slice(0, 155) } : undefined,
  };
}

export default async function ProdutoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, config] = await Promise.all([
    getProdutoPublicoBySlugOrId(slug).catch(() => null),
    getSiteConfig().catch(() => null),
  ]);
  if (!product) notFound();

  const images = [product.imagem, ...product.imagens.map((item) => item.url)]
    .map(imageUrl)
    .filter((value, index, list) => value && list.indexOf(value) === index);
  const whatsapp = config?.whatsappContato?.replace(/\D/g, "") || config?.heroWhatsappNumero?.replace(/\D/g, "");
  const whatsappUrl = whatsapp && /^\d{10,15}$/.test(whatsapp)
    ? `https://wa.me/${whatsapp.startsWith("55") ? whatsapp : `55${whatsapp}`}?text=${encodeURIComponent(`Olá! Tenho uma dúvida sobre ${product.nome}.`)}`
    : null;

  return <ProductPurchasePanel product={{
    id: product.id,
    slug: product.slug || String(product.id),
    name: product.nome,
    description: product.descricao,
    category: product.categoria,
    highlight: product.destaque,
    priceLabel: product.preco,
    priceCents: product.precoCentavos || parsePriceToCents(product.preco),
    stock: product.estoque,
    images,
    variants: product.variantes.map((item) => ({ id: item.id, tamanho: item.tamanho, cor: item.cor, estoque: item.estoque })),
  }} whatsappUrl={whatsappUrl} />;
}
