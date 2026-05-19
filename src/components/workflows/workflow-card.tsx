import Image from "next/image";
import Link from "next/link";
import type { WorkflowGuide } from "@/lib/queries/workflows-queries";

export function WorkflowCard({ wf }: { wf: WorkflowGuide }) {
  return (
    <Link
      href={`/workflows/${wf.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.015] transition hover:border-white/20 hover:bg-white/[0.03]"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-white/[0.02]">
        {wf.coverUrl ? (
          <Image
            src={wf.coverUrl}
            alt=""
            fill
            sizes="(max-width:768px) 100vw, 360px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1547] via-[#15102E] to-[#0a0a0a]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        {wf.tools.length > 0 && (
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
            {wf.tools.slice(0, 3).map((tool) => (
              <span
                key={tool}
                className="rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white/85 backdrop-blur-sm"
              >
                {tool}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-[14px] font-bold leading-tight text-white">
          {wf.title}
        </h3>
        {wf.summary ? (
          <p className="line-clamp-2 text-[12px] leading-relaxed text-white/50">
            {wf.summary}
          </p>
        ) : null}
        <div className="mt-auto flex items-center gap-2 pt-2 text-[11px] text-white/45">
          <span className="line-clamp-1">{wf.authorName ?? "Creator"}</span>
          <span className="text-white/20">·</span>
          <span className="tabular-nums">{wf.steps.length} steps</span>
        </div>
      </div>
    </Link>
  );
}
