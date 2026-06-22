import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createCustomerSession, verifyCustomerPassword } from "@/lib/customer-auth";
import { clienteLoginSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const result = clienteLoginSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0]?.message || "Dados inválidos." }, { status: 400 });
  }

  const { email, password } = result.data;
  const cliente = await prisma.cliente.findUnique({ where: { email } });
  if (!cliente || !verifyCustomerPassword(password, cliente.passwordHash)) {
    return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
  }

  await createCustomerSession(cliente.id);
  return NextResponse.json({ success: true });
}
