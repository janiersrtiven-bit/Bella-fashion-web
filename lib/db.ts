import { PrismaClient } from "@prisma/client";

function isValidPostgresUrl(value: string | undefined) {
    if (!value) return false;
    const normalized = value.trim().toLowerCase();
    return normalized.startsWith("postgresql://") || normalized.startsWith("postgres://");
}

function ensureDatabaseUrlFromVercelPostgres() {
    const currentUrl = process.env.DATABASE_URL;
    const vercelPrismaUrl = process.env.POSTGRES_PRISMA_URL;
    const vercelUrl = process.env.POSTGRES_URL;

    if (isValidPostgresUrl(currentUrl)) {
        return;
    }

    if (isValidPostgresUrl(vercelPrismaUrl)) {
        process.env.DATABASE_URL = vercelPrismaUrl;
        return;
    }

    if (isValidPostgresUrl(vercelUrl)) {
        process.env.DATABASE_URL = vercelUrl;
    }
}

ensureDatabaseUrlFromVercelPostgres();

declare global {
    var prisma: PrismaClient | undefined;
}

export const prisma =
    globalThis.prisma ||
    new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query"] : [],
    });

if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = prisma;
}

export function parsePriceToCents(preco: string) {
    const valorLimpo = preco
        .replace("R$", "")
        .replace(/\s/g, "")
        .replace(/\./g, "")
        .replace(",", ".");

    const numero = Number(valorLimpo);
    if (Number.isNaN(numero)) {
        return 0;
    }

    return Math.round(numero * 100);
}

export async function getProdutos() {
    return prisma.produto.findMany({
        include: {
            imagens: { orderBy: { ordem: "asc" } },
            variantes: { orderBy: [{ cor: "asc" }, { tamanho: "asc" }] },
        },
        orderBy: {
            id: "asc",
        },
    });
}

export async function getProdutosPublicos() {
    return prisma.produto.findMany({
        where: {
            status: "Ativo",
        },
        include: {
            imagens: { orderBy: { ordem: "asc" } },
            variantes: { where: { ativo: true }, orderBy: [{ cor: "asc" }, { tamanho: "asc" }] },
        },
        orderBy: {
            id: "asc",
        },
    });
}

export async function getProdutoById(id: number) {
    return prisma.produto.findUnique({
        where: {
            id,
        },
        include: {
            imagens: { orderBy: { ordem: "asc" } },
            variantes: { orderBy: [{ cor: "asc" }, { tamanho: "asc" }] },
        },
    });
}

export async function getProdutoPublicoBySlugOrId(value: string) {
    const id = Number(value);
    return prisma.produto.findFirst({
        where: {
            status: "Ativo",
            OR: [
                ...(Number.isInteger(id) && id > 0 ? [{ id }] : []),
                { slug: value },
            ],
        },
        include: {
            imagens: { orderBy: { ordem: "asc" } },
            variantes: { where: { ativo: true }, orderBy: [{ cor: "asc" }, { tamanho: "asc" }] },
        },
    });
}

function slugifyProductName(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "produto";
}

async function getAvailableProductSlug(name: string, ignoreId?: number) {
    const base = slugifyProductName(name);
    let candidate = base;
    let suffix = 2;

    while (
        await prisma.produto.findFirst({
            where: { slug: candidate, ...(ignoreId ? { NOT: { id: ignoreId } } : {}) },
            select: { id: true },
        })
    ) {
        candidate = `${base}-${suffix}`;
        suffix += 1;
    }

    return candidate;
}

export async function getPedidoById(id: number) {
    return prisma.pedido.findUnique({
        where: {
            id,
        },
    });
}

export async function createProduto(data: {
    nome: string;
    imagem: string;
    preco: string;
    destaque: string;
    descricao: string;
    status: string;
    categoria: string;
    estoque: number;
    dataCadastro?: string;
    horaCadastro?: string;
    imagens?: string[];
    variantes?: Array<{ tamanho: string; cor: string; sku?: string; estoque: number; ativo: boolean }>;
}) {
    const agora = new Date();
    const dataCadastro = data.dataCadastro ?? agora.toLocaleDateString("pt-BR");
    const horaCadastro = data.horaCadastro ?? agora.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
    });

    const { imagens = [], variantes = [], ...productData } = data;
    const slug = await getAvailableProductSlug(productData.nome);
    const estoque = variantes.length > 0
        ? variantes.reduce((total, item) => total + item.estoque, 0)
        : productData.estoque;

    return prisma.produto.create({
        data: {
            ...productData,
            slug,
            precoCentavos: parsePriceToCents(productData.preco),
            estoque,
            dataCadastro,
            horaCadastro,
            imagens: imagens.length > 0
                ? { create: imagens.map((url, ordem) => ({ url, ordem, alt: productData.nome })) }
                : undefined,
            variantes: variantes.length > 0
                ? { create: variantes.map((item) => ({ ...item, sku: item.sku || null })) }
                : undefined,
        },
        include: { imagens: { orderBy: { ordem: "asc" } }, variantes: true },
    });
}

export async function updateProduto(id: number, data: Partial<{
    nome: string;
    imagem: string;
    preco: string;
    destaque: string;
    descricao: string;
    status: string;
    categoria: string;
    estoque: number;
    dataCadastro: string;
    horaCadastro: string;
    imagens: string[];
    variantes: Array<{ tamanho: string; cor: string; sku?: string; estoque: number; ativo: boolean }>;
}>) {
    const { imagens, variantes, ...productData } = data;
    const slug = productData.nome ? await getAvailableProductSlug(productData.nome, id) : undefined;
    const estoque = variantes
        ? variantes.reduce((total, item) => total + item.estoque, 0)
        : productData.estoque;

    return prisma.$transaction(async (tx) => {
        if (imagens) await tx.produtoImagem.deleteMany({ where: { produtoId: id } });
        if (variantes) await tx.produtoVariante.deleteMany({ where: { produtoId: id } });

        return tx.produto.update({
            where: { id },
            data: {
                ...productData,
                ...(slug ? { slug } : {}),
                ...(productData.preco ? { precoCentavos: parsePriceToCents(productData.preco) } : {}),
                ...(estoque !== undefined ? { estoque } : {}),
                ...(imagens
                    ? { imagens: { create: imagens.map((url, ordem) => ({ url, ordem, alt: productData.nome })) } }
                    : {}),
                ...(variantes
                    ? { variantes: { create: variantes.map((item) => ({ ...item, sku: item.sku || null })) } }
                    : {}),
            },
            include: { imagens: { orderBy: { ordem: "asc" } }, variantes: true },
        });
    });
}

export async function deleteProduto(id: number) {
    return prisma.produto.delete({ where: { id } });
}

export async function searchPedidos({
    whatsapp,
    id,
}: {
    whatsapp?: string;
    id?: number;
}) {
    if (id) {
        const pedido = await prisma.pedido.findUnique({
            where: { id },
        });
        return pedido ? [pedido] : [];
    }

    if (whatsapp) {
        return prisma.pedido.findMany({
            where: {
                whatsapp: {
                    contains: whatsapp,
                },
            },
            orderBy: { id: "desc" },
        });
    }

    return prisma.pedido.findMany({
        orderBy: { id: "desc" },
    });
}

export async function createPedido(data: {
    cliente: string;
    whatsapp: string;
    emailCliente?: string;
    enderecoEntrega?: string;
    produtoId: number;
    produtoNome: string;
    quantidade: number;
    valorTotal: string;
    metodoPagamento: string;
    statusPagamento: string;
    statusPedido: string;
    statusEntrega: string;
    observacoes?: string;
    dataPedido: string;
    horaPedido: string;
}) {
    return prisma.pedido.create({ data });
}

export async function updatePedido(id: number, data: Partial<{
    cliente: string;
    whatsapp: string;
    emailCliente?: string;
    enderecoEntrega?: string;
    produtoId: number;
    produtoNome: string;
    quantidade: number;
    valorTotal: string;
    metodoPagamento: string;
    statusPagamento: string;
    statusPedido: string;
    codigoRastreio?: string;
    statusEntrega: string;
    observacoes?: string;
}>) {
    return prisma.pedido.update({
        where: { id },
        data,
    });
}

export async function deletePedido(id: number) {
    return prisma.pedido.delete({ where: { id } });
}

type SiteConfigInput = {
    heroImagem?: string | null;
    heroTitulo?: string | null;
    heroSubtitulo?: string | null;
    heroMaterial?: string | null;
    heroPrecoDestaque?: string | null;
    heroWhatsappTexto?: string | null;
    heroWhatsappNumero?: string | null;
    avisoTopo?: string | null;
    instagramUrl?: string | null;
    emailContato?: string | null;
    whatsappContato?: string | null;
    sobreTexto?: string | null;
    enviosTexto?: string | null;
    trocasTexto?: string | null;
    privacidadeTexto?: string | null;
    termosTexto?: string | null;
    instrucoesPix?: string | null;
    freteFixoCentavos?: number;
};

export async function getSiteConfig() {
    return prisma.configuracaoSite.findUnique({
        where: {
            singleton: "default",
        },
    });
}

export async function upsertSiteConfig(data: SiteConfigInput) {
    return prisma.configuracaoSite.upsert({
        where: {
            singleton: "default",
        },
        create: {
            singleton: "default",
            ...data,
        },
        update: data,
    });
}
