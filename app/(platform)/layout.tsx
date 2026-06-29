import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/platform/Sidebar";
import MobileNav from "@/components/platform/MobileNav";
import AlertNotifier from "@/components/platform/AlertNotifier";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile for MobileNav balance display
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username, balance")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-[#09090b] flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileNav profile={profile} />
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
      <AlertNotifier />
    </div>
  );
}
