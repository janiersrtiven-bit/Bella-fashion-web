import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
        return NextResponse.json(
            { error: "Stripe secret key is not configured." },
            { status: 500 }
        );
    }

    const stripe = new Stripe(stripeSecretKey, {
        apiVersion: "2026-05-27.dahlia",
    });

    const { amount, productName, whatsapp, cliente, pedidoId, cancelPath } = await request.json();

    const amountInCents = Number(amount);
    const safeProductName = typeof productName === "string" ? productName.trim() : "";
    const safeWhatsapp = typeof whatsapp === "string" ? whatsapp.replace(/\D/g, "") : "";
    const safeCliente = typeof cliente === "string" ? cliente.trim() : "";
    const safePedidoId = Number(pedidoId);
    const safeCancelPath =
        typeof cancelPath === "string" && cancelPath.startsWith("/") && !cancelPath.startsWith("//")
            ? cancelPath
            : "/";

    if (
        !Number.isInteger(amountInCents) ||
        amountInCents <= 0 ||
        !safeProductName ||
        !/^\d{10,15}$/.test(safeWhatsapp) ||
        !safeCliente ||
        !Number.isInteger(safePedidoId) ||
        safePedidoId <= 0
    ) {
        return NextResponse.json(
            { error: "Dados incompletos para criar checkout." },
            { status: 400 }
        );
    }

    const lineItems = [
        {
            price_data: {
                currency: "brl",
                product_data: {
                    name: safeProductName,
                },
                unit_amount: amountInCents,
            },
            quantity: 1,
        },
    ];

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pedido-sucesso?id=${safePedidoId}&status=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${safeCancelPath}`,
            metadata: {
                cliente: safeCliente,
                whatsapp: safeWhatsapp,
                pedidoId: String(safePedidoId),
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        return NextResponse.json(
            { error: "Falha ao criar sessão de pagamento." },
            { status: 500 }
        );
    }
}
