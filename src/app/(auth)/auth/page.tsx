"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

// ── Icons ─────────────────────────────────────────────────────────────────────

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin h-4 w-4", className)}
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

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function CheckBadge() {
  return (
    <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-white/10">
      <svg
        className="h-3 w-3 text-white"
        fill="none"
        viewBox="0 0 12 12"
        stroke="currentColor"
        strokeWidth={2.5}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2 6.5l2.5 2.5 5.5-5"
        />
      </svg>
    </span>
  );
}

function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="w-8 h-8 rounded-xl bg-blue flex items-center justify-center flex-shrink-0">
        <svg
          className="w-4 h-4 text-white"
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
      <span className="font-semibold text-base tracking-tight">SkillBridge</span>
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

const BENEFITS = [
  "Analyse your resume and pinpoint skill gaps instantly",
  "Get a personalised learning path to your target role",
  "Track progress and build real-world confidence",
];

// ── Types ─────────────────────────────────────────────────────────────────────

type Mode = "signin" | "signup";

interface FieldErrors {
  fullName?: string;
  email?: string;
  password?: string;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AuthPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("signin");
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const busy = submitting || oauthLoading;

  function switchMode(next: Mode) {
    setMode(next);
    setFieldErrors({});
    setServerError(null);
  }

  function validate(): FieldErrors {
    const errs: FieldErrors = {};
    if (mode === "signup" && !fullName.trim()) {
      errs.fullName = "Full name is required";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Enter a valid email address";
    }
    if (password.length < 8) {
      errs.password = "Password must be at least 8 characters";
    }
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});
    setServerError(null);
    setSubmitting(true);

    const supabase = createClient();

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setServerError(error.message);
        } else {
          router.refresh();
          router.push("/dashboard");
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName.trim() } },
        });
        if (error) {
          setServerError(error.message);
        } else {
          // identities is empty when the email is already registered
          const isNew = (data.user?.identities?.length ?? 0) > 0;
          router.refresh();
          router.push(isNew ? "/onboarding" : "/dashboard");
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setServerError(null);
    setOauthLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setServerError(error.message);
      setOauthLoading(false);
    }
    // On success the browser navigates away; intentionally leave loading = true.
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left panel ──────────────────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-2/5 flex-col justify-between px-12 py-10"
        style={{ background: "var(--ink)" }}
      >
        {/* Logo */}
        <BrandMark className="text-white" />

        {/* Hero */}
        <div className="space-y-10">
          <p className="font-serif italic text-white text-[2.6rem] leading-[1.15]">
            Your career roadmap<br />starts here.
          </p>

          <ul className="space-y-5">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <CheckBadge />
                <span className="text-white/70 text-sm leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="text-white/30 text-xs">
          © {new Date().getFullYear()} SkillBridge. All rights reserved.
        </p>
      </div>

      {/* ── Right panel ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-paper px-6 py-12 sm:px-12">
        <div className="w-full max-w-[400px]">

          {/* Mobile-only logo */}
          <div className="mb-8 lg:hidden">
            <BrandMark className="text-ink" />
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-ink tracking-tight">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {mode === "signin"
                ? "Sign in to continue your learning journey."
                : "Start mapping your path to your dream role."}
            </p>
          </div>

          {/* Mode tabs */}
          <div className="flex bg-line p-1 rounded-full mb-6">
            {(["signin", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-full transition-all duration-150",
                  m === mode
                    ? "bg-paper text-ink shadow-sm"
                    : "text-muted hover:text-ink-2"
                )}
              >
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Server-level error */}
            {serverError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red/20 text-sm text-red"
              >
                <svg
                  className="h-4 w-4 flex-shrink-0 mt-px"
                  fill="none"
                  viewBox="0 0 16 16"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 5v4m0 2.5h.01M14.5 8A6.5 6.5 0 111.5 8a6.5 6.5 0 0113 0z"
                  />
                </svg>
                {serverError}
              </div>
            )}

            {/* Full name — signup only */}
            {mode === "signup" && (
              <div className="space-y-1">
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-ink"
                >
                  Full name
                </label>
                <Input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Jane Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={busy}
                  className={
                    fieldErrors.fullName ? "border-red focus:ring-red/20" : ""
                  }
                />
                {fieldErrors.fullName && (
                  <p className="text-xs text-red">{fieldErrors.fullName}</p>
                )}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-ink"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete={mode === "signin" ? "username" : "email"}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
                className={
                  fieldErrors.email ? "border-red focus:ring-red/20" : ""
                }
              />
              {fieldErrors.email && (
                <p className="text-xs text-red">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-ink"
                >
                  Password
                </label>
                {mode === "signin" && (
                  <button
                    type="button"
                    className="text-xs text-muted hover:text-blue transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                placeholder={
                  mode === "signup" ? "Min. 8 characters" : "••••••••"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
                className={
                  fieldErrors.password ? "border-red focus:ring-red/20" : ""
                }
              />
              {fieldErrors.password && (
                <p className="text-xs text-red">{fieldErrors.password}</p>
              )}
            </div>

            {/* CTA */}
            <Button
              type="submit"
              variant="blue"
              size="lg"
              className="w-full"
              disabled={busy}
            >
              {submitting ? <SpinnerIcon /> : null}
              Continue →
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-line" />
            <span className="text-xs text-muted px-1">or continue with</span>
            <div className="flex-1 h-px bg-line" />
          </div>

          {/* Google */}
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleGoogle}
            disabled={busy}
          >
            {oauthLoading ? <SpinnerIcon /> : <GoogleIcon />}
            Google
          </Button>

          {/* Terms note */}
          <p className="mt-6 text-center text-xs text-muted leading-relaxed">
            By continuing you agree to our{" "}
            <a href="#" className="underline underline-offset-2 hover:text-ink transition-colors">
              Terms
            </a>{" "}
            and{" "}
            <a href="#" className="underline underline-offset-2 hover:text-ink transition-colors">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
