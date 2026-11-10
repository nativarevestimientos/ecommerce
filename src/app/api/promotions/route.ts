import { NextResponse } from "next/server";
import { PromotionCampaign } from "@/types/promotion";

export const dynamic = "force-dynamic";

export async function GET() {
  const base = (process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || "").trim().replace(/\/+$/, "");
  if (!base) return NextResponse.json({ campaign: null, serverNow: Date.now() }, { headers: { "Cache-Control": "no-store" } });
  try {
    const apiBase = /\/api$/.test(base) ? base : `${base}/api`;
    let response = await fetch(`${apiBase}/settings/promotions`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (response.status === 404) response = await fetch(`${apiBase}/settings/cyber-monday`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`Campaign API: ${response.status}`);
    const data = await response.json();
    const c = data.campaign as PromotionCampaign | undefined;
    if (!c || typeof c.id !== "string" || !Array.isArray(c.productIds)) throw new Error("Invalid campaign");
    return NextResponse.json({ campaign: c, serverNow: Date.now() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Promotion unavailable", error);
    return NextResponse.json({ campaign: null, serverNow: Date.now() }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
