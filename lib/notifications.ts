type PedidoNotificationData = {
    id: number;
    cliente: string;
    whatsapp: string;
    emailCliente?: string | null;
    produtoNome: string;
    quantidade: number;
    valorTotal: string;
    metodoPagamento: string;
    statusPagamento: string;
    statusPedido: string;
    statusEntrega: string;
    codigoRastreio?: string | null;
    dataPedido: string;
    horaPedido: string;
};

type NotificationEvent = "created" | "payment_confirmed" | "shipped" | "delivered";

const EVENT_TITLES: Record<NotificationEvent, string> = {
    created: "Pedido recebido",
    payment_confirmed: "Pagamento confirmado",
    shipped: "Pedido enviado",
    delivered: "Pedido entregue",
};

function notificationsEnabled() {
    return process.env.NODE_ENV === "production" || process.env.ENABLE_DEV_NOTIFICATIONS === "true";
}

function normalizePhone(phone: string) {
    return phone.replace(/\D/g, "");
}

function buildOrderLines(pedido: PedidoNotificationData, event: NotificationEvent) {
    const lines = [
        `${EVENT_TITLES[event]} #${pedido.id}`,
        `Cliente: ${pedido.cliente}`,
        `WhatsApp: ${pedido.whatsapp}`,
        `Produto(s): ${pedido.produtoNome}`,
        `Quantidade: ${pedido.quantidade}`,
        `Valor total: ${pedido.valorTotal}`,
        `Pagamento: ${pedido.metodoPagamento} (${pedido.statusPagamento})`,
        `Pedido: ${pedido.statusPedido}`,
        `Entrega: ${pedido.statusEntrega}`,
        `Data/Hora: ${pedido.dataPedido} ${pedido.horaPedido}`,
    ];

    if (pedido.codigoRastreio) {
        lines.push(`Rastreio: ${pedido.codigoRastreio}`);
    }

    return lines;
}

async function sendEmailNotification(pedido: PedidoNotificationData, event: NotificationEvent) {
    if (!notificationsEnabled()) return;

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || "587");
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const companyEmail = process.env.COMPANY_EMAIL;

    if (!smtpHost || !smtpUser || !smtpPass) {
        return;
    }

    const recipients = [companyEmail, pedido.emailCliente].filter(Boolean).join(",");
    if (!recipients) return;

    const nodemailer = await import("nodemailer");

    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    });

    await transporter.sendMail({
        from: `Bella Fashion <${smtpUser}>`,
        to: recipients,
        subject: `${EVENT_TITLES[event]} Bella Fashion #${pedido.id}`,
        text: buildOrderLines(pedido, event).join("\n"),
    });
}

async function sendWhatsAppText(to: string, message: string) {
    if (!notificationsEnabled()) return;

    const token = process.env.WHATSAPP_CLOUD_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const normalizedTo = normalizePhone(to);

    if (!token || !phoneNumberId || !normalizedTo) {
        return;
    }

    await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            messaging_product: "whatsapp",
            to: normalizedTo.startsWith("55") ? normalizedTo : `55${normalizedTo}`,
            type: "text",
            text: {
                body: message,
            },
        }),
    });
}

async function sendWhatsAppNotification(pedido: PedidoNotificationData, event: NotificationEvent) {
    if (!notificationsEnabled()) return;

    const message = buildOrderLines(pedido, event).join("\n");
    const companyWhatsapp = process.env.COMPANY_WHATSAPP;

    await Promise.allSettled([
        companyWhatsapp ? sendWhatsAppText(companyWhatsapp, message) : Promise.resolve(),
        pedido.whatsapp ? sendWhatsAppText(pedido.whatsapp, message) : Promise.resolve(),
    ]);
}

async function sendNotification(pedido: PedidoNotificationData, event: NotificationEvent) {
    await Promise.allSettled([
        sendEmailNotification(pedido, event),
        sendWhatsAppNotification(pedido, event),
    ]);
}

export async function sendOrderCreatedNotifications(pedido: PedidoNotificationData) {
    await sendNotification(pedido, "created");
}

export async function sendPaymentConfirmedNotifications(pedido: PedidoNotificationData) {
    await sendNotification(pedido, "payment_confirmed");
}

export async function sendOrderShippedNotifications(pedido: PedidoNotificationData) {
    await sendNotification(pedido, "shipped");
}

export async function sendOrderDeliveredNotifications(pedido: PedidoNotificationData) {
    await sendNotification(pedido, "delivered");
}
