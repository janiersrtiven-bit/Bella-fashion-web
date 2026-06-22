import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashCustomerPassword, createCustomerSession } from "@/lib/customer-auth";
import { clienteCadastroSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const result = clienteCadastroSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0]?.message || "Dados inválidos." }, { status: 400 });
  }

  const { nome, email, whatsapp, password, endereco } = result.data;
  const existing = await prisma.cliente.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Já existe uma conta com este e-mail." }, { status: 409 });
  }

  const passwordHash = hashCustomerPassword(password);
  const cliente = await prisma.cliente.create({
    data: {
      nome,
      email,
      whatsapp,
      passwordHash,
      enderecos: endereco
        ? {
            create: {
              rotulo: "Principal",
              endereco,
              principal: true,
            },
          }
        : undefined,
    },
  });

  await createCustomerSession(cliente.id);
  return NextResponse.json({ success: true });
}
