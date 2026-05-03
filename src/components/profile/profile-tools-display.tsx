import { getOrphanTools, groupSelectedToolsForView } from "@/lib/constants/ai-tools";
import { useI18n } from "@/components/genova/language-provider";

/** View mode: show selected tools grouped by category */
export function ProfileToolsDisplay({ tools }: { tools: string[] }) {
  const { t } = useI18n();
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
