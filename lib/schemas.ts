import { z } from "zod";

const whatsappRegex = /^\d{10,15}$/;
const paymentMethodSchema = z.enum(["Pix", "Transferência", "Cartão", "Boleto"]);

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

export const produtoSchema = z.object({
    nome: z.string().min(1, "Informe o nome do produto."),
    imagem: persistedImageSchema,
    preco: z.string().min(1, "Informe o preço do produto."),
    destaque: z.string().min(1, "Informe o destaque do produto."),
    descricao: z.string().min(1, "Informe a descrição do produto."),
    status: z.string().min(1, "Informe o status do produto."),
    categoria: z.string().min(1, "Informe a categoria do produto."),
    estoque: z.number().int().min(0, "O estoque deve ser um número inteiro igual ou maior que zero."),
});

export const produtoUpdateSchema = produtoSchema.partial();

export const pedidoCreateSchema = z.object({
    cliente: z.string().min(1, "Informe o nome do cliente."),
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
        .string()
        .optional()
        .transform((value) => (value?.trim() ? value : undefined)),
    produtoId: z.number().int().positive(),
    quantidade: z.number().int().positive(),
    valorTotal: z.string().min(1, "Informe o valor total do pedido."),
    metodoPagamento: paymentMethodSchema.default("Pix"),
    statusPagamento: z.string().default("Aguardando pagamento"),
    statusPedido: z.string().default("Pedido recebido"),
    statusEntrega: z.string().default("Aguardando envio"),
    observacoes: z
        .string()
        .optional()
        .transform((value) => (value?.trim() ? value : undefined)),
});

export const pedidoUpdateSchema = z.object({
    cliente: z.string().min(1, "Informe o nome do cliente.").optional(),
    whatsapp: z
        .string()
        .transform((value) => value.replace(/\D/g, ""))
        .optional()
        .refine((value) => !value || whatsappRegex.test(value), {
            message: "WhatsApp inválido. Use apenas números com DDD.",
        }),
    emailCliente: z.string().email("E-mail inválido.").optional(),
    enderecoEntrega: z.string().optional(),
    produtoId: z.number().int().positive().optional(),
    quantidade: z.number().int().positive().optional(),
    metodoPagamento: paymentMethodSchema.optional(),
    statusPagamento: z.string().optional(),
    statusPedido: z.string().optional(),
    codigoRastreio: z.string().optional(),
    statusEntrega: z.string().optional(),
    observacoes: z.string().optional(),
});

const optionalTrimmedString = z
    .string()
    .optional()
    .transform((value) => {
        const normalized = value?.trim();
        return normalized ? normalized : undefined;
    });

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
});

export type PedidoCreateInput = z.infer<typeof pedidoCreateSchema>;
export type PedidoUpdateInput = z.infer<typeof pedidoUpdateSchema>;
