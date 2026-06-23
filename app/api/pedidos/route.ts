import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { pedidoCreateSchema, pedidoUpdateSchema } from "@/lib/schemas";
import {
    sendOrderCreatedNotifications,
    sendOrderDeliveredNotifications,
    sendOrderShippedNotifications,
    sendPaymentConfirmedNotifications,
} from "@/lib/notifications";
import { isAdminRequestAuthenticated } from "@/lib/admin-auth";
import { getCurrentCustomer } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

class PedidoError extends Error {
    constructor(message: string, readonly status = 400) {
        super(message);
    }
}

type PedidoItemPublico = {
    id: number;
    nome: string;
    quantidade: number;
    precoUnitarioCentavos: number;
    totalCentavos: number;
};

type PedidoComItens = {
    id: number;
    cliente: string;
    whatsapp: string;
    emailCliente: string | null;
    produtoId: number;
    produtoNome: string;
    quantidade: number;
    valorTotal: string;
    metodoPagamento: string;
    statusPagamento: string;
    statusPedido: string;
    codigoRastreio: string | null;
    statusEntrega: string;
    enderecoEntrega: string | null;
    observacoes: string | null;
    dataPedido: string;
    horaPedido: string;
    estoqueReservado: boolean;
    itens: PedidoItemPublico[];
};

function parsePriceToNumber(value: string) {
    const normalized = value
        .replace(/[^\d,.-]/g, "")
        .replace(/\./g, "")
        .replace(",", ".");

    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
}

function parsePriceToCents(value: string) {
    return Math.round(parsePriceToNumber(value) * 100);
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

function publicPedido(pedido: PedidoComItens) {
    const itens =
        pedido.itens.length > 0
            ? pedido.itens
            : [
                  {
                      id: 0,
                      nome: pedido.produtoNome,
                      quantidade: pedido.quantidade,
                      precoUnitarioCentavos: 0,
                      totalCentavos: 0,
                  },
              ];

    return {
        id: pedido.id,
        cliente: pedido.cliente,
        produtoNome: pedido.produtoNome,
        quantidade: itens.reduce((total, item) => total + item.quantidade, 0),
        valorTotal: pedido.valorTotal,
        metodoPagamento: pedido.metodoPagamento,
        statusPagamento: pedido.statusPagamento,
        statusPedido: pedido.statusPedido,
        codigoRastreio: pedido.codigoRastreio,
        statusEntrega: pedido.statusEntrega,
        enderecoEntrega: pedido.enderecoEntrega,
        dataPedido: pedido.dataPedido,
        horaPedido: pedido.horaPedido,
        itens,
    };
}

function errorResponse(error: unknown, fallback: string) {
    if (error instanceof PedidoError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: fallback }, { status: 500 });
}

function notificationPayload(pedido: {
    id: number;
    cliente: string;
    whatsapp: string;
    emailCliente: string | null;
    produtoNome: string;
    quantidade: number;
    valorTotal: string;
    metodoPagamento: string;
    statusPagamento: string;
    statusPedido: string;
    statusEntrega: string;
    codigoRastreio: string | null;
    dataPedido: string;
    horaPedido: string;
}) {
    return {
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
        codigoRastreio: pedido.codigoRastreio,
        dataPedido: pedido.dataPedido,
        horaPedido: pedido.horaPedido,
    };
}

async function restorePedidoStock(
    tx: Pick<typeof prisma, "produto" | "produtoVariante">,
    pedido: {
        produtoId: number;
        quantidade: number;
        itens: Array<{ produtoId: number | null; varianteId: number | null; quantidade: number }>;
    }
) {
    if (pedido.itens.length > 0) {
        for (const item of pedido.itens) {
            if (item.produtoId) {
                await tx.produto.update({
                    where: { id: item.produtoId },
                    data: { estoque: { increment: item.quantidade } },
                });
            }

            if (item.varianteId) {
                await tx.produtoVariante.update({
                    where: { id: item.varianteId },
                    data: { estoque: { increment: item.quantidade } },
                });
            }
        }
        return;
    }

    await tx.produto.update({
        where: { id: pedido.produtoId },
        data: { estoque: { increment: pedido.quantidade } },
    });
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

                const pedido = await prisma.pedido.findUnique({
                    where: { id },
                    include: { itens: { orderBy: { id: "asc" } } },
                });
                return NextResponse.json(pedido);
            }

            const pedidos = await prisma.pedido.findMany({
                include: { itens: { orderBy: { id: "asc" } } },
                orderBy: { id: "desc" },
            });
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

        const pedido = await prisma.pedido.findFirst({
            where: { id, whatsapp },
            include: {
                itens: {
                    select: {
                        id: true,
                        nome: true,
                        quantidade: true,
                        precoUnitarioCentavos: true,
                        totalCentavos: true,
                    },
                    orderBy: { id: "asc" },
                },
            },
        });

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

    const isAdmin = await isAdminRequestAuthenticated(request);
    const rawBody = body as { aceitouTermos?: unknown };

    if (!isAdmin && rawBody.aceitouTermos !== true) {
        return NextResponse.json(
            { error: "Aceite os termos e a política de privacidade para continuar." },
            { status: 400 }
        );
    }

    const parseResult = pedidoCreateSchema.safeParse(body);
    if (!parseResult.success) {
        return NextResponse.json(
            { error: parseResult.error.errors.map((item) => item.message).join(" | ") },
            { status: 400 }
        );
    }

    const validatedPedido = parseResult.data;
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

        const statusPagamentoValue = isAdmin
            ? validatedPedido.statusPagamento
            : "Aguardando pagamento";
        const statusPedidoValue = isAdmin ? validatedPedido.statusPedido : "Pedido recebido";
        const shouldReserveStock = statusPagamentoValue !== "Pago";
        const pedidoReservationData = {
            statusPagamento: statusPagamentoValue,
            statusPedido: statusPedidoValue,
            estoqueReservado: shouldReserveStock,
            expiresAt: !isAdmin && shouldReserveStock ? new Date(Date.now() + 60 * 60 * 1000) : null,
        };

        const pedido = await prisma.$transaction(async (tx) => {
            const config = await tx.configuracaoSite.findUnique({ where: { singleton: "default" } });
            const freteCentavos = isAdmin ? 0 : config?.freteFixoCentavos ?? 0;
            const isMultiItemOrder = Array.isArray(validatedPedido.itens) && validatedPedido.itens.length > 0;

            if (!isMultiItemOrder) {
                const quantidade = validatedPedido.quantidade ?? 0;
                const produto = await tx.produto.findUnique({
                    where: { id: validatedPedido.produtoId ?? 0 },
                });

                if (!produto || (!isAdmin && produto.status !== "Ativo")) {
                    throw new PedidoError("Produto não encontrado.", 404);
                }

                const reserva = await tx.produto.updateMany({
                    where: {
                        id: produto.id,
                        estoque: { gte: quantidade },
                        ...(isAdmin ? {} : { status: "Ativo" }),
                    },
                    data: { estoque: { decrement: quantidade } },
                });

                if (reserva.count !== 1) {
                    throw new PedidoError("Estoque insuficiente para esta quantidade.");
                }

                const unitPriceCents = produto.precoCentavos ?? parsePriceToCents(produto.preco);
                const subtotalCentavos = unitPriceCents * quantidade;
                const totalCentavos = subtotalCentavos + freteCentavos;

                return tx.pedido.create({
                    data: {
                        cliente: validatedPedido.cliente.trim(),
                        whatsapp: validatedPedido.whatsapp,
                        enderecoEntrega: validatedPedido.enderecoEntrega,
                        ...pedidoClienteData,
                        produtoId: produto.id,
                        produtoNome: produto.nome,
                        quantidade,
                        valorTotal: formatCentsToCurrencyBRL(totalCentavos),
                        subtotalCentavos,
                        freteCentavos,
                        totalCentavos,
                        metodoPagamento: validatedPedido.metodoPagamento,
                        ...pedidoReservationData,
                        statusEntrega: isAdmin ? validatedPedido.statusEntrega : "Aguardando envio",
                        observacoes: validatedPedido.observacoes,
                        dataPedido: now.toLocaleDateString("pt-BR"),
                        horaPedido: now.toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                        }),
                        itens: {
                            create: {
                                produtoId: produto.id,
                                nome: produto.nome,
                                quantidade,
                                precoUnitarioCentavos: unitPriceCents,
                                totalCentavos: subtotalCentavos,
                            },
                        },
                    },
                });
            }

            const orderItems: Array<{
                produto: { id: number; nome: string; precoCentavos: number | null; preco: string };
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

                const unitPriceCents = produto.precoCentavos ?? parsePriceToCents(produto.preco);

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
                        throw new PedidoError("Variação do produto não encontrada.", 404);
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
                        throw new PedidoError("Estoque insuficiente para esta variação.");
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

            const totalCentavos = subtotalCentavos + freteCentavos;
            const totalQuantidade = orderItems.reduce((total, item) => total + item.quantity, 0);
            const firstItem = orderItems[0];

            return tx.pedido.create({
                data: {
                    cliente: validatedPedido.cliente.trim(),
                    whatsapp: validatedPedido.whatsapp,
                    enderecoEntrega: validatedPedido.enderecoEntrega,
                    ...pedidoClienteData,
                    produtoId: firstItem.produto.id,
                    produtoNome: orderItems.length > 1 ? `${orderItems.length} produtos` : firstItem.name,
                    quantidade: totalQuantidade,
                    valorTotal: formatCentsToCurrencyBRL(totalCentavos),
                    subtotalCentavos,
                    freteCentavos,
                    totalCentavos,
                    metodoPagamento: validatedPedido.metodoPagamento,
                    ...pedidoReservationData,
                    statusEntrega: isAdmin ? validatedPedido.statusEntrega : "Aguardando envio",
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

        void sendOrderCreatedNotifications(notificationPayload(pedido));

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
        const { pedidoAtual, pedidoAtualizado } = await prisma.$transaction(async (tx) => {
            const pedidoAtual = await tx.pedido.findUnique({
                where: { id: pedidoId },
                include: { itens: { orderBy: { id: "asc" } } },
            });
            if (!pedidoAtual) throw new PedidoError("Pedido não encontrado.", 404);

            const validatedBody = parseResult.data;
            const wantsProductChange =
                validatedBody.produtoId !== undefined || validatedBody.quantidade !== undefined;

            if (wantsProductChange && pedidoAtual.itens.length > 1) {
                throw new PedidoError(
                    "Pedidos multiproduto não podem ter produtos alterados nesta tela. Atualize status, rastreio ou crie um novo pedido.",
                    409
                );
            }

            const data: Record<string, unknown> = {};
            if (validatedBody.cliente !== undefined) data.cliente = validatedBody.cliente;
            if (validatedBody.whatsapp !== undefined) data.whatsapp = validatedBody.whatsapp;
            if (validatedBody.emailCliente !== undefined) data.emailCliente = validatedBody.emailCliente || null;
            if (validatedBody.enderecoEntrega !== undefined) data.enderecoEntrega = validatedBody.enderecoEntrega || null;
            if (validatedBody.metodoPagamento !== undefined) data.metodoPagamento = validatedBody.metodoPagamento;
            if (validatedBody.statusPagamento !== undefined) data.statusPagamento = validatedBody.statusPagamento;
            if (validatedBody.statusPedido !== undefined) data.statusPedido = validatedBody.statusPedido;
            if (validatedBody.codigoRastreio !== undefined) data.codigoRastreio = validatedBody.codigoRastreio || null;
            if (validatedBody.statusEntrega !== undefined) data.statusEntrega = validatedBody.statusEntrega;
            if (validatedBody.observacoes !== undefined) data.observacoes = validatedBody.observacoes || null;

            if (validatedBody.statusPagamento === "Pago") {
                data.estoqueReservado = false;
                data.expiresAt = null;
            }

            if (validatedBody.statusPedido === "Cancelado" && pedidoAtual.estoqueReservado) {
                await restorePedidoStock(tx, pedidoAtual);
                data.estoqueReservado = false;
                data.expiresAt = null;
            }

            if (wantsProductChange) {
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

                    await restorePedidoStock(tx, pedidoAtual);
                }

                const unitPriceCents = produtoNovo.precoCentavos ?? parsePriceToCents(produtoNovo.preco);
                const subtotalCentavos = unitPriceCents * novaQuantidade;
                const totalCentavos = subtotalCentavos + pedidoAtual.freteCentavos;

                Object.assign(data, {
                    produtoId: novoProdutoId,
                    produtoNome: produtoNovo.nome,
                    quantidade: novaQuantidade,
                    valorTotal: formatCentsToCurrencyBRL(totalCentavos),
                    subtotalCentavos,
                    totalCentavos,
                });

                if (pedidoAtual.itens.length === 1) {
                    await tx.pedidoItem.update({
                        where: { id: pedidoAtual.itens[0].id },
                        data: {
                            produtoId: produtoNovo.id,
                            varianteId: null,
                            nome: produtoNovo.nome,
                            sku: null,
                            tamanho: null,
                            cor: null,
                            quantidade: novaQuantidade,
                            precoUnitarioCentavos: unitPriceCents,
                            totalCentavos: subtotalCentavos,
                        },
                    });
                }
            }

            const pedidoAtualizado = await tx.pedido.update({
                where: { id: pedidoId },
                data,
                include: { itens: { orderBy: { id: "asc" } } },
            });

            return { pedidoAtual, pedidoAtualizado };
        });

        if (pedidoAtual.statusPagamento !== "Pago" && pedidoAtualizado.statusPagamento === "Pago") {
            void sendPaymentConfirmedNotifications(notificationPayload(pedidoAtualizado));
        }

        const becameShipped =
            pedidoAtual.statusPedido !== "Enviado" && pedidoAtualizado.statusPedido === "Enviado";
        const trackingChanged =
            pedidoAtual.codigoRastreio !== pedidoAtualizado.codigoRastreio &&
            Boolean(pedidoAtualizado.codigoRastreio);
        const deliveryStarted =
            pedidoAtual.statusEntrega !== pedidoAtualizado.statusEntrega &&
            ["Em transporte", "Saiu para entrega"].includes(pedidoAtualizado.statusEntrega);

        if (becameShipped || trackingChanged || deliveryStarted) {
            void sendOrderShippedNotifications(notificationPayload(pedidoAtualizado));
        }

        const becameDelivered =
            (pedidoAtual.statusPedido !== "Entregue" && pedidoAtualizado.statusPedido === "Entregue") ||
            (pedidoAtual.statusEntrega !== "Entregue" && pedidoAtualizado.statusEntrega === "Entregue");

        if (becameDelivered) {
            void sendOrderDeliveredNotifications(notificationPayload(pedidoAtualizado));
        }

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
            const pedido = await tx.pedido.findUnique({
                where: { id: pedidoId },
                include: { itens: true },
            });
            if (!pedido) throw new PedidoError("Pedido não encontrado.", 404);

            await restorePedidoStock(tx, pedido);
            await tx.pedido.delete({ where: { id: pedido.id } });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return errorResponse(error, "Não foi possível excluir o pedido.");
    }
}
