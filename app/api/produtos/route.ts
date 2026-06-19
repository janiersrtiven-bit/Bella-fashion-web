import { NextResponse } from "next/server";
import { getProdutos, getProdutoById, createProduto, updateProduto, deleteProduto } from "@/lib/db";
import { produtoSchema, produtoUpdateSchema } from "@/lib/schemas";

export async function GET(request: Request) {
    const url = new URL(request.url);
    const idParam = url.searchParams.get("id");

    if (idParam) {
        const id = Number(idParam);
        if (!Number.isInteger(id) || id <= 0) {
            return NextResponse.json({ error: "ID do produto inválido." }, { status: 400 });
        }

        const produto = await getProdutoById(id);
        if (!produto) {
            return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
        }
        return NextResponse.json(produto);
    }

    const produtos = await getProdutos();
    return NextResponse.json(produtos);
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

    const produto = await createProduto(parseResult.data);
    return NextResponse.json(produto, { status: 201 });
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

    const produto = await updateProduto(id, parseResult.data);
    return NextResponse.json(produto);
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
    } catch (error) {
        return NextResponse.json({ error: "Não foi possível excluir o produto." }, { status: 400 });
    }
}
