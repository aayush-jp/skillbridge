import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateLearningPath } from "@/lib/gemini";
import type { MissingSkill } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { reportId } = body as { reportId?: string };

  if (!reportId) {
    return NextResponse.json({ error: "reportId is required" }, { status: 400 });
  }

  // Return existing path if one was already generated for this report
  const { data: existing } = await supabase
    .from("learning_paths")
    .select("id, modules")
    .eq("user_id", user.id)
    .eq("report_id", reportId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Fetch the report regardless (needed for targetRole in both paths)
  const { data: report, error: reportErr } = await supabase
    .from("skill_gap_reports")
    .select("skills_missing, target_role_id")
    .eq("id", reportId)
    .eq("user_id", user.id)
    .single();

  if (reportErr || !report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const { data: targetRole, error: roleErr } = await supabase
    .from("target_roles")
    .select("role")
    .eq("id", report.target_role_id)
    .eq("user_id", user.id)
    .single();

  if (roleErr || !targetRole) {
    return NextResponse.json({ error: "Target role not found" }, { status: 404 });
  }

  if (existing) {
    return NextResponse.json({
      id: existing.id,
      modules: existing.modules,
      targetRole: targetRole.role,
    });
  }

  // Generate new learning path
  let result: Awaited<ReturnType<typeof generateLearningPath>>;
  try {
    result = await generateLearningPath({
      missingSkills: (report.skills_missing ?? []) as MissingSkill[],
      targetRole: targetRole.role,
      timelineWeeks: 12,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI generation failed" },
      { status: 502 }
    );
  }

  const { data: saved, error: saveErr } = await supabase
    .from("learning_paths")
    .insert({
      user_id: user.id,
      report_id: reportId,
      modules: result.modules,
    })
    .select("id")
    .single();

  if (saveErr || !saved) {
    return NextResponse.json(
      { error: "Failed to save learning path" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    id: saved.id,
    modules: result.modules,
    targetRole: targetRole.role,
  });
}
