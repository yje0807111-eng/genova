"use client";

import { useEffect, useRef, useState } from "react";
import { adminTokens } from "@/lib/admin-styles";
import type { Competition } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

export function SiteSettings({
  competitions,
  onMessage,
}: {
  competitions: Competition[];
  onMessage: (message: string) => void;
}) {
  const [heroEyebrowKo, setHeroEyebrowKo] = useState("");
  const [heroEyebrowEn, setHeroEyebrowEn] = useState("");
  const [heroEyebrowJa, setHeroEyebrowJa] = useState("");
  const [eyebrowLangTab, setEyebrowLangTab] = useState<"ko" | "en" | "ja">("ko");
  const [heroEyebrowLoading, setHeroEyebrowLoading] = useState(false);
  const [featuredCompetitionId, setFeaturedCompetitionId] = useState("");
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [homeFeaturedCompId, setHomeFeaturedCompId] = useState("");
  const [homeFeaturedLoading, setHomeFeaturedLoading] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashSaved = () => {
    setSavedMessage("✓ 저장됨");
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSavedMessage(null), 2500);
  };

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/site-settings?key=films_hero_eyebrow_ko").then((r) => r.json()),
      fetch("/api/site-settings?key=films_hero_eyebrow_en").then((r) => r.json()),
      fetch("/api/site-settings?key=films_hero_eyebrow_ja").then((r) => r.json()),
    ])
      .then(([ko, en, ja]) => {
        if (ko.value) setHeroEyebrowKo(ko.value);
        if (en.value) setHeroEyebrowEn(en.value);
        if (ja.value) setHeroEyebrowJa(ja.value);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/site-settings?key=films_featured_competition_id")
      .then((r) => r.json())
      .then((d) => {
        if (d.value) setFeaturedCompetitionId(d.value);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/site-settings?key=home_featured_competition_id")
      .then((r) => r.json())
      .then((d) => {
        if (d.value) setHomeFeaturedCompId(d.value);
      })
      .catch(() => {});
  }, []);

  const inputFlex = cn(adminTokens.input, "min-w-0 flex-1");

  return (
    <div className={cn(adminTokens.card, "mt-4")}>
      <h2 className={adminTokens.sectionHeader}>사이트 설정</h2>
      {savedMessage ? <span className="mb-3 block text-[11px] text-emerald-400">{savedMessage}</span> : null}

      <div className="space-y-4">
        <div>
          <label className={adminTokens.inputLabel}>Films 히어로 배너 텍스트</label>
          <div className="mb-3 flex gap-1 rounded-md border border-white/[0.06] bg-white/[0.02] p-1">
            {(
              [
                { code: "ko" as const, label: "KR KO" },
                { code: "en" as const, label: "US EN" },
                { code: "ja" as const, label: "JP JA" },
              ] as const
            ).map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setEyebrowLangTab(lang.code)}
                className={cn(
                  "h-7 flex-1 rounded text-[11px] font-medium uppercase tracking-wider transition",
                  eyebrowLangTab === lang.code ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70",
                )}
              >
                {lang.label}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <input
              value={eyebrowLangTab === "ko" ? heroEyebrowKo : eyebrowLangTab === "en" ? heroEyebrowEn : heroEyebrowJa}
              onChange={(e) => {
                if (eyebrowLangTab === "ko") setHeroEyebrowKo(e.target.value);
                else if (eyebrowLangTab === "en") setHeroEyebrowEn(e.target.value);
                else setHeroEyebrowJa(e.target.value);
              }}
              className={inputFlex}
              placeholder={
                eyebrowLangTab === "ko"
                  ? "예: 제1회 Genova AI 단편영화 공모전"
                  : eyebrowLangTab === "en"
                    ? "e.g. 1ST GENOVA AI FILM COMPETITION"
                    : "例: 第1回 Genova AI 映画コンペ"
              }
            />
            <button
              type="button"
              disabled={heroEyebrowLoading}
              onClick={async () => {
                setHeroEyebrowLoading(true);
                try {
                  await Promise.all([
                    fetch("/api/site-settings", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ key: "films_hero_eyebrow_ko", value: heroEyebrowKo }),
                    }),
                    fetch("/api/site-settings", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ key: "films_hero_eyebrow_en", value: heroEyebrowEn }),
                    }),
                    fetch("/api/site-settings", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ key: "films_hero_eyebrow_ja", value: heroEyebrowJa }),
                    }),
                  ]);
                  onMessage("저장되었습니다.");
                  flashSaved();
                } finally {
                  setHeroEyebrowLoading(false);
                }
              }}
              className={cn(adminTokens.buttonSecondary, "h-9 shrink-0 px-3")}
            >
              {heroEyebrowLoading ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>

        <div>
          <label className={adminTokens.inputLabel}>Films 히어로 배너 공모전</label>
          <div className="flex items-end gap-2">
            <select
              value={featuredCompetitionId}
              onChange={(e) => setFeaturedCompetitionId(e.target.value)}
              className={inputFlex}
            >
              <option value="">공모전 선택 안함</option>
              {competitions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={featuredLoading}
              onClick={async () => {
                setFeaturedLoading(true);
                try {
                  await fetch("/api/site-settings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ key: "films_featured_competition_id", value: featuredCompetitionId }),
                  });
                  onMessage("저장되었습니다.");
                  flashSaved();
                } finally {
                  setFeaturedLoading(false);
                }
              }}
              className={cn(adminTokens.buttonSecondary, "h-9 shrink-0 px-3")}
            >
              {featuredLoading ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>

        <div>
          <label className={adminTokens.inputLabel}>홈 배너 공모전</label>
          <div className="flex items-end gap-2">
            <select value={homeFeaturedCompId} onChange={(e) => setHomeFeaturedCompId(e.target.value)} className={inputFlex}>
              <option value="">자동 선택 (진행 중인 공모전)</option>
              {competitions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={homeFeaturedLoading}
              onClick={async () => {
                setHomeFeaturedLoading(true);
                try {
                  await fetch("/api/site-settings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ key: "home_featured_competition_id", value: homeFeaturedCompId }),
                  });
                  onMessage("저장되었습니다.");
                  flashSaved();
                } finally {
                  setHomeFeaturedLoading(false);
                }
              }}
              className={cn(adminTokens.buttonSecondary, "h-9 shrink-0 px-3")}
            >
              {homeFeaturedLoading ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
