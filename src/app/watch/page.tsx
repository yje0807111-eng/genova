import { redirect } from "next/navigation";

/** Legacy listing URL — send to films hub. */
export default function WatchListingRedirect() {
  redirect("/films");
}
