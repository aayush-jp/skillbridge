"use client";

import { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

type Phase = "loading" | "quiz" | "results" | "error";

// ── Constants ─────────────────────────────────────────────────────────────────

const TOTAL_SECONDS = 20 * 60;
const PASS_THRESHOLD = 0.6;
const OPTION_LABELS = ["A", "B", "C", "D"] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function renderWithCode(text: string) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("`") && p.endsWith("`") ? (
          <code
            key={i}
            className="font-mono text-[0.85em] bg-line px-1.5 py-0.5 rounded text-ink-2 not-italic"
          >
            {p.slice(1, -1)}
          </code>
        ) : (
          p
        )
      )}
    </>
  );
}

function titleCase(s: string): string {
  return s
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin h-5 w-5", className)} fill="none" viewBox="0 0 24 24" aria-hidden>
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

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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

// ── Loading state ─────────────────────────────────────────────────────────────

function LoadingScreen({ skill }: { skill: string }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4">
      <SpinnerIcon className="text-blue" />
      <p className="text-sm text-muted">
        Generating your <span className="font-medium text-ink">{titleCase(skill)}</span> assessment&hellip;
      </p>
    </div>
  );
}

// ── Quiz ──────────────────────────────────────────────────────────────────────

function QuizScreen({
  skill,
  level,
  questions,
  onFinish,
}: {
  skill: string;
  level: string;
  questions: Question[];
  onFinish: (answers: (number | null)[]) => void;
}) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    () => Array(questions.length).fill(null)
  );
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);

  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const answersRef = useRef(answers);
  answersRef.current = answers;

  // Countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft]);

  // Auto-submit on timeout
  useEffect(() => {
    if (timeLeft === 0) {
      onFinishRef.current(answersRef.current);
    }
  }, [timeLeft]);

  const selected = answers[currentQ] ?? null;
  const answered = answers.filter((a) => a !== null).length;
  const progress = (answered / questions.length) * 100;
  const isLast = currentQ === questions.length - 1;
  const isUrgent = timeLeft <= 60;

  function select(idx: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentQ] = idx;
      return next;
    });
  }

  function advance() {
    if (selected === null) return;
    if (isLast) {
      onFinishRef.current(answersRef.current);
    } else {
      setCurrentQ((q) => q + 1);
    }
  }

  const q = questions[currentQ];

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* ── Header ── */}
      <header className="bg-paper border-b border-line flex-shrink-0">
        <div className="flex items-center justify-between px-6 py-4">
          <BrandMark />
          <span className="text-sm font-medium text-ink hidden sm:block">
            {titleCase(skill)} &middot; <span className="text-muted capitalize">{level}</span>
          </span>
          <div
            className={cn(
              "flex items-center gap-1.5 font-mono text-sm font-semibold tabular-nums",
              isUrgent ? "text-red" : "text-ink"
            )}
          >
            {isUrgent && (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-line">
          <div
            className="h-full bg-blue transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* ── Question ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* Counter */}
          <p className="text-xs font-medium text-muted mb-4 text-center">
            Question {currentQ + 1} of {questions.length}
          </p>

          {/* Question card */}
          <div className="bg-paper border border-line rounded-xl shadow-sm p-6 sm:p-8">
            {/* Question text */}
            <p className="text-lg sm:text-xl font-medium text-ink leading-snug mb-8">
              {renderWithCode(q.question)}
            </p>

            {/* Options */}
            <div className="space-y-3">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => select(i)}
                  className={cn(
                    "w-full flex items-start gap-4 px-4 py-4 rounded-xl border text-left transition-all duration-100",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/40",
                    selected === i
                      ? "border-blue bg-blue-50"
                      : "border-line bg-paper hover:border-blue/40 hover:bg-blue-50/30 cursor-pointer"
                  )}
                >
                  {/* Letter badge */}
                  <span
                    className={cn(
                      "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold mt-0.5 transition-colors",
                      selected === i
                        ? "bg-blue text-white"
                        : "bg-line text-muted"
                    )}
                  >
                    {OPTION_LABELS[i]}
                  </span>

                  <span className="text-sm text-ink leading-relaxed">
                    {renderWithCode(opt)}
                  </span>
                </button>
              ))}
            </div>

            {/* Next button */}
            <div className="flex justify-end mt-6">
              <Button
                variant="blue"
                onClick={advance}
                disabled={selected === null}
                className="gap-2"
              >
                {isLast ? "Finish →" : "Next →"}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Results ───────────────────────────────────────────────────────────────────

function ResultsScreen({
  skill,
  level,
  questions,
  answers,
}: {
  skill: string;
  level: string;
  questions: Question[];
  answers: (number | null)[];
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  const correct = answers.filter((a, i) => a === questions[i]?.correctIndex).length;
  const total = questions.length;
  const pct = Math.round((correct / total) * 100);
  const passed = correct / total >= PASS_THRESHOLD;

  // Save score to progress table once
  useEffect(() => {
    if (saved) return;
    let cancelled = false;

    async function save() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      await supabase.from("progress").insert({
        user_id: user.id,
        module_id: `assessment:${skill}:${level}`,
        completed: true,
        score: pct,
        completed_at: new Date().toISOString(),
      });

      if (!cancelled) setSaved(true);
    }

    save();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="bg-paper border-b border-line px-6 py-4 flex items-center gap-4">
        <BrandMark />
      </header>

      <main className="flex-1 flex flex-col items-center justify-start px-4 py-10">
        <div className="w-full max-w-2xl space-y-6">
          {/* Score card */}
          <div className="bg-paper border border-line rounded-xl shadow-sm p-8 text-center">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">
              Assessment Complete
            </p>

            <div className="flex items-baseline justify-center gap-2 mb-3">
              <span className="text-6xl font-bold text-ink tabular-nums">
                {correct}
              </span>
              <span className="text-2xl text-muted">/ {total}</span>
            </div>

            <div className="flex items-center justify-center gap-3 mb-4">
              <Badge
                variant={passed ? "green" : "red"}
                className="text-sm px-3 py-1"
              >
                {passed ? "Pass" : "Fail"}
              </Badge>
              <span className="text-sm text-muted">{pct}%</span>
            </div>

            <p className="text-sm text-muted max-w-xs mx-auto leading-relaxed">
              {passed
                ? `Great work on your ${titleCase(skill)} assessment. You demonstrated solid ${level}-level knowledge.`
                : `Keep studying ${titleCase(skill)}. Review the explanations below to strengthen your understanding.`}
            </p>
          </div>

          {/* Per-question breakdown */}
          <div className="bg-paper border border-line rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-line">
              <h2 className="text-sm font-semibold text-ink">Question Breakdown</h2>
            </div>

            <ul className="divide-y divide-line">
              {questions.map((q, i) => {
                const userAnswer = answers[i];
                const isCorrect = userAnswer === q.correctIndex;
                const skipped = userAnswer === null;

                return (
                  <li key={i} className="px-5 py-4 space-y-2">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <span
                        className={cn(
                          "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5",
                          isCorrect
                            ? "bg-green-50 text-green"
                            : "bg-red-50 text-red"
                        )}
                      >
                        {isCorrect ? (
                          <CheckIcon className="h-3.5 w-3.5" />
                        ) : (
                          <XIcon className="h-3.5 w-3.5" />
                        )}
                      </span>

                      {/* Question text */}
                      <p className="text-sm text-ink leading-snug flex-1">
                        {renderWithCode(q.question)}
                      </p>
                    </div>

                    {/* Wrong answer details */}
                    {!isCorrect && (
                      <div className="pl-9 space-y-1.5">
                        {!skipped && (
                          <p className="text-xs text-red">
                            Your answer:{" "}
                            <span className="font-medium">{q.options[userAnswer!]}</span>
                          </p>
                        )}
                        <p className="text-xs text-green">
                          Correct:{" "}
                          <span className="font-medium">{q.options[q.correctIndex]}</span>
                        </p>
                        {q.explanation && (
                          <p className="text-xs text-muted leading-relaxed">
                            {q.explanation}
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="blue"
              size="lg"
              onClick={() => router.push("/learning-path")}
            >
              View Learning Path →
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.refresh()}
            >
              Retake Assessment
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AssessmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ skill: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { skill } = use(params);
  const rawLevel = use(searchParams).level;
  const level = Array.isArray(rawLevel)
    ? (rawLevel[0] ?? "intermediate")
    : (rawLevel ?? "intermediate");

  const [phase, setPhase] = useState<Phase>("loading");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [finalAnswers, setFinalAnswers] = useState<(number | null)[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/assessment/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skill, level }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to generate questions");
        if (cancelled) return;
        setQuestions(json.questions);
        setPhase("quiz");
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : "Something went wrong");
        setPhase("error");
      }
    }

    load();
    return () => { cancelled = true; };
  }, [skill, level]);

  function handleFinish(answers: (number | null)[]) {
    setFinalAnswers(answers);
    setPhase("results");
  }

  if (phase === "loading") return <LoadingScreen skill={skill} />;

  if (phase === "error") {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm font-semibold text-red">Failed to load assessment</p>
        <p className="text-sm text-muted max-w-sm">{loadError}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </div>
    );
  }

  if (phase === "results") {
    return (
      <ResultsScreen
        skill={skill}
        level={level}
        questions={questions}
        answers={finalAnswers}
      />
    );
  }

  return (
    <QuizScreen
      skill={skill}
      level={level}
      questions={questions}
      onFinish={handleFinish}
    />
  );
}
