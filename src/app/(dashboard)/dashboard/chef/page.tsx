import { redirect } from "next/navigation";

/** The kitchen area moved to /chef. */
export default function LegacyChefDashboardPage() {
  redirect("/chef");
}
