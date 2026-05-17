"use server";

import { revalidatePath } from "next/cache";
import { requireAdminWithService } from "@/lib/auth/admin-actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendOperatorMessageNotification } from "@/lib/email";

export type OperatorMessageCategory = "bug" | "suggestion" | "error" | "other";
export type OperatorMessageStatus = "open" | "reviewing" | "resolved";

export type OperatorMessageItem = {
  id: string;
  createdAt: string;
  userId: string | null;
  email: string | null;
  category: OperatorMessageCategory;
  message: string;
  pageUrl: string | null;
  status: OperatorMessageStatus;
  adminNotes: string | null;
};

const VALID_CATEGORIES: OperatorMessageCategory[] = [
  "bug",
  "suggestion",
  "error",
  "other",
];

/**
 * User-facing submit. Anonymous allowed; if signed in we stamp the
 * user id + fall back to their auth email when none was typed.
 */
export async function submitOperatorMessageAction(input: {
  category: OperatorMessageCategory;
  message: string;
  email?: string;
  pageUrl?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const message = input.message?.trim() ?? "";
  if (message.length < 5) {
    return { ok: false, error: "too_short" } as const;
  }
  if (message.length > 4000) {
    return { ok: false, error: "too_long" } as const;
  }
  const category = VALID_CATEGORIES.includes(input.category)
    ? input.category
    : "other";

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { ok: false, error: "config" } as const;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email =
    (input.email?.trim() || user?.email || "").slice(0, 320) || null;

  const { error } = await supabase.from("operator_messages").insert({
    user_id: user?.id ?? null,
    email,
    category,
    message: message.slice(0, 4000),
    page_url: input.pageUrl?.trim().slice(0, 500) || null,
    status: "open",
  });

  if (error) return { ok: false, error: error.message } as const;

  // Fire and forget — a failed notification must not fail the submit.
  void sendOperatorMessageNotification({
    category,
    message,
    email,
    pageUrl: input.pageUrl ?? null,
  });

  revalidatePath("/admin");
  return { ok: true } as const;
}

type AdminResult = { ok: true } | { ok: false; message: string };

export async function fetchOperatorMessages(): Promise<OperatorMessageItem[]> {
  const auth = await requireAdminWithService();
  if ("error" in auth) return [];
  const { service } = auth;

  const { data } = await service
    .from("operator_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  return (data ?? []).map((r) => ({
    id: r.id as string,
    createdAt: r.created_at as string,
    userId: (r.user_id as string | null) ?? null,
    email: (r.email as string | null) ?? null,
    category: r.category as OperatorMessageCategory,
    message: r.message as string,
    pageUrl: (r.page_url as string | null) ?? null,
    status: r.status as OperatorMessageStatus,
    adminNotes: (r.admin_notes as string | null) ?? null,
  }));
}

export async function updateOperatorMessageStatusAction(
  id: string,
  status: OperatorMessageStatus,
): Promise<AdminResult> {
  const auth = await requireAdminWithService();
  if ("error" in auth) return { ok: false, message: auth.error };
  const { service } = auth;
  const { data, error } = await service
    .from("operator_messages")
    .update({ status })
    .eq("id", id)
    .select("id");
  if (error) return { ok: false, message: error.message };
  if (!data || data.length === 0)
    return { ok: false, message: "Update failed (not found)." };
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteOperatorMessageAction(
  id: string,
): Promise<AdminResult> {
  const auth = await requireAdminWithService();
  if ("error" in auth) return { ok: false, message: auth.error };
  const { service } = auth;
  const { data, error } = await service
    .from("operator_messages")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) return { ok: false, message: error.message };
  if (!data || data.length === 0)
    return { ok: false, message: "Delete failed (not found)." };
  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Bulk-clear only RESOLVED rows so unread (open / reviewing) work
 * can never be wiped by a single click — same guard as reports.
 */
export async function deleteAllResolvedOperatorMessagesAction(): Promise<AdminResult> {
  const auth = await requireAdminWithService();
  if ("error" in auth) return { ok: false, message: auth.error };
  const { service } = auth;
  const { data, error } = await service
    .from("operator_messages")
    .delete()
    .eq("status", "resolved")
    .select("id");
  if (error) return { ok: false, message: error.message };
  if (!data || data.length === 0)
    return {
      ok: false,
      message: "No resolved messages to clear (open / reviewing are protected).",
    };
  revalidatePath("/admin");
  return { ok: true };
}
