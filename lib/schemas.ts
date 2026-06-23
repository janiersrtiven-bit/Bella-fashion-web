import { z } from "zod";

const whatsappRegex = /^\d{10,15}$/;
const paymentMethodSchema = z.enum(["Pix", "Transferência", "Cartão", "Boleto"]);
const productStatusSchema = z.enum(["Ativo", "Inativo"]);
const productHighlightSchema = z.enum(["Novo", "Mais vendido", "Exclusivo", "Promoção"]);

function hasPositivePrice(value: string) {
    const normalized = value
        .replace(/[^\d,.-]/g, "")
        .replace(/\./g, "")
        .replace(",", ".");
    return Number.parseFloat(normalized) > 0;
}

function isTempImageUrl(value: string) {
    const normalized = value.trim().toLowerCase();
    return normalized.startsWith("blob:") || normalized.startsWith("data:");
}

const persistedImageSchema = z
    .string()
    .min(1, "Informe o URL da imagem.")
    .refine((value) => !isTempImageUrl(value), {
        message: "A imagem deve ser URL persistente. blob: e data: não são permitidos.",
    });

const productVariantSchema = z.object({
    tamanho: z.string().trim().min(1, "Informe o tamanho.").max(40),
    cor: z.string().trim().min(1, "Informe a cor.").max(60),
    sku: z.string().trim().max(80).optional().or(z.literal("")),
    estoque: z.number().int().min(0).max(100000),
    ativo: z.boolean().default(true),
});

export const produtoSchema = z.object({
    nome: z.string().trim().min(2, "Informe o nome do produto.").max(120),
    imagem: persistedImageSchema,
    preco: z.string().min(1, "Informe o preço do produto.").refine(hasPositivePrice, "Informe um preço maior que zero."),
    destaque: productHighlightSchema,
    descricao: z.string().trim().min(5, "Informe uma descrição mais completa.").max(1000),
    status: productStatusSchema,
    categoria: z.string().trim().min(2, "Informe a categoria do produto.").max(80),
    estoque: z.number().int().min(0, "O estoque deve ser um número inteiro igual ou maior que zero.").max(100000),
    imagens: z.array(persistedImageSchema).max(8).optional(),
    variantes: z.array(productVariantSchema).max(100).optional(),
});

export const produtoUpdateSchema = produtoSchema.partial();

const pedidoItemSchema = z.object({
    produtoId: z.number().int().positive(),
    varianteId: z.number().int().positive().nullable().optional(),
    quantidade: z.number().int().min(1).max(1000),
});

export const pedidoCreateSchema = z.object({
    cliente: z.string().trim().min(2, "Informe o nome do cliente.").max(120),
    whatsapp: z
        .string()
        .transform((value) => value.replace(/\D/g, ""))
        .refine((value) => whatsappRegex.test(value), {
            message: "WhatsApp inválido. Use apenas números com DDD.",
        }),
    emailCliente: z
        .string()
        .email("E-mail inválido.")
        .optional()
        .or(z.literal(""))
        .transform((value) => (value === "" ? undefined : value)),
    enderecoEntrega: z
        .string().max(500)
        .optional()
        .transform((value) => (value?.trim() ? value : undefined)),
    produtoId: z.number().int().positive().optional(),
    quantidade: z.number().int().positive().optional(),
    valorTotal: z.string().min(1, "Informe o valor total do pedido.").max(40).optional(),
    itens: z.array(pedidoItemSchema).min(1).optional(),
    metodoPagamento: paymentMethodSchema.default("Pix"),
    statusPagamento: z.string().default("Aguardando pagamento"),
    statusPedido: z.string().default("Pedido recebido"),
    statusEntrega: z.string().default("Aguardando envio"),
    observacoes: z
        .string().max(500)
        .optional()
        .transform((value) => (value?.trim() ? value : undefined)),
}).superRefine((data, ctx) => {
    const hasItems = Array.isArray(data.itens) && data.itens.length > 0;
    const hasLegacy = data.produtoId != null || data.quantidade != null;

    if (!hasItems && !hasLegacy) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Informe produtoId/quantidade ou itens para criar o pedido.",
        });
        return;
    }

    if (hasItems) {
        return;
    }

    if (data.produtoId == null) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Informe o produtoId.",
        });
    }

    if (data.quantidade == null) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Informe a quantidade.",
        });
    }

    if (!data.valorTotal) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Informe o valor total do pedido.",
        });
    }
});

export const pedidoUpdateSchema = z.object({
    cliente: z.string().trim().min(2, "Informe o nome do cliente.").max(120).optional(),
    whatsapp: z
        .string()
        .transform((value) => value.replace(/\D/g, ""))
        .optional()
        .refine((value) => !value || whatsappRegex.test(value), {
            message: "WhatsApp inválido. Use apenas números com DDD.",
        }),
    emailCliente: z.string().email("E-mail inválido.").optional().or(z.literal("")),
    enderecoEntrega: z.string().max(500).optional(),
    produtoId: z.number().int().positive().optional(),
    quantidade: z.number().int().positive().optional(),
    metodoPagamento: paymentMethodSchema.optional(),
    statusPagamento: z.enum(["Aguardando pagamento", "Pago", "Reembolsado"]).optional(),
    statusPedido: z.enum(["Pedido recebido", "Pagamento confirmado", "Em preparação", "Enviado", "Entregue", "Cancelado"]).optional(),
    codigoRastreio: z.string().max(100).optional(),
    statusEntrega: z.enum(["Aguardando envio", "Em transporte", "Saiu para entrega", "Entregue"]).optional(),
    observacoes: z.string().max(500).optional(),
});

const optionalTrimmedString = z
    .string().max(500)
    .optional()
    .transform((value) => {
        const normalized = value?.trim();
        return normalized ? normalized : undefined;
    });

const optionalLongText = z
    .string()
    .max(12000, "O texto excede o limite permitido.")
    .optional()
    .transform((value) => value?.trim() || undefined);

const optionalHttpsUrl = z
    .string()
    .max(500)
    .optional()
    .transform((value) => value?.trim() || undefined)
    .refine((value) => !value || /^https:\/\//i.test(value), "Use uma URL segura iniciada por https://.");

export const siteConfigSchema = z.object({
    heroImagem: optionalTrimmedString.refine(
        (value) => !value || !isTempImageUrl(value),
        "A imagem do Hero deve ser URL persistente. blob: e data: não são permitidos."
    ),
    heroTitulo: optionalTrimmedString,
    heroSubtitulo: optionalTrimmedString,
    heroMaterial: optionalTrimmedString,
    heroPrecoDestaque: optionalTrimmedString,
    heroWhatsappTexto: optionalTrimmedString,
    heroWhatsappNumero: optionalTrimmedString.refine(
        (value) => !value || /^\d{10,15}$/.test(value.replace(/\D/g, "")),
        "WhatsApp inválido. Use apenas números com DDD."
    ),
    avisoTopo: optionalTrimmedString,
    instagramUrl: optionalHttpsUrl.refine(
        (value) => !value || /(^|\.)instagram\.com\//i.test(value),
        "Informe um perfil válido do Instagram."
    ),
    emailContato: z.string().email("E-mail de contato inválido.").optional().or(z.literal("")),
    whatsappContato: optionalTrimmedString.refine(
        (value) => !value || /^\d{10,15}$/.test(value.replace(/\D/g, "")),
        "WhatsApp de contato inválido."
    ),
    sobreTexto: optionalLongText,
    enviosTexto: optionalLongText,
    trocasTexto: optionalLongText,
    privacidadeTexto: optionalLongText,
    termosTexto: optionalLongText,
    instrucoesPix: optionalLongText,
    freteFixoCentavos: z.number().int().min(0).max(10_000_000).default(0),
});

export const checkoutPedidoSchema = z.object({
    cliente: z.string().trim().min(2, "Informe o nome completo.").max(120),
    whatsapp: z.string().transform((value) => value.replace(/\D/g, "")).refine((value) => whatsappRegex.test(value), "WhatsApp inválido."),
    emailCliente: z.string().trim().email("E-mail inválido.").max(200),
    enderecoEntrega: z.string().trim().min(12, "Informe o endereço completo e CEP.").max(500),
    observacoes: z.string().trim().max(500).optional().transform((value) => value || undefined),
    metodoPagamento: z.enum(["Pix", "Cartão"]),
    itens: z.array(z.object({
        produtoId: z.number().int().positive(),
        varianteId: z.number().int().positive().nullable().optional(),
        quantidade: z.number().int().min(1).max(10),
    })).min(1, "Sua sacola está vazia.").max(30),
    aceitouTermos: z.literal(true, { errorMap: () => ({ message: "Aceite os termos para continuar." }) }),
});

export const clienteCadastroSchema = z.object({
    nome: z.string().trim().min(2).max(120),
    email: z.string().trim().email("E-mail inválido.").max(200).transform((value) => value.toLowerCase()),
    whatsapp: z.string().transform((value) => value.replace(/\D/g, "")).refine((value) => whatsappRegex.test(value), "WhatsApp inválido."),
    password: z.string().min(8, "Use uma senha com pelo menos 8 caracteres.").max(128),
    endereco: z.string().trim().max(500).optional().transform((value) => value || undefined),
});

export const clienteLoginSchema = z.object({
    email: z.string().trim().email("E-mail inválido.").transform((value) => value.toLowerCase()),
    password: z.string().min(1).max(128),
});

export const clienteUpdateSchema = z.object({
    nome: z.string().trim().min(2).max(120),
    whatsapp: z.string().transform((value) => value.replace(/\D/g, "")).refine((value) => whatsappRegex.test(value), "WhatsApp inválido."),
    endereco: z.string().trim().max(500).optional().transform((value) => value || undefined),
});

export type PedidoCreateInput = z.infer<typeof pedidoCreateSchema>;
export type PedidoUpdateInput = z.infer<typeof pedidoUpdateSchema>;
