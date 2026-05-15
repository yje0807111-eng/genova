"use client";

import { Mail, Phone, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteBusinessInquiryAction,
  updateBusinessInquiryNotesAction,
  updateBusinessInquiryStatusAction,
  type BusinessInquiryItem,
  type BusinessInquiryStatus,
} from "@/app/actions/business-inquiries";
import { useI18n } from "@/components/genova/language-provider";
import { adminTokens } from "@/lib/admin-styles";
import { cn } from "@/lib/utils/cn";

type TFn = (key: string, fallback: string) => string;

const statusLabels = (t: TFn): Record<BusinessInquiryStatus, string> => ({
  new: t("adminBizInquiry.statusNew", "New"),
  contacted: t("adminBizInquiry.statusContacted", "Contacted"),
  in_progress: t("adminBizInquiry.statusInProgress", "In Progress"),
  closed: t("adminBizInquiry.statusClosed", "Closed"),
});

const budgetLabels = (t: TFn): Record<string, string> => ({
  under_1m: t("adminBizInquiry.budgetUnder1m", "Under 1M KRW"),
  "1m_5m": t("adminBizInquiry.budget1m5m", "1M–5M KRW"),
  "5m_10m": t("adminBizInquiry.budget5m10m", "5M–10M KRW"),
  over_10m: t("adminBizInquiry.budgetOver10m", "Over 10M KRW"),
  tbd: t("adminBizInquiry.budgetTbd", "To be discussed"),
});

export function BusinessInquiryManagement({
  inquiries,
  onMessage,
  initialStatusFilter,
}: {
  inquiries: BusinessInquiryItem[];
  onMessage: (message: string) => void;
  /** 대시보드 액션 칩 진입 시 초기 상태 필터(new 등). */
  initialStatusFilter?: string | null;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const STATUS_LABELS = statusLabels(t);
  const BUDGET_LABELS = budgetLabels(t);
  const [loading, setLoading] = useState(false);
  const [local, setLocal] = useState<BusinessInquiryItem[]>(inquiries);
  const [statusFilter, setStatusFilter] = useState<"all" | BusinessInquiryStatus>(
    initialStatusFilter &&
      ["new", "contacted", "in_progress", "closed"].includes(initialStatusFilter)
      ? (initialStatusFilter as BusinessInquiryStatus)
      : "all",
  );
  const [typeFilter, setTypeFilter] = useState<"all" | "individual" | "business">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  // G5: free-text search across name / email / company / phone / message.
  const [search, setSearch] = useState("");

  useEffect(() => setLocal(inquiries), [inquiries]);

  const filtered = useMemo(() => {
    let result = [...local];
    if (statusFilter !== "all") result = result.filter((i) => i.status === statusFilter);
    if (typeFilter !== "all") result = result.filter((i) => i.type === typeFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((i) =>
        [
          i.contactName,
          i.email,
          i.companyName,
          i.phone,
          i.productDescription,
          i.competitionConcept,
          i.notes,
        ]
          .filter((s): s is string => Boolean(s))
          .some((s) => s.toLowerCase().includes(q)),
      );
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [local, statusFilter, typeFilter, search]);

  const newCount = local.filter((i) => i.status === "new").length;

  const handleStatusChange = async (id: string, status: BusinessInquiryStatus) => {
    setLoading(true);
    setLocal((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    const res = await updateBusinessInquiryStatusAction(id, status);
    setLoading(false);
    onMessage(
      res.ok
        ? t("adminBizInquiry.toastStatusChanged", "Status updated.")
        : res.message ?? t("adminBizInquiry.toastFailed", "Operation failed."),
    );
    if (res.ok) router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("adminBizInquiry.confirmDelete", "Delete this inquiry?"))) return;
    setLoading(true);
    setLocal((prev) => prev.filter((i) => i.id !== id));
    const res = await deleteBusinessInquiryAction(id);
    setLoading(false);
    onMessage(
      res.ok
        ? t("adminBizInquiry.toastDeleted", "Deleted.")
        : res.message ?? t("adminBizInquiry.toastFailed", "Operation failed."),
    );
    if (res.ok) router.refresh();
  };

  const handleSaveNote = async (id: string) => {
    const note = noteDrafts[id] ?? "";
    setSavingNoteId(id);
    const res = await updateBusinessInquiryNotesAction(id, note);
    setSavingNoteId(null);
    if (res.ok) {
      setLocal((prev) => prev.map((i) => (i.id === id ? { ...i, adminNotes: note } : i)));
      onMessage(t("adminBizInquiry.toastNoteSaved", "Note saved."));
      router.refresh();
    } else {
      onMessage(res.message ?? t("adminBizInquiry.toastSaveFailed", "Save failed."));
    }
  };

  const filterSelectSm = cn(adminTokens.input, "min-w-[110px] cursor-pointer text-[12px]");

  return (
    <div className={cn(adminTokens.card, "mt-4")}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h2 className={cn(adminTokens.sectionHeader, "!mb-0")}>
            {t("adminBizInquiry.title", "Business Inquiries")}
          </h2>
          {newCount > 0 && (
            <span className={cn(adminTokens.badge, adminTokens.badgeDanger)}>
              {newCount} {t("adminBizInquiry.badgeNew", "New")}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* G5: free-text search */}
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t(
              "adminBizInquiry.searchPlaceholder",
              "Search (name / email / company / content)",
            )}
            className={cn(adminTokens.input, "min-w-[180px] text-[12px]")}
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            className={filterSelectSm}
          >
            <option value="all">{t("adminBizInquiry.filterAllTypes", "All types")}</option>
            <option value="business">{t("adminBizInquiry.typeBusiness", "Business")}</option>
            <option value="individual">{t("adminBizInquiry.typeIndividual", "Individual")}</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className={filterSelectSm}
          >
            <option value="all">{t("adminBizInquiry.filterAllStatus", "All status")}</option>
            <option value="new">{t("adminBizInquiry.statusNew", "New")}</option>
            <option value="contacted">{t("adminBizInquiry.statusContacted", "Contacted")}</option>
            <option value="in_progress">
              {t("adminBizInquiry.statusInProgress", "In Progress")}
            </option>
            <option value="closed">{t("adminBizInquiry.statusClosed", "Closed")}</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] py-10 text-center">
          <p className="text-[12px] font-medium text-white/55">
            {t("adminBizInquiry.emptyTitle", "No inquiries yet.")}
          </p>
          <p className="mx-auto mt-1 max-w-md text-[10px] leading-relaxed text-white/35">
            {t(
              "adminBizInquiry.emptyDesc",
              "Business inquiries submitted from the /business page will appear here. A tab badge notifies you when new inquiries arrive.",
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className="rounded-md border border-white/[0.06] bg-white/[0.02] transition hover:border-white/[0.1]"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span
                      className={cn(
                        "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        item.type === "business"
                          ? "bg-sky-500/15 text-sky-300"
                          : "bg-emerald-500/15 text-emerald-300",
                      )}
                    >
                      {item.type === "business"
                        ? t("adminBizInquiry.typeBusiness", "Business")
                        : t("adminBizInquiry.typeIndividual", "Individual")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[13px] font-semibold text-white">
                          {item.contactName}
                          {item.companyName && (
                            <span className="ml-1.5 text-white/35">· {item.companyName}</span>
                          )}
                        </p>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-white/35">
                        {item.email}
                        {item.budgetRange && ` · ${BUDGET_LABELS[item.budgetRange] ?? item.budgetRange}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-[10px] text-white/30">
                      {new Date(item.createdAt).toLocaleDateString("ko-KR", {
                        month: "numeric",
                        day: "numeric",
                      })}
                    </span>
                    <select
                      value={item.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        void handleStatusChange(item.id, e.target.value as BusinessInquiryStatus);
                      }}
                      disabled={loading}
                      className={cn(
                        adminTokens.input,
                        "min-w-[100px] cursor-pointer text-[11px]",
                        item.status === "new" && "border-amber-400/40 text-amber-300",
                        item.status === "contacted" && "border-sky-400/40 text-sky-300",
                        item.status === "in_progress" && "border-violet-400/40 text-violet-300",
                        item.status === "closed" && "border-white/10 text-white/35",
                      )}
                    >
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-white/[0.06] px-4 py-3">
                    <div className="grid gap-3 text-[12px] md:grid-cols-2">
                      <DetailField label={t("adminBizInquiry.fieldEmail", "Email")}>
                        <a
                          href={`mailto:${item.email}`}
                          // G9: when the operator opens mail-client from
                          // a `new` inquiry, auto-flip the row to
                          // 'contacted' optimistically.  No round-trip
                          // gating — they're leaving the page anyway.
                          // If the auto-flip fails, the manual select
                          // beside the row is still the source of truth.
                          onClick={() => {
                            if (item.status === "new") {
                              void handleStatusChange(item.id, "contacted");
                            }
                          }}
                          className="inline-flex items-center gap-1 text-sky-300 hover:underline"
                        >
                          <Mail className="h-3 w-3" />
                          {item.email}
                        </a>
                      </DetailField>
                      {item.phone && (
                        <DetailField label={t("adminBizInquiry.fieldPhone", "Phone")}>
                          <a
                            href={`tel:${item.phone}`}
                            className="inline-flex items-center gap-1 text-sky-300 hover:underline"
                          >
                            <Phone className="h-3 w-3" />
                            {item.phone}
                          </a>
                        </DetailField>
                      )}
                      {item.budgetRange && (
                        <DetailField label={t("adminBizInquiry.fieldBudget", "Budget")}>
                          {BUDGET_LABELS[item.budgetRange] ?? item.budgetRange}
                        </DetailField>
                      )}
                      {item.desiredTimeline && (
                        <DetailField label={t("adminBizInquiry.fieldTimeline", "Desired timeline")}>
                          {item.desiredTimeline}
                        </DetailField>
                      )}
                      {item.productDescription && (
                        <DetailField
                          label={t("adminBizInquiry.fieldProduct", "Product / Service")}
                          full
                        >
                          <p className="whitespace-pre-wrap text-white/70">{item.productDescription}</p>
                        </DetailField>
                      )}
                      {item.competitionConcept && (
                        <DetailField
                          label={t("adminBizInquiry.fieldConcept", "Competition concept")}
                          full
                        >
                          <p className="whitespace-pre-wrap text-white/70">{item.competitionConcept}</p>
                        </DetailField>
                      )}
                      {item.notes && (
                        <DetailField
                          label={t("adminBizInquiry.fieldNotes", "Additional notes")}
                          full
                        >
                          <p className="whitespace-pre-wrap text-white/70">{item.notes}</p>
                        </DetailField>
                      )}
                    </div>
                    <div className="mt-4 border-t border-white/[0.06] pt-3">
                      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/35">
                        {t("adminBizInquiry.adminMemo", "Admin memo")}
                      </p>
                      <textarea
                        value={noteDrafts[item.id] ?? item.adminNotes ?? ""}
                        onChange={(e) =>
                          setNoteDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                        placeholder={t(
                          "adminBizInquiry.memoPlaceholder",
                          "Record consultation progress, follow-up tasks, etc.",
                        )}
                        rows={3}
                        className={cn(adminTokens.input, "w-full resize-none text-[12px]")}
                      />
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-[10px] text-white/30">
                          {(noteDrafts[item.id] ?? item.adminNotes ?? "") !== (item.adminNotes ?? "")
                            ? t("adminBizInquiry.unsavedChanges", "Unsaved changes")
                            : ""}
                        </p>
                        <button
                          type="button"
                          onClick={() => void handleSaveNote(item.id)}
                          disabled={savingNoteId === item.id}
                          className={cn(adminTokens.buttonPrimary, "text-[11px]")}
                        >
                          {savingNoteId === item.id
                            ? t("adminBizInquiry.saving", "Saving...")
                            : t("adminBizInquiry.saveMemo", "Save memo")}
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => void handleDelete(item.id)}
                        disabled={loading}
                        className={cn(adminTokens.buttonDanger, "inline-flex items-center gap-1")}
                      >
                        <Trash2 className="h-3 w-3" />
                        {t("adminBizInquiry.delete", "Delete")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DetailField({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={full ? "md:col-span-2" : undefined}>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-white/35">{label}</p>
      <div className="text-[12px] text-white/80">{children}</div>
    </div>
  );
}
