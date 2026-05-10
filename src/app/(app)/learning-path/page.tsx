"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LearningModule, Resource } from "@/lib/gemini";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PathData {
  id: string;
  modules: LearningModule[];
  targetRole: string;
  completedIds: string[];
}

// ── SWR fetcher ───────────────────────────────────────────────────────────────

async function fetchPath(reportId: string): Promise<PathData> {
  const res = await fetch("/api/learning-path", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reportId }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to load learning path");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let completedIds: string[] = [];
  if (user && Array.isArray(json.modules) && json.modules.length > 0) {
    const moduleIds = (json.modules as LearningModule[]).map((m) => m.id);
    const { data: rows } = await supabase
      .from("progress")
      .select("module_id")
      .eq("user_id", user.id)
      .in("module_id", moduleIds)
      .eq("completed", true);
    completedIds = (rows ?? []).map((r) => r.module_id as string);
  }

  return {
    id: json.id,
    modules: (json.modules ?? []) as LearningModule[],
    targetRole: json.targetRole ?? "",
    completedIds,
  };
}

// ── Progress persistence ──────────────────────────────────────────────────────

async function persistToggle(
  moduleId: string,
  markComplete: boolean
): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Delete existing row(s) for this module to avoid duplicates
  await supabase
    .from("progress")
    .delete()
    .eq("user_id", user.id)
    .eq("module_id", moduleId);

  if (markComplete) {
    const { error } = await supabase.from("progress").insert({
      user_id: user.id,
      module_id: moduleId,
      completed: true,
      completed_at: new Date().toISOString(),
    });
    if (error) throw error;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function totalHours(modules: LearningModule[]): number {
  return modules.reduce((sum, m) => sum + (m.durationHours ?? 0), 0);
}

function typeVariant(
  type: string
): "blue" | "green" | "orange" | "muted" {
  const t = type.toLowerCase();
  if (t === "course") return "blue";
  if (t === "project") return "green";
  if (t === "practice") return "orange";
  return "muted";
}

function toSlug(skill: string): string {
  return skill
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin h-4 w-4 flex-shrink-0", className)}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg className="h-3.5 w-3.5 flex-shrink-0 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

function ResourceIcon({ type }: { type: Resource["type"] }) {
  if (type === "video") {
    return (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (type === "practice") {
    return (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    );
  }
  if (type === "article") {
    return (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }
  // course (default)
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-blue flex items-center justify-center flex-shrink-0">
        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
      </div>
      <span className="font-semibold text-sm tracking-tight text-ink">SkillBridge</span>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-line", className)} />;
}

function SkeletonPage() {
  return (
    <div className="min-h-screen lg:h-screen bg-bg flex flex-col lg:overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 bg-paper border-b border-line">
        <div className="flex items-center justify-between px-6 py-4 gap-4">
          <BrandMark />
          <div className="flex items-center gap-3">
            <Bone className="h-6 w-32 rounded-full" />
            <Bone className="h-4 w-28" />
          </div>
        </div>
        <div className="h-1 bg-line" />
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar skeleton */}
        <aside className="hidden lg:flex flex-col w-[280px] flex-shrink-0 border-r border-line px-4 py-5 gap-3">
          <Bone className="h-4 w-36 mb-1" />
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="flex items-center gap-3 px-1 py-2">
              <Bone className="h-7 w-7 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Bone className="h-3.5 w-full" />
                <Bone className="h-3 w-14" />
              </div>
            </div>
          ))}
        </aside>

        {/* Main skeleton */}
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2.5 mb-6 text-sm text-muted">
              <SpinnerIcon className="text-blue" />
              Building your personalised learning path&hellip;
            </div>
            <div className="bg-paper border border-line rounded-xl overflow-hidden">
              <div className="px-6 py-5 border-b border-line space-y-3">
                <Bone className="h-3 w-20" />
                <Bone className="h-6 w-64" />
                <div className="flex gap-2">
                  <Bone className="h-6 w-16 rounded-full" />
                  <Bone className="h-6 w-20 rounded-full" />
                </div>
              </div>
              <div className="px-6 py-5 space-y-5">
                <Bone className="h-3 w-full" />
                <Bone className="h-3 w-5/6" />
                <Bone className="h-3 w-4/6" />
                <div className="pt-2 space-y-2">
                  <Bone className="h-3 w-28" />
                  <div className="flex gap-2">
                    {[1, 2, 3].map((n) => <Bone key={n} className="h-6 w-20 rounded-full" />)}
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <Bone className="h-3 w-24" />
                  {[1, 2, 3].map((n) => <Bone key={n} className="h-12 w-full" />)}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ── Module card ───────────────────────────────────────────────────────────────

function ModuleCard({
  module,
  index,
  isCompleted,
  onToggle,
  toggling,
}: {
  module: LearningModule;
  index: number;
  isCompleted: boolean;
  onToggle: () => void;
  toggling: boolean;
}) {
  return (
    <div className="bg-paper border border-line rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-5 border-b border-line">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-muted mb-1 font-medium">
              Module {module.order ?? index + 1}
            </p>
            <h2 className="text-xl font-semibold text-ink leading-snug">
              {module.title}
            </h2>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
            <Badge variant="muted">{module.durationHours}h</Badge>
            <Badge variant={typeVariant(module.type)} className="capitalize">
              {module.type}
            </Badge>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-6">
        {/* Description */}
        <p className="text-sm text-muted leading-relaxed">{module.description}</p>

        {/* Skills covered */}
        {module.skills?.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-ink uppercase tracking-wider mb-3">
              Skills covered
            </h3>
            <div className="flex flex-wrap gap-2">
              {module.skills.map((skill, i) => (
                <Link key={i} href={`/assessment/${toSlug(skill)}`}>
                  <Badge
                    variant="muted"
                    className="cursor-pointer hover:bg-blue-50 hover:text-blue transition-colors"
                  >
                    {skill}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Resources */}
        {module.resources?.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-ink uppercase tracking-wider mb-3">
              Resources
            </h3>
            <ul className="space-y-1">
              {module.resources.map((r, i) => (
                <li key={i}>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-bg transition-colors group"
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0",
                        r.type === "video" && "bg-orange-50 text-orange",
                        r.type === "practice" && "bg-green-50 text-green",
                        r.type === "article" && "bg-line text-muted",
                        r.type === "course" && "bg-blue-50 text-blue",
                        !["video", "practice", "article", "course"].includes(r.type) && "bg-line text-muted"
                      )}
                    >
                      <ResourceIcon type={r.type} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink group-hover:text-blue transition-colors truncate">
                        {r.title}
                      </p>
                      <p className="text-xs text-muted capitalize">{r.type}</p>
                    </div>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLinkIcon />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Mark complete */}
        <div className="flex justify-end pt-2 border-t border-line">
          <Button
            variant={isCompleted ? "outline" : "blue"}
            onClick={onToggle}
            disabled={toggling}
            className={cn(
              "gap-2 mt-4",
              isCompleted && "text-green border-green/40 hover:bg-green-50"
            )}
          >
            {toggling ? (
              <SpinnerIcon />
            ) : isCompleted ? (
              <CheckIcon className="text-green" />
            ) : null}
            {isCompleted ? "Completed · Undo" : "Mark as complete"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

function PathView({
  data,
  completed,
  onToggle,
  toggling,
}: {
  data: PathData;
  completed: Set<string>;
  onToggle: (moduleId: string) => void;
  toggling: boolean;
}) {
  const router = useRouter();
  const modules = useMemo(
    () => [...data.modules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [data.modules]
  );

  const [activeIndex, setActiveIndex] = useState(0);

  const hours = totalHours(modules);
  const completedCount = modules.filter((m) => completed.has(m.id)).length;
  const progress = modules.length > 0 ? (completedCount / modules.length) * 100 : 0;
  const activeModule = modules[activeIndex];

  return (
    <div className="min-h-screen lg:h-screen bg-bg flex flex-col lg:overflow-hidden">
      {/* ── Header ── */}
      <header className="flex-shrink-0 bg-paper border-b border-line">
        <div className="flex items-center justify-between px-6 py-4 gap-4 flex-wrap">
          <BrandMark />
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="blue">{data.targetRole}</Badge>
            <span className="text-sm text-muted">
              {hours}h total &middot; {modules.length} modules
            </span>
            {completedCount > 0 && (
              <span className="text-sm text-green font-medium">
                {completedCount}/{modules.length} done
              </span>
            )}
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-line">
          <div
            className="h-full bg-green transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Sidebar ── */}
        <aside className="hidden lg:flex flex-col w-[280px] flex-shrink-0 border-r border-line overflow-y-auto">
          <div className="px-4 py-5 space-y-1">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider px-3 mb-3">
              {modules.length} Modules
            </p>

            {modules.map((m, i) => {
              const isDone = completed.has(m.id);
              const isActive = i === activeIndex;

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className={cn(
                    "w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-colors",
                    isActive
                      ? "bg-blue-50"
                      : "hover:bg-bg"
                  )}
                >
                  {/* Circle indicator */}
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5 transition-colors",
                      isDone
                        ? "bg-green text-white"
                        : isActive
                          ? "bg-blue text-white"
                          : "bg-line text-muted"
                    )}
                  >
                    {isDone ? <CheckIcon className="h-3.5 w-3.5" /> : (m.order ?? i + 1)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium leading-snug",
                        isActive ? "text-blue" : isDone ? "text-muted line-through" : "text-ink"
                      )}
                    >
                      {m.title}
                    </p>
                    <p className="text-xs text-muted mt-0.5">{m.durationHours}h</p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── Module content ── */}
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-2xl mx-auto">
            {/* Mobile: module nav */}
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <button
                type="button"
                onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
                disabled={activeIndex === 0}
                className="text-sm text-muted disabled:opacity-40 hover:text-ink transition-colors"
              >
                ← Previous
              </button>
              <span className="text-xs text-muted">
                {activeIndex + 1} / {modules.length}
              </span>
              <button
                type="button"
                onClick={() => setActiveIndex((i) => Math.min(modules.length - 1, i + 1))}
                disabled={activeIndex === modules.length - 1}
                className="text-sm text-muted disabled:opacity-40 hover:text-ink transition-colors"
              >
                Next →
              </button>
            </div>

            {activeModule ? (
              <ModuleCard
                key={activeModule.id}
                module={activeModule}
                index={activeIndex}
                isCompleted={completed.has(activeModule.id)}
                onToggle={() => onToggle(activeModule.id)}
                toggling={toggling}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
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
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <div className="space-y-1.5 max-w-xs">
                  <p className="text-sm font-semibold text-ink">No modules found</p>
                  <p className="text-sm text-muted leading-relaxed">
                    Your learning path appears to be empty. Try regenerating it
                    from your skill gap report.
                  </p>
                </div>
                <Button variant="outline" onClick={() => router.push("/dashboard")}>
                  Back to dashboard
                </Button>
              </div>
            )}

            {/* Next module nudge */}
            {activeModule &&
              completed.has(activeModule.id) &&
              activeIndex < modules.length - 1 && (
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveIndex(activeIndex + 1)}
                    className="text-sm text-blue font-medium hover:text-blue-600 transition-colors"
                  >
                    Next module →
                  </button>
                </div>
              )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────

function ErrorState({ message }: { message: string }) {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 gap-4 text-center">
      <p className="text-sm font-semibold text-red">Failed to load learning path</p>
      <p className="text-sm text-muted max-w-sm leading-relaxed">{message}</p>
      <Button variant="outline" onClick={() => router.push("/dashboard")}>
        Back to dashboard
      </Button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LearningPathPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reportId = searchParams.get("reportId");

  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!reportId) router.replace("/dashboard");
  }, [reportId, router]);

  const { data, error, isLoading } = useSWR<PathData, Error>(
    reportId ?? null,
    fetchPath,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    }
  );

  // Seed completed state from initial DB load
  useEffect(() => {
    if (data?.completedIds) {
      setCompleted(new Set(data.completedIds));
    }
  }, [data]);

  async function handleToggle(moduleId: string) {
    if (toggling) return;
    const wasCompleted = completed.has(moduleId);

    // Optimistic update
    setCompleted((prev) => {
      const next = new Set(prev);
      wasCompleted ? next.delete(moduleId) : next.add(moduleId);
      return next;
    });

    setToggling(true);
    try {
      await persistToggle(moduleId, !wasCompleted);
      if (!wasCompleted) {
        toast.success("Module marked as complete!");
      }
    } catch {
      // Revert on failure
      setCompleted((prev) => {
        const next = new Set(prev);
        wasCompleted ? next.add(moduleId) : next.delete(moduleId);
        return next;
      });
      toast.error("Failed to save progress. Please try again.");
    } finally {
      setToggling(false);
    }
  }

  if (!reportId || isLoading) return <SkeletonPage />;
  if (error) return <ErrorState message={error.message} />;
  if (!data) return <SkeletonPage />;

  return (
    <PathView
      data={data}
      completed={completed}
      onToggle={handleToggle}
      toggling={toggling}
    />
  );
}
