import { NextResponse } from "next/server";
import Stripe from "stripe";
import { parsePriceToCents, prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function getAppBaseUrl(request: Request) {
    const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();

    if (configured) {
        try {
            const url = new URL(configured);
            if (url.protocol === "https:" || url.protocol === "http:") {
                return url.origin;
            }
        } catch {
            // Usa a origem da requisição quando a variável está inválida.
        }
    }

    return new URL(request.url).origin;
}

export async function POST(request: Request) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
        return NextResponse.json(
            { error: "Pagamento online não configurado." },
            { status: 503 }
        );
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Payload JSON inválido." }, { status: 400 });
    }

    const payload = body as { pedidoId?: unknown; cancelPath?: unknown };
    const pedidoId = Number(payload.pedidoId);
    const cancelPath =
        typeof payload.cancelPath === "string" &&
        payload.cancelPath.startsWith("/") &&
        !payload.cancelPath.startsWith("//")
            ? payload.cancelPath
            : "/";

    if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
        return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
    }

    let pedido;
    try {
        pedido = await prisma.pedido.findUnique({
            where: { id: pedidoId },
            include: { itens: true },
        });
    } catch {
        return NextResponse.json(
            { error: "Serviço de pedidos temporariamente indisponível." },
            { status: 503 }
        );
    }
    if (!pedido) {
        return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
    }

    if (pedido.statusPagamento === "Pago") {
        return NextResponse.json({ error: "Este pedido já foi pago." }, { status: 409 });
    }

    const amountInCents =
        typeof pedido.totalCentavos === "number" && pedido.totalCentavos > 0
            ? pedido.totalCentavos
            : parsePriceToCents(pedido.valorTotal);
    if (amountInCents <= 0) {
        return NextResponse.json({ error: "Valor do pedido inválido." }, { status: 400 });
    }

    const lineItems =
        pedido.itens && pedido.itens.length > 0
            ? pedido.itens.map((item) => ({
                  price_data: {
                      currency: "brl",
                      product_data: { name: item.nome },
                      unit_amount: item.precoUnitarioCentavos,
                  },
                  quantity: item.quantidade,
              }))
            : [
                  {
                      price_data: {
                          currency: "brl",
                          product_data: { name: pedido.produtoNome },
                          unit_amount: amountInCents,
                      },
                      quantity: 1,
                  },
              ];

    const stripe = new Stripe(stripeSecretKey, {
        apiVersion: "2026-05-27.dahlia",
    });
    const appBaseUrl = getAppBaseUrl(request);

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            client_reference_id: String(pedido.id),
            customer_email: pedido.emailCliente || undefined,
            success_url: `${appBaseUrl}/pedido-sucesso?id=${pedido.id}`,
            cancel_url: `${appBaseUrl}${cancelPath}`,
            metadata: {
                pedidoId: String(pedido.id),
                expectedAmount: String(amountInCents),
            },
        });

        if (!session.url) {
            return NextResponse.json(
                { error: "A operadora não retornou o link de pagamento." },
                { status: 502 }
            );
        }

        return NextResponse.json({ url: session.url });
    } catch {
        return NextResponse.json(
            { error: "Falha ao iniciar o pagamento. Seu pedido foi salvo; tente novamente." },
            { status: 502 }
        );
    }
}
