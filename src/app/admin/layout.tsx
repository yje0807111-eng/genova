import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/auth/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/**
 * Centralized auth guard for every /admin/** route.
 *
 * Page-level guards are kept in place as defense-in-depth (each page also
 * runs the same isAdminEmail check), but new admin routes added later
 * inherit this layout automatically and are protected even if a developer
 * forgets to add the guard to their page server component.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) redirect("/auth");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  if (!isAdminEmail(user.email) || !user.email_confirmed_at) redirect("/");
  return <>{children}</>;
}
