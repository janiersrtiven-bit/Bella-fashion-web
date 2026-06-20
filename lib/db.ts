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
    // eslint-disable-next-line no-var
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
    });
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
}) {
    const agora = new Date();
    const dataCadastro = data.dataCadastro ?? agora.toLocaleDateString("pt-BR");
    const horaCadastro = data.horaCadastro ?? agora.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
    });

    return prisma.produto.create({
        data: {
            ...data,
            dataCadastro,
            horaCadastro,
        },
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
}>) {
    return prisma.produto.update({
        where: { id },
        data,
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
    heroImagem?: string;
    heroTitulo?: string;
    heroSubtitulo?: string;
    heroMaterial?: string;
    heroPrecoDestaque?: string;
    heroWhatsappTexto?: string;
    heroWhatsappNumero?: string;
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
