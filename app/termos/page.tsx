import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Termos de Uso | Bella Fashion",
    description: "Termos de uso, compra, entrega e trocas da Bella Fashion.",
};

export default function TermosPage() {
    return (
        <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-12 text-gray-900">
            <h1 className="text-3xl font-bold text-purple-900">Termos de Uso</h1>

            <section className="mt-8 space-y-4 text-gray-700">
                <h2 className="text-xl font-semibold text-purple-900">1. Sobre a loja</h2>
                <p>
                    A Bella Fashion comercializa moda feminina com atendimento online e
                    envio para todo o Brasil.
                </p>

                <h2 className="text-xl font-semibold text-purple-900">2. Pedidos e pagamento</h2>
                <p>
                    O pedido é confirmado após aprovação de pagamento. Em pagamentos por
                    cartão, a confirmação ocorre pela Stripe.
                </p>

                <h2 className="text-xl font-semibold text-purple-900">3. Entrega</h2>
                <p>
                    O prazo de entrega pode variar conforme endereço e transportadora. O
                    status do pedido pode ser acompanhado pelos canais da loja.
                </p>

                <h2 className="text-xl font-semibold text-purple-900">4. Trocas e devoluções</h2>
                <p>
                    Trocas e devoluções seguem o Código de Defesa do Consumidor. O cliente
                    deve entrar em contato para orientações e prazos.
                </p>

                <h2 className="text-xl font-semibold text-purple-900">5. Contato</h2>
                <p>
                    WhatsApp: +55 11 94062-5832 | E-mail:
                    janierstivenrodrigueslondono@gmail.com.
                </p>
            </section>
        </main>
    );
}
