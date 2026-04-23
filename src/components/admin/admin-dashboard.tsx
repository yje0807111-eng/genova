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

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-white/10 bg-[#1A1535]/80 p-4">
        <h2 className="text-base font-bold">Trophies</h2>
        <p className="mt-1 text-xs text-[#AFA9EC]">
          Grant competition trophies manually, or run weekly genre aggregation (requires{" "}
          <code className="text-[#E8E4FF]">SUPABASE_SERVICE_ROLE_KEY</code> on the server).
        </p>
        <div className="mt-4 space-y-3 rounded-lg border border-white/10 bg-[#0A0A18]/50 p-3">
          <p className="text-sm font-semibold text-[#EEEDFE]">Manual competition trophy</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={trophyUserId}
              onChange={(e) => setTrophyUserId(e.target.value)}
              className="rounded-md border border-white/10 bg-[#0A0A18]/70 px-3 py-2 text-sm"
              placeholder="User UUID (profiles.id)"
            />
            <select
              value={trophyCompetitionId}
              onChange={(e) => setTrophyCompetitionId(e.target.value)}
              className="rounded-md border border-white/10 bg-[#0A0A18]/70 px-3 py-2 text-sm"
            >
              <option value="">Select competition</option>
              {competitions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <select
              value={trophyAward}
              onChange={(e) => setTrophyAward(e.target.value)}
              className="rounded-md border border-white/10 bg-[#0A0A18]/70 px-3 py-2 text-sm sm:col-span-2"
            >
              {(["대상", "금상", "은상", "입선", "장려상"] as const).map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
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
            className="rounded-[6px] bg-[#534AB7] px-4 py-2 text-sm font-semibold text-[#EEEDFE]"
          >
            Grant trophy
          </button>
        </div>
        <div className="mt-4 space-y-2 rounded-lg border border-white/10 bg-[#0A0A18]/50 p-3">
          <p className="text-sm font-semibold text-[#EEEDFE]">Weekly genre trophies</p>
          <p className="text-xs text-[#AFA9EC]">
            Top 3 distinct creators per main genre by views, among public videos uploaded in that UTC week. Leave empty
            to use the previous completed Monday week.
          </p>
          <input
            value={weeklyWeekStart}
            onChange={(e) => setWeeklyWeekStart(e.target.value)}
            className="w-full max-w-xs rounded-md border border-white/10 bg-[#0A0A18]/70 px-3 py-2 text-sm"
            placeholder="Week start YYYY-MM-DD (Monday)"
          />
          <button
            type="button"
            disabled={loading}
            onClick={() => void call(() => runWeeklyGenreTrophiesAction(weeklyWeekStart.trim() || undefined))}
            className="rounded-[6px] border border-white/20 bg-transparent px-4 py-2 text-sm font-semibold text-[#EEEDFE]"
          >
            Run weekly aggregation
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-[#1A1535]/80 p-4">
        <h2 className="text-base font-bold">Create Competition</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(
            [
              ["id", "ID"],
              ["title", "Title"],
              ["genre", "Genre"],
              ["status", "Status (Open/In Review/Voting/Closed)"],
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
              className="rounded-md border border-white/10 bg-[#0A0A18]/70 px-3 py-2 text-sm"
              placeholder={label}
            />
          ))}
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => void call(() => createCompetitionAction(form))}
          className="mt-3 rounded-md bg-[#534AB7] px-4 py-2 text-sm font-semibold"
        >
          Create Competition
        </button>
      </section>

      <section className="rounded-xl border border-white/10 bg-[#1A1535]/80 p-4">
        <h2 className="text-base font-bold">Manage Competitions</h2>
        <ul className="mt-3 space-y-2">
          {competitions.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 p-2">
              <span className="min-w-0 flex-1 truncate text-sm">
                {c.title} <span className="text-[#AFA9EC]">({c.status})</span>
              </span>
              {["Open", "In Review", "Voting", "Closed"].map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={loading || c.status === s}
                  onClick={() => void call(() => updateCompetitionStatusAction(c.id, s))}
                  className="rounded-full border border-white/20 px-3 py-1 text-xs disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-white/10 bg-[#1A1535]/80 p-4">
        <h2 className="text-base font-bold">Manage Films</h2>
        <ul className="mt-3 space-y-2">
          {videos.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 p-2">
              <span className="min-w-0 flex-1 truncate text-sm">
                {v.title}
                {v.award ? <span className="ml-2 text-[#FFD873]">[{v.award}]</span> : null}
              </span>
              <button
                type="button"
                disabled={loading}
                onClick={() => void call(() => setVideoFinalistAction(v.id, !v.isFinalist))}
                className="rounded-full border border-white/20 px-3 py-1 text-xs"
              >
                {v.isFinalist ? "Unset Finalist" : "Set as Finalist"}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  const value = prompt("Winner title (leave empty to clear)", v.award ?? "") ?? "";
                  void call(() => setVideoAwardAction(v.id, value));
                }}
                className="rounded-full border border-white/20 px-3 py-1 text-xs"
              >
                Set as Winner
              </button>
            </li>
          ))}
        </ul>
      </section>
      {message ? <p className="text-sm text-[#AFA9EC]">{message}</p> : null}
    </div>
  );
}
