import Link from "next/link";
import { Upload, Ticket, Gift, ChevronDown } from "lucide-react";
import type { Locale } from "@/lib/i18n/translations";
import { LotteryUploadCta } from "./lottery-upload-cta";

/**
 * 응모권 추첨 안내 콘텐츠 (공유).
 *
 * /lottery 페이지(서버)와 사이드바 모달(클라이언트)이 같은 본문을
 * 쓰도록 분리.  순수 렌더 컴포넌트 — locale 을 prop 으로 받아
 * 서버/클라이언트 어디서든 사용 가능 ("use client" 불필요).
 *
 * 정적 콘텐츠가 많아 i18n 키 폭증을 피하려 로컬 CONTENT 객체를
 * locale 로 분기 (translations.ts 비오염).
 */

type Step = { icon: "upload" | "ticket" | "gift"; title: string; desc: string };
type Faq = { q: string; a: string };
type LotteryContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  stepsTitle: string;
  steps: Step[];
  eligTitle: string;
  eligibility: string[];
  faqTitle: string;
  faq: Faq[];
  ctaUpload: string;
  ctaCompetition: string;
};

export const LOTTERY_GUIDE_CONTENT: Record<Locale, LotteryContent> = {
  ko: {
    eyebrow: "Genova 응모권 추첨",
    title: "영상을 올리면, 매월 추첨에 자동 참여됩니다",
    subtitle:
      "조건을 충족한 영상을 업로드하면 진행 중인 모든 공모전에 자동으로 응모권이 등록됩니다. 매월 공정한 무작위 추첨으로 당첨자에게 상금을 드립니다.",
    stepsTitle: "어떻게 진행되나요",
    steps: [
      {
        icon: "upload",
        title: "1 · 영상 업로드",
        desc: "30초 이상 영상을 올리고, 업로드 화면에서 “본인이 직접 제작한 영상” 에 체크합니다.",
      },
      {
        icon: "ticket",
        title: "2 · 자동 응모",
        desc: "업로드 즉시 진행 중인 모든 공모전에 응모권이 등록됩니다. 매월 최대 5장까지 받을 수 있습니다.",
      },
      {
        icon: "gift",
        title: "3 · 매월 추첨 · 당첨",
        desc: "공모전마다 5명을 추첨해 1인당 $100 USD를 드립니다. 당첨 시 알림과 이메일이 발송됩니다.",
      },
    ],
    eligTitle: "응모권 발급 조건",
    eligibility: [
      "영상 길이가 30초 이상이어야 합니다.",
      "업로드 시 “본인이 직접 제작한 영상” 동의에 체크해야 합니다.",
      "매월 1일 0시(한국 시간) 기준으로 최대 5장까지 발급됩니다.",
      "신고로 회수된 응모권도 그달의 사용 수에 포함됩니다 (페널티 정책).",
    ],
    faqTitle: "자주 묻는 질문",
    faq: [
      {
        q: "응모권은 어떻게 받나요?",
        a: "별도 신청 없이, 조건을 충족한 영상을 업로드하면 자동으로 발급·응모됩니다.",
      },
      {
        q: "여러 공모전에 동시에 응모되나요?",
        a: "네. 업로드 시점에 진행 중인 모든 공모전 풀에 자동으로 들어갑니다.",
      },
      {
        q: "추첨은 공정한가요?",
        a: "추첨에 사용된 시드값이 기록·보존되어 같은 조건이면 항상 같은 결과가 나오는 결정론적 방식입니다. 운영진이 임의로 결과를 바꿀 수 없습니다.",
      },
      {
        q: "한 사람이 여러 번 당첨될 수 있나요?",
        a: "한 공모전에서는 1인 1상만 보장됩니다. 다른 공모전에서는 별개로 당첨될 수 있습니다.",
      },
      {
        q: "당첨되면 무엇을 해야 하나요?",
        a: "당첨 알림과 이메일에 담긴 링크로 접속해 이메일 인증 후 상금 수령 정보를 제출합니다. 제출 기한은 1달이며, 마감 3일·1일 전에 리마인더가 발송됩니다.",
      },
      {
        q: "기한 내 정보를 제출하지 않으면요?",
        a: "제출 기한이 지나면 해당 당첨은 자동으로 만료되고, 빈 자리는 재추첨될 수 있습니다.",
      },
    ],
    ctaUpload: "영상 업로드하기",
    ctaCompetition: "진행 중인 공모전 보기",
  },
  en: {
    eyebrow: "Genova entry lottery",
    title: "Upload a film, get auto-entered into the monthly draw",
    subtitle:
      "Upload an eligible film and you're automatically entered into every running competition. Each month a fair random draw awards cash prizes to winners.",
    stepsTitle: "How it works",
    steps: [
      {
        icon: "upload",
        title: "1 · Upload a film",
        desc: "Upload a film at least 30s long and tick “This is my own original work” on the upload screen.",
      },
      {
        icon: "ticket",
        title: "2 · Auto-entered",
        desc: "An entry ticket is registered to every running competition right away — up to 5 per month.",
      },
      {
        icon: "gift",
        title: "3 · Monthly draw",
        desc: "Each competition draws 5 winners at $100 USD each. Winners get an in-app notice and an email.",
      },
    ],
    eligTitle: "Ticket requirements",
    eligibility: [
      "The film must be at least 30 seconds long.",
      "You must tick the “my own original work” attestation on upload.",
      "Up to 5 tickets per month, reset on the 1st at 00:00 KST.",
      "Tickets revoked via reports still count toward your monthly total (penalty policy).",
    ],
    faqTitle: "FAQ",
    faq: [
      {
        q: "How do I get tickets?",
        a: "No application needed — uploading an eligible film issues and enters a ticket automatically.",
      },
      {
        q: "Am I entered into multiple competitions?",
        a: "Yes. At upload time you're entered into every competition that's currently running.",
      },
      {
        q: "Is the draw fair?",
        a: "The seed used for the draw is recorded and preserved — it's deterministic, so the same pool always yields the same result. Operators cannot alter outcomes.",
      },
      {
        q: "Can one person win multiple times?",
        a: "One prize per person per competition. You can still win separately in other competitions.",
      },
      {
        q: "What do I do if I win?",
        a: "Open the link in the win notice / email, verify your email, then submit payout info. You have 1 month; reminders go out 3 and 1 days before the deadline.",
      },
      {
        q: "What if I miss the deadline?",
        a: "The win expires automatically and the slot may be redrawn.",
      },
    ],
    ctaUpload: "Upload a film",
    ctaCompetition: "See running competitions",
  },
  ja: {
    eyebrow: "Genova 応募券抽選",
    title: "動画を投稿すると、毎月の抽選に自動参加",
    subtitle:
      "条件を満たす動画を投稿すると、開催中のすべてのコンペに自動で応募券が登録されます。毎月、公正な抽選で当選者に賞金をお渡しします。",
    stepsTitle: "仕組み",
    steps: [
      {
        icon: "upload",
        title: "1 · 動画を投稿",
        desc: "30秒以上の動画を投稿し、投稿画面で「本人が制作したオリジナル作品」にチェックします。",
      },
      {
        icon: "ticket",
        title: "2 · 自動応募",
        desc: "投稿と同時に開催中の全コンペに応募券が登録されます。毎月最大5枚まで。",
      },
      {
        icon: "gift",
        title: "3 · 毎月抽選",
        desc: "コンペごとに5名を抽選し、1人あたり$100 USDをお渡しします。当選時は通知とメールが届きます。",
      },
    ],
    eligTitle: "応募券の発行条件",
    eligibility: [
      "動画は30秒以上である必要があります。",
      "投稿時に「本人制作」同意にチェックが必要です。",
      "毎月1日0時(韓国時間)基準で最大5枚まで発行。",
      "通報で回収された応募券もその月の使用数に含まれます(ペナルティ)。",
    ],
    faqTitle: "よくある質問",
    faq: [
      {
        q: "応募券はどうやって受け取りますか？",
        a: "申請不要。条件を満たす動画を投稿すると自動で発行・応募されます。",
      },
      {
        q: "複数のコンペに同時に応募されますか？",
        a: "はい。投稿時点で開催中の全コンペプールに自動で入ります。",
      },
      {
        q: "抽選は公正ですか？",
        a: "抽選に使われたシード値が記録・保存され、同条件なら常に同じ結果になる決定論的方式です。運営が結果を変更することはできません。",
      },
      {
        q: "1人が複数回当選できますか？",
        a: "1つのコンペでは1人1賞のみ。別のコンペでは別途当選できます。",
      },
      {
        q: "当選したら何をすればいいですか？",
        a: "当選通知/メールのリンクからメール認証後、賞金受取情報を提出します。期限は1ヶ月、締切3日・1日前にリマインダーが届きます。",
      },
      {
        q: "期限内に提出しないと？",
        a: "当選は自動的に失効し、空き枠は再抽選される場合があります。",
      },
    ],
    ctaUpload: "動画を投稿",
    ctaCompetition: "開催中のコンペを見る",
  },
};

const STEP_ICON = {
  upload: Upload,
  ticket: Ticket,
  gift: Gift,
} as const;

/**
 * variant:
 *  - "page"  : /lottery 풀 페이지 (현재 기본).
 *  - "modal" : 사이드바 모달 본문.  hero 폭/여백을 줄이고 CTA 에
 *              "전체 페이지로 보기" 를 추가 (모달은 닫기 UX 별도).
 */
export function LotteryGuideContent({
  locale,
  variant = "page",
}: {
  locale: Locale;
  variant?: "page" | "modal";
}) {
  const c = LOTTERY_GUIDE_CONTENT[locale] ?? LOTTERY_GUIDE_CONTENT.en;
  const isModal = variant === "modal";

  return (
    <div className={isModal ? "" : "mx-auto max-w-[920px] px-6 pb-20 pt-10 sm:px-8"}>
      {/* Hero */}
      <div className={isModal ? "" : "text-center"}>
        <p className="text-[12px] font-bold uppercase tracking-[0.25em] text-[#AFA9EC]/80">
          {c.eyebrow}
        </p>
        <h1
          className={
            isModal
              ? "mt-2 bg-clip-text text-xl font-black leading-tight text-transparent"
              : "mt-3 bg-clip-text text-2xl font-black leading-tight text-transparent sm:text-[34px]"
          }
          style={{ backgroundImage: "linear-gradient(135deg, #fff 0%, #AFA9EC 100%)" }}
        >
          {c.title}
        </h1>
        <p
          className={
            isModal
              ? "mt-3 text-[13px] leading-relaxed text-white/55"
              : "mx-auto mt-4 max-w-[640px] text-[14px] leading-relaxed text-white/55"
          }
        >
          {c.subtitle}
        </p>
      </div>

      {/* Steps */}
      <h2
        className={cnHeading(isModal)}
      >
        {c.stepsTitle}
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {c.steps.map((s) => {
          const Icon = STEP_ICON[s.icon];
          return (
            <div
              key={s.title}
              className="rounded-2xl border p-5"
              style={{
                border: "1px solid rgba(127,119,221,0.18)",
                background:
                  "linear-gradient(160deg, rgba(16,12,32,0.92) 0%, rgba(8,6,20,0.96) 100%)",
                boxShadow:
                  "0 0 30px rgba(83,74,183,0.08), inset 0 1px 0 rgba(127,119,221,0.15)",
              }}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7F77DD]/15 text-[#AFA9EC]">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-[14px] font-bold text-white">{s.title}</h3>
              <p className="mt-1.5 text-[12px] leading-relaxed text-white/55">
                {s.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Eligibility */}
      <h2 className={cnHeading(isModal)}>{c.eligTitle}</h2>
      <ul className="space-y-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
        {c.eligibility.map((e) => (
          <li key={e} className="flex gap-2.5 text-[13px] text-white/65">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7F77DD]" />
            {e}
          </li>
        ))}
      </ul>

      {/* FAQ */}
      <h2 className={cnHeading(isModal)}>{c.faqTitle}</h2>
      <div className="space-y-2">
        {c.faq.map((f) => (
          <details
            key={f.q}
            className="group rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[13px] font-semibold text-white/85">
              {f.q}
              <ChevronDown className="h-4 w-4 shrink-0 text-white/35 transition group-open:rotate-180" />
            </summary>
            <p className="mt-2.5 text-[13px] leading-relaxed text-white/55">
              {f.a}
            </p>
          </details>
        ))}
      </div>

      {/* CTA — 업로드는 페이지 대신 항상 팝업(모달) */}
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <LotteryUploadCta label={c.ctaUpload} />
        <Link
          href="/competition"
          className="rounded-xl border px-5 py-2.5 text-[13px] font-semibold text-white/80 transition hover:text-white"
          style={{
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          {c.ctaCompetition}
        </Link>
      </div>
    </div>
  );
}

function cnHeading(isModal: boolean) {
  return isModal
    ? "mt-8 mb-4 text-[13px] font-bold uppercase tracking-[0.18em] text-white/45"
    : "mt-14 mb-5 text-[13px] font-bold uppercase tracking-[0.18em] text-white/45";
}
