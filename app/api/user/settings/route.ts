import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body;

  if (action === "updateProfile") {
    const { full_name, username } = body;
    
    if (!full_name || !username) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const newUsername = username.toLowerCase().replace(/\s+/g, "_");
    
    // Update profiles table
    const { error } = await supabase
      .from("profiles")
      .update({ full_name, username: newUsername })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also sync with Auth metadata so it reflects in the Supabase Dashboard
    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name, username: newUsername }
    });

    if (authError) {
      console.error("Failed to sync auth metadata:", authError);
      // We don't fail the request since the profile was updated successfully
    }

    return NextResponse.json({ success: true });
  }

  if (action === "resetAccount") {
    // We execute these sequentially but they could be Promise.all,
    // though executing sequentially prevents overwhelming the DB connection.
    await supabase.from("holdings").delete().eq("user_id", user.id);
    await supabase.from("transactions").delete().eq("user_id", user.id);
    await supabase.from("limit_orders").delete().eq("user_id", user.id);
    await supabase.from("price_alerts").delete().eq("user_id", user.id);
    await supabase.from("watchlist").delete().eq("user_id", user.id);

    const { error } = await supabase
      .from("profiles")
      .update({ balance: 1000000 })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
