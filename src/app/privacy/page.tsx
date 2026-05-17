import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy · Genova",
};

export default function PrivacyPage() {
  return <LegalPage kind="privacy" />;
}
