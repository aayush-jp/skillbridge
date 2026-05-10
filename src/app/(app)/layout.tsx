import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/components/nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  const displayName =
    profile?.full_name ??
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "User";

  return (
    <>
      <Nav
        user={{
          name: displayName,
          email: user.email ?? "",
          avatarUrl: profile?.avatar_url ?? null,
        }}
      />
      <main className="flex-1">
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </>
  );
}
