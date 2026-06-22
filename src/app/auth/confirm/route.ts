import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next") ?? "/onboarding";
  const next =
    requestedNext.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/onboarding";

  if (!isSupabaseConfigured) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = await createClient();
  let success = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    success = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    success = !error;
  }

  return NextResponse.redirect(
    `${origin}${success ? next : "/login?error=confirmation"}`,
  );
}
