import type { Produto } from "@/lib/produtos";

export type Pedido = {
    id: number;
    cliente: string;
    whatsapp: string;
    emailCliente?: string;
    enderecoEntrega?: string;
    produtoId: number;
    produtoNome: string;
    quantidade: number;
    valorTotal: string;
    metodoPagamento?: string;
    statusPagamento?: string;
    statusPedido?: string;
    status?: string;
    codigoRastreio?: string;
    statusEntrega?: string;
    observacoes?: string;
    dataPedido: string;
    horaPedido: string;
};

const produtosKey = "bella-fashion-produtos";
const pedidosKey = "bella-fashion-pedidos";

export function getProdutos(): Produto[] {
    if (typeof window === "undefined") {
        return [];
    }

    const produtosSalvos = window.localStorage.getItem(produtosKey);

    if (!produtosSalvos) {
        return [];
    }

    try {
        const produtos = JSON.parse(produtosSalvos) as Produto[];
        return Array.isArray(produtos) ? produtos : [];
    } catch {
        return [];
    }
}

export function getProdutoById(id: number): Produto | undefined {
    return getProdutos().find((produto) => produto.id === id);
}

export function updateProdutoEstoque(id: number, novaQuantidade: number) {
    if (typeof window === "undefined") return;

    const produtos = getProdutos().map((produto) =>
        produto.id === id ? { ...produto, estoque: novaQuantidade } : produto
    );

    saveProdutos(produtos);
}

export function saveProdutos(produtos: Produto[]) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(produtosKey, JSON.stringify(produtos));
}

export function getPedidos(): Pedido[] {
    if (typeof window === "undefined") {
        return [];
    }

    const pedidosSalvos = window.localStorage.getItem(pedidosKey);

    if (!pedidosSalvos) {
        return [];
    }

    try {
        return JSON.parse(pedidosSalvos) as Pedido[];
    } catch {
        return [];
    }
}

export function savePedidos(pedidos: Pedido[]) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(pedidosKey, JSON.stringify(pedidos));
}

export function getPedidoById(id: number): Pedido | undefined {
    return getPedidos().find((pedido) => pedido.id === id);
}

export function addPedido(pedido: Pedido) {
    if (typeof window === "undefined") return;
    const pedidos = getPedidos();
    savePedidos([...pedidos, pedido]);
}
