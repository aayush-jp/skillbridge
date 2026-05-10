import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateAssessmentQuestions } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { skill, level } = body as { skill?: string; level?: string };

  if (!skill) {
    return NextResponse.json({ error: "skill is required" }, { status: 400 });
  }

  const normalizedLevel = level ?? "intermediate";

  let questions: Awaited<ReturnType<typeof generateAssessmentQuestions>>;
  try {
    questions = await generateAssessmentQuestions({
      skill,
      level: normalizedLevel,
      userId: user.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    if (message === "Model returned malformed output") {
      return NextResponse.json({ error: message }, { status: 502 });
    }
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({ questions });
}
