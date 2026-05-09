"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth/admin";

export type BusinessInquiryStatus = "new" | "contacted" | "in_progress" | "closed";

export type BusinessInquiryItem = {
  id: string;
  type: "individual" | "business";
  contactName: string;
  companyName: string | null;
  email: string;
  phone: string | null;
  productDescription: string | null;
  competitionConcept: string | null;
  budgetRange: string | null;
  desiredTimeline: string | null;
  notes: string | null;
  status: BusinessInquiryStatus;
  adminNotes: string | null;
  createdAt: string;
};

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { error: "Please check your Supabase configuration." } as const;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." } as const;
  if (!isAdminEmail(user.email)) return { error: "Access denied." } as const;
  return { supabase, user } as const;
}

export async function fetchBusinessInquiries(): Promise<BusinessInquiryItem[]> {
  const result = await requireAdmin();
  if ("error" in result) return [];
  const { supabase } = result;

  const { data } = await supabase
    .from("business_inquiries")
    .select("*")
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id as string,
    type: row.type as "individual" | "business",
    contactName: row.contact_name as string,
    companyName: (row.company_name as string | null) ?? null,
    email: row.email as string,
    phone: (row.phone as string | null) ?? null,
    productDescription: (row.product_description as string | null) ?? null,
    competitionConcept: (row.competition_concept as string | null) ?? null,
    budgetRange: (row.budget_range as string | null) ?? null,
    desiredTimeline: (row.desired_timeline as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    status: row.status as BusinessInquiryStatus,
    adminNotes: (row.admin_notes as string | null) ?? null,
    createdAt: row.created_at as string,
  }));
}

export async function updateBusinessInquiryStatusAction(
  id: string,
  status: BusinessInquiryStatus,
) {
  const result = await requireAdmin();
  if ("error" in result) return { ok: false, message: result.error } as const;
  const { supabase } = result;

  const { error } = await supabase
    .from("business_inquiries")
    .update({ status })
    .eq("id", id);

  if (error) return { ok: false, message: error.message } as const;
  return { ok: true } as const;
}

export async function deleteBusinessInquiryAction(id: string) {
  const result = await requireAdmin();
  if ("error" in result) return { ok: false, message: result.error } as const;
  const { supabase } = result;

  const { error } = await supabase
    .from("business_inquiries")
    .delete()
    .eq("id", id);

  if (error) return { ok: false, message: error.message } as const;
  return { ok: true } as const;
}

export async function updateBusinessInquiryNotesAction(id: string, notes: string) {
  const result = await requireAdmin();
  if ("error" in result) return { ok: false, message: result.error } as const;
  const { supabase } = result;

  const { error } = await supabase
    .from("business_inquiries")
    .update({ admin_notes: notes })
    .eq("id", id);

  if (error) return { ok: false, message: error.message } as const;
  return { ok: true } as const;
}
