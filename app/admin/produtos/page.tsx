"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ToastView, useToast } from "@/components/ui/toast";

type Produto = {
  id: number;
  nome: string;
  imagem: string;
  preco: string;
  status: string;
  destaque: string;
  categoria: string;
  estoque: number;
  descricao?: string;
  dataCadastro?: string;
  horaCadastro?: string;
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

export default function ProdutosAdminPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("Todos");
  const [ordenacao, setOrdenacao] = useState("Mais recentes");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { toast, showToast, clearToast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    setErrorMessage(null);

    fetch("/api/produtos")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("No se pudieron cargar los productos.");
        }
        return response.json();
      })
      .then((data) => setProdutos(data))
      .catch(() => {
        setProdutos([]);
        setErrorMessage("Não foi possível carregar os produtos.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function handleDelete(id: number) {
    const confirmar = confirm("Tem certeza que deseja eliminar este produto?");
    if (!confirmar) return;

    try {
      setDeletingId(id);
      const response = await fetch(`/api/produtos?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok) {
        const message = data.error || "No se pudo eliminar el producto.";
        setErrorMessage(message);
        showToast(message, "error");
        return;
      }

      const produtosAtualizados = produtos.filter((produto) => produto.id !== id);
      setProdutos(produtosAtualizados);
      showToast("Produto eliminado com sucesso.", "success");
    } catch {
      const message = "No se pudo conectar con el servidor.";
      setErrorMessage(message);
      showToast(message, "error");
    } finally {
      setDeletingId(null);
    }
  }

  const totalProdutos = produtos.length;

  const totalAtivos = produtos.filter(
    (produto) => produto.status === "Ativo"
  ).length;

  const totalInativos = produtos.filter(
    (produto) => produto.status === "Inativo"
  ).length;

  const estoqueTotal = produtos.reduce(
    (total, produto) => total + (produto.estoque || 0),
    0
  );

  const produtosFiltrados = produtos.filter((produto) => {
    const textoBusca = busca.toLowerCase();

    const correspondeBusca =
      produto.nome.toLowerCase().includes(textoBusca) ||
      produto.preco.toLowerCase().includes(textoBusca) ||
      (produto.categoria || "").toLowerCase().includes(textoBusca) ||
      (produto.descricao || "").toLowerCase().includes(textoBusca);

    const correspondeFiltro =
      filtro === "Todos" ||
      produto.status === filtro ||
      produto.destaque === filtro ||
      produto.categoria === filtro;

    return correspondeBusca && correspondeFiltro;
  });

  const produtosOrdenados = [...produtosFiltrados].sort((a, b) => {
    switch (ordenacao) {
      case "Nome A-Z":
        return a.nome.localeCompare(b.nome);

      case "Nome Z-A":
        return b.nome.localeCompare(a.nome);

      case "Preço menor":
        return precoParaNumero(a.preco) - precoParaNumero(b.preco);

      case "Preço maior":
        return precoParaNumero(b.preco) - precoParaNumero(a.preco);

      case "Estoque menor":
        return (a.estoque || 0) - (b.estoque || 0);

      case "Estoque maior":
        return (b.estoque || 0) - (a.estoque || 0);

      case "Mais antigos":
        return a.id - b.id;

      case "Mais recentes":
      default:
        return b.id - a.id;
    }
  });

  return (
    <main className="min-h-screen bg-purple-50 p-6">
      <ToastView toast={toast} onClose={clearToast} />
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-500">
              Produtos
            </p>

            <h1 className="mt-2 text-4xl font-bold text-purple-950">
              Gerenciar Produtos
            </h1>

            <p className="mt-3 text-gray-600">
              Visualize, organize e edite os produtos da Bella Fashion.
            </p>
            {isLoading && <p className="mt-2 text-sm text-purple-700">Carregando produtos...</p>}
            {errorMessage && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}
          </div>

          <div className="flex gap-3">
            <a
              href="/admin"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-purple-900 shadow-sm transition hover:bg-purple-100"
            >
              Voltar
            </a>

            <a
              href="/admin/produtos/novo"
              className="rounded-full bg-purple-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-900"
            >
              + Novo Produto
            </a>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Total de produtos</p>
            <h2 className="mt-2 text-3xl font-bold text-purple-950">
              {totalProdutos}
            </h2>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Produtos ativos</p>
            <h2 className="mt-2 text-3xl font-bold text-green-600">
              {totalAtivos}
            </h2>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Produtos inativos</p>
            <h2 className="mt-2 text-3xl font-bold text-red-500">
              {totalInativos}
            </h2>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Estoque total</p>
            <h2 className="mt-2 text-3xl font-bold text-purple-950">
              {estoqueTotal}
            </h2>
          </div>
        </div>

        <section className="mt-10 overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="border-b border-purple-100 p-6">
            <h2 className="text-2xl font-bold text-purple-950">
              Lista de produtos
            </h2>
          </div>

          <div className="grid gap-4 border-b border-purple-100 p-6 md:grid-cols-3">
            <input
              type="text"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por nome, categoria, preço ou descrição..."
              className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none transition focus:border-purple-700"
            />

            <select
              value={filtro}
              onChange={(event) => setFiltro(event.target.value)}
              className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none transition focus:border-purple-700"
            >
              <option>Todos</option>
              <option>Ativo</option>
              <option>Inativo</option>
              <option>Novo</option>
              <option>Mais vendido</option>
              <option>Exclusivo</option>
              <option>Promoção</option>
              <option>Bodies</option>
            </select>

            <select
              value={ordenacao}
              onChange={(event) => setOrdenacao(event.target.value)}
              className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none transition focus:border-purple-700"
            >
              <option>Mais recentes</option>
              <option>Mais antigos</option>
              <option>Nome A-Z</option>
              <option>Nome Z-A</option>
              <option>Preço menor</option>
              <option>Preço maior</option>
              <option>Estoque menor</option>
              <option>Estoque maior</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1300px] text-left">
              <thead className="bg-purple-100 text-sm text-purple-950">
                <tr>
                  <th className="px-6 py-4">Foto</th>
                  <th className="px-6 py-4">Produto</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4">Estoque</th>
                  <th className="px-6 py-4">Preço</th>
                  <th className="px-6 py-4">Destaque</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Cadastro</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>

              <tbody>
                {produtosOrdenados.length > 0 ? (
                  produtosOrdenados.map((produto) => (
                    <tr
                      key={produto.id}
                      className="border-b border-purple-50 last:border-none"
                    >
                      <td className="px-6 py-4">
                        <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-purple-100">
                          <Image
                            src={produto.imagem}
                            alt={produto.nome}
                            fill
                            className="object-cover"
                            unoptimized={produto.imagem.startsWith("blob:")}
                          />
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-bold text-purple-950">
                          {produto.nome}
                        </p>
                        <p className="text-sm text-gray-500">
                          {produto.descricao || "Sem descrição cadastrada"}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                          {produto.categoria || "-"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={
                            (produto.estoque || 0) < 5
                              ? "rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700"
                              : "rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700"
                          }
                        >
                          {produto.estoque || 0} un.
                        </span>
                      </td>

                      <td className="px-6 py-4 font-bold text-purple-900">
                        {produto.preco}
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-full bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-800">
                          {produto.destaque}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={
                            produto.status === "Ativo"
                              ? "rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700"
                              : "rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700"
                          }
                        >
                          {produto.status}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-semibold text-purple-950">
                          {produto.dataCadastro || "-"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {produto.horaCadastro || "-"}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <a
                            href={`/admin/produtos/editar/${produto.id}`}
                            className="rounded-full bg-purple-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-900"
                          >
                            Editar
                          </a>

                          <button
                            type="button"
                            onClick={() => handleDelete(produto.id)}
                            disabled={deletingId === produto.id}
                            className="rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-200"
                          >
                            {deletingId === produto.id ? "Eliminando..." : "Eliminar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      Nenhum produto cadastrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}