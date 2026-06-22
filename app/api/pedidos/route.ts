import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { pedidoCreateSchema, pedidoUpdateSchema } from "@/lib/schemas";
import { sendOrderCreatedNotifications } from "@/lib/notifications";
import { isAdminRequestAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

class PedidoError extends Error {
    constructor(message: string, readonly status = 400) {
        super(message);
    }
}

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

function publicPedido(pedido: {
    id: number;
    cliente: string;
    produtoNome: string;
    quantidade: number;
    valorTotal: string;
    metodoPagamento: string;
    statusPagamento: string;
    statusPedido: string;
    codigoRastreio: string | null;
    statusEntrega: string;
    enderecoEntrega: string | null;
    dataPedido: string;
    horaPedido: string;
}) {
    return {
        id: pedido.id,
        cliente: pedido.cliente,
        produtoNome: pedido.produtoNome,
        quantidade: pedido.quantidade,
        valorTotal: pedido.valorTotal,
        metodoPagamento: pedido.metodoPagamento,
        statusPagamento: pedido.statusPagamento,
        statusPedido: pedido.statusPedido,
        codigoRastreio: pedido.codigoRastreio,
        statusEntrega: pedido.statusEntrega,
        enderecoEntrega: pedido.enderecoEntrega,
        dataPedido: pedido.dataPedido,
        horaPedido: pedido.horaPedido,
    };
}

function errorResponse(error: unknown, fallback: string) {
    if (error instanceof PedidoError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: fallback }, { status: 500 });
}

export async function GET(request: Request) {
    const url = new URL(request.url);
    const idParam = url.searchParams.get("id");
    const whatsappParam = url.searchParams.get("whatsapp");
    const isAdmin = await isAdminRequestAuthenticated(request);

    try {
      if (isAdmin) {
        if (idParam) {
            const id = Number(idParam);
            if (!Number.isInteger(id) || id <= 0) {
                return NextResponse.json({ error: "ID do pedido inválido." }, { status: 400 });
            }

            const pedido = await prisma.pedido.findUnique({ where: { id } });
            return NextResponse.json(pedido);
        }

          const pedidos = await prisma.pedido.findMany({ orderBy: { id: "desc" } });
          return NextResponse.json(pedidos);
      }

      if (!idParam || !whatsappParam) {
          return NextResponse.json(
              { error: "Informe o número do pedido e o WhatsApp usado na compra." },
              { status: 400 }
          );
      }

      const id = Number(idParam);
      const whatsapp = whatsappParam.replace(/\D/g, "");

      if (!Number.isInteger(id) || id <= 0) {
          return NextResponse.json({ error: "ID do pedido inválido." }, { status: 400 });
      }

      if (!/^\d{10,15}$/.test(whatsapp)) {
          return NextResponse.json({ error: "WhatsApp inválido." }, { status: 400 });
      }

      const pedido = await prisma.pedido.findFirst({ where: { id, whatsapp } });
      return NextResponse.json(pedido ? publicPedido(pedido) : null);
    } catch {
      return NextResponse.json(
        { error: "Serviço de pedidos temporariamente indisponível." },
        { status: 503 }
      );
    }
}

export async function POST(request: Request) {
    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Payload JSON inválido." }, { status: 400 });
    }

    const parseResult = pedidoCreateSchema.safeParse(body);
    if (!parseResult.success) {
        return NextResponse.json(
            { error: parseResult.error.errors.map((item) => item.message).join(" | ") },
            { status: 400 }
        );
    }

    const validatedPedido = parseResult.data;
    const isAdmin = await isAdminRequestAuthenticated(request);
    const now = new Date();

    if (!isAdmin && !validatedPedido.enderecoEntrega) {
        return NextResponse.json(
            { error: "Informe o endereço completo para entrega." },
            { status: 400 }
        );
    }

    if (!isAdmin && !["Pix", "Cartão"].includes(validatedPedido.metodoPagamento)) {
        return NextResponse.json({ error: "Forma de pagamento indisponível." }, { status: 400 });
    }

    try {
        const pedido = await prisma.$transaction(async (tx) => {
            const produto = await tx.produto.findUnique({
                where: { id: validatedPedido.produtoId },
            });

            if (!produto || (!isAdmin && produto.status !== "Ativo")) {
                throw new PedidoError("Produto não encontrado.", 404);
            }

            const reserva = await tx.produto.updateMany({
                where: {
                    id: produto.id,
                    estoque: { gte: validatedPedido.quantidade },
                    ...(isAdmin ? {} : { status: "Ativo" }),
                },
                data: { estoque: { decrement: validatedPedido.quantidade } },
            });

            if (reserva.count !== 1) {
                throw new PedidoError("Estoque insuficiente para esta quantidade.");
            }

            return tx.pedido.create({
                data: {
                    cliente: validatedPedido.cliente.trim(),
                    whatsapp: validatedPedido.whatsapp,
                    emailCliente: validatedPedido.emailCliente,
                    enderecoEntrega: validatedPedido.enderecoEntrega,
                    produtoId: produto.id,
                    produtoNome: produto.nome,
                    quantidade: validatedPedido.quantidade,
                    valorTotal: formatCurrencyBRL(
                        parsePriceToNumber(produto.preco) * validatedPedido.quantidade
                    ),
                    metodoPagamento: validatedPedido.metodoPagamento,
                    statusPagamento: isAdmin
                        ? validatedPedido.statusPagamento
                        : "Aguardando pagamento",
                    statusPedido: isAdmin ? validatedPedido.statusPedido : "Pedido recebido",
                    statusEntrega: isAdmin
                        ? validatedPedido.statusEntrega
                        : "Aguardando envio",
                    observacoes: validatedPedido.observacoes,
                    dataPedido: now.toLocaleDateString("pt-BR"),
                    horaPedido: now.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                },
            });
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
    } catch (error) {
        return errorResponse(error, "Não foi possível registrar o pedido.");
    }
}

export async function PUT(request: Request) {
    if (!(await isAdminRequestAuthenticated(request))) {
        return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const pedidoId = Number(new URL(request.url).searchParams.get("id"));
    if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
        return NextResponse.json({ error: "ID do pedido inválido." }, { status: 400 });
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Payload JSON inválido." }, { status: 400 });
    }

    const parseResult = pedidoUpdateSchema.safeParse(body);
    if (!parseResult.success) {
        return NextResponse.json(
            { error: parseResult.error.errors.map((item) => item.message).join(" | ") },
            { status: 400 }
        );
    }

    try {
        const pedidoAtualizado = await prisma.$transaction(async (tx) => {
            const pedidoAtual = await tx.pedido.findUnique({ where: { id: pedidoId } });
            if (!pedidoAtual) throw new PedidoError("Pedido não encontrado.", 404);

            const validatedBody = parseResult.data;
            const novoProdutoId = validatedBody.produtoId ?? pedidoAtual.produtoId;
            const novaQuantidade = validatedBody.quantidade ?? pedidoAtual.quantidade;
            const produtoNovo = await tx.produto.findUnique({ where: { id: novoProdutoId } });

            if (!produtoNovo) throw new PedidoError("Produto selecionado não encontrado.", 404);

            if (pedidoAtual.produtoId === novoProdutoId) {
                const diferenca = novaQuantidade - pedidoAtual.quantidade;

                if (diferenca > 0) {
                    const reserva = await tx.produto.updateMany({
                        where: { id: novoProdutoId, estoque: { gte: diferenca } },
                        data: { estoque: { decrement: diferenca } },
                    });
                    if (reserva.count !== 1) {
                        throw new PedidoError("Estoque insuficiente para aumentar a quantidade.");
                    }
                } else if (diferenca < 0) {
                    await tx.produto.update({
                        where: { id: novoProdutoId },
                        data: { estoque: { increment: Math.abs(diferenca) } },
                    });
                }
            } else {
                const reserva = await tx.produto.updateMany({
                    where: { id: novoProdutoId, estoque: { gte: novaQuantidade } },
                    data: { estoque: { decrement: novaQuantidade } },
                });
                if (reserva.count !== 1) {
                    throw new PedidoError("Estoque insuficiente para o novo produto.");
                }

                await tx.produto.update({
                    where: { id: pedidoAtual.produtoId },
                    data: { estoque: { increment: pedidoAtual.quantidade } },
                });
            }

            return tx.pedido.update({
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
        });

        return NextResponse.json(pedidoAtualizado);
    } catch (error) {
        return errorResponse(error, "Não foi possível atualizar o pedido.");
    }
}

export async function DELETE(request: Request) {
    if (!(await isAdminRequestAuthenticated(request))) {
        return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const pedidoId = Number(new URL(request.url).searchParams.get("id"));
    if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
        return NextResponse.json({ error: "ID do pedido inválido." }, { status: 400 });
    }

    try {
        await prisma.$transaction(async (tx) => {
            const pedido = await tx.pedido.findUnique({ where: { id: pedidoId } });
            if (!pedido) throw new PedidoError("Pedido não encontrado.", 404);

            await tx.produto.update({
                where: { id: pedido.produtoId },
                data: { estoque: { increment: pedido.quantidade } },
            });
            await tx.pedido.delete({ where: { id: pedido.id } });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return errorResponse(error, "Não foi possível excluir o pedido.");
    }
}
