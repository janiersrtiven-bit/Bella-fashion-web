"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { ToastView, useToast } from "@/components/ui/toast";
import { toUserFacingError } from "@/lib/ui-error";
import { isInvalidImageValue, uploadImageToServer } from "@/lib/upload-client";

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
  dataCadastro?: string;
  horaCadastro?: string;
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

function formatarPreco(valor: string) {
  const valorLimpo = valor
    .replace("R$", "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
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

export default function EditarProdutoPage() {
  const params = useParams();
  const router = useRouter();

  const id = Number(params.id);

  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [categoria, setCategoria] = useState("");
  const [estoque, setEstoque] = useState("");
  const [destaque, setDestaque] = useState("Novo");
  const [status, setStatus] = useState("Ativo");
  const [descricao, setDescricao] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [produtoEncontrado, setProdutoEncontrado] = useState(false);
  const [dataCadastroOriginal, setDataCadastroOriginal] = useState("");
  const [horaCadastroOriginal, setHoraCadastroOriginal] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast, showToast, clearToast } = useToast();

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setIsLoading(true);
    setErrorMessage(null);

    fetch(`/api/produtos?id=${id}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Produto não encontrado");
        }
        return response.json();
      })
      .then((produto: Produto) => {
        setProdutoEncontrado(true);
        setNome(produto.nome);
        setPreco(produto.preco);
        setCategoria(produto.categoria || "");
        setEstoque(String(produto.estoque ?? ""));
        setDestaque(produto.destaque);
        setStatus(produto.status);
        setDescricao(produto.descricao || "");
        setImagemUrl(produto.imagem || "");
        setDataCadastroOriginal(produto.dataCadastro || "");
        setHoraCadastroOriginal(produto.horaCadastro || "");
      })
      .catch(() => {
        setProdutoEncontrado(false);
        setErrorMessage("Não foi possível carregar o produto.");
      })
      .finally(() => setIsLoading(false));
  }, [id]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setIsUploadingImage(true);
      const uploadedUrl = await uploadImageToServer(file);
      setImagemUrl(uploadedUrl);
      showToast("Imagem enviada com sucesso.", "success");
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : "";
      const message = toUserFacingError(
        rawMessage,
        "Nao foi possivel enviar a imagem agora. Tente novamente."
      );
      showToast(message, "error");
    } finally {
      setIsUploadingImage(false);
      event.currentTarget.value = "";
    }
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

    if (!imagemUrl.trim()) {
      showToast("Selecione uma foto do produto ou informe uma URL manual.", "error");
      return;
    }

    if (isInvalidImageValue(imagemUrl)) {
      showToast("Esta imagem é inválida (blob/data). Suba uma nova ou informe URL persistente.", "error");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const agora = new Date();

    const produtoAtualizado: Produto = {
      id,
      nome: nome.trim(),
      preco: precoFormatado,
      categoria: categoria.trim(),
      estoque: estoqueNumero,
      destaque,
      status,
      descricao: descricao.trim(),
      imagem: imagemUrl.trim(),
      dataCadastro: dataCadastroOriginal || agora.toLocaleDateString("pt-BR"),
      horaCadastro:
        horaCadastroOriginal ||
        agora.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
    };

    try {
      const response = await fetch(`/api/produtos?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: produtoAtualizado.nome,
          imagem: produtoAtualizado.imagem,
          preco: produtoAtualizado.preco,
          status: produtoAtualizado.status,
          destaque: produtoAtualizado.destaque,
          categoria: produtoAtualizado.categoria,
          estoque: produtoAtualizado.estoque,
          descricao: produtoAtualizado.descricao,
          dataCadastro: produtoAtualizado.dataCadastro,
          horaCadastro: produtoAtualizado.horaCadastro,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        const message = toUserFacingError(
          data?.error,
          "Nao foi possivel atualizar o produto. Tente novamente."
        );
        setErrorMessage(message);
        showToast(message, "error");
        setIsSubmitting(false);
        return;
      }

      showToast("Produto atualizado com sucesso!", "success");
      router.push("/admin/produtos");
    } catch {
      const message = "Sem conexao com o servidor. Tente novamente.";
      setErrorMessage(message);
      showToast(message, "error");
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-purple-50 p-6">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-purple-950">Carregando produto...</h1>
          <p className="mt-3 text-gray-600">Aguarde enquanto buscamos os dados para edição.</p>
        </div>
      </main>
    );
  }

  if (!produtoEncontrado) {
    return (
      <main className="min-h-screen bg-purple-50 p-6">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-purple-950">
            Produto não encontrado
          </h1>

          <p className="mt-3 text-gray-600">
            Não encontramos esse produto no painel da Bella Fashion.
          </p>
          {errorMessage && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}

          <a
            href="/admin/produtos"
            className="mt-6 inline-block rounded-full bg-purple-800 px-6 py-3 font-semibold text-white"
          >
            Voltar para produtos
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
              Editar Produto
            </p>

            <h1 className="mt-2 text-4xl font-bold text-purple-950">
              Editar {nome}
            </h1>

            <p className="mt-3 text-gray-600">
              Atualize as informações do produto selecionado.
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
                rows={5}
                className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none transition focus:border-purple-700"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-purple-950">
                Foto do produto
              </label>

              <label className="mb-3 block text-sm text-gray-600">
                URL manual (opcional)
                <input
                  type="text"
                  value={imagemUrl}
                  onChange={(event) => setImagemUrl(event.target.value)}
                  placeholder="https://... ou /produtos/minha-imagem.jpg"
                  className="mt-2 w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none transition focus:border-purple-700"
                />
              </label>

              <div className="rounded-3xl border-2 border-dashed border-purple-200 bg-purple-50 p-8 text-center">
                {imagemUrl ? (
                  <div className="mx-auto max-w-sm">
                    <div className="relative mx-auto h-96 overflow-hidden rounded-3xl bg-purple-100 shadow-sm">
                      {isInvalidImageValue(imagemUrl) ? (
                        <div className="flex h-full items-center justify-center p-6 text-center text-sm text-red-600">
                          Imagem inválida detectada (blob/data). Suba uma nova para corrigir.
                        </div>
                      ) : (
                        <Image
                          src={normalizeImagePath(imagemUrl)}
                          alt="Prévia do produto"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      )}
                    </div>

                    <p className="mt-4 font-semibold text-purple-950">
                      Prévia da imagem atual
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-purple-700">Produto sem imagem definida.</p>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={isUploadingImage}
                  className="mt-5 rounded-full bg-white px-5 py-3 text-sm text-gray-600"
                />
                {isUploadingImage && (
                  <p className="mt-3 text-sm text-purple-700">Enviando imagem para storage...</p>
                )}
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
              disabled={isSubmitting || isUploadingImage}
              className="rounded-full bg-purple-800 px-8 py-4 font-semibold text-white transition hover:bg-purple-900"
            >
              {isSubmitting ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}