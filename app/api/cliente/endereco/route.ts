import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const enderecoSchema = z.object({
  endereco: z.string().trim().min(1, "Informe o endereço."),
});

export async function POST(request: Request) {
  const cliente = await getCurrentCustomer();
  if (!cliente) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const result = enderecoSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0]?.message || "Dados inválidos." }, { status: 400 });
  }

  const { endereco } = result.data;
  await prisma.$transaction(async (tx) => {
    await tx.enderecoCliente.updateMany({
      where: { clienteId: cliente.id, principal: true },
      data: { principal: false },
    });

    const existing = await tx.enderecoCliente.findFirst({
      where: { clienteId: cliente.id, endereco },
    });

    if (existing) {
      await tx.enderecoCliente.update({
        where: { id: existing.id },
        data: { principal: true },
      });
    } else {
      await tx.enderecoCliente.create({
        data: {
          clienteId: cliente.id,
          rotulo: "Principal",
          endereco,
          principal: true,
        },
      });
    }
  });

  return NextResponse.json({ success: true });
}
