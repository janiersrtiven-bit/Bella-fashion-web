import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { pedidoCreateSchema, pedidoUpdateSchema } from "@/lib/schemas";
import { sendOrderCreatedNotifications } from "@/lib/notifications";

function parsePriceToNumber(value: string) {
    const normalized = value
        .replace(/[^\d,.-]/g, "")
        .replace(/\./g, "")
        .replace(",", ".");

    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrencyBRL(value: number) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}

export async function GET(request: Request) {
    const url = new URL(request.url);
    const idParam = url.searchParams.get("id");
    const whatsapp = url.searchParams.get("whatsapp");

    if (idParam) {
        const id = Number(idParam);
        if (!Number.isInteger(id) || id <= 0) {
            return NextResponse.json({ error: "ID do pedido inválido." }, { status: 400 });
        }

        const pedido = await prisma.pedido.findUnique({
            where: { id },
        });
        return NextResponse.json(pedido);
    }

    if (whatsapp) {
        const normalizedWhatsapp = whatsapp.replace(/\D/g, "");
        if (!/^\d{10,15}$/.test(normalizedWhatsapp)) {
            return NextResponse.json({ error: "WhatsApp inválido." }, { status: 400 });
        }

        const pedidos = await prisma.pedido.findMany({
            where: {
                whatsapp: {
                    contains: normalizedWhatsapp,
                },
            },
            orderBy: { id: "desc" },
        });
        return NextResponse.json(pedidos);
    }

    return NextResponse.json(
        { error: "Informe id ou whatsapp para consultar pedidos." },
        { status: 400 }
    );
}

export async function POST(request: Request) {
    const body = await request.json();

    const parseResult = pedidoCreateSchema.safeParse(body);
    if (!parseResult.success) {
        return NextResponse.json(
            { error: parseResult.error.errors.map((item) => item.message).join(" | ") },
            { status: 400 }
        );
    }

    const validatedPedido = parseResult.data;

    const produto = await prisma.produto.findUnique({
        where: { id: validatedPedido.produtoId },
    });

    if (!produto) {
        return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
    }

    if (produto.estoque < validatedPedido.quantidade) {
        return NextResponse.json({ error: "Estoque insuficiente." }, { status: 400 });
    }

    const now = new Date();
    const totalCalculado = formatCurrencyBRL(
        parsePriceToNumber(produto.preco) * validatedPedido.quantidade
    );

    const pedido = await prisma.pedido.create({
        data: {
            cliente: validatedPedido.cliente,
            whatsapp: validatedPedido.whatsapp,
            emailCliente: validatedPedido.emailCliente,
            enderecoEntrega: validatedPedido.enderecoEntrega,
            produtoId: validatedPedido.produtoId,
            produtoNome: produto.nome,
            quantidade: validatedPedido.quantidade,
            valorTotal: totalCalculado,
            metodoPagamento: validatedPedido.metodoPagamento,
            statusPagamento: validatedPedido.statusPagamento ?? "Aguardando pagamento",
            statusPedido: validatedPedido.statusPedido ?? "Pedido recebido",
            statusEntrega: validatedPedido.statusEntrega ?? "Aguardando envio",
            observacoes: validatedPedido.observacoes,
            dataPedido: now.toLocaleDateString("pt-BR"),
            horaPedido: now.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
            }),
        },
    });

    await prisma.produto.update({
        where: { id: produto.id },
        data: { estoque: produto.estoque - validatedPedido.quantidade },
    });

    void sendOrderCreatedNotifications({
        id: pedido.id,
        cliente: pedido.cliente,
        whatsapp: pedido.whatsapp,
        emailCliente: pedido.emailCliente,
        produtoNome: pedido.produtoNome,
        quantidade: pedido.quantidade,
        valorTotal: pedido.valorTotal,
        metodoPagamento: pedido.metodoPagamento,
        statusPagamento: pedido.statusPagamento,
        statusPedido: pedido.statusPedido,
        statusEntrega: pedido.statusEntrega,
        dataPedido: pedido.dataPedido,
        horaPedido: pedido.horaPedido,
    });

    return NextResponse.json(pedido, { status: 201 });
}

export async function PUT(request: Request) {
    const url = new URL(request.url);
    const idParam = url.searchParams.get("id");

    if (!idParam) {
        return NextResponse.json({ error: "ID do pedido é obrigatório." }, { status: 400 });
    }

    const pedidoId = Number(idParam);
    const body = await request.json();

    const pedidoAtual = await prisma.pedido.findUnique({
        where: { id: pedidoId },
    });

    if (!pedidoAtual) {
        return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
    }

    const parseResult = pedidoUpdateSchema.safeParse(body);
    if (!parseResult.success) {
        return NextResponse.json(
            { error: parseResult.error.errors.map((item) => item.message).join(" | ") },
            { status: 400 }
        );
    }

    const validatedBody = parseResult.data;
    const novoProdutoId = Number(validatedBody.produtoId ?? pedidoAtual.produtoId);
    const novaQuantidade = Number(validatedBody.quantidade ?? pedidoAtual.quantidade);

    if (!novoProdutoId || !Number.isInteger(novaQuantidade) || novaQuantidade <= 0) {
        return NextResponse.json({ error: "Produto e quantidade válidos são obrigatórios." }, { status: 400 });
    }

    const produtoAntigo = await prisma.produto.findUnique({
        where: { id: pedidoAtual.produtoId },
    });

    const produtoNovo = await prisma.produto.findUnique({
        where: { id: novoProdutoId },
    });

    if (!produtoNovo) {
        return NextResponse.json({ error: "Produto selecionado não encontrado." }, { status: 404 });
    }

    if (pedidoAtual.produtoId === novoProdutoId) {
        const diferenca = novaQuantidade - pedidoAtual.quantidade;
        if (diferenca > 0 && produtoNovo.estoque < diferenca) {
            return NextResponse.json({ error: "Estoque insuficiente para aumentar a quantidade." }, { status: 400 });
        }

        await prisma.produto.update({
            where: { id: produtoNovo.id },
            data: { estoque: produtoNovo.estoque - diferenca },
        });
    } else {
        if (produtoNovo.estoque < novaQuantidade) {
            return NextResponse.json({ error: "Estoque insuficiente para o novo produto." }, { status: 400 });
        }

        if (produtoAntigo) {
            await prisma.produto.update({
                where: { id: produtoAntigo.id },
                data: { estoque: produtoAntigo.estoque + pedidoAtual.quantidade },
            });
        }

        await prisma.produto.update({
            where: { id: produtoNovo.id },
            data: { estoque: produtoNovo.estoque - novaQuantidade },
        });
    }

    const pedidoAtualizado = await prisma.pedido.update({
        where: { id: pedidoId },
        data: {
            cliente: validatedBody.cliente,
            whatsapp: validatedBody.whatsapp,
            emailCliente: validatedBody.emailCliente,
            enderecoEntrega: validatedBody.enderecoEntrega,
            produtoId: novoProdutoId,
            produtoNome: produtoNovo.nome,
            quantidade: novaQuantidade,
            valorTotal: formatCurrencyBRL(
                parsePriceToNumber(produtoNovo.preco) * novaQuantidade
            ),
            metodoPagamento: validatedBody.metodoPagamento,
            statusPagamento: validatedBody.statusPagamento,
            statusPedido: validatedBody.statusPedido,
            codigoRastreio: validatedBody.codigoRastreio,
            statusEntrega: validatedBody.statusEntrega,
            observacoes: validatedBody.observacoes,
        },
    });

    return NextResponse.json(pedidoAtualizado);
}

export async function DELETE(request: Request) {
    const url = new URL(request.url);
    const idParam = url.searchParams.get("id");

    if (!idParam) {
        return NextResponse.json({ error: "ID do pedido é obrigatório." }, { status: 400 });
    }

    const pedidoId = Number(idParam);
    if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
        return NextResponse.json({ error: "ID do pedido inválido." }, { status: 400 });
    }

    const pedido = await prisma.pedido.findUnique({
        where: { id: pedidoId },
    });

    if (!pedido) {
        return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
    }

    const produto = await prisma.produto.findUnique({
        where: { id: pedido.produtoId },
    });

    if (produto) {
        await prisma.produto.update({
            where: { id: produto.id },
            data: { estoque: produto.estoque + pedido.quantidade },
        });
    }

    await prisma.pedido.delete({
        where: { id: pedido.id },
    });

    return NextResponse.json({ success: true });
}
