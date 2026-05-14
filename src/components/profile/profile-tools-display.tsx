import { getOrphanTools, groupSelectedToolsForView } from "@/lib/constants/ai-tools";
import { getServerLocale, getServerT } from "@/lib/i18n/server";

/**
 * Server component — shows the user's AI-tool selections grouped by
 * category (with an "Other" bucket for orphan tools).  Previously
 * a client component, but it never had the `"use client"` directive
 * and used `useI18n()` directly (latent React Server Components bug
 * caught in the Phase B.1 audit).  B.2-6 fixes it by moving the
 * translation lookup to the server.
 *
 * Note: the inner `.map((t) => ...)` callback parameter shadowed the
 * `t` translator returned by `useI18n()`.  The new code keeps the
 * same shadowing — both `t`s are unambiguous at their use sites and
 * renaming would be a noisy diff.
 */
export async function ProfileToolsDisplay({ tools }: { tools: string[] }) {
  const locale = await getServerLocale();
  const t = getServerT(locale);
  const groups = groupSelectedToolsForView(tools);
  const orphans = getOrphanTools(tools);

  if (groups.length === 0 && orphans.length === 0) {
    return <p className="text-sm text-[#AFA9EC]">{t("profile.noAiTools")}</p>;
  }

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#AFA9EC]">{g.label}</p>
          <div className="flex flex-wrap gap-2">
            {g.tools.map((t) => (
              <span key={t} className="rounded-full bg-[#26215C] px-3 py-1.5 text-xs text-[#EEEDFE] ring-1 ring-white/10">
                {t}
              </span>
            ))}
          </div>
        </div>
      ))}
      {orphans.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#AFA9EC]">{t("common.other")}</p>
          <div className="flex flex-wrap gap-2">
            {orphans.map((t) => (
              <span key={t} className="rounded-full bg-[#26215C] px-3 py-1.5 text-xs text-[#EEEDFE] ring-1 ring-white/10">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
