"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/cart-provider";

export function CartLink({ compact = false }: { compact?: boolean }) {
  const { totalItems, hydrated } = useCart();
  const count = hydrated ? totalItems : 0;

  return (
    <Link href="/carrinho" className="relative rounded-full border border-purple-200 px-4 py-2 text-sm font-semibold text-purple-950 transition hover:bg-purple-50" aria-label={`Carrinho com ${count} itens`}>
      {compact ? "Sacola" : "Minha sacola"}
      {count > 0 && <span className="ml-2 inline-flex min-w-5 justify-center rounded-full bg-purple-900 px-1.5 py-0.5 text-xs text-white">{count}</span>}
    </Link>
  );
}
