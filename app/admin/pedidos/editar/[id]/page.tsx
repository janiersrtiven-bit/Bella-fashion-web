"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ToastView, useToast } from "@/components/ui/toast";
type Pedido = {
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
  itens?: Array<{
    id: number;
    nome: string;
    quantidade: number;
  }>;
};

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

export default function EditarPedidoPage() {
  const params = useParams();
  const router = useRouter();

  const id = Number(params.id);

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [pedidoEncontrado, setPedidoEncontrado] = useState(false);

  const [cliente, setCliente] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [emailCliente, setEmailCliente] = useState("");
  const [enderecoEntrega, setEnderecoEntrega] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState("1");

  const [metodoPagamento, setMetodoPagamento] = useState("Pix");
  const [statusPagamento, setStatusPagamento] = useState(
    "Aguardando pagamento"
  );
  const [statusPedido, setStatusPedido] = useState("Pedido recebido");
  const [codigoRastreio, setCodigoRastreio] = useState("");
  const [statusEntrega, setStatusEntrega] = useState("Aguardando envio");
  const [observacoes, setObservacoes] = useState("");
  const [pedidoItens, setPedidoItens] = useState<Pedido["itens"]>([]);
  const [valorTotalOriginal, setValorTotalOriginal] = useState("");

  const [dataPedidoOriginal, setDataPedidoOriginal] = useState("");
  const [horaPedidoOriginal, setHoraPedidoOriginal] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast, showToast, clearToast } = useToast();

  useEffect(() => {
    Promise.all([
      fetch("/api/produtos").then(async (response) => {
        if (!response.ok) {
          throw new Error("Falha ao carregar produtos");
        }
        return response.json();
      }),
      fetch(`/api/pedidos?id=${id}`).then(async (response) => {
        if (!response.ok) {
          throw new Error("Falha ao carregar pedido");
        }
        return response.json();
      }),
    ])
      .then(([todosProdutos, pedido]: [Produto[], Pedido]) => {
        if (!pedido) {
          setPedidoEncontrado(false);
          return;
        }

        const produtosDisponiveis = todosProdutos.filter(
          (produto) => produto.status === "Ativo" || produto.id === pedido.produtoId
        );

        setProdutos(produtosDisponiveis);
        setPedidoEncontrado(true);

        setCliente(pedido.cliente);
        setWhatsapp(pedido.whatsapp);
        setEmailCliente(pedido.emailCliente || "");
        setEnderecoEntrega(pedido.enderecoEntrega || "");
        setProdutoId(String(pedido.produtoId));
        setQuantidade(String(pedido.quantidade));
        setMetodoPagamento(pedido.metodoPagamento || "Pix");
        setStatusPagamento(pedido.statusPagamento || "Aguardando pagamento");
        setStatusPedido(pedido.statusPedido || pedido.status || "Pedido recebido");
        setCodigoRastreio(pedido.codigoRastreio || "");
        setStatusEntrega(pedido.statusEntrega || "Aguardando envio");
        setObservacoes(pedido.observacoes || "");
        setPedidoItens(pedido.itens || []);
        setValorTotalOriginal(pedido.valorTotal || "");

        setDataPedidoOriginal(pedido.dataPedido || "");
        setHoraPedidoOriginal(pedido.horaPedido || "");
      })
      .catch(() => {
        setPedidoEncontrado(false);
        setErrorMessage("Não foi possível carregar os dados do pedido.");
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const produtoSelecionado = produtos.find(
    (produto) => produto.id === Number(produtoId)
  );

  const quantidadeNumero = Number(quantidade);
  const isMultiproduto = (pedidoItens?.length || 0) > 1;

  const valorUnitario = produtoSelecionado
    ? precoParaNumero(produtoSelecionado.preco)
    : 0;

  const valorTotal =
    !isMultiproduto && produtoSelecionado && quantidadeNumero > 0
      ? valorUnitario * quantidadeNumero
      : 0;

  async function handleSave() {
    const whatsappLimpo = whatsapp.replace(/\D/g, "");

    if (!cliente.trim()) {
      showToast("Preencha o nome do cliente.", "error");
      return;
    }

    if (!whatsappLimpo || whatsappLimpo.length < 10) {
      showToast("Preencha um WhatsApp válido.", "error");
      return;
    }

    if (!isMultiproduto && !produtoSelecionado) {
      showToast("Selecione um produto.", "error");
      return;
    }

    if (!isMultiproduto && (!Number.isInteger(quantidadeNumero) || quantidadeNumero <= 0)) {
      showToast("Preencha uma quantidade válida.", "error");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const pedidoAtualizado: Pedido = {
      id,
      cliente: cliente.trim(),
      whatsapp: whatsappLimpo,
      emailCliente: emailCliente.trim(),
      enderecoEntrega: enderecoEntrega.trim(),
      produtoId: produtoSelecionado?.id || Number(produtoId),
      produtoNome: produtoSelecionado?.nome || "Múltiplos produtos",
      quantidade: isMultiproduto
        ? pedidoItens?.reduce((total, item) => total + item.quantidade, 0) || quantidadeNumero
        : quantidadeNumero,
      valorTotal: isMultiproduto ? valorTotalOriginal : formatarMoeda(valorTotal),
      metodoPagamento,
      statusPagamento,
      statusPedido,
      status: statusPedido,
      codigoRastreio: codigoRastreio.trim(),
      statusEntrega,
      observacoes: observacoes.trim(),
      dataPedido: dataPedidoOriginal,
      horaPedido: horaPedidoOriginal,
    };

    try {
      const response = await fetch(`/api/pedidos?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cliente: pedidoAtualizado.cliente,
          whatsapp: pedidoAtualizado.whatsapp,
          emailCliente: pedidoAtualizado.emailCliente || undefined,
          enderecoEntrega: pedidoAtualizado.enderecoEntrega || undefined,
          ...(isMultiproduto
            ? {}
            : {
                produtoId: pedidoAtualizado.produtoId,
                quantidade: pedidoAtualizado.quantidade,
                valorTotal: pedidoAtualizado.valorTotal,
              }),
          metodoPagamento: pedidoAtualizado.metodoPagamento,
          statusPagamento: pedidoAtualizado.statusPagamento,
          statusPedido: pedidoAtualizado.statusPedido,
          codigoRastreio: pedidoAtualizado.codigoRastreio || undefined,
          statusEntrega: pedidoAtualizado.statusEntrega,
          observacoes: pedidoAtualizado.observacoes || undefined,
          dataPedido: pedidoAtualizado.dataPedido,
          horaPedido: pedidoAtualizado.horaPedido,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        const message = data.error || "Não foi possível atualizar o pedido.";
        setErrorMessage(message);
        showToast(message, "error");
        setIsSubmitting(false);
        return;
      }

      showToast("Pedido atualizado com sucesso!", "success");
      router.push("/admin/pedidos");
    } catch {
      const message = "Não foi possível conectar com o servidor.";
      setErrorMessage(message);
      showToast(message, "error");
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-purple-50 p-6">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-purple-950">Carregando pedido...</h1>
          <p className="mt-3 text-gray-600">Aguarde enquanto buscamos os dados para edição.</p>
        </div>
      </main>
    );
  }

  if (!pedidoEncontrado) {
    return (
      <main className="min-h-screen bg-purple-50 p-6">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-purple-950">
            Pedido não encontrado
          </h1>

          <p className="mt-3 text-gray-600">
            Não encontramos esse pedido no painel da Bella Fashion.
          </p>
          {errorMessage && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}

          <a
            href="/admin/pedidos"
            className="mt-6 inline-block rounded-full bg-purple-800 px-6 py-3 font-semibold text-white"
          >
            Voltar para pedidos
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-purple-50 p-6">
      <ToastView toast={toast} onClose={clearToast} />
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-500">
              Editar Pedido
            </p>

            <h1 className="mt-2 text-4xl font-bold text-purple-950">
              Pedido de {cliente}
            </h1>

            <p className="mt-3 text-gray-600">
              Atualize pagamento, entrega, rastreio e estoque automaticamente.
            </p>
          </div>

          <a
            href="/admin/pedidos"
            className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-purple-900 shadow-sm hover:bg-purple-100"
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
                disabled={isMultiproduto}
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
                disabled={isMultiproduto}
                className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none focus:border-purple-700"
              />
            </div>

            {isMultiproduto ? (
              <div className="rounded-3xl border border-purple-100 bg-purple-50 p-5 md:col-span-2">
                <p className="text-sm font-semibold text-purple-950">
                  Pedido multiproduto
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Produtos e quantidades ficam bloqueados nesta tela. Atualize
                  pagamento, preparo, envio, rastreio ou entrega.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {pedidoItens?.map((item) => (
                    <div key={item.id} className="rounded-2xl bg-white p-4">
                      <p className="font-semibold text-purple-950">{item.nome}</p>
                      <p className="mt-1 text-sm text-gray-600">
                        Quantidade: {item.quantidade}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

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
                Valor total atualizado
              </p>
              <p className="mt-2 text-3xl font-bold text-purple-950">
                {isMultiproduto ? valorTotalOriginal : formatarMoeda(valorTotal)}
              </p>
            </div>
          </div>

          {errorMessage && <p className="mt-6 text-sm text-red-600">{errorMessage}</p>}

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
              {isSubmitting ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
