"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ToastView, useToast } from "@/components/ui/toast";

type Produto = {
  id: number;
  nome: string;
  preco: string;
  status: string;
  estoque: number;
};

function precoParaNumero(preco: string) {
  const valorLimpo = preco
    .replace("R$", "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const numero = Number(valorLimpo);
  return Number.isNaN(numero) ? 0 : numero;
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function NovoPedidoPage() {
  const router = useRouter();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [cliente, setCliente] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [emailCliente, setEmailCliente] = useState("");
  const [enderecoEntrega, setEnderecoEntrega] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState("1");

  const [metodoPagamento, setMetodoPagamento] = useState("Pix");
  const [statusPagamento, setStatusPagamento] = useState("Aguardando pagamento");
  const [statusPedido, setStatusPedido] = useState("Pedido recebido");
  const [codigoRastreio, setCodigoRastreio] = useState("");
  const [statusEntrega, setStatusEntrega] = useState("Aguardando envio");
  const [observacoes, setObservacoes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const { toast, showToast, clearToast } = useToast();

  useEffect(() => {
    setIsLoadingProducts(true);
    setErrorMessage(null);

    fetch("/api/produtos")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("No se pudieron cargar los productos.");
        }
        return response.json();
      })
      .then((data: Produto[]) => {
        setProdutos(
          data.filter(
            (produto) => produto.status === "Ativo" && (produto.estoque || 0) > 0
          )
        );
      })
      .catch(() => {
        setProdutos([]);
        setErrorMessage("Não foi possível carregar os produtos.");
      })
      .finally(() => setIsLoadingProducts(false));
  }, []);

  const produtoSelecionado = produtos.find(
    (produto) => produto.id === Number(produtoId)
  );

  const quantidadeNumero = Number(quantidade);

  const valorUnitario = produtoSelecionado
    ? precoParaNumero(produtoSelecionado.preco)
    : 0;

  const valorTotal =
    produtoSelecionado && quantidadeNumero > 0
      ? valorUnitario * quantidadeNumero
      : 0;

  async function handleSave() {
    const whatsappLimpo = whatsapp.replace(/\D/g, "");

    if (!cliente.trim()) {
      showToast("Preencha o nome do cliente.", "error");
      return;
    }

    if (whatsappLimpo.length < 10) {
      showToast("Preencha um WhatsApp válido.", "error");
      return;
    }

    if (!produtoSelecionado) {
      showToast("Selecione um produto.", "error");
      return;
    }

    if (!Number.isInteger(quantidadeNumero) || quantidadeNumero <= 0) {
      showToast("Preencha uma quantidade válida.", "error");
      return;
    }

    if (quantidadeNumero > produtoSelecionado.estoque) {
      showToast("Quantidade maior que o estoque disponível.", "error");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/pedidos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cliente: cliente.trim(),
          whatsapp: whatsappLimpo,
          emailCliente: emailCliente.trim() || undefined,
          enderecoEntrega: enderecoEntrega.trim() || undefined,
          produtoId: produtoSelecionado.id,
          quantidade: quantidadeNumero,
          valorTotal: formatarMoeda(valorTotal),
          metodoPagamento,
          statusPagamento,
          statusPedido,
          statusEntrega,
          observacoes: observacoes.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        const message = data.error || "No se pudo guardar el pedido.";
        setErrorMessage(message);
        showToast(message, "error");
        setIsSubmitting(false);
        return;
      }

      showToast("Pedido salvo com sucesso!", "success");
      router.push("/admin/pedidos");
    } catch {
      const message = "No se pudo conectar con el servidor.";
      setErrorMessage(message);
      showToast(message, "error");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-purple-50 p-6">
      <ToastView toast={toast} onClose={clearToast} />
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-500">
              Novo Pedido
            </p>

            <h1 className="mt-2 text-4xl font-bold text-purple-950">
              Registrar Pedido
            </h1>

            <p className="mt-3 text-gray-600">
              Cadastre um novo pedido, pagamento, entrega e estoque.
            </p>
            {isLoadingProducts && <p className="mt-2 text-sm text-purple-700">Carregando produtos...</p>}
            {errorMessage && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}
          </div>

          <a
            href="/admin/pedidos"
            className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-purple-900 shadow-sm transition hover:bg-purple-100"
          >
            Voltar para pedidos
          </a>
        </div>

        <form className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-purple-950">
                Cliente
              </label>
              <input
                type="text"
                value={cliente}
                onChange={(event) => setCliente(event.target.value)}
                placeholder="Nome do cliente"
                className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none focus:border-purple-700"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-purple-950">
                WhatsApp
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(event) => setWhatsapp(event.target.value)}
                placeholder="Ex: 11940625832"
                className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none focus:border-purple-700"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-purple-950">
                E-mail do cliente
              </label>
              <input
                type="email"
                value={emailCliente}
                onChange={(event) => setEmailCliente(event.target.value)}
                placeholder="cliente@email.com"
                className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none focus:border-purple-700"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-purple-950">
                Método de pagamento
              </label>
              <select
                value={metodoPagamento}
                onChange={(event) => setMetodoPagamento(event.target.value)}
                className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none focus:border-purple-700"
              >
                <option>Pix</option>
                <option>Transferência</option>
                <option>Cartão</option>
                <option>Boleto</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-purple-950">
                Produto
              </label>
              <select
                value={produtoId}
                onChange={(event) => setProdutoId(event.target.value)}
                className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none focus:border-purple-700"
              >
                <option value="">Selecione um produto</option>
                {produtos.map((produto) => (
                  <option key={produto.id} value={produto.id}>
                    {produto.nome} - {produto.preco} - Estoque:{" "}
                    {produto.estoque}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-purple-950">
                Quantidade
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={quantidade}
                onChange={(event) => setQuantidade(event.target.value)}
                className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none focus:border-purple-700"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-purple-950">
                Status do pagamento
              </label>
              <select
                value={statusPagamento}
                onChange={(event) => setStatusPagamento(event.target.value)}
                className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none focus:border-purple-700"
              >
                <option>Aguardando pagamento</option>
                <option>Pago</option>
                <option>Reembolsado</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-purple-950">
                Status do pedido
              </label>
              <select
                value={statusPedido}
                onChange={(event) => setStatusPedido(event.target.value)}
                className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none focus:border-purple-700"
              >
                <option>Pedido recebido</option>
                <option>Pagamento confirmado</option>
                <option>Em preparação</option>
                <option>Enviado</option>
                <option>Entregue</option>
                <option>Cancelado</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-purple-950">
                Código de rastreio
              </label>
              <input
                type="text"
                value={codigoRastreio}
                onChange={(event) => setCodigoRastreio(event.target.value)}
                placeholder="Ex: BR123456789BR"
                className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none focus:border-purple-700"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-purple-950">
                Status da entrega
              </label>
              <select
                value={statusEntrega}
                onChange={(event) => setStatusEntrega(event.target.value)}
                className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none focus:border-purple-700"
              >
                <option>Aguardando envio</option>
                <option>Em transporte</option>
                <option>Saiu para entrega</option>
                <option>Entregue</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-purple-950">
                Endereço de entrega
              </label>
              <textarea
                value={enderecoEntrega}
                onChange={(event) => setEnderecoEntrega(event.target.value)}
                rows={3}
                placeholder="Rua, número, bairro, cidade, estado e CEP"
                className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none focus:border-purple-700"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-purple-950">
                Observações
              </label>
              <textarea
                value={observacoes}
                onChange={(event) => setObservacoes(event.target.value)}
                rows={3}
                placeholder="Observações internas do pedido"
                className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none focus:border-purple-700"
              />
            </div>

            <div className="rounded-3xl bg-purple-50 p-6 md:col-span-2">
              <p className="text-sm font-semibold text-gray-500">
                Valor total
              </p>
              <p className="mt-2 text-3xl font-bold text-purple-950">
                {formatarMoeda(valorTotal)}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 md:flex-row md:justify-end">
            <a
              href="/admin/pedidos"
              className="rounded-full bg-purple-100 px-8 py-4 text-center font-semibold text-purple-900 hover:bg-purple-200"
            >
              Cancelar
            </a>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
              className="rounded-full bg-purple-800 px-8 py-4 font-semibold text-white hover:bg-purple-900"
            >
              {isSubmitting ? "Salvando..." : "Salvar pedido"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}