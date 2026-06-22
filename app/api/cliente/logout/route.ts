import { NextResponse } from "next/server";
import { destroyCustomerSession } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  await destroyCustomerSession();
  return NextResponse.json({ success: true });
}
