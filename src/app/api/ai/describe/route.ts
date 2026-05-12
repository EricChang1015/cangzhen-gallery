import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { generateItemDescription } from "@/lib/poe";
import { getSettings } from "@/lib/settings";

export const runtime = "nodejs";
export const maxDuration = 60;

const inputSchema = z.object({
  title: z.string().min(1, "請輸入品名"),
  category: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  era: z.string().nullable().optional(),
  material: z.string().nullable().optional(),
  dimensions: z.string().nullable().optional(),
  weight: z.string().nullable().optional(),
  provenance: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "資料格式錯誤" },
      { status: 400 },
    );
  }
  const settings = await getSettings();
  try {
    const text = await generateItemDescription(parsed.data, {
      model: settings.ai_model,
    });
    return NextResponse.json({ description: text });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI 服務異常";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
