"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/components/genova/language-provider";
import { LegalModal } from "@/components/legal/legal-modal";
import { ContactModal } from "@/components/contact/contact-modal";

export function SiteFooter() {
  const { t } = useI18n();
  const [legal, setLegal] = useState<"terms" | "privacy" | null>(null);
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <footer className="border-t border-white/[0.05] px-6 py-6 sm:px-8">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px]">
          <span className="font-black text-white">Genova</span>
          <Link href="/landing" className="text-white/45 transition hover:text-white/80">{t("footer.about", "About")}</Link>
          <Link href="/?tab=films" className="text-white/45 transition hover:text-white/80">{t("nav.films", "Films")}</Link>
          <Link href="/competition" className="text-white/45 transition hover:text-white/80">{t("nav.competition", "Competition")}</Link>
          <Link href="/business" className="text-white/45 transition hover:text-white/80">{t("nav.business", "공모전 열기")}</Link>
          <Link href="/lottery" className="text-white/45 transition hover:text-white/80">{t("footer.lottery", "응모권 추첨")}</Link>
          <button type="button" onClick={() => setLegal("terms")} className="text-white/45 transition hover:text-white/80">{t("footer.terms", "Terms of Service")}</button>
          <button type="button" onClick={() => setLegal("privacy")} className="text-white/45 transition hover:text-white/80">{t("footer.privacy", "Privacy Policy")}</button>
          <button type="button" onClick={() => setContactOpen(true)} className="text-white/45 transition hover:text-white/80">{t("footer.contact", "Contact / Report")}</button>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-white/30">
          <span>© 2026 Genova</span>
          <div className="flex items-center gap-2.5">
            <Link href="https://www.youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube" className="text-white/30 transition hover:text-white/60">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8M9.6 15.6V8.4l6.2 3.6z" />
              </svg>
            </Link>
            <Link href="https://www.instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="text-white/30 transition hover:text-white/60">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
                <circle cx="12" cy="12" r="4.2" />
                <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
              </svg>
            </Link>
            <Link href="https://x.com" target="_blank" rel="noreferrer" aria-label="X" className="text-white/30 transition hover:text-white/60">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M18.9 2H22l-6.7 7.7L23.2 22h-6.2l-4.9-6.5L6.5 22H3.4l7.2-8.2L1.1 2h6.4l4.4 5.9zm-1.1 18h1.7L6.6 3.9H4.7z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
      <LegalModal kind={legal} onClose={() => setLegal(null)} />
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </footer>
  );
}
