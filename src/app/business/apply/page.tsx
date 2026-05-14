import type { Metadata } from "next";
import { BusinessApplyClient } from "@/components/business/business-apply-client";

export const metadata: Metadata = {
  title: "Apply for Business Partnership",
  robots: { index: false, follow: false },
};

export default function BusinessApplyPage() {
  return <BusinessApplyClient />;
}
