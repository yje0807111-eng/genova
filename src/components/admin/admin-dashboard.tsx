"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createCompetitionAction,
  setVideoAwardAction,
  setVideoFinalistAction,
  updateCompetitionStatusAction,
} from "@/app/actions/admin";
import { grantCompetitionTrophyAction, runWeeklyGenreTrophiesAction } from "@/app/actions/trophies-admin";
import type { Competition, Video } from "@/lib/types";

export function AdminDashboard({ competitions, videos }: { competitions: Competition[]; videos: Video[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    id: "",
    title: "",
    genre: "All",
    status: "Open",
    deadline: "",
    voteEnd: "",
    prizeInfo: "",
    sponsor: "",
  });
  const [trophyUserId, setTrophyUserId] = useState("");
  const [trophyCompetitionId, setTrophyCompetitionId] = useState("");
  const [trophyAward, setTrophyAward] = useState("대상");
  const [weeklyWeekStart, setWeeklyWeekStart] = useState("");

  const call = async (fn: () => Promise<{ ok: boolean; message?: string }>) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fn();
      setMessage(res.ok ? "Saved successfully." : res.message ?? "Failed");
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const inp =
    "w-full rounded-xl border border-white/[0.12] bg-[#0d0b20] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#7F77DD]/60 focus:ring-1 focus:ring-[#7F77DD]/30";
  const sectionBg = { background: "linear-gradient(135deg, rgba(20,17,50,0.98) 0%, rgba(10,8,28,0.99) 100%)" } as const;

  return (
    <div className="w-full pb-16">
      {/* 헤더 */}
      <div className="mb-5 rounded-2xl border border-white/[0.08] p-5" style={sectionBg}>
        <div className="flex items-end justify-between border-b border-white/[0.06] pb-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7F77DD]/60">Dashboard</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-white">Admin</h1>
          </div>
          {message && (
            <p
              className={`text-sm font-medium ${message.includes("success") || message === "Saved successfully." ? "text-emerald-400" : "text-red-400"}`}
            >
              {message}
            </p>
          )}
        </div>

        {/* 통계 */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: "Total Films", value: videos.length },
            { label: "Competitions", value: competitions.length },
            { label: "Active", value: competitions.filter((c) => c.status === "Open").length },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl border border-white/[0.06] p-4 text-center"
              style={{ background: "rgba(83,74,183,0.08)" }}
            >
              <p className="text-2xl font-black text-white">{value}</p>
              <p className="text-[11px] font-medium uppercase tracking-widest text-white/35">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* 공모전 생성 */}
        <div className="rounded-2xl border border-white/[0.08] p-5" style={sectionBg}>
          <h2 className="mb-4 border-b border-[#7F77DD]/20 pb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#AFA9EC]">
            Create Competition
          </h2>
          <div className="space-y-2">
            {(
              [
                ["id", "ID (optional)"],
                ["title", "Title"],
                ["genre", "Genre"],
                ["status", "Status"],
                ["deadline", "Deadline (ISO)"],
                ["voteEnd", "Vote End (ISO)"],
                ["prizeInfo", "Total Prize"],
                ["sponsor", "Sponsor"],
              ] as const
            ).map(([k, label]) => (
              <input
                key={k}
                value={form[k]}
                onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
                className={inp}
                placeholder={label}
              />
            ))}
            <button
              type="button"
              disabled={loading}
              onClick={() => void call(() => createCompetitionAction(form))}
              className="w-full rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #534AB7 0%, #7B6FE8 100%)",
                boxShadow: "0 4px 16px rgba(83,74,183,0.4)",
              }}
            >
              {loading ? "Creating..." : "Create Competition →"}
            </button>
          </div>
        </div>

        {/* 트로피 */}
        <div className="rounded-2xl border border-white/[0.08] p-5" style={sectionBg}>
          <h2 className="mb-4 border-b border-[#7F77DD]/20 pb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#AFA9EC]">
            Trophies
          </h2>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-white/60">Manual Competition Trophy</p>
            <input
              value={trophyUserId}
              onChange={(e) => setTrophyUserId(e.target.value)}
              className={inp}
              placeholder="User UUID"
            />
            <select
              value={trophyCompetitionId}
              onChange={(e) => setTrophyCompetitionId(e.target.value)}
              className={inp + " bg-[#0d0b20]"}
            >
              <option value="">Select competition</option>
              {competitions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <select value={trophyAward} onChange={(e) => setTrophyAward(e.target.value)} className={inp + " bg-[#0d0b20]"}>
              {["대상", "금상", "은상", "입선", "장려상"].map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                void call(() =>
                  grantCompetitionTrophyAction({
                    userId: trophyUserId.trim(),
                    competitionId: trophyCompetitionId.trim(),
                    award: trophyAward,
                  }),
                )
              }
              className="w-full rounded-xl border border-[#7F77DD]/30 py-2.5 text-sm font-semibold text-[#AFA9EC] transition hover:bg-[#534AB7]/20"
            >
              Grant Trophy
            </button>

            <div className="border-t border-white/[0.06] pt-3">
              <p className="mb-2 text-xs font-semibold text-white/60">Weekly Genre Trophies</p>
              <input
                value={weeklyWeekStart}
                onChange={(e) => setWeeklyWeekStart(e.target.value)}
                className={inp}
                placeholder="Week start YYYY-MM-DD (Monday)"
              />
              <button
                type="button"
                disabled={loading}
                onClick={() => void call(() => runWeeklyGenreTrophiesAction(weeklyWeekStart.trim() || undefined))}
                className="mt-2 w-full rounded-xl border border-white/[0.08] py-2.5 text-sm font-medium text-white/50 transition hover:border-white/20 hover:text-white/70"
              >
                Run Weekly Aggregation
              </button>
            </div>
          </div>
        </div>

        {/* 공모전 관리 */}
        <div className="rounded-2xl border border-white/[0.08] p-5" style={sectionBg}>
          <h2 className="mb-4 border-b border-[#7F77DD]/20 pb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#AFA9EC]">
            Manage Competitions
          </h2>
          <div className="space-y-2">
            {competitions.length === 0 && <p className="text-sm text-white/30">No competitions yet.</p>}
            {competitions.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-white/[0.06] p-3"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{c.title}</p>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{
                      background: c.status === "Open" ? "rgba(16,185,129,0.2)" : "rgba(83,74,183,0.2)",
                      color: c.status === "Open" ? "#34d399" : "#AFA9EC",
                      border: `1px solid ${c.status === "Open" ? "rgba(16,185,129,0.3)" : "rgba(127,119,221,0.3)"}`,
                    }}
                  >
                    {c.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["Open", "In Review", "Voting", "Closed"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={loading || c.status === s}
                      onClick={() => void call(() => updateCompetitionStatusAction(c.id, s))}
                      className="rounded-lg border border-white/[0.08] px-3 py-1 text-xs transition hover:border-[#7F77DD]/30 hover:text-white disabled:opacity-30"
                      style={{ color: c.status === s ? "#AFA9EC" : "rgba(255,255,255,0.4)" }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 영상 관리 */}
        <div className="rounded-2xl border border-white/[0.08] p-5" style={sectionBg}>
          <h2 className="mb-4 border-b border-[#7F77DD]/20 pb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#AFA9EC]">
            Manage Films
          </h2>
          <div className="max-h-[500px] space-y-2 overflow-y-auto pr-1">
            {videos.length === 0 && <p className="text-sm text-white/30">No films yet.</p>}
            {videos.map((v) => (
              <div
                key={v.id}
                className="rounded-xl border border-white/[0.06] p-3"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{v.title}</p>
                  {v.award && (
                    <span className="shrink-0 rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold text-yellow-400">
                      {v.award}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void call(() => setVideoFinalistAction(v.id, !v.isFinalist))}
                    className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs transition hover:border-[#7F77DD]/30"
                    style={{
                      color: v.isFinalist ? "#AFA9EC" : "rgba(255,255,255,0.4)",
                      background: v.isFinalist ? "rgba(83,74,183,0.2)" : "transparent",
                    }}
                  >
                    {v.isFinalist ? "✓ Finalist" : "Set Finalist"}
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      const value = prompt("Award title (empty to clear)", v.award ?? "") ?? "";
                      void call(() => setVideoAwardAction(v.id, value));
                    }}
                    className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-white/40 transition hover:border-yellow-500/30 hover:text-yellow-400"
                  >
                    🏆 Set Award
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
