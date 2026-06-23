"use client";

export type ProdutoVarianteForm = {
  tamanho: string;
  cor: string;
  sku: string;
  estoque: string;
  ativo: boolean;
};

export type ProdutoVariantePayload = {
  tamanho: string;
  cor: string;
  sku?: string;
  estoque: number;
  ativo: boolean;
};

export function createEmptyProductVariant(): ProdutoVarianteForm {
  return {
    tamanho: "",
    cor: "",
    sku: "",
    estoque: "",
    ativo: true,
  };
}

export function normalizeProductVariants(variantes: ProdutoVarianteForm[]) {
  return variantes
    .filter(
      (item) =>
        item.tamanho.trim() ||
        item.cor.trim() ||
        item.sku.trim() ||
        item.estoque.trim()
    )
    .map((item) => ({
      tamanho: item.tamanho.trim(),
      cor: item.cor.trim(),
      sku: item.sku.trim() || undefined,
      estoque: Number(item.estoque),
      ativo: item.ativo,
    }));
}

export function getProductVariantsError(variantes: ProdutoVariantePayload[]) {
  for (const [index, item] of variantes.entries()) {
    const linha = index + 1;

    if (!item.tamanho) {
      return `Informe o tamanho da variaÃ§Ã£o ${linha}.`;
    }

    if (!item.cor) {
      return `Informe a cor da variaÃ§Ã£o ${linha}.`;
    }

    if (!Number.isInteger(item.estoque) || item.estoque < 0) {
      return `Informe um estoque vÃ¡lido para a variaÃ§Ã£o ${linha}.`;
    }
  }

  return null;
}

type ProductVariantsEditorProps = {
  variantes: ProdutoVarianteForm[];
  onChange: (variantes: ProdutoVarianteForm[]) => void;
};

export function ProductVariantsEditor({
  variantes,
  onChange,
}: ProductVariantsEditorProps) {
  function addVariant() {
    onChange([...variantes, createEmptyProductVariant()]);
  }

  function updateVariant(index: number, patch: Partial<ProdutoVarianteForm>) {
    onChange(
      variantes.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      )
    );
  }

  function removeVariant(index: number) {
    onChange(variantes.filter((_, itemIndex) => itemIndex !== index));
  }

  const estoqueTotal = normalizeProductVariants(variantes).reduce(
    (total, item) => total + (Number.isFinite(item.estoque) ? item.estoque : 0),
    0
  );

  return (
    <section className="md:col-span-2 rounded-3xl border border-purple-100 bg-purple-50 p-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h3 className="text-lg font-bold text-purple-950">
            VariaÃ§Ãµes: tallas, colores y stock
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Use variaÃ§Ãµes quando o mesmo produto tiver tamanhos ou cores
            diferentes. O estoque do produto serÃ¡ a soma delas.
          </p>
        </div>

        <button
          type="button"
          onClick={addVariant}
          className="rounded-full bg-purple-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-900"
        >
          + Adicionar variaÃ§Ã£o
        </button>
      </div>

      {variantes.length > 0 ? (
        <div className="mt-5 space-y-4">
          {variantes.map((item, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-[1fr_1fr_1fr_120px_auto]"
            >
              <label className="text-sm font-semibold text-purple-950">
                Tamanho
                <input
                  type="text"
                  value={item.tamanho}
                  onChange={(event) =>
                    updateVariant(index, { tamanho: event.target.value })
                  }
                  placeholder="P, M, G..."
                  className="mt-2 w-full rounded-2xl border border-purple-100 px-4 py-3 font-normal outline-none transition focus:border-purple-700"
                />
              </label>

              <label className="text-sm font-semibold text-purple-950">
                Cor
                <input
                  type="text"
                  value={item.cor}
                  onChange={(event) =>
                    updateVariant(index, { cor: event.target.value })
                  }
                  placeholder="Preto, Rosa..."
                  className="mt-2 w-full rounded-2xl border border-purple-100 px-4 py-3 font-normal outline-none transition focus:border-purple-700"
                />
              </label>

              <label className="text-sm font-semibold text-purple-950">
                SKU
                <input
                  type="text"
                  value={item.sku}
                  onChange={(event) =>
                    updateVariant(index, { sku: event.target.value })
                  }
                  placeholder="Opcional"
                  className="mt-2 w-full rounded-2xl border border-purple-100 px-4 py-3 font-normal outline-none transition focus:border-purple-700"
                />
              </label>

              <label className="text-sm font-semibold text-purple-950">
                Estoque
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={item.estoque}
                  onChange={(event) =>
                    updateVariant(index, { estoque: event.target.value })
                  }
                  placeholder="0"
                  className="mt-2 w-full rounded-2xl border border-purple-100 px-4 py-3 font-normal outline-none transition focus:border-purple-700"
                />
              </label>

              <div className="flex items-end gap-3">
                <label className="flex items-center gap-2 rounded-2xl bg-purple-50 px-4 py-3 text-sm font-semibold text-purple-900">
                  <input
                    type="checkbox"
                    checked={item.ativo}
                    onChange={(event) =>
                      updateVariant(index, { ativo: event.target.checked })
                    }
                  />
                  Ativa
                </label>

                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="rounded-full bg-red-100 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-200"
                >
                  Remover
                </button>
              </div>
            </div>
          ))}

          <p className="text-sm font-semibold text-purple-900">
            Estoque total pelas variaÃ§Ãµes: {estoqueTotal} un.
          </p>
        </div>
      ) : (
        <p className="mt-5 rounded-2xl bg-white p-4 text-sm text-gray-600">
          Sem variaÃ§Ãµes cadastradas. Nesse caso, o estoque manual do produto
          serÃ¡ usado normalmente.
        </p>
      )}
    </section>
  );
}
