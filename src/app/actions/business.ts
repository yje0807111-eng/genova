"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendBusinessInquiryNotification } from "@/lib/email";

export type SubmitInquiryInput = {
  type: "individual" | "business";
  contactName: string;
  companyName?: string;
  email: string;
  phone?: string;
  productDescription?: string;
  competitionConcept?: string;
  budgetRange?: string;
  desiredTimeline?: string;
  notes?: string;
};

export async function submitBusinessInquiryAction(input: SubmitInquiryInput) {
  if (!input.contactName.trim() || !input.email.trim()) {
    return { ok: false, error: "이름과 이메일은 필수입니다." } as const;
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { ok: false, error: "서버 설정 오류입니다." } as const;
  }

  const { error } = await supabase.from("business_inquiries").insert({
    type: input.type,
    contact_name: input.contactName.trim(),
    company_name: input.companyName?.trim() || null,
    email: input.email.trim(),
    phone: input.phone?.trim() || null,
    product_description: input.productDescription?.trim() || null,
    competition_concept: input.competitionConcept?.trim() || null,
    budget_range: input.budgetRange || null,
    desired_timeline: input.desiredTimeline?.trim() || null,
    notes: input.notes?.trim() || null,
  });

  if (error) {
    return { ok: false, error: error.message } as const;
  }

  // Fire and forget - 이메일 실패해도 사용자 응답에 영향 없음
  void sendBusinessInquiryNotification({
    type: input.type,
    contactName: input.contactName,
    companyName: input.companyName,
    email: input.email,
    phone: input.phone,
    productDescription: input.productDescription,
    competitionConcept: input.competitionConcept,
    budgetRange: input.budgetRange,
  });

  return { ok: true } as const;
}
