import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminRequestAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type CandidateSummary = {
  id: number;
  itens: Array<{ produtoId: number | null; varianteId: number | null; quantidade: number }>;
};

export async function GET(request: Request) {
  if (!(await isAdminRequestAuthenticated(request))) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const now = new Date();

  // Find candidate pedidos in dry-run mode
  const candidates = await prisma.pedido.findMany({
    where: {
      estoqueReservado: true,
      expiresAt: { lte: now },
      statusPagamento: { not: "Pago" },
    },
    include: { itens: true },
    orderBy: { id: "asc" },
  });

  const candidateSummaries: CandidateSummary[] = candidates.map((p) => ({
    id: p.id,
    itens: p.itens.map((it) => ({ produtoId: it.produtoId ?? null, varianteId: it.varianteId ?? null, quantidade: it.quantidade })),
  }));

  // Aggregate totals per product/variant
  const totalsMap = new Map<string, { produtoId: number | null; varianteId: number | null; total: number }>();
  for (const c of candidateSummaries) {
    for (const it of c.itens) {
      const key = `${it.produtoId ?? "null"}:${it.varianteId ?? "null"}`;
      const existing = totalsMap.get(key);
      if (existing) existing.total += it.quantidade;
      else totalsMap.set(key, { produtoId: it.produtoId, varianteId: it.varianteId, total: it.quantidade });
    }
  }

  const totals = Array.from(totalsMap.values());

  // Always dry-run on GET: return summary without modifying DB
  return NextResponse.json({
    mode: "dry-run",
    now: now.toISOString(),
    totalCandidates: candidateSummaries.length,
    pedidoIds: candidateSummaries.map((c) => c.id),
    candidates: candidateSummaries,
    totals,
  });
}

export async function POST(request: Request) {
  if (!(await isAdminRequestAuthenticated(request))) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const url = new URL(request.url);
  const apply = url.searchParams.get("apply") === "true";
  if (!apply) {
    return NextResponse.json({ error: "To apply changes, call POST with ?apply=true" }, { status: 400 });
  }

  const now = new Date();

  const candidates = await prisma.pedido.findMany({
    where: {
      estoqueReservado: true,
      expiresAt: { lte: now },
      statusPagamento: { not: "Pago" },
    },
    include: { itens: true },
    orderBy: { id: "asc" },
  });

  const appliedResults: Array<{ id: number; applied: boolean; reason?: string }> = [];

  for (const candidate of candidates) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const pedido = await tx.pedido.findUnique({ where: { id: candidate.id }, include: { itens: true } });
        if (!pedido) return { applied: false, reason: "Pedido not found" };
        if (!pedido.estoqueReservado) return { applied: false, reason: "Already released" };
        if (pedido.statusPagamento === "Pago") return { applied: false, reason: "Already paid" };
        if (!pedido.expiresAt || pedido.expiresAt > new Date()) return { applied: false, reason: "Not expired anymore" };

        for (const it of pedido.itens) {
          if (it.varianteId) {
            await tx.produtoVariante.updateMany({ where: { id: it.varianteId }, data: { estoque: { increment: it.quantidade } } });
          }
          if (it.produtoId) {
            await tx.produto.updateMany({ where: { id: it.produtoId }, data: { estoque: { increment: it.quantidade } } });
          }
        }

        await tx.pedido.update({ where: { id: pedido.id }, data: { estoqueReservado: false, expiresAt: null, statusPedido: "Pedido expirado", statusPagamento: "Expirado" } });
        return { applied: true };
      });

      appliedResults.push({ id: candidate.id, applied: result.applied, reason: result.reason });
    } catch (err) {
      appliedResults.push({ id: candidate.id, applied: false, reason: String(err) });
    }
  }

  const appliedCount = appliedResults.filter((r) => r.applied).length;

  return NextResponse.json({ mode: "apply", now: now.toISOString(), totalCandidates: candidates.length, appliedCount, appliedResults });
}
