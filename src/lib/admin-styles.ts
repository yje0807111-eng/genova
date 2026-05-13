/**
 * Admin dashboard design tokens only.
 * Linear / Vercel Dashboard / Supabase Studio inspired: dense, solid surfaces, minimal purple accent.
 * Do not import into user-facing pages — keep separate from public UI.
 */
export const adminTokens = {
  // 카드
  card: "rounded-xl border border-white/[0.06] bg-[#0d0b1f] p-5",
  cardCompact: "rounded-lg border border-white/[0.06] bg-[#0d0b1f] p-3",

  // 섹션 헤더
  sectionHeader: "text-[13px] font-semibold uppercase tracking-[0.12em] text-white/50 mb-4",

  // 입력
  input:
    "h-9 rounded-md border border-white/[0.08] bg-[#0a0a0a] px-3 text-[13px] text-white placeholder:text-white/30 focus:border-white/[0.2] focus:outline-none transition-colors",
  inputLabel: "text-[11px] font-medium text-white/50 mb-1.5",

  // 버튼
  buttonPrimary:
    "h-8 px-3 rounded-md bg-white text-[#0a0a0a] text-[12px] font-semibold hover:bg-white/90 transition",
  buttonSecondary:
    "h-8 px-3 rounded-md border border-white/[0.1] bg-white/[0.04] text-white/70 text-[12px] font-medium hover:bg-white/[0.08] hover:text-white transition",
  buttonGhost: "h-8 px-3 text-[12px] text-white/50 hover:text-white transition",
  buttonDanger:
    "h-8 px-3 rounded-md border border-red-500/20 bg-red-500/[0.05] text-red-400 text-[12px] font-medium hover:bg-red-500/10 transition",

  // 아이콘 버튼 (정사각형)
  iconButton:
    "h-8 w-8 rounded-md flex items-center justify-center text-white/35 hover:text-white hover:bg-white/[0.06] transition",

  // 배지
  badge: "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider",
  badgeNeutral: "bg-white/[0.06] text-white/55",
  badgeSuccess: "bg-emerald-500/10 text-emerald-400",
  badgeWarning: "bg-amber-500/10 text-amber-400",
  badgeDanger: "bg-red-500/10 text-red-400",
  badgeInfo: "bg-sky-500/10 text-sky-400",

  // 구분선
  divider: "border-t border-white/[0.05]",

  // 테이블
  tableHeader: "text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35 px-3 py-2",
  tableRow: "border-t border-white/[0.04] hover:bg-white/[0.02] transition",
  tableCell: "px-3 py-2.5 text-[12px] text-white/80",
} as const;
