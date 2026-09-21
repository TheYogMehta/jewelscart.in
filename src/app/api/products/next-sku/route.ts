import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/rbac";
import { getNextSku } from "@/lib/products";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sku = await getNextSku();
  return NextResponse.json({ sku });
}
