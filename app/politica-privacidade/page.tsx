import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Política de Privacidade",
    description:
        "Política de Privacidade da Bella Fashion para atendimento, pedidos e pagamentos.",
};

export default function PoliticaPrivacidadePage() {
    const contactEmail = process.env.COMPANY_EMAIL;

    return (
        <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-12 text-gray-900">
            <h1 className="text-3xl font-bold text-purple-900">Política de Privacidade</h1>

            <p className="mt-6 text-gray-700">
                A Bella Fashion respeita a sua privacidade e protege os dados pessoais
                usados durante o atendimento e a compra.
            </p>

            <section className="mt-8 space-y-4 text-gray-700">
                <h2 className="text-xl font-semibold text-purple-900">1. Dados coletados</h2>
                <p>
                    Podemos coletar nome, WhatsApp, e-mail, endereço de entrega e dados do
                    pedido para processar compras e suporte ao cliente.
                </p>

                <h2 className="text-xl font-semibold text-purple-900">2. Uso dos dados</h2>
                <p>
                    Os dados são usados para confirmar pedidos, organizar entrega,
                    comunicação de status e suporte pós-venda.
                </p>

                <h2 className="text-xl font-semibold text-purple-900">3. Pagamentos</h2>
                <p>
                    Pagamentos por cartão são processados pela Stripe. A Bella Fashion não
                    armazena dados completos de cartão.
                </p>

                <h2 className="text-xl font-semibold text-purple-900">4. Compartilhamento</h2>
                <p>
                    Não vendemos dados pessoais. Compartilhamos apenas com serviços
                    necessários para processar pedido e pagamento.
                </p>

                <h2 className="text-xl font-semibold text-purple-900">5. Contato</h2>
                <p>
                    Para dúvidas sobre privacidade ou solicitações relacionadas aos seus dados,
                    entre em contato pelos canais oficiais da Bella Fashion
                    {contactEmail ? `: ${contactEmail}.` : "."}
                </p>
            </section>

            <Link href="/" className="mt-10 inline-block rounded-full bg-purple-800 px-6 py-3 font-semibold text-white hover:bg-purple-900">
                Voltar à loja
            </Link>
        </main>
    );
}
