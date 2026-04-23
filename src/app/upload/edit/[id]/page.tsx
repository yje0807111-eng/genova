import Link from "next/link";
import { redirect } from "next/navigation";
import { EditVideoForm } from "@/components/upload/edit-video-form";
import { fetchVideoById } from "@/lib/queries";
import { ensureProfile } from "@/lib/queries/profile-queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function EditVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  if (!supabase) redirect("/auth");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  await ensureProfile(user.id, user.email);

  const video = await fetchVideoById(id);
  if (!video || !video.uploadedBy || video.uploadedBy !== user.id) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-5 py-10 text-[#EEEDFE] sm:space-y-8 sm:px-8 sm:py-12">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <p className="text-xs text-[#AFA9EC]">
              <Link href="/upload" className="hover:text-[#EEEDFE]">
                Upload
              </Link>
              <span className="mx-1.5 text-white/30">/</span>
              <span>Edit</span>
            </p>
            <h1 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">Edit Film</h1>
            <p className="mt-1 text-sm text-[#AFA9EC] line-clamp-2">{video.title}</p>
          </div>
          <Link
            href={`/watch/${video.id}`}
            className="text-sm font-medium text-[#7F77DD] hover:text-[#9A93E8]"
          >
            Watch Page →
          </Link>
        </div>
        <EditVideoForm video={video} userId={user.id} />
    </div>
  );
}
