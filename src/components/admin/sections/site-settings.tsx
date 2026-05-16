"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/genova/language-provider";
import { adminTokens } from "@/lib/admin-styles";
import type { Competition } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

/**
 * POST a site-setting value and throw on non-2xx so the caller's
 * try/catch sees the failure.  Without this guard a 403 / 500 from
 * /api/site-settings would silently resolve and the UI would show
 * "저장되었습니다." even though the row never landed in the DB. (G2)
 */
async function postSiteSetting(key: string, value: string): Promise<void> {
  const res = await fetch("/api/site-settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) {
    let detail = "";
    try {
      const data = (await res.json()) as { error?: string };
      detail = data?.error ?? "";
    } catch {
      /* non-json body — ignore */
    }
    throw new Error(detail || `HTTP ${res.status}`);
  }
}

export function SiteSettings({
  competitions,
  onMessage,
}: {
  competitions: Competition[];
  onMessage: (message: string) => void;
}) {
  const { t } = useI18n();
  const [heroEyebrowKo, setHeroEyebrowKo] = useState("");
  const [heroEyebrowEn, setHeroEyebrowEn] = useState("");
  const [heroEyebrowJa, setHeroEyebrowJa] = useState("");
  const [eyebrowLangTab, setEyebrowLangTab] = useState<"ko" | "en" | "ja">("ko");
  const [heroEyebrowLoading, setHeroEyebrowLoading] = useState(false);
  const [homeFeaturedCompId, setHomeFeaturedCompId] = useState("");
  const [homeFeaturedLoading, setHomeFeaturedLoading] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashSaved = () => {
    setSavedMessage(t("adminSiteSettings.savedFlash", "✓ Saved"));
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
      <h2 className={adminTokens.sectionHeader}>{t("adminSiteSettings.header", "Site Settings")}</h2>
      {savedMessage ? <span className="mb-3 block text-[11px] text-emerald-400">{savedMessage}</span> : null}

      <div className="space-y-4">
        <div>
          <label className={adminTokens.inputLabel}>{t("adminSiteSettings.filmsHeroLabel", "Films Hero Banner Text")}</label>
          {/* 언어 탭 라벨은 고정 코드 표기라 번역 대상 아님 */}
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
                  eyebrowLangTab === lang.code ? "bg-white/10 text-white" : "text-white/35 hover:text-white/70",
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
                  ? t("adminSiteSettings.filmsHeroPlaceholderKo", "e.g. 1st Genova AI Short Film Competition")
                  : eyebrowLangTab === "en"
                    ? t("adminSiteSettings.filmsHeroPlaceholderEn", "e.g. 1ST GENOVA AI FILM COMPETITION")
                    : t("adminSiteSettings.filmsHeroPlaceholderJa", "e.g. 1st Genova AI Film Competition")
              }
            />
            <button
              type="button"
              disabled={heroEyebrowLoading}
              onClick={async () => {
                setHeroEyebrowLoading(true);
                try {
                  await Promise.all([
                    postSiteSetting("films_hero_eyebrow_ko", heroEyebrowKo),
                    postSiteSetting("films_hero_eyebrow_en", heroEyebrowEn),
                    postSiteSetting("films_hero_eyebrow_ja", heroEyebrowJa),
                  ]);
                  onMessage(t("adminSiteSettings.saveSuccess", "Saved."));
                  flashSaved();
                } catch (e) {
                  onMessage(
                    e instanceof Error
                      ? t("adminSiteSettings.saveFailedDetail", "Save failed: {message}").replace("{message}", e.message)
                      : t("adminSiteSettings.saveFailed", "Save failed"),
                  );
                } finally {
                  setHeroEyebrowLoading(false);
                }
              }}
              className={cn(adminTokens.buttonSecondary, "h-9 shrink-0 px-3")}
            >
              {heroEyebrowLoading
                ? t("adminSiteSettings.saving", "Saving...")
                : t("adminSiteSettings.save", "Save")}
            </button>
          </div>
        </div>

        <div>
          <label className={adminTokens.inputLabel}>{t("adminSiteSettings.homeBannerLabel", "Home Banner Competition")}</label>
          <div className="flex items-end gap-2">
            <select value={homeFeaturedCompId} onChange={(e) => setHomeFeaturedCompId(e.target.value)} className={inputFlex}>
              <option value="">{t("adminSiteSettings.homeBannerAuto", "Auto (ongoing competition)")}</option>
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
                  await postSiteSetting("home_featured_competition_id", homeFeaturedCompId);
                  onMessage(t("adminSiteSettings.saveSuccess", "Saved."));
                  flashSaved();
                } catch (e) {
                  onMessage(
                    e instanceof Error
                      ? t("adminSiteSettings.saveFailedDetail", "Save failed: {message}").replace("{message}", e.message)
                      : t("adminSiteSettings.saveFailed", "Save failed"),
                  );
                } finally {
                  setHomeFeaturedLoading(false);
                }
              }}
              className={cn(adminTokens.buttonSecondary, "h-9 shrink-0 px-3")}
            >
              {homeFeaturedLoading
                ? t("adminSiteSettings.saving", "Saving...")
                : t("adminSiteSettings.save", "Save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
