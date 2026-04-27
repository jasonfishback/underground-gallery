// app/api/mod-catalog/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { modCatalog } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db
      .select({
        id: modCatalog.id,
        category: modCatalog.category,
        name: modCatalog.name,
        hpDelta: modCatalog.defaultHpGain,
        description: modCatalog.description,
      })
      .from(modCatalog);
    return NextResponse.json({ ok: true, results: rows });
  } catch (err) {
    console.error("[mod-catalog] failed:", err);
    return NextResponse.json({ ok: false, error: "Failed to load." }, { status: 500 });
  }
}