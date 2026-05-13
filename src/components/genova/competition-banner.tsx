"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock, Trophy } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
import { cn } from "@/lib/utils/cn";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function fallbackDeadlineMs(): number {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 38);
  deadline.setHours(23, 59, 59, 999);
  return deadline.getTime();
}

function calculateTimeLeft(deadlineMs: number): TimeLeft {
  const difference = Math.max(0, deadlineMs - Date.now());
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-0.5">
      <span className="text-2xl font-bold tabular-nums text-white">{value.toString().padStart(2, "0")}</span>
      <span className="ml-0.5 text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

const COUNTDOWN_LABEL_KEYS = ["banner.day", "banner.hour", "banner.min", "banner.sec"] as const;
const COUNTDOWN_FALLBACK = ["D", "H", "M", "S"] as const;

/**
 * English copy is hardcoded. `deadlineIso` from Supabase drives the countdown when valid;
 * otherwise matches template fallback (+38 days at 23:59:59).
 */
export function CompetitionBanner({ deadlineIso }: { deadlineIso: string | null }) {
  const { t } = useI18n();
  const endMs = useMemo(() => {
    if (!deadlineIso) return fallbackDeadlineMs();
    const t = new Date(deadlineIso).getTime();
    return Number.isNaN(t) ? fallbackDeadlineMs() : t;
  }, [deadlineIso]);

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(endMs));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setTimeLeft(calculateTimeLeft(endMs));
    const timer = window.setInterval(() => setTimeLeft(calculateTimeLeft(endMs)), 1000);
    return () => window.clearInterval(timer);
  }, [endMs]);

  return (
    <div className="group/comp relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#1a1a1a] transition-[border-color,box-shadow] duration-300 hover:border-white/[0.12] hover:shadow-[0_0_28px_var(--border-default)]">
      <div className="relative px-8 py-3">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex items-center gap-3">
            <Trophy className="h-5 w-5 shrink-0 text-[#c4b5fd]" />
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white">{t("banner.title", "Genova AI Film Contest 2026")}</h2>
              <p className="truncate text-sm text-muted-foreground">
                {t("banner.subtitle", "Submit your best AI-generated short film · Win $10,000")}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-5">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
              {!mounted ? (
                <div className="flex items-center gap-1">
                  {COUNTDOWN_LABEL_KEYS.map((key, i) => (
                    <TimeBlock key={key} value={0} label={t(key, COUNTDOWN_FALLBACK[i])} />
                  ))}
                </div>
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <TimeBlock value={timeLeft.days} label={t("banner.day", "D")} />
                  <span className="text-lg font-bold text-muted-foreground">:</span>
                  <TimeBlock value={timeLeft.hours} label={t("banner.hour", "H")} />
                  <span className="text-lg font-bold text-muted-foreground">:</span>
                  <TimeBlock value={timeLeft.minutes} label={t("banner.min", "M")} />
                  <span className="text-lg font-bold text-muted-foreground">:</span>
                  <TimeBlock value={timeLeft.seconds} label={t("banner.sec", "S")} />
                </div>
              )}
            </div>

            <Link
              href="/competition"
              className={cn(
                "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius)] bg-[#8b5cf6] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#7c3aed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]/50",
              )}
            >
              {t("banner.enterNow", "Enter Now")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
