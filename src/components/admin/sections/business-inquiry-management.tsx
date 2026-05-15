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
import { adminTokens } from "@/lib/admin-styles";
import { cn } from "@/lib/utils/cn";

const STATUS_LABELS: Record<BusinessInquiryStatus, string> = {
  new: "신규",
  contacted: "연락 완료",
  in_progress: "진행 중",
  closed: "종료",
};

const BUDGET_LABELS: Record<string, string> = {
  under_1m: "100만원 이하",
  "1m_5m": "100-500만원",
  "5m_10m": "500-1,000만원",
  over_10m: "1,000만원 이상",
  tbd: "협의 후 결정",
};

export function BusinessInquiryManagement({
  inquiries,
  onMessage,
}: {
  inquiries: BusinessInquiryItem[];
  onMessage: (message: string) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [local, setLocal] = useState<BusinessInquiryItem[]>(inquiries);
  const [statusFilter, setStatusFilter] = useState<"all" | BusinessInquiryStatus>("all");
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
          i.name,
          i.email,
          i.companyName,
          i.phone,
          i.message,
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
    onMessage(res.ok ? "상태가 변경되었습니다." : res.message ?? "실패했습니다.");
    if (res.ok) router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 신청을 삭제하시겠습니까?")) return;
    setLoading(true);
    setLocal((prev) => prev.filter((i) => i.id !== id));
    const res = await deleteBusinessInquiryAction(id);
    setLoading(false);
    onMessage(res.ok ? "삭제되었습니다." : res.message ?? "실패했습니다.");
    if (res.ok) router.refresh();
  };

  const handleSaveNote = async (id: string) => {
    const note = noteDrafts[id] ?? "";
    setSavingNoteId(id);
    const res = await updateBusinessInquiryNotesAction(id, note);
    setSavingNoteId(null);
    if (res.ok) {
      setLocal((prev) => prev.map((i) => (i.id === id ? { ...i, adminNotes: note } : i)));
      onMessage("메모가 저장되었습니다.");
      router.refresh();
    } else {
      onMessage(res.message ?? "저장 실패");
    }
  };

  const filterSelectSm = cn(adminTokens.input, "min-w-[110px] cursor-pointer text-[12px]");

  return (
    <div className={cn(adminTokens.card, "mt-4")}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h2 className={cn(adminTokens.sectionHeader, "!mb-0")}>비즈니스 상담 신청</h2>
          {newCount > 0 && (
            <span className={cn(adminTokens.badge, adminTokens.badgeDanger)}>{newCount} 신규</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* G5: free-text search */}
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="검색 (이름/이메일/회사/내용)"
            className={cn(adminTokens.input, "min-w-[180px] text-[12px]")}
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            className={filterSelectSm}
          >
            <option value="all">전체 유형</option>
            <option value="business">기업</option>
            <option value="individual">개인</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className={filterSelectSm}
          >
            <option value="all">전체 상태</option>
            <option value="new">신규</option>
            <option value="contacted">연락 완료</option>
            <option value="in_progress">진행 중</option>
            <option value="closed">종료</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-[12px] text-white/35">신청 내역이 없습니다.</p>
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
                      {item.type === "business" ? "기업" : "개인"}
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
                      <DetailField label="이메일">
                        <a
                          href={`mailto:${item.email}`}
                          className="inline-flex items-center gap-1 text-sky-300 hover:underline"
                        >
                          <Mail className="h-3 w-3" />
                          {item.email}
                        </a>
                      </DetailField>
                      {item.phone && (
                        <DetailField label="연락처">
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
                        <DetailField label="예산">
                          {BUDGET_LABELS[item.budgetRange] ?? item.budgetRange}
                        </DetailField>
                      )}
                      {item.desiredTimeline && (
                        <DetailField label="희망 일정">{item.desiredTimeline}</DetailField>
                      )}
                      {item.productDescription && (
                        <DetailField label="제품/서비스" full>
                          <p className="whitespace-pre-wrap text-white/70">{item.productDescription}</p>
                        </DetailField>
                      )}
                      {item.competitionConcept && (
                        <DetailField label="공모전 컨셉" full>
                          <p className="whitespace-pre-wrap text-white/70">{item.competitionConcept}</p>
                        </DetailField>
                      )}
                      {item.notes && (
                        <DetailField label="추가 요청" full>
                          <p className="whitespace-pre-wrap text-white/70">{item.notes}</p>
                        </DetailField>
                      )}
                    </div>
                    <div className="mt-4 border-t border-white/[0.06] pt-3">
                      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/35">
                        어드민 메모
                      </p>
                      <textarea
                        value={noteDrafts[item.id] ?? item.adminNotes ?? ""}
                        onChange={(e) =>
                          setNoteDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                        placeholder="상담 진행 메모, 후속 작업 등을 기록하세요."
                        rows={3}
                        className={cn(adminTokens.input, "w-full resize-none text-[12px]")}
                      />
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-[10px] text-white/30">
                          {(noteDrafts[item.id] ?? item.adminNotes ?? "") !== (item.adminNotes ?? "")
                            ? "저장되지 않은 변경사항"
                            : ""}
                        </p>
                        <button
                          type="button"
                          onClick={() => void handleSaveNote(item.id)}
                          disabled={savingNoteId === item.id}
                          className={cn(adminTokens.buttonPrimary, "text-[11px]")}
                        >
                          {savingNoteId === item.id ? "저장 중..." : "메모 저장"}
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
                        삭제
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
