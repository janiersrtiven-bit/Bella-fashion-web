import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { clienteUpdateSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const cliente = await getCurrentCustomer();
  if (!cliente) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const result = clienteUpdateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0]?.message || "Dados inválidos." }, { status: 400 });
  }

  const { nome, whatsapp, endereco } = result.data;
  await prisma.cliente.update({
    where: { id: cliente.id },
    data: {
      nome,
      whatsapp,
    },
  });

  if (endereco !== undefined) {
    const existing = await prisma.enderecoCliente.findFirst({
      where: { clienteId: cliente.id, principal: true },
    });

    if (existing) {
      await prisma.enderecoCliente.update({
        where: { id: existing.id },
        data: { endereco },
      });
    } else if (endereco.trim()) {
      await prisma.enderecoCliente.create({
        data: {
          clienteId: cliente.id,
          rotulo: "Principal",
          endereco,
          principal: true,
        },
      });
    }
  }

  return NextResponse.json({ success: true });
}
