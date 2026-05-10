import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MissingSkill } from "@/lib/gemini";

// ── Helpers ───────────────────────────────────────────────────────────────────

function toSlug(skill: string): string {
  return skill
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

const priorityVariant: Record<
  MissingSkill["priority"],
  "orange" | "blue" | "muted"
> = {
  high: "orange",
  medium: "blue",
  low: "muted",
};

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div className="w-14 h-14 rounded-full bg-line flex items-center justify-center">
        <svg
          className="h-7 w-7 text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </div>
      <div className="space-y-1.5 max-w-xs">
        <p className="text-sm font-semibold text-ink">No assessments available</p>
        <p className="text-sm text-muted leading-relaxed">
          Complete your skill gap analysis first
        </p>
      </div>
      <Link
        href="/resume"
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium rounded-full",
          "transition-colors h-[38px] px-4 text-sm",
          "border border-line text-ink hover:bg-line"
        )}
      >
        Analyse your resume
      </Link>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AssessmentIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: report } = user
    ? await supabase
        .from("skill_gap_reports")
        .select("skills_missing")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
    : { data: null };

  const skills = (report?.skills_missing ?? []) as MissingSkill[];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink tracking-tight">
          Skill Assessments
        </h1>
        <p className="text-sm text-muted mt-1">
          Test your knowledge and validate your progress
        </p>
      </div>

      {skills.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.map((s) => (
            <div
              key={s.skill}
              className="bg-paper border border-line rounded-xl p-5 shadow-sm flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-sm font-semibold text-ink leading-snug">
                  {s.skill}
                </h2>
                <Badge
                  variant={priorityVariant[s.priority] ?? "muted"}
                  className="flex-shrink-0 capitalize mt-0.5"
                >
                  {s.priority}
                </Badge>
              </div>

              {s.why && (
                <p className="text-xs text-muted leading-relaxed line-clamp-2">
                  {s.why}
                </p>
              )}

              <div className="mt-auto">
                <Link
                  href={`/assessment/${toSlug(s.skill)}`}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 font-medium rounded-full w-full",
                    "transition-colors h-[38px] px-4 text-sm",
                    "bg-blue text-white hover:bg-blue-600"
                  )}
                >
                  Take assessment →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
