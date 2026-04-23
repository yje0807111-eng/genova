"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { markAllNotificationsReadAction } from "@/app/actions/notifications";
import type { AppNotification } from "@/lib/queries/notifications-queries";

export function NotificationsList({ items }: { items: AppNotification[] }) {
  const router = useRouter();

  const onReadAll = async () => {
    const res = await markAllNotificationsReadAction();
    if (!res.ok) return;
    router.refresh();
  };

  return (
    <section className="rounded-xl border border-white/10 bg-[#1A1535]/80 p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-[#EEEDFE]">Notifications</h1>
        <button
          type="button"
          onClick={() => void onReadAll()}
          className="rounded-full border border-white/20 px-3 py-1.5 text-xs text-[#E8E4FF] hover:border-[#7F77DD]/60"
        >
          Mark all as read
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-[#AFA9EC]">No notifications yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => {
            const row = (
              <div
                className={`rounded-lg border p-3 ${n.isRead ? "border-white/10 bg-[#0A0A18]/40" : "border-[#7F77DD]/50 bg-[#2A2460]/45"}`}
              >
                <p className="text-sm font-semibold text-[#EEEDFE]">{n.title}</p>
                {n.body ? <p className="mt-1 text-xs text-[#C7C2F4]">{n.body}</p> : null}
              </div>
            );
            return (
              <li key={n.id}>
                {n.href ? <Link href={n.href}>{row}</Link> : row}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
