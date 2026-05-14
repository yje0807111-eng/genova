import type { Metadata } from "next";
import { BusinessLandingClient } from "@/components/business/business-landing-client";

export const metadata: Metadata = {
  title: "For Business",
  description:
    "Partner with Genova for brand competitions, custom AI film campaigns, and creator collaborations.",
  openGraph: {
    title: "For Business | Genova",
    description:
      "Partner with Genova for brand competitions, custom AI film campaigns, and creator collaborations.",
  },
};

export default function BusinessPage() {
  return <BusinessLandingClient />;
}
