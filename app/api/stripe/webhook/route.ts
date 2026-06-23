import { NextResponse } from "next/server";
import Stripe from "stripe";
import { parsePriceToCents, prisma } from "@/lib/db";
import { sendPaymentConfirmedNotifications } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeSecretKey || !webhookSecret) {
        return NextResponse.json(
            { error: "Stripe webhook is not configured." },
            { status: 503 }
        );
    }

    const signature = request.headers.get("stripe-signature");
    if (!signature) {
        return NextResponse.json({ error: "Missing stripe signature." }, { status: 400 });
    }

    const stripe = new Stripe(stripeSecretKey, {
        apiVersion: "2026-05-27.dahlia",
    });

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(
            await request.text(),
            signature,
            webhookSecret
        );
    } catch {
        return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
    }

    const isSuccessfulCheckout =
        event.type === "checkout.session.completed" ||
        event.type === "checkout.session.async_payment_succeeded";

    if (!isSuccessfulCheckout) {
        return NextResponse.json({ received: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const pedidoId = Number(session.metadata?.pedidoId);
    const paymentIntentId =
        typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;

    if (!Number.isInteger(pedidoId) || pedidoId <= 0 || session.payment_status !== "paid") {
        return NextResponse.json({ received: true });
    }

    const pedidoAtual = await prisma.pedido.findUnique({ where: { id: pedidoId } });
    if (!pedidoAtual) {
        return NextResponse.json({ received: true });
    }

    const expectedAmount =
        typeof pedidoAtual.totalCentavos === "number" && pedidoAtual.totalCentavos > 0
            ? pedidoAtual.totalCentavos
            : parsePriceToCents(pedidoAtual.valorTotal);
    if (
        session.currency?.toLowerCase() !== "brl" ||
        session.amount_total !== expectedAmount ||
        session.client_reference_id !== String(pedidoId)
    ) {
        return NextResponse.json({ error: "Payment amount mismatch." }, { status: 400 });
    }

    const update = await prisma.pedido.updateMany({
        where: { id: pedidoId, statusPagamento: { not: "Pago" } },
        data: {
            statusPagamento: "Pago",
            statusPedido: "Pagamento confirmado",
            estoqueReservado: false,
            expiresAt: null,
            stripeSessionId: session.id,
            ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
        },
    });

    if (update.count === 1) {
        const updatedPedido = await prisma.pedido.findUnique({ where: { id: pedidoId } });

        if (updatedPedido) {
            void sendPaymentConfirmedNotifications({
                id: updatedPedido.id,
                cliente: updatedPedido.cliente,
                whatsapp: updatedPedido.whatsapp,
                emailCliente: updatedPedido.emailCliente,
                produtoNome: updatedPedido.produtoNome,
                quantidade: updatedPedido.quantidade,
                valorTotal: updatedPedido.valorTotal,
                metodoPagamento: updatedPedido.metodoPagamento,
                statusPagamento: updatedPedido.statusPagamento,
                statusPedido: updatedPedido.statusPedido,
                statusEntrega: updatedPedido.statusEntrega,
                dataPedido: updatedPedido.dataPedido,
                horaPedido: updatedPedido.horaPedido,
            });
        }
    }

    return NextResponse.json({ received: true });
}
