"use client";

import { useI18n } from "@/components/genova/language-provider";

type Section = { h: string; p: string };
type Doc = { title: string; updated: string; intro: string; sections: Section[] };

// ⚠️ 초안 템플릿. 실제 서비스 정책·법무 검토 후 문구를 확정하세요.
// (개인정보 항목/보존기간/제3자, 준거법, 분쟁관할 등은 사업자 정보 기준으로 교체)
const TERMS: Record<"en" | "ko" | "ja", Doc> = {
  ko: {
    title: "이용약관",
    updated: "최종 업데이트: 2026-05-17 (초안)",
    intro:
      "본 약관은 Genova(이하 '서비스')의 이용 조건을 규정합니다. 서비스에 가입하거나 이용함으로써 본 약관에 동의하는 것으로 간주됩니다.",
    sections: [
      { h: "1. 서비스", p: "Genova는 AI 생성 영상의 스트리밍·공모전·창작자 커뮤니티를 제공하는 플랫폼입니다. 기능은 사전 통지 없이 변경·중단될 수 있습니다." },
      { h: "2. 계정", p: "이용자는 정확한 정보로 계정을 생성하고 계정 보안을 스스로 관리할 책임이 있습니다. 타인 계정 도용·부정 이용은 금지됩니다." },
      { h: "3. 콘텐츠와 권리", p: "업로드한 콘텐츠의 권리는 이용자에게 있으며, 이용자는 서비스 운영·홍보에 필요한 범위의 사용 권한을 서비스에 부여합니다. 타인의 권리를 침해하는 콘텐츠는 금지됩니다." },
      { h: "4. 공모전·응모권 추첨", p: "공모전 및 월간 응모권 추첨은 각 안내된 규칙에 따릅니다. 당첨 시 상품 수령을 위해 법적 이름·국가·결제 계정 정보 제출 및 본인 확인이 필요하며, 기한 내 미제출 시 자격이 소멸될 수 있습니다." },
      { h: "5. 금지 행위", p: "불법 콘텐츠, 스팸, 자동화 남용, 시스템 무력화 시도, 추첨·공모전 부정 행위 등을 금지합니다." },
      { h: "6. 책임의 한계", p: "서비스는 관련 법령이 허용하는 범위에서 '있는 그대로' 제공되며, 서비스 중단·데이터 손실·간접 손해에 대해 책임이 제한됩니다." },
      { h: "7. 약관 변경·문의", p: "약관은 변경될 수 있으며 중요한 변경 시 적절히 고지합니다. 문의: 운영자 이메일." },
    ],
  },
  en: {
    title: "Terms of Service",
    updated: "Last updated: 2026-05-17 (draft)",
    intro:
      "These Terms govern your use of Genova (the 'Service'). By creating an account or using the Service you agree to these Terms.",
    sections: [
      { h: "1. The Service", p: "Genova is a platform for streaming AI-generated films, competitions, and a creator community. Features may change or be discontinued without prior notice." },
      { h: "2. Accounts", p: "You must provide accurate information and are responsible for your account security. Impersonation and unauthorized use are prohibited." },
      { h: "3. Content & Rights", p: "You retain rights to content you upload and grant the Service the license needed to operate and promote it. Content infringing others' rights is prohibited." },
      { h: "4. Competitions & Lottery", p: "Competitions and the monthly entry lottery follow their stated rules. Winners must submit legal name, country, and payment account info and pass identity verification; failure to submit in time may forfeit the prize." },
      { h: "5. Prohibited Conduct", p: "Illegal content, spam, automated abuse, attempts to circumvent the system, and fraud in competitions/lottery are prohibited." },
      { h: "6. Limitation of Liability", p: "The Service is provided 'as is' to the extent permitted by law; liability for downtime, data loss, or indirect damages is limited." },
      { h: "7. Changes & Contact", p: "These Terms may change; we will give reasonable notice of material changes. Contact: operator email." },
    ],
  },
  ja: {
    title: "利用規約",
    updated: "最終更新: 2026-05-17 (ドラフト)",
    intro:
      "本規約はGenova（以下「本サービス」）の利用条件を定めます。アカウント登録または利用により本規約に同意したものとみなされます。",
    sections: [
      { h: "1. 本サービス", p: "GenovaはAI生成映像のストリーミング・コンペ・クリエイターコミュニティを提供します。機能は予告なく変更・終了する場合があります。" },
      { h: "2. アカウント", p: "正確な情報で登録し、アカウントの安全管理は利用者の責任です。なりすまし・不正利用は禁止します。" },
      { h: "3. コンテンツと権利", p: "アップロードしたコンテンツの権利は利用者に帰属し、運営・宣伝に必要な範囲の利用許諾を本サービスに付与します。他者の権利を侵害するコンテンツは禁止します。" },
      { h: "4. コンペ・抽選", p: "コンペおよび月次抽選は各規則に従います。当選時は法的氏名・国・支払いアカウント情報の提出と本人確認が必要で、期限内未提出の場合は資格を失う場合があります。" },
      { h: "5. 禁止行為", p: "違法コンテンツ、スパム、自動化の濫用、システム回避、コンペ・抽選の不正行為を禁止します。" },
      { h: "6. 責任の制限", p: "本サービスは法令の許す範囲で「現状有姿」で提供され、停止・データ損失・間接損害について責任を制限します。" },
      { h: "7. 変更・問い合わせ", p: "本規約は変更される場合があり、重要な変更時は適切に告知します。連絡先: 運営メール。" },
    ],
  },
};

const PRIVACY: Record<"en" | "ko" | "ja", Doc> = {
  ko: {
    title: "개인정보 처리방침",
    updated: "최종 업데이트: 2026-05-17 (초안)",
    intro:
      "Genova는 서비스 제공을 위해 필요한 최소한의 개인정보를 처리합니다. 본 방침은 수집 항목·목적·보관·제3자 제공을 안내합니다.",
    sections: [
      { h: "1. 수집 항목", p: "계정 이메일, 프로필 정보, 업로드한 영상 및 메타데이터, 시청·이용 기록. 응모권 추첨 당첨자의 경우 법적 이름, 국가, 결제 계정 이메일, 제출 IP를 추가로 수집합니다." },
      { h: "2. 이용 목적", p: "서비스 제공·인증, 공모전 및 추첨 운영, 상품 지급 및 본인 확인, 안내 이메일 발송, 부정 이용 방지." },
      { h: "3. 보관 기간", p: "목적 달성 시까지 보관 후 파기하며, 관련 법령상 보존 의무가 있는 경우 해당 기간 보관합니다. (구체 기간은 정책 확정 시 명시)" },
      { h: "4. 제3자·처리위탁", p: "인프라·기능 제공을 위해 Supabase(DB·인증), Mux(영상), Vercel(호스팅), Resend(이메일)를 이용합니다. 각 사는 처리에 필요한 범위에서만 데이터를 취급합니다." },
      { h: "5. 이용자 권리", p: "이용자는 본인 정보의 열람·정정·삭제·처리 정지를 요청할 수 있습니다. 계정 삭제 시 관련 데이터는 정책에 따라 삭제됩니다." },
      { h: "6. 보안", p: "전송 구간 암호화, 접근 통제(RLS), 민감 키의 서버 전용 보관 등 합리적 보호조치를 적용합니다." },
      { h: "7. 문의", p: "개인정보 관련 문의: 운영자 이메일." },
    ],
  },
  en: {
    title: "Privacy Policy",
    updated: "Last updated: 2026-05-17 (draft)",
    intro:
      "Genova processes the minimum personal data needed to provide the Service. This policy explains what we collect, why, how long we keep it, and third parties.",
    sections: [
      { h: "1. Data We Collect", p: "Account email, profile info, uploaded videos and metadata, viewing/usage logs. For lottery winners we additionally collect legal name, country, payment account email, and submission IP." },
      { h: "2. Purpose", p: "Service delivery and authentication, running competitions and the lottery, prize payout and identity verification, notification emails, and abuse prevention." },
      { h: "3. Retention", p: "Kept until the purpose is fulfilled, then deleted, except where law requires longer retention. (Concrete periods to be specified when finalized.)" },
      { h: "4. Processors / Third Parties", p: "We use Supabase (database/auth), Mux (video), Vercel (hosting), and Resend (email) to operate the Service; each handles data only as needed for processing." },
      { h: "5. Your Rights", p: "You may request access, correction, deletion, or restriction of your data. Deleting your account removes related data per our policy." },
      { h: "6. Security", p: "We apply reasonable safeguards: transport encryption, access control (RLS), and server-only storage of sensitive keys." },
      { h: "7. Contact", p: "Privacy inquiries: operator email." },
    ],
  },
  ja: {
    title: "プライバシーポリシー",
    updated: "最終更新: 2026-05-17 (ドラフト)",
    intro:
      "Genovaはサービス提供に必要な最小限の個人情報を取り扱います。本ポリシーは収集項目・目的・保管・第三者提供を説明します。",
    sections: [
      { h: "1. 収集項目", p: "アカウントメール、プロフィール、アップロード動画とメタデータ、視聴・利用ログ。抽選当選者は法的氏名・国・支払いアカウントメール・提出IPも収集します。" },
      { h: "2. 利用目的", p: "サービス提供・認証、コンペ/抽選の運営、賞品支払いと本人確認、通知メール送信、不正防止。" },
      { h: "3. 保管期間", p: "目的達成まで保管後に破棄し、法令で保存義務がある場合は当該期間保管します。（具体期間は確定時に明記）" },
      { h: "4. 第三者・委託", p: "インフラ・機能提供のためSupabase（DB/認証）、Mux（動画）、Vercel（ホスティング）、Resend（メール）を利用します。各社は処理に必要な範囲のみ取り扱います。" },
      { h: "5. 利用者の権利", p: "本人情報の開示・訂正・削除・処理停止を請求できます。アカウント削除時、関連データはポリシーに従い削除します。" },
      { h: "6. セキュリティ", p: "通信暗号化、アクセス制御(RLS)、機微なキーのサーバー限定保管など合理的な保護措置を講じます。" },
      { h: "7. 問い合わせ", p: "プライバシーに関する問い合わせ: 運営メール。" },
    ],
  },
};

/** Shared presentational body — used by the full page and the modal. */
export function LegalBody({ kind }: { kind: "terms" | "privacy" }) {
  const { locale } = useI18n();
  const loc = (["en", "ko", "ja"] as const).includes(locale as "en" | "ko" | "ja")
    ? (locale as "en" | "ko" | "ja")
    : "en";
  const doc = (kind === "terms" ? TERMS : PRIVACY)[loc];

  return (
    <>
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#AFA9EC]">
        Genova
      </p>
      <h1 className="mt-2 text-[24px] font-black tracking-tight md:text-[30px]">
        {doc.title}
      </h1>
      <p className="mt-2 text-[12px] text-white/40">{doc.updated}</p>
      <p className="mt-5 text-[14px] leading-relaxed text-white/65">
        {doc.intro}
      </p>
      <div className="mt-7 space-y-5">
        {doc.sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-[15px] font-bold text-white">{s.h}</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">
              {s.p}
            </p>
          </section>
        ))}
      </div>
    </>
  );
}

export function LegalPage({ kind }: { kind: "terms" | "privacy" }) {
  return (
    <main className="mx-auto min-h-[100svh] w-full max-w-[760px] px-6 py-16 text-white">
      <LegalBody kind={kind} />
    </main>
  );
}
