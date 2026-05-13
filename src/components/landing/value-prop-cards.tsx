"use client";

import { useState } from "react";
import { Sparkles, Trophy, Briefcase, TrendingUp, X, AlertTriangle, Check } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
import type { Locale } from "@/lib/i18n/translations";

type Tri = { ko: string; en: string; ja: string };

function pick(tri: Tri, locale: Locale): string {
  return tri[locale];
}

const LABELS = {
  learnMore: {
    ko: "자세히 보기",
    en: "Learn more",
    ja: "詳しく見る",
  },
  importantNotes: {
    ko: "유의사항",
    en: "Important Notes",
    ja: "ご注意",
  },
} satisfies Record<string, Tri>;

type ValuePropConfig = {
  key: string;
  icon: typeof Sparkles;
  badge?: string;
  glow: string;
  accent: string;
  iconColor: string;
  copy: {
    title: Tri;
    desc: Tri;
    details: {
      intro: Tri;
      benefits: { title: Tri; desc: Tri }[];
      warnings?: Tri[];
    };
  };
};

const VALUE_PROPS: ValuePropConfig[] = [
  {
    key: "original",
    icon: Sparkles,
    glow: "rgba(127,119,221,0.4)",
    accent: "#7F77DD",
    iconColor: "#AFA9EC",
    copy: {
      title: { ko: "진짜 창작", en: "Real Creation", ja: "本物の創作" },
      desc: {
        ko: "프롬프트 복사가 아닌, 당신만의 시네마틱 비전",
        en: "Not prompt copies — your own cinematic vision",
        ja: "プロンプトのコピーではなく、あなただけのシネマティックビジョン",
      },
      details: {
        intro: {
          ko: "Genova는 단순한 프롬프트 복제 영상이 아닌, 진짜 창작자의 비전을 담은 작품을 위한 공간입니다.",
          en: "Genova is a space for works that embody real creators' visions, not mere prompt-replicated videos.",
          ja: "Genovaは単なるプロンプト複製動画ではなく、本物のクリエイターのビジョンを込めた作品のための空間です。",
        },
        benefits: [
          {
            title: { ko: "자체 편집 작품", en: "Self-Edited Works", ja: "自己編集作品" },
            desc: {
              ko: "여러 AI 도구를 조합하고 직접 편집한 시네마틱 작품을 환영합니다.",
              en: "We welcome cinematic works that combine multiple AI tools with hands-on editing.",
              ja: "複数のAIツールを組み合わせ、自ら編集したシネマティック作品を歓迎します。",
            },
          },
          {
            title: { ko: "스토리텔링 중심", en: "Storytelling First", ja: "ストーリーテリング重視" },
            desc: {
              ko: "단순 데모가 아닌, 캐릭터/플롯/감정이 있는 작품에 우선 노출 기회를 제공합니다.",
              en: "Not demos — works with characters, plot, and emotion get priority exposure.",
              ja: "単なるデモではなく、キャラクター・プロット・感情のある作品を優先的に露出します。",
            },
          },
          {
            title: { ko: "크리에이터 보호", en: "Creator Protection", ja: "クリエイター保護" },
            desc: {
              ko: "표절 신고 시스템과 검증을 통해 원작자의 권리를 보호합니다.",
              en: "Plagiarism reporting and verification protect original creators' rights.",
              ja: "盗用通報システムと検証により原作者の権利を保護します。",
            },
          },
        ],
        warnings: [
          {
            ko: "타인의 프롬프트를 그대로 복사한 영상은 제재 대상입니다.",
            en: "Copying others' prompts verbatim is subject to penalties.",
            ja: "他人のプロンプトをそのままコピーした動画は制裁対象です。",
          },
          {
            ko: "AI 도구 결과물을 편집 없이 그대로 업로드하는 것은 권장하지 않습니다.",
            en: "Uploading raw AI tool outputs without editing is discouraged.",
            ja: "AIツールの出力を編集せずそのままアップロードすることは推奨しません。",
          },
          {
            ko: "표절/도용 신고 누적 시 계정이 영구 정지될 수 있습니다.",
            en: "Repeated plagiarism reports may result in permanent account suspension.",
            ja: "盗用通報の累積によりアカウントが永久停止される場合があります。",
          },
        ],
      },
    },
  },
  {
    key: "competition",
    icon: Trophy,
    badge: "$1,000",
    glow: "rgba(255,200,80,0.35)",
    accent: "#FFC850",
    iconColor: "#FFD980",
    copy: {
      title: { ko: "글로벌 공모전", en: "Global Competitions", ja: "グローバルコンペ" },
      desc: {
        ko: "전 세계 크리에이터와 경쟁 · 실제 상금",
        en: "Compete worldwide · Real prizes",
        ja: "世界中のクリエイターと競争・実際の賞金",
      },
      details: {
        intro: {
          ko: "Genova는 매월 새로운 공모전을 개최하며, 전 세계 크리에이터에게 수상 기회와 상금을 제공합니다.",
          en: "Genova hosts new competitions monthly, offering prizes and recognition to creators worldwide.",
          ja: "Genovaは毎月新しいコンペを開催し、世界中のクリエイターに受賞機会と賞金を提供します。",
        },
        benefits: [
          {
            title: { ko: "실제 상금", en: "Real Prizes", ja: "実際の賞金" },
            desc: {
              ko: "1회 단편영화 공모전 총상금 $1,000. 회차마다 상금 규모가 확대됩니다.",
              en: "$1,000 total prize for the 1st short film competition. Prize pools grow each round.",
              ja: "第1回短編映画コンペ総賞金$1,000。回ごとに賞金規模が拡大します。",
            },
          },
          {
            title: { ko: "글로벌 노출", en: "Global Exposure", ja: "グローバル露出" },
            desc: {
              ko: "수상작은 Genova 메인과 추천 큐레이션에 노출되어 전 세계 시청자를 만납니다.",
              en: "Winners are featured on Genova's main and curation, reaching global viewers.",
              ja: "受賞作はGenovaメインと推薦キュレーションに露出され、世界中の視聴者と出会います。",
            },
          },
          {
            title: { ko: "공정한 심사", en: "Fair Judging", ja: "公正な審査" },
            desc: {
              ko: "내부 심사진 + 시청자 투표를 결합한 투명한 심사 시스템.",
              en: "Transparent judging combining internal panel and viewer votes.",
              ja: "内部審査陣+視聴者投票を組み合わせた透明な審査システム。",
            },
          },
        ],
        warnings: [
          {
            ko: "공모전 출품작은 출품 당시 작성된 작품이어야 합니다.",
            en: "Submissions must be created at the time of entry.",
            ja: "出品作は出品時に制作された作品である必要があります。",
          },
          {
            ko: "타 플랫폼 동시 출품작은 사전 고지 필요.",
            en: "Cross-platform submissions require prior disclosure.",
            ja: "他プラットフォーム同時出品作は事前告知が必要です。",
          },
          {
            ko: "수상 후 표절/규정 위반 발견 시 수상 취소 및 상금 회수.",
            en: "Awards may be revoked and prizes reclaimed if violations are found post-award.",
            ja: "受賞後、盗用・規定違反が発覚した場合は受賞取消・賞金回収。",
          },
        ],
      },
    },
  },
  {
    key: "brand",
    icon: Briefcase,
    glow: "rgba(175,169,236,0.35)",
    accent: "#AFA9EC",
    iconColor: "#C7C2F0",
    copy: {
      title: { ko: "브랜드 협업", en: "Brand Partnerships", ja: "ブランドコラボ" },
      desc: {
        ko: "당신의 작품으로 공모전 의뢰 매칭",
        en: "Brand-commissioned competitions for your work",
        ja: "あなたの作品でコンペ依頼マッチング",
      },
      details: {
        intro: {
          ko: "당신의 작품을 본 브랜드가 Genova에 직접 공모전을 의뢰합니다. 크리에이티브가 수익이 되는 구조.",
          en: "Brands that discover your work commission competitions directly through Genova. Creative work becomes income.",
          ja: "あなたの作品を見たブランドがGenovaに直接コンペを依頼します。クリエイティブが収益になる構造。",
        },
        benefits: [
          {
            title: { ko: "브랜드 의뢰 공모전", en: "Brand-Commissioned Competitions", ja: "ブランド依頼コンペ" },
            desc: {
              ko: "기업이 제품/서비스를 주제로 공모전을 열고 크리에이터들에게 의뢰합니다.",
              en: "Companies host competitions around their products and commission creators.",
              ja: "企業が製品・サービスをテーマにコンペを開催しクリエイターに依頼します。",
            },
          },
          {
            title: { ko: "기존 광고비의 1/10", en: "1/10th of Agency Cost", ja: "既存広告費の1/10" },
            desc: {
              ko: "에이전시 의뢰 대비 합리적 비용으로 다양한 시안 확보 가능.",
              en: "Get diverse concepts at a fraction of agency costs.",
              ja: "エージェンシー依頼比で合理的なコストで多様な案を確保可能。",
            },
          },
          {
            title: { ko: "수익 창출", en: "Earning Opportunity", ja: "収益創出" },
            desc: {
              ko: "공모전 우승 시 상금 외에도 추가 협업 기회로 이어집니다.",
              en: "Winning leads to additional collaboration opportunities beyond prizes.",
              ja: "コンペ優勝時には賞金以外にも追加コラボ機会につながります。",
            },
          },
        ],
      },
    },
  },
  {
    key: "monetization",
    icon: TrendingUp,
    badge: "Phase 2",
    glow: "rgba(100,200,150,0.35)",
    accent: "#64C896",
    iconColor: "#86D9B0",
    copy: {
      title: { ko: "크리에이터 수익화", en: "Creator Monetization", ja: "クリエイター収益化" },
      desc: {
        ko: "조회수 · 시청시간 기반 수익 분배 시스템",
        en: "Revenue share by views and watch time",
        ja: "再生数・視聴時間ベースの収益分配システム",
      },
      details: {
        intro: {
          ko: "Genova는 크리에이터가 작품으로 지속 가능한 수익을 창출하는 플랫폼을 지향합니다. 유튜브식 광고 수익 분배 모델을 준비 중입니다.",
          en: "Genova aims to be a platform where creators earn sustainable income from their work. A YouTube-style ad revenue share model is in preparation.",
          ja: "Genovaはクリエイターが作品で持続可能な収益を生み出すプラットフォームを目指します。YouTube式広告収益分配モデルを準備中です。",
        },
        benefits: [
          {
            title: { ko: "조회수 · 시청시간 기반", en: "Views & Watch Time Based", ja: "再生数・視聴時間ベース" },
            desc: {
              ko: "팔로워 일정 수준 달성 시, 영상 조회수와 시청 시간에 따라 수익이 분배됩니다.",
              en: "Once follower thresholds are met, revenue is distributed by views and watch time.",
              ja: "フォロワーが一定水準に達すると、再生数と視聴時間に応じて収益が分配されます。",
            },
          },
          {
            title: { ko: "공모전 + 수익화 이중 구조", en: "Dual: Prizes + Revenue", ja: "コンペ+収益化の二重構造" },
            desc: {
              ko: "공모전 상금과 별개로 평소 작품 활동만으로도 수익을 얻을 수 있습니다.",
              en: "Beyond competition prizes, regular uploads alone can generate income.",
              ja: "コンペ賞金とは別に、普段の作品活動だけでも収益を得られます。",
            },
          },
          {
            title: { ko: "투명한 정산", en: "Transparent Payouts", ja: "透明な精算" },
            desc: {
              ko: "월별 수익 리포트와 명확한 RPM 공개로 신뢰할 수 있는 수익 시스템을 만듭니다.",
              en: "Monthly reports and clear RPM disclosure build a trustworthy revenue system.",
              ja: "月別収益レポートと明確なRPM公開で信頼できる収益システムを作ります。",
            },
          },
        ],
        warnings: [
          {
            ko: "현재 베타 단계에서는 수익화 기능이 활성화되어 있지 않습니다.",
            en: "Monetization is not yet active in the current beta phase.",
            ja: "現在ベータ段階では収益化機能は有効化されていません。",
          },
          {
            ko: "광고주 확보 및 일정 트래픽 도달 시 단계적으로 도입됩니다.",
            en: "Will roll out in phases once advertisers and traffic thresholds are reached.",
            ja: "広告主確保および一定トラフィック到達時に段階的に導入されます。",
          },
          {
            ko: "정확한 활성화 시점과 수익 분배율은 정식 오픈 시 공지됩니다.",
            en: "Exact launch timing and revenue split will be announced at official release.",
            ja: "正確な有効化時期と収益分配率は正式オープン時に告知されます。",
          },
          {
            ko: "본 시스템은 향후 정책 및 시장 상황에 따라 변경될 수 있습니다.",
            en: "This system may change based on future policies and market conditions.",
            ja: "本システムは今後の方針および市場状況により変更される可能性があります。",
          },
        ],
      },
    },
  },
];

export function ValuePropCards() {
  const { locale } = useI18n();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const active = VALUE_PROPS.find((p) => p.key === openKey);
  const ActiveIcon = active?.icon;

  return (
    <>
      <div className="mb-20 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {VALUE_PROPS.map((item, i) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setOpenKey(item.key)}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.08] p-6 text-left transition-all duration-500 hover:-translate-y-1.5 hover:border-white/20"
              style={{
                background: "#1a1a1a",
                animation: `fade-in-up 0.6s ease-out ${i * 0.1}s both`,
              }}
            >
              {/* Accent top line */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-40 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, ${item.accent} 50%, transparent 100%)`,
                }}
              />
              {/* Glow orb */}
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-0 transition-all duration-700 group-hover:opacity-80 group-hover:scale-110"
                style={{
                  background: `radial-gradient(circle, ${item.glow} 0%, transparent 70%)`,
                  filter: "blur(30px)",
                }}
              />
              {/* Bottom hover glow */}
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-32 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background: `radial-gradient(ellipse at bottom, ${item.glow} 0%, transparent 70%)`,
                  filter: "blur(20px)",
                }}
              />
              {/* Dot texture */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.15]"
                style={{
                  backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)",
                  backgroundSize: "16px 16px",
                }}
              />
              <div className="relative">
                <div
                  className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                  style={{
                    borderColor: `${item.accent}40`,
                    background: `linear-gradient(135deg, ${item.accent}25 0%, ${item.accent}08 100%)`,
                    boxShadow: `0 0 0 1px ${item.accent}10, 0 8px 24px -8px ${item.glow}`,
                  }}
                >
                  <Icon
                    className="h-5 w-5 transition-all duration-500 group-hover:scale-110"
                    style={{ color: item.iconColor }}
                  />
                </div>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-[18px] font-black tracking-tight text-white">{pick(item.copy.title, locale)}</h3>
                  {item.badge && (
                    <span
                      className="rounded-full border px-2 py-0.5 text-[10px] font-black"
                      style={{
                        borderColor: `${item.accent}50`,
                        backgroundColor: `${item.accent}15`,
                        color: item.iconColor,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="mb-5 text-[13px] leading-relaxed text-white/55">{pick(item.copy.desc, locale)}</p>
                <div
                  className="inline-flex items-center gap-1.5 text-[12px] font-bold transition-all duration-300"
                  style={{ color: item.iconColor }}
                >
                  {pick(LABELS.learnMore, locale)}
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Modal */}
      {active && ActiveIcon && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setOpenKey(null)}
        >
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.1] p-8"
            style={{
              background: "#1a1a1a",
              animation: "fade-in-up 0.4s ease-out",
              maxHeight: "85vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-25"
              style={{
                background: `radial-gradient(circle, ${active.glow} 0%, transparent 70%)`,
                filter: "blur(50px)",
              }}
            />
            <button
              type="button"
              onClick={() => setOpenKey(null)}
              className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-white/35 transition hover:bg-white/[0.05] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative">
              <div
                className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${active.accent}55 0%, ${active.accent}28 100%)`,
                  boxShadow: `inset 0 1px 0 ${active.accent}66, 0 0 0 1px ${active.accent}44`,
                }}
              >
                <ActiveIcon className="h-6 w-6" style={{ color: active.iconColor }} />
              </div>

              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-[24px] font-black tracking-tight text-white">{pick(active.copy.title, locale)}</h2>
                {active.badge && (
                  <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black text-emerald-300">
                    {active.badge}
                  </span>
                )}
              </div>

              <p className="mb-6 text-[14px] leading-relaxed text-white/65">{pick(active.copy.details.intro, locale)}</p>

              <div className="mb-6 space-y-3">
                {active.copy.details.benefits.map((b, bi) => (
                  <div
                    key={`${active.key}-benefit-${bi}`}
                    className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                  >
                    <div
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${active.accent}33` }}
                    >
                      <Check className="h-3 w-3" style={{ color: active.iconColor }} />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-white">{pick(b.title, locale)}</p>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-white/50">{pick(b.desc, locale)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {active.copy.details.warnings && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                      {pick(LABELS.importantNotes, locale)}
                    </p>
                  </div>
                  <ul className="space-y-1.5">
                    {active.copy.details.warnings.map((w, wi) => (
                      <li key={`${active.key}-warn-${wi}`} className="text-[12px] leading-relaxed text-white/55">
                        · {pick(w, locale)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
