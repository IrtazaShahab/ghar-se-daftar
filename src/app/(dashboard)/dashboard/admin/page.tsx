import { redirect } from "next/navigation";

/** The admin area moved to /admin. */
export default function LegacyAdminDashboardPage() {
  redirect("/admin");
}
