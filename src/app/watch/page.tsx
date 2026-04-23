import { redirect } from "next/navigation";

/** Legacy listing URL — browse feed at `/feed`. */
export default function WatchListingRedirect() {
  redirect("/feed");
}
