"use client";

export type HashtagEventType = "search" | "click";

function normalizeTag(raw: string): string {
  return raw.replace(/^#+/, "").trim().toLowerCase();
}

export function trackHashtagEvent(tagRaw: string, eventType: HashtagEventType): void {
  const tag = normalizeTag(tagRaw);
  if (!tag) return;
  void fetch("/api/hashtags/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tag, eventType }),
  });
}
