import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const cliente = await getCurrentCustomer();
  if (!cliente) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const enderecoPrincipal = await prisma.enderecoCliente.findFirst({
    where: {
      clienteId: cliente.id,
      principal: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const safeCliente = {
    id: cliente.id,
    nome: cliente.nome,
    email: cliente.email,
    whatsapp: cliente.whatsapp,
    createdAt: cliente.createdAt,
    updatedAt: cliente.updatedAt,
  };

  return NextResponse.json({ cliente: safeCliente, enderecoPrincipal });
}
