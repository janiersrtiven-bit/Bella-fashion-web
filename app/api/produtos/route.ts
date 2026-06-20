import { NextResponse } from "next/server";
import { getProdutos, getProdutoById, createProduto, updateProduto, deleteProduto } from "@/lib/db";
import { produtosDefault, type Produto } from "@/lib/produtos";
import { produtoSchema, produtoUpdateSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

declare global {
    // eslint-disable-next-line no-var
    var produtosFallback: Produto[] | undefined;
}

function getFallbackProdutos() {
    if (!globalThis.produtosFallback) {
        globalThis.produtosFallback = produtosDefault.map((produto) => ({ ...produto }));
    }

    return globalThis.produtosFallback;
}

function nextFallbackId(produtos: Produto[]) {
    return produtos.reduce((max, produto) => Math.max(max, produto.id), 0) + 1;
}

export async function GET(request: Request) {
    const url = new URL(request.url);
    const idParam = url.searchParams.get("id");

    if (idParam) {
        const id = Number(idParam);
        if (!Number.isInteger(id) || id <= 0) {
            return NextResponse.json({ error: "ID do produto inválido." }, { status: 400 });
        }

        try {
            const produto = await getProdutoById(id);
            if (!produto) {
                return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
            }

            return NextResponse.json(produto);
        } catch {
            const produtoFallback = getFallbackProdutos().find((produto) => produto.id === id);
            if (!produtoFallback) {
                return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
            }

            return NextResponse.json(produtoFallback);
        }
    }

    try {
        const produtos = await getProdutos();
        return NextResponse.json(produtos);
    } catch {
        return NextResponse.json(getFallbackProdutos());
    }
}

export async function POST(request: Request) {
    const body = await request.json();
    const parseResult = produtoSchema.safeParse(body);
    if (!parseResult.success) {
        return NextResponse.json(
            { error: parseResult.error.errors.map((item) => item.message).join(" | ") },
            { status: 400 }
        );
    }

    try {
        const produto = await createProduto(parseResult.data);
        return NextResponse.json(produto, { status: 201 });
    } catch {
        const produtos = getFallbackProdutos();
        const novoProduto: Produto = {
            id: nextFallbackId(produtos),
            ...parseResult.data,
        };

        produtos.push(novoProduto);
        return NextResponse.json(novoProduto, { status: 201 });
    }
}

export async function PUT(request: Request) {
    const url = new URL(request.url);
    const idParam = url.searchParams.get("id");
    if (!idParam) {
        return NextResponse.json({ error: "ID do produto é obrigatório." }, { status: 400 });
    }

    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) {
        return NextResponse.json({ error: "ID do produto inválido." }, { status: 400 });
    }

    const body = await request.json();
    const parseResult = produtoUpdateSchema.safeParse(body);
    if (!parseResult.success) {
        return NextResponse.json(
            { error: parseResult.error.errors.map((item) => item.message).join(" | ") },
            { status: 400 }
        );
    }

    try {
        const produto = await updateProduto(id, parseResult.data);
        return NextResponse.json(produto);
    } catch {
        const produtos = getFallbackProdutos();
        const index = produtos.findIndex((produto) => produto.id === id);

        if (index === -1) {
            return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
        }

        produtos[index] = {
            ...produtos[index],
            ...parseResult.data,
        };

        return NextResponse.json(produtos[index]);
    }
}

export async function DELETE(request: Request) {
    const url = new URL(request.url);
    const idParam = url.searchParams.get("id");
    if (!idParam) {
        return NextResponse.json({ error: "ID do produto é obrigatório." }, { status: 400 });
    }

    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) {
        return NextResponse.json({ error: "ID do produto inválido." }, { status: 400 });
    }

    try {
        await deleteProduto(id);
        return NextResponse.json({ success: true });
    } catch {
        const produtos = getFallbackProdutos();
        const index = produtos.findIndex((produto) => produto.id === id);

        if (index === -1) {
            return NextResponse.json({ error: "Não foi possível excluir o produto." }, { status: 400 });
        }

        produtos.splice(index, 1);
        return NextResponse.json({ success: true });
    }
}
