"use client";

import { ExternalLink, Mail, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteAllResolvedOperatorMessagesAction,
  deleteOperatorMessageAction,
  updateOperatorMessageStatusAction,
  type OperatorMessageItem,
  type OperatorMessageStatus,
} from "@/app/actions/operator-messages";
import { adminTokens } from "@/lib/admin-styles";
import { cn } from "@/lib/utils/cn";
import { useI18n } from "@/components/genova/language-provider";

function formatRelativeTime(
  date: string,
  t: (key: string, fallback: string) => string,
) {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return t("adminReport.timeJustNow", "Just now");
  if (hours < 24)
    return t("adminReport.timeHoursAgo", "{hours}h ago").replace(
      "{hours}",
      String(hours),
    );
  const days = Math.floor(hours / 24);
  if (days < 7)
    return t("adminReport.timeDaysAgo", "{days}d ago").replace(
      "{days}",
      String(days),
    );
  return new Date(date).toLocaleDateString("ko-KR");
}

function categoryLabel(
  c: OperatorMessageItem["category"],
  t: (key: string, fallback: string) => string,
) {
  if (c === "bug") return t("contact.catBug", "Bug");
  if (c === "suggestion") return t("contact.catSuggestion", "Suggestion");
  if (c === "error") return t("contact.catError", "Error report");
  return t("contact.catOther", "Other");
}

export function OperatorMessageManagement({
  messages,
  onMessage,
  initialStatusFilter,
}: {
  messages: OperatorMessageItem[];
  onMessage: (message: string) => void;
  initialStatusFilter?: string | null;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [local, setLocal] = useState<OperatorMessageItem[]>(messages);
  const [statusFilter, setStatusFilter] = useState<
    "all" | OperatorMessageStatus
  >(
    initialStatusFilter &&
      ["open", "reviewing", "resolved"].includes(initialStatusFilter)
      ? (initialStatusFilter as OperatorMessageStatus)
      : "all",
  );
  const [categoryFilter, setCategoryFilter] = useState<
    "all" | OperatorMessageItem["category"]
  >("all");
  const [search, setSearch] = useState("");

  const [prev, setPrev] = useState(messages);
  if (prev !== messages) {
    setPrev(messages);
    setLocal(messages);
  }

  const filtered = useMemo(() => {
    let result = [...local];
    if (statusFilter !== "all")
      result = result.filter((m) => m.status === statusFilter);
    if (categoryFilter !== "all")
      result = result.filter((m) => m.category === categoryFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((m) =>
        [m.message, m.email, m.pageUrl]
          .filter((v): v is string => Boolean(v))
          .some((v) => v.toLowerCase().includes(q)),
      );
    }
    result.sort((a, b) => {
      if (a.status === "open" && b.status !== "open") return -1;
      if (a.status !== "open" && b.status === "open") return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return result;
  }, [local, statusFilter, categoryFilter, search]);

  const openCount = useMemo(
    () => local.filter((m) => m.status === "open").length,
    [local],
  );

  const filterSelectSm = cn(
    adminTokens.input,
    "min-w-[110px] cursor-pointer text-[12px]",
  );

  const callWithOptimistic = async (
    fn: () => Promise<{ ok: boolean; message?: string }>,
    optimistic?: () => void,
  ) => {
    setLoading(true);
    if (optimistic) optimistic();
    try {
      const res = await fn();
      onMessage(
        res.ok
          ? t("adminReport.saved", "Saved.")
          : (res.message ?? t("adminReport.failed", "Failed.")),
      );
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = (id: string, status: OperatorMessageStatus) => {
    void callWithOptimistic(
      () => updateOperatorMessageStatusAction(id, status),
      () =>
        setLocal((p) =>
          p.map((m) => (m.id === id ? { ...m, status } : m)),
        ),
    );
  };

  const handleDelete = (id: string) => {
    if (!confirm(t("adminMsg.deleteConfirm", "Delete this message?"))) return;
    void callWithOptimistic(
      () => deleteOperatorMessageAction(id),
      () => setLocal((p) => p.filter((m) => m.id !== id)),
    );
  };

  const handleDeleteAll = () => {
    const resolved = local.filter((m) => m.status === "resolved").length;
    if (resolved === 0) {
      onMessage(
        t("adminMsg.noResolved", "There are no resolved messages."),
      );
      return;
    }
    if (
      !confirm(
        t(
          "adminMsg.deleteAllConfirm",
          "Permanently delete {count} resolved message(s)? (open / reviewing are protected.)",
        ).replace("{count}", String(resolved)),
      )
    )
      return;
    void callWithOptimistic(
      () => deleteAllResolvedOperatorMessagesAction(),
      () => setLocal((p) => p.filter((m) => m.status !== "resolved")),
    );
  };

  return (
    <div className={cn(adminTokens.card, "mt-4")}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h2 className={cn(adminTokens.sectionHeader, "!mb-0")}>
            {t("adminMsg.title", "Operator Messages")}
          </h2>
          <span className="font-mono text-[11px] text-white/30">
            {local.length}
          </span>
          {openCount > 0 ? (
            <span
              className={cn(
                adminTokens.badge,
                adminTokens.badgeDanger,
                "ml-0 sm:ml-1",
              )}
            >
              Open {openCount}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t(
              "adminMsg.searchPlaceholder",
              "Search (message/email/page)",
            )}
            className={cn(adminTokens.input, "min-w-[180px] text-[12px]")}
          />
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | OperatorMessageStatus)
            }
            className={filterSelectSm}
          >
            <option value="all">
              {t("adminReport.statusAll", "Status: All")}
            </option>
            <option value="open">Open</option>
            <option value="reviewing">Reviewing</option>
            <option value="resolved">Resolved</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(
                e.target.value as "all" | OperatorMessageItem["category"],
              )
            }
            className={filterSelectSm}
          >
            <option value="all">
              {t("adminMsg.categoryAll", "Category: All")}
            </option>
            <option value="bug">{t("contact.catBug", "Bug")}</option>
            <option value="suggestion">
              {t("contact.catSuggestion", "Suggestion")}
            </option>
            <option value="error">
              {t("contact.catError", "Error report")}
            </option>
            <option value="other">{t("contact.catOther", "Other")}</option>
          </select>
          {local.length > 0 ? (
            <button
              type="button"
              disabled={loading}
              onClick={handleDeleteAll}
              className={adminTokens.buttonDanger}
            >
              {t("adminReport.deleteAll", "Delete all")}
            </button>
          ) : null}
        </div>
      </div>

      <div className="max-h-[520px] min-h-0 space-y-1 overflow-y-auto pr-0.5">
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] py-12 text-center">
            <p className="text-[12px] text-white/35">
              {local.length === 0
                ? t("adminMsg.empty", "No messages")
                : t("adminReport.emptyNoMatch", "No messages match the filter")}
            </p>
          </div>
        ) : (
          filtered.map((m) => (
            <div
              key={m.id}
              className="group rounded-lg border border-white/[0.04] bg-white/[0.01] px-3 py-2.5 transition hover:border-white/[0.08] hover:bg-white/[0.03]"
            >
              <div className="flex items-start gap-3">
                <div className="flex w-[84px] shrink-0 flex-col gap-1">
                  {m.status === "open" ? (
                    <span
                      className={cn(adminTokens.badge, adminTokens.badgeDanger)}
                    >
                      Open
                    </span>
                  ) : null}
                  {m.status === "reviewing" ? (
                    <span
                      className={cn(adminTokens.badge, adminTokens.badgeWarning)}
                    >
                      Reviewing
                    </span>
                  ) : null}
                  {m.status === "resolved" ? (
                    <span
                      className={cn(adminTokens.badge, adminTokens.badgeSuccess)}
                    >
                      Resolved
                    </span>
                  ) : null}
                  <span className="text-[10px] uppercase tracking-wider text-white/35">
                    {categoryLabel(m.category, t)}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-white/85">
                    {m.message}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-white/40">
                    {m.email ? (
                      <a
                        href={`mailto:${m.email}`}
                        className="inline-flex items-center gap-1 text-[#AFA9EC]/80 hover:text-[#AFA9EC]"
                      >
                        <Mail size={11} />
                        {m.email}
                      </a>
                    ) : (
                      <span className="text-white/30">
                        {t("adminMsg.noEmail", "No reply email")}
                      </span>
                    )}
                    {m.pageUrl ? (
                      <>
                        <span className="text-white/20">·</span>
                        <span className="truncate text-white/35">
                          {m.pageUrl}
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>

                <span className="hidden shrink-0 font-mono text-[10px] text-white/30 sm:inline-block">
                  {formatRelativeTime(m.createdAt, t)}
                </span>

                <div className="ml-auto flex shrink-0 items-center gap-1 opacity-100 transition-opacity sm:ml-0 [@media(hover:hover)]:sm:opacity-0 [@media(hover:hover)]:sm:group-hover:opacity-100">
                  {m.userId ? (
                    <button
                      type="button"
                      className={adminTokens.iconButton}
                      title={t("adminMsg.viewProfile", "Sender profile")}
                      onClick={() =>
                        window.open(
                          `/profile/${m.userId}`,
                          "_blank",
                          "noopener,noreferrer",
                        )
                      }
                    >
                      <ExternalLink size={13} />
                    </button>
                  ) : null}
                  <div className="ml-1 flex flex-wrap items-center gap-0.5 border-l border-white/[0.06] pl-2">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => updateStatus(m.id, "open")}
                      className={cn(
                        adminTokens.buttonGhost,
                        "h-8 px-2",
                        m.status === "open" ? "text-red-400" : "",
                      )}
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => updateStatus(m.id, "reviewing")}
                      className={cn(
                        adminTokens.buttonGhost,
                        "h-8 px-2",
                        m.status === "reviewing" ? "text-amber-400" : "",
                      )}
                    >
                      {t("adminReport.actionReview", "Review")}
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => updateStatus(m.id, "resolved")}
                      className={cn(
                        adminTokens.buttonGhost,
                        "h-8 px-2",
                        m.status === "resolved" ? "text-emerald-400" : "",
                      )}
                    >
                      {t("adminReport.actionResolve", "Resolve")}
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleDelete(m.id)}
                    className={adminTokens.iconButton}
                    title={t("adminReport.delete", "Delete")}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="mt-1 font-mono text-[10px] text-white/25 sm:hidden">
                {formatRelativeTime(m.createdAt, t)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
