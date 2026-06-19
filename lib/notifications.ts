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
    dataPedido: string;
    horaPedido: string;
};

function buildOrderLines(pedido: PedidoNotificationData, title: string) {
    return [
        `${title} #${pedido.id}`,
        `Cliente: ${pedido.cliente}`,
        `WhatsApp: ${pedido.whatsapp}`,
        `Produto: ${pedido.produtoNome}`,
        `Quantidade: ${pedido.quantidade}`,
        `Valor total: ${pedido.valorTotal}`,
        `Pagamento: ${pedido.metodoPagamento} (${pedido.statusPagamento})`,
        `Pedido: ${pedido.statusPedido}`,
        `Entrega: ${pedido.statusEntrega}`,
        `Data/Hora: ${pedido.dataPedido} ${pedido.horaPedido}`,
    ];
}

function normalizePhone(phone: string) {
    return phone.replace(/\D/g, "");
}

async function sendEmailNotification(pedido: PedidoNotificationData) {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || "587");
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const companyEmail = process.env.COMPANY_EMAIL || "janierstivenrodrigueslondono@gmail.com";

    if (!smtpHost || !smtpUser || !smtpPass) {
        return;
    }

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

    const lines = buildOrderLines(pedido, "Novo pedido criado");

    const recipients = [companyEmail, pedido.emailCliente].filter(Boolean).join(",");

    await transporter.sendMail({
        from: `Bella Fashion <${smtpUser}>`,
        to: recipients,
        subject: `Novo pedido Bella Fashion #${pedido.id}`,
        text: lines.join("\n"),
    });
}

async function sendWhatsAppNotification(pedido: PedidoNotificationData) {
    const token = process.env.WHATSAPP_CLOUD_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const companyWhatsapp = normalizePhone(
        process.env.COMPANY_WHATSAPP || "11940625832"
    );

    if (!token || !phoneNumberId || !companyWhatsapp) {
        return;
    }

    const message = [
        `Novo pedido #${pedido.id}`,
        `Cliente: ${pedido.cliente}`,
        `WhatsApp: ${pedido.whatsapp}`,
        `Produto: ${pedido.produtoNome}`,
        `Qtd: ${pedido.quantidade}`,
        `Total: ${pedido.valorTotal}`,
        `Pagamento: ${pedido.metodoPagamento} (${pedido.statusPagamento})`,
    ].join("\n");

    await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            messaging_product: "whatsapp",
            to: `55${companyWhatsapp}`,
            type: "text",
            text: {
                body: message,
            },
        }),
    });
}

export async function sendOrderCreatedNotifications(pedido: PedidoNotificationData) {
    await Promise.allSettled([
        sendEmailNotification(pedido),
        sendWhatsAppNotification(pedido),
    ]);
}

async function sendPaymentConfirmedEmail(pedido: PedidoNotificationData) {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || "587");
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const companyEmail = process.env.COMPANY_EMAIL || "janierstivenrodrigueslondono@gmail.com";

    if (!smtpHost || !smtpUser || !smtpPass) {
        return;
    }

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

    const lines = buildOrderLines(pedido, "Pagamento confirmado");
    const recipients = [companyEmail, pedido.emailCliente].filter(Boolean).join(",");

    await transporter.sendMail({
        from: `Bella Fashion <${smtpUser}>`,
        to: recipients,
        subject: `Pagamento confirmado Bella Fashion #${pedido.id}`,
        text: lines.join("\n"),
    });
}

async function sendPaymentConfirmedWhatsApp(pedido: PedidoNotificationData) {
    const token = process.env.WHATSAPP_CLOUD_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const companyWhatsapp = normalizePhone(
        process.env.COMPANY_WHATSAPP || "11940625832"
    );

    if (!token || !phoneNumberId || !companyWhatsapp) {
        return;
    }

    const message = [
        `Pagamento confirmado #${pedido.id}`,
        `Cliente: ${pedido.cliente}`,
        `Produto: ${pedido.produtoNome}`,
        `Total: ${pedido.valorTotal}`,
        `Status: ${pedido.statusPagamento}`,
    ].join("\n");

    await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            messaging_product: "whatsapp",
            to: `55${companyWhatsapp}`,
            type: "text",
            text: {
                body: message,
            },
        }),
    });
}

export async function sendPaymentConfirmedNotifications(pedido: PedidoNotificationData) {
    await Promise.allSettled([
        sendPaymentConfirmedEmail(pedido),
        sendPaymentConfirmedWhatsApp(pedido),
    ]);
}
