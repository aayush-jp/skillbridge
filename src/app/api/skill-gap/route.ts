import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSkillGapReport } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { resumeId, targetRoleId } = body as {
    resumeId?: string;
    targetRoleId?: string;
  };

  if (!resumeId || !targetRoleId) {
    return NextResponse.json(
      { error: "resumeId and targetRoleId are required" },
      { status: 400 }
    );
  }

  // Fetch resume — RLS ensures it belongs to this user
  const { data: resume, error: resumeErr } = await supabase
    .from("resumes")
    .select("raw_text")
    .eq("id", resumeId)
    .eq("user_id", user.id)
    .single();

  if (resumeErr || !resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  // Fetch target role — RLS ensures it belongs to this user
  const { data: targetRole, error: roleErr } = await supabase
    .from("target_roles")
    .select("role, domain")
    .eq("id", targetRoleId)
    .eq("user_id", user.id)
    .single();

  if (roleErr || !targetRole) {
    return NextResponse.json(
      { error: "Target role not found" },
      { status: 404 }
    );
  }

  // Generate report via AI
  let report: Awaited<ReturnType<typeof generateSkillGapReport>>;
  try {
    report = await generateSkillGapReport({
      resumeText: resume.raw_text ?? "",
      targetRole: targetRole.role,
      domain: targetRole.domain,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI analysis failed" },
      { status: 502 }
    );
  }

  // Persist
  const { data: saved, error: saveErr } = await supabase
    .from("skill_gap_reports")
    .insert({
      user_id: user.id,
      resume_id: resumeId,
      target_role_id: targetRoleId,
      readiness_score: report.readinessScore,
      skills_present: report.skillsPresent,
      skills_missing: report.skillsMissing,
      raw_ai_response: JSON.stringify(report),
    })
    .select("id")
    .single();

  if (saveErr || !saved) {
    return NextResponse.json(
      { error: "Failed to save report" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    id: saved.id,
    readinessScore: report.readinessScore,
    skillsPresent: report.skillsPresent,
    skillsMissing: report.skillsMissing,
    summary: report.summary,
    targetRole: targetRole.role,
    domain: targetRole.domain,
  });
}
