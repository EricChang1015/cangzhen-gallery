import OpenAI from "openai";
import { env, getPoeApiKey } from "@/lib/env";

let _client: OpenAI | null = null;

export function getPoeClient(): OpenAI {
  if (_client) return _client;
  _client = new OpenAI({
    apiKey: getPoeApiKey(),
    baseURL: env.poeBaseUrl,
  });
  return _client;
}

export interface ItemBriefInput {
  title: string;
  category?: string | null;
  summary?: string | null;
  era?: string | null;
  material?: string | null;
  dimensions?: string | null;
  weight?: string | null;
  provenance?: string | null;
  /** 已上傳的藏品圖片公開 URL，傳入後 AI 將以圖識物 */
  imageUrls?: string[];
}

/** 給 POE AI 的 system prompt 與 user prompt 組裝。支援純文字與含圖片（Vision）兩種模式。 */
export function buildAiPrompt(item: ItemBriefInput) {
  const fields: string[] = [];
  if (item.category) fields.push(`分類：${item.category}`);
  if (item.era) fields.push(`年代：${item.era}`);
  if (item.material) fields.push(`材質：${item.material}`);
  if (item.dimensions) fields.push(`尺寸：${item.dimensions}`);
  if (item.weight) fields.push(`重量：${item.weight}`);
  if (item.provenance) fields.push(`來源／提供者：${item.provenance}`);
  if (item.summary) fields.push(`藏家簡述：${item.summary}`);

  const knownInfo = fields.length
    ? `已知資訊如下：\n- ${fields.join("\n- ")}`
    : "藏家僅提供品名，請依品名常識進行考證。";

  const hasImages = Array.isArray(item.imageUrls) && item.imageUrls.length > 0;
  const textPrompt = `請為下列藏品撰寫詳細介紹：\n品名：${item.title}\n${knownInfo}\n\n請輸出 350 ～ 600 字之間，可分段。`;

  const systemContent = [
    "你是「藏珍閣」線上典藏館的中文藝品鑑賞顧問。",
    "請以繁體中文、典雅而易讀的口吻撰寫藏品介紹文，目標讀者為一般華文藏家與愛好者。",
    "若有需要可援引常見典故、產地、工藝特色，並標註資訊為傳說或推測，避免捏造具體拍賣紀錄。",
    "禁止使用 Markdown 標題（# 與 ##），可使用粗體、條列、段落分隔。",
    "輸出結構建議：藏品概述 → 工藝／材質特徵 → 文化背景／典故 → 鑑賞要點 → 收藏建議。",
    "若資訊不足請明確說明「此件之確切年代仍待考證」。",
    ...(hasImages ? ["使用者已上傳藏品圖片，請務必結合圖片中可見的器形、紋飾、色澤進行描述，以圖識物。"] : []),
  ].join("\n");

  const userContent = hasImages
    ? [
        { type: "text" as const, text: textPrompt },
        ...(item.imageUrls ?? []).slice(0, 4).map((url) => ({
          type: "image_url" as const,
          image_url: { url, detail: "high" as const },
        })),
      ]
    : textPrompt;

  return [
    { role: "system" as const, content: systemContent },
    { role: "user" as const, content: userContent },
  ];
}

/**
 * 呼叫 POE AI 產生藏品說明。
 * 預設使用 chat.completions 介面（POE 相容 OpenAI Chat API）。
 */
export async function generateItemDescription(
  input: ItemBriefInput,
  options: { model?: string } = {},
): Promise<string> {
  const client = getPoeClient();
  const model = options.model || "gpt-5.5";
  const messages = buildAiPrompt(input);

  const completion = await client.chat.completions.create({
    model,
    messages,
  });

  const text = completion.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("AI 未回傳內容，請稍後再試。");
  }
  return text;
}
