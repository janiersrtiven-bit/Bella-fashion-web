import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { pedidoCreateSchema, pedidoUpdateSchema } from "@/lib/schemas";
import { sendOrderCreatedNotifications } from "@/lib/notifications";
import { isAdminRequestAuthenticated } from "@/lib/admin-auth";
import { getCurrentCustomer } from "@/lib/customer-auth";

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

function formatCentsToCurrencyBRL(cents: number) {
    return formatCurrencyBRL(cents / 100);
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
        const currentCustomer = await getCurrentCustomer();
        const pedidoClienteData = {
            emailCliente: validatedPedido.emailCliente ?? currentCustomer?.email,
            ...(currentCustomer ? { clienteId: currentCustomer.id } : {}),
        };

        const pedido = await prisma.$transaction(async (tx) => {
            const isMultiItemOrder = Array.isArray(validatedPedido.itens) && validatedPedido.itens.length > 0;

            if (!isMultiItemOrder) {
                const produto = await tx.produto.findUnique({
                    where: { id: validatedPedido.produtoId ?? 0 },
                });

                if (!produto || (!isAdmin && produto.status !== "Ativo")) {
                    throw new PedidoError("Produto não encontrado.", 404);
                }

                const reserva = await tx.produto.updateMany({
                    where: {
                        id: produto.id,
                        estoque: { gte: validatedPedido.quantidade ?? 0 },
                        ...(isAdmin ? {} : { status: "Ativo" }),
                    },
                    data: { estoque: { decrement: validatedPedido.quantidade ?? 0 } },
                });

                if (reserva.count !== 1) {
                    throw new PedidoError("Estoque insuficiente para esta quantidade.");
                }

                return tx.pedido.create({
                    data: {
                        cliente: validatedPedido.cliente.trim(),
                        whatsapp: validatedPedido.whatsapp,
                        enderecoEntrega: validatedPedido.enderecoEntrega,
                        ...pedidoClienteData,
                        produtoId: produto.id,
                        produtoNome: produto.nome,
                        quantidade: validatedPedido.quantidade ?? 0,
                        valorTotal: formatCurrencyBRL(
                            (produto.precoCentavos ?? Math.round(parsePriceToNumber(produto.preco) * 100)) *
                                (validatedPedido.quantidade ?? 0) / 100
                        ),
                        subtotalCentavos:
                            (produto.precoCentavos ?? Math.round(parsePriceToNumber(produto.preco) * 100)) *
                            (validatedPedido.quantidade ?? 0),
                        freteCentavos: 0,
                        totalCentavos:
                            (produto.precoCentavos ?? Math.round(parsePriceToNumber(produto.preco) * 100)) *
                            (validatedPedido.quantidade ?? 0),
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
            }

            const orderItems: Array<{
                produto: { id: number; nome: string; precoCentavos: number | null };
                variante: { id: number; sku: string | null; tamanho: string | null; cor: string | null } | null;
                quantity: number;
                unitPriceCents: number;
                totalCentavos: number;
                name: string;
            }> = [];

            let subtotalCentavos = 0;
            const itens = validatedPedido.itens ?? [];

            for (const item of itens) {
                const produto = await tx.produto.findUnique({
                    where: { id: item.produtoId },
                });

                if (!produto || (!isAdmin && produto.status !== "Ativo")) {
                    throw new PedidoError("Produto não encontrado.", 404);
                }

                const unitPriceCents =
                    produto.precoCentavos ?? Math.round(parsePriceToNumber(produto.preco) * 100);

                let variante: { id: number; sku: string | null; tamanho: string | null; cor: string | null } | null = null;
                if (item.varianteId != null) {
                    const produtoVariante = await tx.produtoVariante.findUnique({
                        where: { id: item.varianteId },
                    });

                    if (
                        !produtoVariante ||
                        produtoVariante.produtoId !== produto.id ||
                        (!isAdmin && !produtoVariante.ativo)
                    ) {
                        throw new PedidoError("Produto não encontrado.", 404);
                    }

                    variante = {
                        id: produtoVariante.id,
                        sku: produtoVariante.sku,
                        tamanho: produtoVariante.tamanho,
                        cor: produtoVariante.cor,
                    };

                    const reservaVariante = await tx.produtoVariante.updateMany({
                        where: {
                            id: item.varianteId,
                            estoque: { gte: item.quantidade },
                            ...(isAdmin ? {} : { ativo: true }),
                        },
                        data: { estoque: { decrement: item.quantidade } },
                    });

                    if (reservaVariante.count !== 1) {
                        throw new PedidoError("Estoque insuficiente para esta quantidade.");
                    }
                }

                const reservaProduto = await tx.produto.updateMany({
                    where: {
                        id: produto.id,
                        estoque: { gte: item.quantidade },
                        ...(isAdmin ? {} : { status: "Ativo" }),
                    },
                    data: { estoque: { decrement: item.quantidade } },
                });

                if (reservaProduto.count !== 1) {
                    throw new PedidoError("Estoque insuficiente para esta quantidade.");
                }

                const totalCentavos = unitPriceCents * item.quantidade;
                subtotalCentavos += totalCentavos;

                const itemName = variante
                    ? `${produto.nome} (${variante.cor} · ${variante.tamanho})`
                    : produto.nome;

                orderItems.push({
                    produto,
                    variante,
                    quantity: item.quantidade,
                    unitPriceCents,
                    totalCentavos,
                    name: itemName,
                });
            }

            const freteCentavos = 0;
            const totalCentavos = subtotalCentavos + freteCentavos;
            const firstItem = orderItems[0];

            return tx.pedido.create({
                data: {
                    cliente: validatedPedido.cliente.trim(),
                    whatsapp: validatedPedido.whatsapp,
                    enderecoEntrega: validatedPedido.enderecoEntrega,
                    ...pedidoClienteData,
                    produtoId: firstItem.produto.id,
                    produtoNome: firstItem.name,
                    quantidade: firstItem.quantity,
                    valorTotal: formatCentsToCurrencyBRL(totalCentavos),
                    subtotalCentavos,
                    freteCentavos,
                    totalCentavos,
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
                    itens: {
                        create: orderItems.map((orderItem) => ({
                            produtoId: orderItem.produto.id,
                            varianteId: orderItem.variante?.id,
                            nome: orderItem.name,
                            sku: orderItem.variante?.sku,
                            tamanho: orderItem.variante?.tamanho,
                            cor: orderItem.variante?.cor,
                            quantidade: orderItem.quantity,
                            precoUnitarioCentavos: orderItem.unitPriceCents,
                            totalCentavos: orderItem.totalCentavos,
                        })),
                    },
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
