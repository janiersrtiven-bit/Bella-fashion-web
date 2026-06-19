import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { sendPaymentConfirmedNotifications } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeSecretKey || !webhookSecret) {
        return NextResponse.json(
            { error: "Stripe webhook is not configured." },
            { status: 500 }
        );
    }

    const stripe = new Stripe(stripeSecretKey, {
        apiVersion: "2026-05-27.dahlia",
    });

    const signature = request.headers.get("stripe-signature");
    if (!signature) {
        return NextResponse.json({ error: "Missing stripe signature." }, { status: 400 });
    }

    const payload = await request.text();

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch {
        return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const pedidoId = Number(session.metadata?.pedidoId);

        if (pedidoId) {
            const pedidoAtual = await prisma.pedido.findUnique({
                where: { id: pedidoId },
            });

            if (pedidoAtual && pedidoAtual.statusPagamento !== "Pago") {
                const updatedPedido = await prisma.pedido.update({
                    where: { id: pedidoId },
                    data: {
                        statusPagamento: "Pago",
                        statusPedido: "Pagamento confirmado",
                    },
                });

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
    }

    return NextResponse.json({ received: true });
}
