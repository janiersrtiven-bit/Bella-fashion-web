export type Produto = {
    id: number;
    nome: string;
    imagem: string;
    preco: string;
    destaque: string;
    descricao: string;
    status?: string;
    categoria?: string;
    estoque?: number;
    dataCadastro?: string;
    horaCadastro?: string;
};

export const produtosDefault: Produto[] = [
    {
        id: 1,
        nome: "Body Bella Branco",
        imagem: "/produtos/body-1.jpg.jpeg",
        preco: "R$ 89,90",
        destaque: "Mais vendido",
        descricao: "Body elegante, confortável e com caimento perfeito.",
        status: "Ativo",
        categoria: "Bodies",
        estoque: 12,
    },
    {
        id: 2,
        nome: "Body Bella Branco",
        imagem: "/produtos/body-2.jpg.jpeg",
        preco: "R$ 89,90",
        destaque: "Novo",
        descricao: "Modelo versátil para combinar com jeans, saia ou alfaiataria.",
        status: "Ativo",
        categoria: "Bodies",
        estoque: 8,
    },
    {
        id: 3,
        nome: "Body Bella Branco",
        imagem: "/produtos/body-3.jpeg",
        preco: "R$ 89,90",
        destaque: "Exclusivo",
        descricao: "Peça de fabricação própria com tecido premium e toque macio.",
        status: "Ativo",
        categoria: "Bodies",
        estoque: 10,
    },
];
