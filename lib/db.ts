import { PrismaClient } from "@prisma/client";
import { produtosDefault } from "@/lib/produtos";

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

export async function ensureProductsSeeded() {
    const count = await prisma.produto.count();

    if (count > 0) {
        return;
    }

    const agora = new Date();
    const dataCadastro = agora.toLocaleDateString("pt-BR");
    const horaCadastro = agora.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
    });

    await prisma.produto.createMany({
        data: produtosDefault.map((produto) => ({
            nome: produto.nome,
            imagem: produto.imagem,
            preco: produto.preco,
            destaque: produto.destaque,
            descricao: produto.descricao,
            status: produto.status ?? "Ativo",
            categoria: produto.categoria ?? "Bodies",
            estoque: produto.estoque ?? 0,
            dataCadastro,
            horaCadastro,
        })),
    });
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
    await ensureProductsSeeded();
    return prisma.produto.findMany({
        orderBy: {
            id: "asc",
        },
    });
}

export async function getProdutoById(id: number) {
    await ensureProductsSeeded();
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
