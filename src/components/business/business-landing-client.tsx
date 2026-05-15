import Link from "next/link";
import { ArrowRight, Sparkles, Users, Zap, Trophy, CheckCircle2 } from "lucide-react";
import { AnimateIn } from "@/components/animate-in";
import { BusinessApplyButton } from "./business-apply-button";

const VALUE_PROPS = [
  {
    icon: Users,
    title: "수백 명의 AI 크리에이터",
    desc: "Genova의 검증된 AI 영상 크리에이터들이 당신의 브랜드를 위해 경쟁합니다.",
  },
  {
    icon: Zap,
    title: "기존 광고 비용의 1/10",
    desc: "에이전시 의뢰 대신 공모전 형식으로 다양한 시안을 합리적인 비용에 확보합니다.",
  },
  {
    icon: Trophy,
    title: "독창적이고 다양한 결과물",
    desc: "한 가지 답이 아닌, 수십 개의 서로 다른 크리에이티브를 받아보세요.",
  },
];

const PROCESS_STEPS = [
  { num: "01", title: "상담 신청", desc: "예산, 일정, 컨셉을 알려주세요. 24시간 내 담당자가 연락드립니다." },
  { num: "02", title: "기획 & 설계", desc: "Genova 팀이 공모전 요강, 심사 기준, 상금 구조를 함께 설계합니다." },
  { num: "03", title: "공모전 오픈", desc: "Genova 플랫폼에서 공모전이 공개되고 크리에이터들의 출품이 시작됩니다." },
  { num: "04", title: "심사 & 선정", desc: "전문 심사위원과 클라이언트가 함께 수상작을 선정합니다." },
  { num: "05", title: "정산 & 인도", desc: "수상작 영상의 사용 권리와 함께 정산이 완료됩니다." },
];

const FAQ = [
  {
    q: "최소 예산은 얼마인가요?",
    a: "프로젝트 규모에 따라 다릅니다. 상담을 통해 적정 예산을 함께 산정해드립니다.",
  },
  {
    q: "결과물 사용 권리는 누구에게 있나요?",
    a: "수상작에 한해 클라이언트에게 광고/마케팅 사용 권리가 부여됩니다. 세부 조건은 계약 시 확정됩니다.",
  },
  {
    q: "기간은 얼마나 걸리나요?",
    a: "평균적으로 기획 1주, 모집 4주, 심사 2주로 총 7주 내외 소요됩니다.",
  },
  {
    q: "개인도 신청 가능한가요?",
    a: "네, 개인 크리에이터, 1인 사업자, 스타트업 모두 신청 가능합니다.",
  },
];

export function BusinessLandingClient() {
  return (
    <div className="-mt-16 min-h-screen bg-[#0a0a0a]">
      {/* Hero */}
      <div className="relative pt-16">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute left-1/2 top-0 h-[500px] w-[1000px] -translate-x-1/2 rounded-full"
            style={{
              background: "radial-gradient(ellipse, rgba(127,119,221,0.15) 0%, transparent 70%)",
              filter: "blur(80px)",
            }}
          />
          <div
            className="absolute right-0 top-40 h-72 w-72 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(83,74,183,0.18) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
        </div>

        <div
          className="pointer-events-none absolute left-0 right-0 top-16 h-px"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(127,119,221,0.5) 30%, rgba(175,169,236,0.3) 60%, transparent)",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-20">
          <AnimateIn delay={0.05}>
            <div className="mb-6 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-[#7F77DD]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#AFA9EC]">
                For Brands & Creators
              </span>
            </div>

            <h1 className="text-[56px] font-black leading-[1.05] tracking-[-0.02em] text-white">
              당신의 제품으로
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #AFA9EC 0%, #7F77DD 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                AI 영상 공모전을 열어보세요
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-white/55">
              Genova가 기획부터 운영, 심사, 정산까지 전담합니다.
              <br />
              수많은 AI 크리에이터들이 당신의 브랜드를 위해 경쟁하고, 가장 뛰어난 영상을 받아보세요.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <BusinessApplyButton
                className="group inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-bold text-white transition-all duration-300 hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, #534AB7 0%, #7B6FE8 100%)",
                  boxShadow: "0 8px 32px rgba(83,74,183,0.5)",
                }}
              >
                간단한 폼 작성하기
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </BusinessApplyButton>
              <Link
                href="/competition"
                className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.03] px-6 py-3 text-[14px] font-bold text-white/70 transition hover:border-white/25 hover:bg-white/[0.06] hover:text-white"
              >
                진행 중인 공모전 보기
              </Link>
            </div>
            <p className="mt-4 text-[12px] text-white/35">
              ✓ 무료 · 1분이면 충분합니다 · 결정은 상담 후에
            </p>
          </AnimateIn>
        </div>
      </div>

      {/* Value Propositions */}
      <div className="mx-auto max-w-6xl px-6 pb-24">
        <AnimateIn delay={0.06}>
          <div className="mb-10 flex items-center gap-2">
            <span className="text-[10px] text-[#7F77DD]">✦</span>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7F77DD]/75">
              Why Genova
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {VALUE_PROPS.map((item) => (
              <div
                key={item.title}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.1] p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#7F77DD]/30 hover:shadow-[0_0_32px_rgba(127,119,221,0.2)]"
                style={{
                  background:
                    "linear-gradient(135deg, var(--tint-purple-08) 0%, rgba(83,74,183,0.04) 50%, rgba(10,10,10,0.6) 100%)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 16px rgba(0,0,0,0.2)",
                }}
              >
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{
                    background: "linear-gradient(135deg, rgba(83,74,183,0.4) 0%, rgba(127,119,221,0.2) 100%)",
                    boxShadow: "0 4px 16px var(--tint-accent-25)",
                  }}
                >
                  <item.icon className="h-5 w-5 text-[#AFA9EC]" />
                </div>
                <h3 className="text-[16px] font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/50">{item.desc}</p>
              </div>
            ))}
          </div>
        </AnimateIn>
      </div>

      {/* Process */}
      <div className="mx-auto max-w-6xl px-6 pb-24">
        <AnimateIn delay={0.06}>
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <div className="mb-1.5 flex items-center gap-1.5">
                <span className="text-[10px] text-[#7F77DD]">✦</span>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7F77DD]/75">
                  Process
                </p>
              </div>
              <h2
                className="text-[32px] font-black tracking-tight text-white"
                style={{ letterSpacing: "-0.02em" }}
              >
                진행 프로세스
              </h2>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            {PROCESS_STEPS.map((step, idx) => (
              <div
                key={step.num}
                className="relative rounded-2xl border border-white/[0.08] bg-[#0a0a0a]/40 p-5 backdrop-blur-xl"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className="text-[28px] font-black leading-none"
                    style={{
                      background: "linear-gradient(135deg, #AFA9EC 0%, #534AB7 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {step.num}
                  </span>
                  {idx < PROCESS_STEPS.length - 1 && (
                    <ArrowRight className="hidden h-3.5 w-3.5 text-white/20 md:block" />
                  )}
                </div>
                <h3 className="text-[14px] font-bold text-white">{step.title}</h3>
                <p className="mt-1.5 text-[11px] leading-relaxed text-white/45">{step.desc}</p>
              </div>
            ))}
          </div>
        </AnimateIn>
      </div>

      {/* FAQ */}
      <div className="mx-auto max-w-4xl px-6 pb-24">
        <AnimateIn delay={0.06}>
          <div className="mb-10 flex items-center gap-2">
            <span className="text-[10px] text-[#7F77DD]">✦</span>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7F77DD]/75">
              FAQ
            </p>
          </div>
          <div className="space-y-3">
            {FAQ.map((item) => (
              <div
                key={item.q}
                className="rounded-2xl border border-white/[0.08] bg-[#0a0a0a]/40 p-5 backdrop-blur-xl"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#7F77DD]" />
                  <div>
                    <h3 className="text-[14px] font-bold text-white">{item.q}</h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-white/55">{item.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AnimateIn>
      </div>

      {/* Bottom CTA */}
      <div className="mx-auto max-w-6xl px-6 pb-24">
        <AnimateIn delay={0.06}>
          <div
            className="relative overflow-hidden rounded-3xl border border-white/[0.1] p-12 text-center backdrop-blur-xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(127,119,221,0.15) 0%, rgba(83,74,183,0.08) 50%, rgba(10,10,10,0.6) 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.3)",
            }}
          >
            <div
              className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(127,119,221,0.3) 0%, transparent 70%)",
                filter: "blur(60px)",
              }}
            />
            <div className="relative">
              <h2
                className="text-[36px] font-black leading-tight tracking-tight text-white"
                style={{ letterSpacing: "-0.02em" }}
              >
                먼저 폼만 작성해보세요
              </h2>
              <p className="mt-3 text-[14px] text-white/55">
                1분이면 끝납니다. 24시간 내 담당자가 연락드립니다.
              </p>
              <BusinessApplyButton
                className="group mt-8 inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-[14px] font-bold text-white transition-all duration-300 hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, #534AB7 0%, #7B6FE8 100%)",
                  boxShadow: "0 8px 32px rgba(83,74,183,0.5)",
                }}
              >
                폼 작성하기
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </BusinessApplyButton>
            </div>
          </div>
        </AnimateIn>
      </div>
    </div>
  );
}
