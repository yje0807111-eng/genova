"use client";

import Link from "next/link";
import { useI18n } from "@/components/genova/language-provider";
import type { TrophyRow } from "@/lib/queries/trophies-queries";
import type { UserAward } from "@/lib/queries/profile-queries";
import { ProfileTrophiesSection } from "@/components/profile/profile-trophies-section";

export function ProfileAwardsTab({ awards, trophies }: { awards: UserAward[]; trophies: TrophyRow[] }) {
  const { t } = useI18n();
  return (
    <section className="space-y-10" aria-labelledby="awards-tab-heading">
      <h2 id="awards-tab-heading" className="text-xl font-bold text-[#F8F7FF]">
        {t("profile.awardsTrophies")}
      </h2>

      <div className="space-y-3">
        <div className="flex flex-col gap-1 border-b border-white/10 pb-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7F77DD]">{t("profile.recordedAwards")}</p>
          <p className="text-sm text-[#AFA9EC]">{t("profile.awardHistoryHint")}</p>
        </div>
        {awards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 bg-[#1A1535]/60 px-6 py-10 text-center">
            <p className="text-sm text-[#F8F7FF]">{t("profile.noRecordedAwards")}</p>
            <p className="mt-2 text-sm text-[#AFA9EC]">
              {t("profile.noRecordedAwardsHint")}
            </p>
            <Link
              href="/competition"
              className="mt-4 inline-flex rounded-[6px] bg-[#534AB7] px-4 py-2 text-sm font-semibold text-[#EEEDFE] transition hover:bg-[#655cd0]"
            >
              {t("profile.browseCompetitions")}
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {awards.map((a) => (
              <li
                key={a.id}
                className="rounded-lg border border-white/10 bg-[#1A1535]/80 px-4 py-3 text-sm text-[#F8F7FF]"
              >
                <span className="font-semibold">{a.awardTitle}</span>
                {a.competitionTitle ? <span className="text-[#AFA9EC]"> · {a.competitionTitle}</span> : null}
                {a.awardedAt ? (
                  <span className="mt-1 block text-xs text-[#7F77DD]">{a.awardedAt}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <ProfileTrophiesSection trophies={trophies} />
    </section>
  );
}
