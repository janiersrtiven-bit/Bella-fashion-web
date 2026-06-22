import { NextResponse } from "next/server";
import {
    getProdutos,
    getProdutosPublicos,
    getProdutoById,
    createProduto,
    updateProduto,
    deleteProduto,
} from "@/lib/db";
import { produtoSchema, produtoUpdateSchema } from "@/lib/schemas";
import { isAdminRequestAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

function getSafeErrorMessage(error: unknown) {
    if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
        return error.message;
    }

    return "Erro interno desconhecido.";
}

export async function GET(request: Request) {
    const url = new URL(request.url);
    const idParam = url.searchParams.get("id");

    const isAdmin = await isAdminRequestAuthenticated(request);

    if (idParam) {
        const id = Number(idParam);
        if (!Number.isInteger(id) || id <= 0) {
            return NextResponse.json({ error: "ID do produto inválido." }, { status: 400 });
        }

        try {
            const produto = await getProdutoById(id);
            if (!produto || (!isAdmin && produto.status !== "Ativo")) {
                return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
            }

            return NextResponse.json(produto);
        } catch {
            return NextResponse.json(
                { error: "Catálogo temporariamente indisponível." },
                { status: 503 }
            );
        }
    }

    try {
        const produtos = isAdmin ? await getProdutos() : await getProdutosPublicos();
        return NextResponse.json(produtos);
    } catch {
        return NextResponse.json(
            { error: "Catálogo temporariamente indisponível." },
            { status: 503 }
        );
    }
}

export async function POST(request: Request) {
    if (!(await isAdminRequestAuthenticated(request))) {
        return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Payload JSON inválido." }, { status: 400 });
    }

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
    } catch (error) {
        return NextResponse.json(
            { error: `Erro ao criar produto. ${getSafeErrorMessage(error)}` },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    if (!(await isAdminRequestAuthenticated(request))) {
        return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const url = new URL(request.url);
    const idParam = url.searchParams.get("id");
    if (!idParam) {
        return NextResponse.json({ error: "ID do produto é obrigatório." }, { status: 400 });
    }

    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) {
        return NextResponse.json({ error: "ID do produto inválido." }, { status: 400 });
    }

    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Payload JSON inválido." }, { status: 400 });
    }

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
    } catch (error) {
        return NextResponse.json(
            { error: `Erro ao atualizar produto. ${getSafeErrorMessage(error)}` },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    if (!(await isAdminRequestAuthenticated(request))) {
        return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

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
        return NextResponse.json({ error: "Não foi possível excluir o produto." }, { status: 400 });
    }
}
