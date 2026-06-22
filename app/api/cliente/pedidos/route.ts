import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

function publicPedido(pedido: {
  id: number;
  valorTotal: string;
  statusPagamento: string;
  statusPedido: string;
  statusEntrega: string;
  codigoRastreio: string | null;
  dataPedido: string;
  horaPedido: string;
  produtoNome: string;
  enderecoEntrega: string | null;
}) {
  return {
    id: pedido.id,
    valorTotal: pedido.valorTotal,
    statusPagamento: pedido.statusPagamento,
    statusPedido: pedido.statusPedido,
    statusEntrega: pedido.statusEntrega,
    codigoRastreio: pedido.codigoRastreio,
    dataPedido: pedido.dataPedido,
    horaPedido: pedido.horaPedido,
    produtoNome: pedido.produtoNome,
    enderecoEntrega: pedido.enderecoEntrega,
  };
}

export async function GET() {
  const cliente = await getCurrentCustomer();
  if (!cliente) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const pedidos = await prisma.pedido.findMany({
      where: {
        OR: [
          { clienteId: cliente.id },
          { emailCliente: cliente.email },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        valorTotal: true,
        statusPagamento: true,
        statusPedido: true,
        statusEntrega: true,
        codigoRastreio: true,
        dataPedido: true,
        horaPedido: true,
        produtoNome: true,
        enderecoEntrega: true,
      },
    });

    return NextResponse.json(pedidos.map(publicPedido));
  } catch {
    return NextResponse.json(
      { error: "Não foi possível carregar os pedidos no momento." },
      { status: 503 }
    );
  }
}
