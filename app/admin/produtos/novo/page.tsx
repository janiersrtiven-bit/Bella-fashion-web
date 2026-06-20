"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
  descricao: string;
  dataCadastro: string;
  horaCadastro: string;
};

function normalizeImagePath(value: string) {
  const image = value.trim();

  if (!image) return image;

  if (
    image.startsWith("/produtos/") ||
    /^https?:\/\//i.test(image) ||
    image.startsWith("blob:") ||
    image.startsWith("data:")
  ) {
    return image;
  }

  return `/produtos/${image.replace(/^\/+/, "")}`;
}

export default function NovoProdutoPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [categoria, setCategoria] = useState("Bodies");
  const [estoque, setEstoque] = useState("");
  const [destaque, setDestaque] = useState("Novo");
  const [status, setStatus] = useState("Ativo");
  const [descricao, setDescricao] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast, showToast, clearToast } = useToast();

  function formatarPreco(valor: string) {
    const valorLimpo = valor
      .replace("R$", "")
      .replace(/\s/g, "")
      .replace(",", ".");

    const numero = Number(valorLimpo);

    if (Number.isNaN(numero) || numero <= 0) {
      return null;
    }

    return numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setPreview(imageUrl);
  }

  async function handleSave() {
    const precoFormatado = formatarPreco(preco);
    const estoqueNumero = Number(estoque);

    if (!nome.trim()) {
      showToast("Preencha o nome do produto.", "error");
      return;
    }

    if (!precoFormatado) {
      showToast("Preencha um preço válido. Exemplo: 89,90", "error");
      return;
    }

    if (!categoria.trim()) {
      showToast("Preencha a categoria do produto.", "error");
      return;
    }

    if (!Number.isInteger(estoqueNumero) || estoqueNumero < 0) {
      showToast("Preencha um estoque válido. Exemplo: 10", "error");
      return;
    }

    if (!descricao.trim()) {
      showToast("Preencha a descrição do produto.", "error");
      return;
    }

    if (!preview) {
      showToast("Selecione uma foto do produto.", "error");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const novoProduto: Produto = {
      id: 0,
      nome: nome.trim(),
      preco: precoFormatado,
      categoria: categoria.trim(),
      estoque: estoqueNumero,
      destaque,
      status,
      descricao: descricao.trim(),
      imagem: preview,
      dataCadastro: "",
      horaCadastro: "",
    };

    try {
      const response = await fetch("/api/produtos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: novoProduto.nome,
          imagem: novoProduto.imagem,
          preco: novoProduto.preco,
          status: novoProduto.status,
          destaque: novoProduto.destaque,
          categoria: novoProduto.categoria,
          estoque: novoProduto.estoque,
          descricao: novoProduto.descricao,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        const message = data.error || "No se pudo guardar el producto.";
        setErrorMessage(message);
        showToast(message, "error");
        setIsSubmitting(false);
        return;
      }

      showToast("Produto salvo com sucesso!", "success");
      router.push("/admin/produtos");
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
              Novo Produto
            </p>

            <h1 className="mt-2 text-4xl font-bold text-purple-950">
              Adicionar Produto
            </h1>

            <p className="mt-3 text-gray-600">
              Cadastre um novo produto para aparecer na loja Bella Fashion.
            </p>
          </div>

          <a
            href="/admin/produtos"
            className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-purple-900 shadow-sm transition hover:bg-purple-100"
          >
            Voltar para produtos
          </a>
        </div>

        <form className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-purple-950">
                Nome do produto
              </label>
              <input
                type="text"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Ex: Body Bella Branco"
                className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none transition focus:border-purple-700"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-purple-950">
                Preço
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={preco}
                onChange={(event) => setPreco(event.target.value)}
                placeholder="Ex: 89,90"
                className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none transition focus:border-purple-700"
              />
              <p className="mt-2 text-xs text-gray-500">
                Digite somente o valor. Exemplo: 89,90
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-purple-950">
                Categoria
              </label>
              <input
                type="text"
                value={categoria}
                onChange={(event) => setCategoria(event.target.value)}
                placeholder="Ex: Bodies"
                className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none transition focus:border-purple-700"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-purple-950">
                Estoque
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={estoque}
                onChange={(event) => setEstoque(event.target.value)}
                placeholder="Ex: 10"
                className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none transition focus:border-purple-700"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-purple-950">
                Destaque
              </label>
              <select
                value={destaque}
                onChange={(event) => setDestaque(event.target.value)}
                className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none transition focus:border-purple-700"
              >
                <option>Novo</option>
                <option>Mais vendido</option>
                <option>Exclusivo</option>
                <option>Promoção</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-purple-950">
                Status
              </label>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none transition focus:border-purple-700"
              >
                <option>Ativo</option>
                <option>Inativo</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-purple-950">
                Descrição
              </label>
              <textarea
                value={descricao}
                onChange={(event) => setDescricao(event.target.value)}
                placeholder="Descreva o produto, tecido, conforto e detalhes."
                rows={5}
                className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none transition focus:border-purple-700"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-purple-950">
                Foto do produto
              </label>

              <div className="rounded-3xl border-2 border-dashed border-purple-200 bg-purple-50 p-8 text-center">
                {preview ? (
                  <div className="mx-auto max-w-sm">
                    <div className="relative mx-auto h-96 overflow-hidden rounded-3xl bg-purple-100 shadow-sm">
                      <Image
                        src={normalizeImagePath(preview)}
                        alt="Prévia do produto"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>

                    <p className="mt-4 font-semibold text-purple-950">
                      Prévia da imagem selecionada
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-4xl">📷</p>
                    <p className="mt-3 font-semibold text-purple-950">
                      Clique para selecionar uma imagem
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      JPG, PNG ou WEBP. Recomendado: foto vertical do produto.
                    </p>
                  </>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="mt-5 rounded-full bg-white px-5 py-3 text-sm text-gray-600"
                />
              </div>
            </div>
          </div>

          {errorMessage && <p className="mt-6 text-sm text-red-600">{errorMessage}</p>}

          <div className="mt-8 flex flex-col gap-4 md:flex-row md:justify-end">
            <a
              href="/admin/produtos"
              className="rounded-full bg-purple-100 px-8 py-4 text-center font-semibold text-purple-900 transition hover:bg-purple-200"
            >
              Cancelar
            </a>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
              className="rounded-full bg-purple-800 px-8 py-4 font-semibold text-white transition hover:bg-purple-900"
            >
              {isSubmitting ? "Salvando..." : "Salvar produto"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}