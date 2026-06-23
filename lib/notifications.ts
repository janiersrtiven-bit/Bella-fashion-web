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

function buildOrderHtml(pedido: PedidoNotificationData, event: NotificationEvent) {
    const lines = buildOrderLines(pedido, event);
    return `
        <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color: #111;">
            <h2>${EVENT_TITLES[event]} — Pedido #${pedido.id}</h2>
            <table cellpadding="6" cellspacing="0" border="0" style="border-collapse: collapse;">
                ${lines
            .map((line) => `<tr><td style="vertical-align: top; font-weight: 600;">${line.split(':')[0]}:</td><td style="padding-left: 12px;">${line.split(':').slice(1).join(':')}</td></tr>`)
            .join('')}
            </table>
        </body>
        </html>
    `;
}

async function sendEmailNotification(pedido: PedidoNotificationData, event: NotificationEvent) {
    if (!notificationsEnabled()) return;

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || "587");
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const companyEmail = process.env.COMPANY_EMAIL;
    const recipients = [companyEmail, pedido.emailCliente].filter(Boolean).join(",");
    if (!recipients) return;

    const nodemailer = await import("nodemailer");
    let transporter: any;
    let isTestAccount = false;
    let fromAddress = `Bella Fashion <${smtpUser ?? "no-reply@example.com"}>`;

    if (smtpHost && smtpUser && smtpPass) {
        transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });
    } else if (process.env.NODE_ENV !== "production") {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        isTestAccount = true;
        fromAddress = `Bella Fashion <${testAccount.user}>`;
        console.info("Usando cuenta de prueba Ethereal para correo en entorno de desarrollo.");
    } else {
        console.info("Email não enviado: credenciais SMTP ausentes em produção.");
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: fromAddress,
            to: recipients,
            subject: `${EVENT_TITLES[event]} Bella Fashion #${pedido.id}`,
            text: buildOrderLines(pedido, event).join("\n"),
            html: buildOrderHtml(pedido, event),
        });

        if (isTestAccount && info.messageId) {
            const previewUrl = nodemailer.getTestMessageUrl(info);
            console.info(`Email de prueba enviado: event=${event} pedido=${pedido.id} previewUrl=${previewUrl}`);
        } else {
            console.info(`Email enviado: event=${event} pedido=${pedido.id} messageId=${info.messageId}`);
        }
    } catch (err) {
        console.error(`Falha ao enviar email: event=${event} pedido=${pedido.id}`, err);
    }
}

function isPlaceholderValue(value: string | undefined) {
    if (!value) return true;
    const normalized = value.trim().toLowerCase();
    return ["cole_aqui", "your", "token", "phone_number_id", "change_this", "example"].some((keyword) => normalized.includes(keyword));
}

async function sendWhatsAppText(to: string, message: string) {
    if (!notificationsEnabled()) return;

    const token = process.env.WHATSAPP_CLOUD_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const normalizedTo = normalizePhone(to);

    if (!token || !phoneNumberId || !normalizedTo) {
        console.info("WhatsApp não enviado: faltam credenciais ou número de destino.", {
            token: Boolean(token),
            phoneNumberId: Boolean(phoneNumberId),
            to: normalizedTo,
        });
        return;
    }

    if (isPlaceholderValue(token) || isPlaceholderValue(phoneNumberId)) {
        console.info("WhatsApp não enviado: credenciais parecem ser de exemplo/placeholder.", {
            token: token.slice(0, 8) + "...",
            phoneNumberId,
        });
        return;
    }

    try {
        const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to: normalizedTo.startsWith("55") ? normalizedTo : `55${normalizedTo}`,
                type: "text",
                text: { body: message },
            }),
        });
        if (!res.ok) {
            const text = await res.text().catch(() => "");
            console.error(`WhatsApp API error: to=${normalizedTo} status=${res.status} body=${text}`);
        } else {
            console.info(`WhatsApp enviado: to=${normalizedTo}`);
        }
    } catch (err) {
        console.error(`Falha ao enviar WhatsApp para ${normalizedTo}`, err);
    }
}

async function sendWhatsAppNotification(pedido: PedidoNotificationData, event: NotificationEvent) {
    if (!notificationsEnabled()) return;

    const message = buildOrderLines(pedido, event).join("\n");
    const companyWhatsapp = process.env.COMPANY_WHATSAPP;
    const tasks = [companyWhatsapp ? sendWhatsAppText(companyWhatsapp, message) : Promise.resolve()];
    if (pedido.whatsapp) tasks.push(sendWhatsAppText(pedido.whatsapp, message));

    const results = await Promise.allSettled(tasks);
    console.info(`WhatsApp notifications result: pedido=${pedido.id}`, results.map((r) => r.status));
}

async function sendNotification(pedido: PedidoNotificationData, event: NotificationEvent) {
    console.info(`Iniciando envios de notificação: event=${event} pedido=${pedido.id}`);
    await Promise.allSettled([sendEmailNotification(pedido, event), sendWhatsAppNotification(pedido, event)]);
    console.info(`Notificações disparadas: event=${event} pedido=${pedido.id}`);
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
