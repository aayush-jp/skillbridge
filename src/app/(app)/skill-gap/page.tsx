"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import useSWR from "swr";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DonutChart } from "@/components/ui/donut-chart";
import type { Skill, MissingSkill } from "@/lib/gemini";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ReportData {
  id: string;
  readinessScore: number;
  skillsPresent: Skill[];
  skillsMissing: MissingSkill[];
  summary: string;
  targetRole: string;
  domain: string;
}

// ── Badge variant maps ────────────────────────────────────────────────────────

const levelVariant: Record<Skill["level"], "muted" | "blue" | "green"> = {
  beginner: "muted",
  intermediate: "blue",
  advanced: "green",
};

const priorityVariant: Record<
  MissingSkill["priority"],
  "orange" | "blue" | "muted"
> = {
  high: "orange",
  medium: "blue",
  low: "muted",
};

// ── SWR fetcher ───────────────────────────────────────────────────────────────

async function fetchReport(resumeId: string): Promise<ReportData> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data: targetRole } = await supabase
    .from("target_roles")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!targetRole) {
    throw new Error("No target role found. Please complete onboarding first.");
  }

  const res = await fetch("/api/skill-gap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resumeId, targetRoleId: targetRole.id }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Analysis failed");
  return json as ReportData;
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
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-blue flex items-center justify-center flex-shrink-0">
        <svg
          className="w-3.5 h-3.5 text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <span className="font-semibold text-sm tracking-tight text-ink">
        SkillBridge
      </span>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-line", className)} />;
}

function SkeletonPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <PageHeader />
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-10">
        {/* Status message */}
        <div className="flex items-center gap-2.5 mb-8 text-sm text-muted">
          <SpinnerIcon className="text-blue" />
          Analysing your resume&hellip; this takes about 15&ndash;30 seconds.
        </div>

        <div className="grid lg:grid-cols-[380px_1fr] gap-8 items-start">
          {/* Left skeleton */}
          <div className="bg-paper border border-line rounded-xl p-6 flex flex-col items-center gap-5">
            <Bone className="h-44 w-44 rounded-full" />
            <Bone className="h-5 w-52" />
            <div className="w-full space-y-2">
              <Bone className="h-3 w-full" />
              <Bone className="h-3 w-5/6" />
              <Bone className="h-3 w-4/6" />
            </div>
          </div>

          {/* Right skeleton */}
          <div className="space-y-5">
            <div className="bg-paper border border-line rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-line">
                <Bone className="h-4 w-32" />
              </div>
              <div className="px-5 py-4 space-y-3">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="flex items-center gap-3">
                    <Bone className="h-4 flex-1" />
                    <Bone className="h-5 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-paper border border-line rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-line">
                <Bone className="h-4 w-32" />
              </div>
              <div className="px-5 py-4 space-y-5">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Bone className="h-4 flex-1" />
                      <Bone className="h-5 w-16 rounded-full" />
                    </div>
                    <Bone className="h-3 w-5/6" />
                    <div className="flex gap-2">
                      <Bone className="h-5 w-28 rounded-full" />
                      <Bone className="h-5 w-24 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <Bone className="h-12 w-56 rounded-full" />
        </div>
      </main>
    </div>
  );
}

// ── Layout shells ─────────────────────────────────────────────────────────────

function PageHeader() {
  return (
    <header className="flex items-center px-6 py-4 border-b border-line bg-paper">
      <BrandMark />
    </header>
  );
}

// ── Report view ───────────────────────────────────────────────────────────────

function ReportView({ data }: { data: ReportData }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <PageHeader />
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-ink tracking-tight mb-8">
          Your Skill Gap Report
        </h1>

        <div className="grid lg:grid-cols-[380px_1fr] gap-8 items-start">
          {/* ── Left — score card ── */}
          <div className="bg-paper border border-line rounded-xl p-6 flex flex-col items-center text-center gap-4 shadow-sm">
            <DonutChart score={data.readinessScore} />

            <div>
              <p className="text-base font-semibold text-ink leading-snug">
                You&apos;re{" "}
                <span
                  className={cn(
                    "font-bold",
                    data.readinessScore >= 70
                      ? "text-green"
                      : data.readinessScore >= 40
                        ? "text-orange"
                        : "text-red"
                  )}
                >
                  {data.readinessScore}%
                </span>{" "}
                ready for
              </p>
              <p className="text-sm font-medium text-blue mt-0.5">
                {data.targetRole}
              </p>
            </div>

            <p className="text-sm text-muted leading-relaxed">{data.summary}</p>
          </div>

          {/* ── Right — skill panels ── */}
          <div className="space-y-5">
            {/* Skills You Have */}
            <div className="bg-paper rounded-xl border border-line border-l-4 border-l-green overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-line">
                <span className="w-2 h-2 rounded-full bg-green flex-shrink-0" />
                <h2 className="text-sm font-semibold text-ink">
                  Skills You Have
                </h2>
                <span className="ml-auto text-xs text-muted tabular-nums">
                  {data.skillsPresent.length}
                </span>
              </div>

              <ul className="divide-y divide-line">
                {data.skillsPresent.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 px-5 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink">{s.skill}</p>
                      {s.evidence && (
                        <p className="text-xs text-muted mt-0.5 line-clamp-1">
                          {s.evidence}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={levelVariant[s.level] ?? "muted"}
                      className="flex-shrink-0 capitalize mt-0.5"
                    >
                      {s.level}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>

            {/* Skills to Build */}
            <div className="bg-paper rounded-xl border border-line border-l-4 border-l-orange overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-line">
                <span className="w-2 h-2 rounded-full bg-orange flex-shrink-0" />
                <h2 className="text-sm font-semibold text-ink">
                  Skills to Build
                </h2>
                <span className="ml-auto text-xs text-muted tabular-nums">
                  {data.skillsMissing.length}
                </span>
              </div>

              <ul className="divide-y divide-line">
                {data.skillsMissing.map((s, i) => (
                  <li key={i} className="px-5 py-4 space-y-2">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-medium text-ink flex-1">
                        {s.skill}
                      </p>
                      <Badge
                        variant={priorityVariant[s.priority] ?? "muted"}
                        className="flex-shrink-0 capitalize"
                      >
                        {s.priority}
                      </Badge>
                    </div>

                    {s.why && (
                      <p className="text-xs text-muted leading-relaxed">
                        {s.why}
                      </p>
                    )}

                    {s.resources.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {s.resources.slice(0, 2).map((r, j) => (
                          <span
                            key={j}
                            className="inline-flex items-center text-xs bg-blue-50 text-blue px-2.5 py-0.5 rounded-full"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 flex justify-center">
          <Button
            variant="blue"
            size="lg"
            onClick={() => router.push(`/learning-path?reportId=${data.id}`)}
          >
            Build my learning path →
          </Button>
        </div>
      </main>
    </div>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────

function ErrorState({ message }: { message: string }) {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <PageHeader />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center gap-4">
        <p className="text-sm font-semibold text-red">Analysis failed</p>
        <p className="text-sm text-muted max-w-sm leading-relaxed">{message}</p>
        <Button variant="outline" onClick={() => router.push("/resume")}>
          Try a different resume
        </Button>
      </main>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SkillGapPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const resumeId = searchParams.get("resumeId");

  useEffect(() => {
    if (!resumeId) router.replace("/resume");
  }, [resumeId, router]);

  const { data, error, isLoading } = useSWR<ReportData, Error>(
    resumeId ?? null,
    fetchReport,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      onError: (err: Error) => {
        toast.error(err.message ?? "Analysis failed. Please try again.");
      },
    }
  );

  if (!resumeId || isLoading) return <SkeletonPage />;
  if (error) return <ErrorState message={error.message} />;
  if (!data) return <SkeletonPage />;
  return <ReportView data={data} />;
}
