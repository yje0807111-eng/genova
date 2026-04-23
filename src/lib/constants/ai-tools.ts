/** DB·이전 데이터와의 호환용 표준 이름 보정 */
export function normalizeToolName(name: string): string {
  const n = name.trim();
  if (n === "DALL·E" || n === "DALL E") return "DALL-E";
  return n;
}

export type AiToolCategory = {
  key: "image" | "video" | "music";
  label: string;
  tools: readonly string[];
};

export const AI_TOOL_CATEGORIES: readonly AiToolCategory[] = [
  {
    key: "image",
    label: "Image Generation",
    tools: ["Midjourney", "DALL-E", "Stable Diffusion", "Firefly", "Ideogram"],
  },
  {
    key: "video",
    label: "Video Generation",
    tools: ["Runway", "Kling", "Sora", "Pika", "Luma", "ComfyUI"],
  },
  {
    key: "music",
    label: "Music Generation",
    tools: ["ElevenLabs", "Suno", "Udio"],
  },
] as const;

export const ALL_CANONICAL_TOOLS: readonly string[] = AI_TOOL_CATEGORIES.flatMap((c) => [...c.tools]);

/** 표준 태그 + 카테고리별 기타(직접 입력) 문자열을 DB `ai_tools` 배열로 합칩니다. */
export function buildAiToolsPayload(
  selectedCanonical: string[],
  otherByCategory: Partial<Record<AiToolCategory["key"], string>>,
): string[] {
  const out = [...selectedCanonical];
  for (const cat of AI_TOOL_CATEGORIES) {
    const raw = otherByCategory[cat.key]?.trim();
    if (raw) out.push(`Other·${cat.label}:${raw}`);
  }
  return out;
}

/** 선택된 툴을 카테고리별로 묶어, 태그가 하나라도 있는 카테고리만 반환 */
export function groupSelectedToolsForView(selected: string[]): { label: string; tools: string[] }[] {
  const normalized = selected.map(normalizeToolName);
  const out: { label: string; tools: string[] }[] = [];
  for (const cat of AI_TOOL_CATEGORIES) {
    const inCat = cat.tools.filter((t) => normalized.includes(t));
    if (inCat.length > 0) {
      out.push({ label: cat.label, tools: inCat });
    }
  }
  return out;
}

/** 카테고리에 속하지 않는(이전 데이터 등) 툴 */
export function getOrphanTools(selected: string[]): string[] {
  const normalized = selected.map(normalizeToolName);
  const known = new Set(ALL_CANONICAL_TOOLS);
  return normalized.filter((t) => t && !known.has(t));
}

/** DB `ai_tools` 배열을 업로드·수정 폼의 선택 상태로 되돌립니다. */
export function parseAiToolsFromVideo(aiTools: string[]): {
  tools: string[];
  otherText: Partial<Record<AiToolCategory["key"], string>>;
  otherOpen: Record<AiToolCategory["key"], boolean>;
} {
  const tools: string[] = [];
  const otherText: Partial<Record<AiToolCategory["key"], string>> = {};
  const otherOpen: Record<AiToolCategory["key"], boolean> = {
    image: false,
    video: false,
    music: false,
  };

  for (const entry of aiTools) {
    const t = entry.trim();
    if (!t) continue;
    let matchedPrefix = false;
    for (const cat of AI_TOOL_CATEGORIES) {
      const prefix = `Other·${cat.label}:`;
      if (t.startsWith(prefix)) {
        otherText[cat.key] = t.slice(prefix.length);
        otherOpen[cat.key] = true;
        matchedPrefix = true;
        break;
      }
    }
    if (matchedPrefix) continue;

    const normalized = normalizeToolName(t);
    const canonical = ALL_CANONICAL_TOOLS.find((x) => normalizeToolName(x) === normalized);
    if (canonical) {
      if (!tools.some((x) => normalizeToolName(x) === normalizeToolName(canonical))) {
        tools.push(canonical);
      }
    } else {
      otherOpen.image = true;
      otherText.image = otherText.image ? `${otherText.image}, ${t}` : t;
    }
  }

  return { tools, otherText, otherOpen };
}
