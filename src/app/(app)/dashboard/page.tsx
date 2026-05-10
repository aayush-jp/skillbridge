import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DonutChart } from "@/components/ui/donut-chart";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LearningModule } from "@/lib/gemini";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFullDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function computeStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0;
  const days = new Set(completedDates.map((d) => d.slice(0, 10)));
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const cursor = new Date(today);
  if (!days.has(todayKey)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let streak = 0;
  while (streak < 365) {
    if (days.has(cursor.toISOString().slice(0, 10))) {
      streak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else break;
  }
  return streak;
}

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
}

const DAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];
function getDayInitial(dateStr: string): string {
  return DAY_INITIALS[new Date(dateStr + "T12:00:00Z").getUTCDay()];
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EmptyState({
  title,
  description,
  href,
  cta,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-6">
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="text-sm text-muted leading-relaxed max-w-xs">{description}</p>
      <Link
        href={href}
        className="inline-flex items-center justify-center h-9 px-4 text-sm font-medium rounded-full bg-blue text-white hover:bg-blue-600 transition-colors"
      >
        {cta}
      </Link>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Layout already guards auth; redirect is a safety net for direct renders.
  if (!user) redirect("/auth");

  const [profileRes, targetRoleRes, reportRes, pathRes, progressRes] =
    await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", user.id).single(),
      supabase
        .from("target_roles")
        .select("role, domain")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from("skill_gap_reports")
        .select("id, readiness_score, skills_missing, resume_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from("learning_paths")
        .select("id, modules, report_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from("progress")
        .select("module_id, completed_at, score")
        .eq("user_id", user.id)
        .eq("completed", true)
        .order("completed_at", { ascending: false }),
    ]);

  const name =
    profileRes.data?.full_name ??
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "there";
  const targetRole = targetRoleRes.data;
  const report = reportRes.data;
  const path = pathRes.data;
  const progressRows = progressRes.data ?? [];

  // Modules
  const modules: LearningModule[] = Array.isArray(path?.modules)
    ? (path.modules as LearningModule[])
    : [];
  const sortedModules = [...modules].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );
  const completedIds = new Set(progressRows.map((r) => r.module_id));
  const completedModules = modules.filter((m) => completedIds.has(m.id));
  const totalHoursLearned = completedModules.reduce(
    (sum, m) => sum + (m.durationHours ?? 0),
    0
  );
  const assessmentsPassed = progressRows.filter(
    (r) => r.score !== null && (r.score as number) >= 70
  ).length;
  const progressPct =
    modules.length > 0
      ? Math.round((completedModules.length / modules.length) * 100)
      : 0;

  // Next incomplete module & upcoming queue
  const nextModule = sortedModules.find((m) => !completedIds.has(m.id));
  const upcomingModules = sortedModules
    .filter((m) => !completedIds.has(m.id) && m.id !== nextModule?.id)
    .slice(0, 3);

  // Streak & calendar
  const completedDates = progressRows
    .filter((r) => r.completed_at)
    .map((r) => r.completed_at as string);
  const streak = computeStreak(completedDates);
  const activitySet = new Set(completedDates.map((d) => d.slice(0, 10)));
  const last7Days = getLast7Days();
  const todayKey = new Date().toISOString().slice(0, 10);

  // Recent activity
  const moduleMap = new Map(modules.map((m) => [m.id, m.title]));
  const recentActivity = progressRows.slice(0, 5).map((r) => ({
    title: moduleMap.get(r.module_id) ?? r.module_id.slice(0, 20),
    completedAt: r.completed_at as string | null,
    score: r.score as number | null,
  }));

  const skillsToBuild = Array.isArray(report?.skills_missing)
    ? (report.skills_missing as unknown[]).length
    : 0;

  return (
    <>
      {/* ── Row 1: Welcome ── */}
        <div className="mb-7">
          <h1 className="text-3xl font-semibold text-ink tracking-tight">
            Welcome back, {name} 👋
          </h1>
          <p className="text-sm text-muted mt-1">{formatFullDate(new Date())}</p>
        </div>

        {/* ── Dashboard grid (12 cols) ── */}
        <div className="grid grid-cols-12 gap-5">

          {/* ── Card 1: Target Role (col-span-8) ── */}
          <div className="col-span-12 lg:col-span-8 bg-paper border border-line rounded-xl p-6 shadow-sm">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">
              Target Role
            </p>
            {targetRole ? (
              <div className="flex items-start gap-6 flex-wrap">
                <DonutChart
                  score={report?.readiness_score ?? 0}
                  className="w-36 h-36 flex-shrink-0"
                />
                <div className="flex-1 min-w-[160px]">
                  <h2 className="text-2xl font-serif text-ink leading-tight">
                    {targetRole.role}
                  </h2>
                  <div className="mt-2 mb-5">
                    <Badge variant="blue">{targetRole.domain}</Badge>
                  </div>
                  {skillsToBuild > 0 && (
                    <div className="mb-5">
                      <p className="text-3xl font-bold text-ink tabular-nums">
                        {skillsToBuild}
                      </p>
                      <p className="text-xs text-muted mt-0.5">skills to build</p>
                    </div>
                  )}
                  {report?.resume_id && (
                    <Link
                      href={`/skill-gap?resumeId=${report.resume_id}`}
                      className="text-sm text-blue font-medium hover:text-blue-600 transition-colors"
                    >
                      View full report →
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <EmptyState
                title="No target role set"
                description="Complete onboarding to set your target role and get your readiness score."
                href="/onboarding"
                cta="Complete onboarding"
              />
            )}
          </div>

          {/* ── Card 2: Streak (col-span-4) ── */}
          <div className="col-span-12 lg:col-span-4 bg-paper border border-line rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-3xl leading-none" role="img" aria-label="fire">
                🔥
              </span>
              <div>
                <p className="text-xl font-bold text-ink leading-tight">
                  {streak} day streak
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {streak > 0 ? "Keep it going!" : "Start learning today"}
                </p>
              </div>
            </div>

            {/* Mini calendar — last 7 days */}
            <div className="flex gap-1.5">
              {last7Days.map((day) => {
                const active = activitySet.has(day);
                const isToday = day === todayKey;
                return (
                  <div
                    key={day}
                    className="flex-1 flex flex-col items-center gap-1.5"
                  >
                    <span className="text-[10px] text-muted font-medium">
                      {getDayInitial(day)}
                    </span>
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full border-2 transition-colors",
                        active
                          ? "bg-orange border-orange"
                          : isToday
                          ? "border-line-2 bg-bg"
                          : "border-transparent bg-line"
                      )}
                      title={day}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Card 3: Continue Learning (col-span-8) ── */}
          <div className="col-span-12 lg:col-span-8 bg-paper border border-line rounded-xl p-6 shadow-sm">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">
              Continue Learning
            </p>

            {nextModule ? (
              <>
                <div className="mb-4">
                  <div className="flex items-baseline justify-between gap-3 mb-2">
                    <h3 className="text-base font-semibold text-ink leading-snug">
                      {nextModule.title}
                    </h3>
                    <span className="text-xs text-muted tabular-nums flex-shrink-0">
                      {progressPct}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-line rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted mt-1.5">
                    {completedModules.length} of {modules.length} modules complete
                  </p>
                </div>

                <Link
                  href={
                    path?.report_id
                      ? `/learning-path?reportId=${path.report_id}`
                      : "/learning-path"
                  }
                  className="inline-flex items-center justify-center h-9 px-4 text-sm font-medium rounded-full bg-blue text-white hover:bg-blue-600 transition-colors"
                >
                  Resume →
                </Link>

                {upcomingModules.length > 0 && (
                  <div className="mt-5 border-t border-line pt-4">
                    <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">
                      Up next
                    </p>
                    <div className="space-y-1">
                      {upcomingModules.map((m, i) => (
                        <div
                          key={m.id}
                          className="flex items-center gap-3 py-1.5"
                        >
                          <div className="w-5 h-5 rounded-full bg-line text-muted text-[10px] font-semibold flex items-center justify-center flex-shrink-0">
                            {m.order ?? completedModules.length + i + 2}
                          </div>
                          <span className="text-sm text-ink-2 flex-1 truncate">
                            {m.title}
                          </span>
                          <span className="text-xs text-muted flex-shrink-0">
                            {m.durationHours}h
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : modules.length > 0 ? (
              <div className="py-6 text-center">
                <p className="text-2xl mb-2">🎉</p>
                <p className="text-sm font-semibold text-ink">All done!</p>
                <p className="text-sm text-muted mt-1">
                  You&apos;ve completed all {modules.length} modules.
                </p>
              </div>
            ) : report ? (
              <EmptyState
                title="Learning path not generated yet"
                description="Your skill gap analysis is ready. Generate your personalized learning path to start studying."
                href={`/learning-path?reportId=${report.id}`}
                cta="Generate learning path"
              />
            ) : (
              <EmptyState
                title="No resume uploaded yet"
                description="Upload your resume so we can analyse your skills and build a personalized learning path."
                href="/resume"
                cta="Upload resume"
              />
            )}
          </div>

          {/* ── Card 4: Quick Stats (col-span-4) ── */}
          <div className="col-span-12 lg:col-span-4 bg-paper border border-line rounded-xl p-6 shadow-sm">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">
              Quick Stats
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-blue"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-ink-2">Modules completed</p>
                </div>
                <p className="text-sm font-bold text-ink tabular-nums">
                  {completedModules.length}
                  <span className="text-muted font-normal"> / {modules.length}</span>
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-green"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-ink-2">Hours learned</p>
                </div>
                <p className="text-sm font-bold text-ink tabular-nums">
                  {totalHoursLearned}h
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-orange"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-ink-2">Assessments passed</p>
                </div>
                <p className="text-sm font-bold text-ink tabular-nums">
                  {assessmentsPassed}
                </p>
              </div>
            </div>
          </div>

          {/* ── Card 5: Recent Activity (col-span-12) ── */}
          <div className="col-span-12 bg-paper border border-line rounded-xl p-6 shadow-sm">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">
              Recent Activity
            </p>

            {recentActivity.length > 0 ? (
              <ul className="divide-y divide-line">
                {recentActivity.map((item, i) => {
                  const isAssessment =
                    item.score !== null && (item.score as number) >= 70;
                  return (
                    <li
                      key={i}
                      className="flex items-start gap-4 py-3.5 first:pt-0 last:pb-0"
                    >
                      <div
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                          isAssessment ? "bg-orange-50" : "bg-green-50"
                        )}
                      >
                        {isAssessment ? (
                          <svg
                            className="w-3.5 h-3.5 text-orange"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                            aria-hidden
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-3.5 h-3.5 text-green"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                            aria-hidden
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink leading-snug">
                          {isAssessment ? "Assessment passed" : "Completed module"}
                        </p>
                        <p className="text-xs text-muted mt-0.5 truncate">
                          {item.title}
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        {item.score !== null && (
                          <p className="text-sm font-semibold text-ink tabular-nums">
                            {item.score}%
                          </p>
                        )}
                        <p className="text-xs text-muted">{timeAgo(item.completedAt)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted text-center py-8">
                No activity yet — complete a module to see your progress here.
              </p>
            )}
          </div>

        </div>
    </>
  );
}
