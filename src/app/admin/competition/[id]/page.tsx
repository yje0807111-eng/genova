import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/auth/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EditCompetitionForm } from "@/components/admin/edit-competition-form";

export default async function EditCompetitionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  if (!supabase) redirect("/auth");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  if (!isAdminEmail(user.email)) redirect("/");

  const { data: competition } = await supabase.from("competitions").select("*").eq("id", id).maybeSingle();

  if (!competition) redirect("/admin");

  return (
    <div className="px-4 py-6 text-white sm:px-6">
      <EditCompetitionForm competition={competition} />
    </div>
  );
}
