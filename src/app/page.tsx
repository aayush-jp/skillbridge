"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ── Reveal hook ───────────────────────────────────────────────────────────────

function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useReveal();
  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ── Radar chart ───────────────────────────────────────────────────────────────

const CX = 180;
const CY = 180;
const R = 118;

function polarXY(i: number, radius: number) {
  const a = (i * 60 - 90) * (Math.PI / 180);
  return { x: CX + radius * Math.cos(a), y: CY + radius * Math.sin(a) };
}

function polyPts(vals: number[]): string {
  return vals
    .map((v, i) => {
      const { x, y } = polarXY(i, R * Math.max(0.05, v));
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function hexPts(r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const { x, y } = polarXY(i, r);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

const RADAR_SKILLS = ["Python", "SQL", "Tableau", "Excel", "Stats", "ML"];
const CURRENT_VALS = [0.7, 0.85, 0.4, 0.9, 0.55, 0.3];
const TARGET_VALS = [0.95, 0.9, 0.85, 0.9, 0.9, 0.8];
const L_ANCHOR = ["middle", "start", "start", "middle", "end", "end"] as const;
const L_DY = [-10, 4, 4, 16, 4, 4];
const L_DX = [0, 8, 8, 0, -8, -8];

function RadarChart({ animated }: { animated: boolean }) {
  const s = (delay: number): React.CSSProperties => ({
    transformOrigin: `${CX}px ${CY}px`,
    transform: animated ? "scale(1)" : "scale(0)",
    opacity: animated ? 1 : 0,
    transition: `transform 1s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms, opacity 0.6s ease ${delay}ms`,
  });

  return (
    <svg viewBox="0 0 360 360" className="w-full h-full" aria-hidden>
      {[0.25, 0.5, 0.75, 1].map((l) => (
        <polygon
          key={l}
          points={hexPts(R * l)}
          fill="none"
          stroke="var(--line)"
          strokeWidth="1"
        />
      ))}
      {RADAR_SKILLS.map((_, i) => {
        const { x, y } = polarXY(i, R);
        return (
          <line
            key={i}
            x1={CX}
            y1={CY}
            x2={x}
            y2={y}
            stroke="var(--line)"
            strokeWidth="1"
          />
        );
      })}
      <polygon
        points={polyPts(TARGET_VALS)}
        fill="var(--blue)"
        fillOpacity={0.06}
        stroke="var(--blue)"
        strokeOpacity={0.35}
        strokeWidth="1.5"
        strokeDasharray="4 3"
        style={s(0)}
      />
      <polygon
        points={polyPts(CURRENT_VALS)}
        fill="var(--blue)"
        fillOpacity={0.22}
        stroke="var(--blue)"
        strokeWidth="2"
        style={s(130)}
      />
      {CURRENT_VALS.map((v, i) => {
        const { x, y } = polarXY(i, R * v);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="3.5"
            fill="white"
            stroke="var(--blue)"
            strokeWidth="2"
            style={s(250)}
          />
        );
      })}
      {RADAR_SKILLS.map((skill, i) => {
        const { x, y } = polarXY(i, R + 24);
        return (
          <text
            key={i}
            x={x + L_DX[i]}
            y={y}
            dy={L_DY[i]}
            textAnchor={L_ANCHOR[i]}
            fill="var(--ink-2)"
            fontSize="11"
            fontWeight="600"
            fontFamily="var(--font-geist-sans)"
          >
            {skill}
          </text>
        );
      })}
    </svg>
  );
}

// ── Brand mark ────────────────────────────────────────────────────────────────

function BrandMark({ dark = false }: { dark?: boolean }) {
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
      <span
        className={cn(
          "font-semibold text-sm tracking-tight",
          dark ? "text-white" : "text-ink"
        )}
      >
        SkillBridge
      </span>
    </div>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-paper/90 backdrop-blur-md transition-all duration-200",
        scrolled
          ? "border-b border-line shadow-sm"
          : "border-b border-transparent"
      )}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between relative">
        <Link href="/" className="flex-shrink-0 z-10">
          <BrandMark />
        </Link>

        <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8">
          <a
            href="#how-it-works"
            className="text-sm text-muted hover:text-ink transition-colors"
          >
            How it works
          </a>
          <a
            href="#features"
            className="text-sm text-muted hover:text-ink transition-colors"
          >
            Features
          </a>
        </nav>

        <div className="flex items-center gap-2 flex-shrink-0 z-10">
          <Link
            href="/auth"
            className="hidden sm:inline-flex h-9 px-4 items-center text-sm font-medium text-muted hover:text-ink hover:bg-line rounded-full transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/auth"
            className="inline-flex h-9 px-4 items-center text-sm font-medium bg-ink text-paper rounded-full hover:bg-ink-2 transition-colors whitespace-nowrap"
          >
            Get started free
          </Link>
        </div>
      </div>
    </header>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function HeroSection() {
  const [chartReady, setChartReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setChartReady(true), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="pt-20 pb-28 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* ── Left: copy ── */}
          <div>
            <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue text-xs font-semibold px-3 py-1.5 rounded-full mb-7">
              <svg
                className="w-3 h-3"
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
              AI-Powered Career Intelligence
            </div>

            <h1 className="text-5xl lg:text-[56px] font-semibold text-ink tracking-tight leading-[1.08] mb-6">
              Bridge the gap
              <br />
              between your skills
              <br />
              and your{" "}
              <span className="font-serif italic text-blue">dream job</span>
            </h1>

            <p className="text-lg text-muted leading-relaxed mb-8 max-w-[420px]">
              Upload your resume, pick a target role, and get a precise
              AI-generated learning roadmap tailored to the exact skills you
              need to build.
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-5">
              <Link
                href="/auth"
                className="inline-flex h-11 px-6 items-center text-base font-medium bg-blue text-white rounded-full hover:bg-blue-600 transition-colors"
              >
                Analyse my resume
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex h-11 px-6 items-center text-base font-medium border border-line-2 text-ink rounded-full hover:bg-line transition-colors"
              >
                See how it works
              </a>
            </div>

            <p className="text-xs text-muted flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green" />
              Free analysis · No credit card required
            </p>
          </div>

          {/* ── Right: visual ── */}
          <div className="relative">
            <div className="absolute -inset-8 -z-10 bg-gradient-to-br from-blue-50 via-transparent to-transparent rounded-3xl blur-2xl opacity-70" />

            <div className="bg-paper border border-line rounded-2xl shadow-md overflow-hidden">
              <div className="px-5 pt-5 pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-semibold text-muted uppercase tracking-widest">
                      Skill Analysis
                    </p>
                    <p className="text-sm font-semibold text-ink mt-0.5">
                      Data Analyst
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-ink leading-none">
                      72%
                    </p>
                    <p className="text-[10px] text-muted mt-0.5">readiness</p>
                  </div>
                </div>
              </div>

              <div className="h-[240px] px-2">
                <RadarChart animated={chartReady} />
              </div>

              <div className="px-5 pb-5 pt-3 border-t border-line">
                <p className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-2">
                  Skills to build
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {["Tableau", "Machine Learning", "Statistics"].map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange border border-orange/10"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute -top-4 -right-4 bg-paper border border-line rounded-xl shadow-md px-3.5 py-2.5 text-xs font-semibold text-ink flex items-center gap-1.5">
              <span role="img" aria-label="target">
                🎯
              </span>{" "}
              3 skills to bridge
            </div>

            <div className="absolute -bottom-4 -left-4 bg-green-50 border border-green/20 rounded-xl shadow-md px-3.5 py-2.5 text-xs font-semibold text-green flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5 flex-shrink-0"
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
              SQL · 85% proficient
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── How it works ──────────────────────────────────────────────────────────────

interface Step {
  num: string;
  title: string;
  desc: string;
  icon: ReactNode;
}

const STEPS: Step[] = [
  {
    num: "01",
    title: "Upload Your Resume",
    desc: "Drop your PDF or Word file. Our AI reads it instantly to map your current skills, experience, and knowledge level.",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
        />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Choose Your Target Role",
    desc: "Pick a domain and role — Data Analyst, ML Engineer, Product Manager — and we benchmark you against real job requirements.",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"
        />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Get Your Roadmap",
    desc: "Receive a prioritized learning path with curated resources, assessments, and a readiness score that improves as you learn.",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
        />
      </svg>
    ),
  },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-paper">
      <div className="max-w-6xl mx-auto px-6">
        <Reveal className="text-center mb-14">
          <p className="text-xs font-semibold text-blue uppercase tracking-widest mb-3">
            How it works
          </p>
          <h2 className="text-4xl font-semibold text-ink tracking-tight">
            From resume to roadmap in three steps
          </h2>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((step, i) => (
            <Reveal key={step.num} delay={i * 100}>
              <div className="relative bg-bg border border-line rounded-xl p-6 h-full">
                <span className="text-[11px] font-bold text-muted/50 tracking-widest block mb-4">
                  {step.num}
                </span>
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue flex items-center justify-center mb-4">
                  {step.icon}
                </div>
                <h3 className="text-base font-semibold text-ink mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted leading-relaxed">{step.desc}</p>

                {i < STEPS.length - 1 && (
                  <div className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-paper border border-line rounded-full items-center justify-center z-10">
                    <svg
                      className="w-3 h-3 text-muted"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Features ──────────────────────────────────────────────────────────────────

interface Feature {
  title: string;
  desc: string;
  icon: ReactNode;
  accent: "blue" | "green" | "orange";
}

const FEATURES: Feature[] = [
  {
    title: "AI Skill Gap Analysis",
    desc: "Get a precise breakdown of exactly which skills you have vs. what your target role demands, powered by Gemini AI.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    accent: "blue",
  },
  {
    title: "Personalized Learning Path",
    desc: "A curated sequence of courses, articles, and projects ordered by priority and tailored to close your specific gaps.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    accent: "green",
  },
  {
    title: "Readiness Score",
    desc: "A clear percentage score showing how prepared you are, updated in real time as you complete learning modules.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    accent: "blue",
  },
  {
    title: "Instant Resume Parsing",
    desc: "Upload PDF or Word files and we extract your skills and experience automatically — no manual input needed.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    accent: "orange",
  },
  {
    title: "Progress Tracking",
    desc: "Track your learning streak, mark modules complete, and watch your readiness score climb day by day.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    accent: "green",
  },
  {
    title: "Skill Assessments",
    desc: "Test your knowledge with AI-generated, timed quizzes that validate your learning before you advance.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    accent: "orange",
  },
];

const ACCENT: Record<Feature["accent"], { bg: string; text: string }> = {
  blue:   { bg: "bg-blue-50",   text: "text-blue" },
  green:  { bg: "bg-green-50",  text: "text-green" },
  orange: { bg: "bg-orange-50", text: "text-orange" },
};

function FeaturesSection() {
  return (
    <section id="features" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <Reveal className="text-center mb-14">
          <p className="text-xs font-semibold text-blue uppercase tracking-widest mb-3">
            Features
          </p>
          <h2 className="text-4xl font-semibold text-ink tracking-tight">
            Everything you need to land your next role
          </h2>
        </Reveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => {
            const { bg, text } = ACCENT[f.accent];
            return (
              <Reveal key={f.title} delay={i * 80}>
                <div className="bg-paper border border-line rounded-xl p-6 h-full hover:shadow-sm transition-shadow">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center mb-4",
                      bg,
                      text
                    )}
                  >
                    {f.icon}
                  </div>
                  <h3 className="text-sm font-semibold text-ink mb-2">
                    {f.title}
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── CTA Banner ────────────────────────────────────────────────────────────────

function CTABanner() {
  return (
    <section className="py-24" style={{ background: "var(--ink)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <Reveal className="text-center">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">
            Start today — it&apos;s free
          </p>
          <h2 className="text-4xl font-semibold text-white tracking-tight mb-4">
            Start your skill analysis today
          </h2>
          <p className="text-lg text-white/55 mb-10 max-w-md mx-auto leading-relaxed">
            No credit card. No setup. AI-powered results in under 30 seconds.
          </p>
          <Link
            href="/auth"
            className="inline-flex h-12 px-8 items-center text-base font-medium bg-white text-ink rounded-full hover:bg-blue-50 transition-colors"
          >
            Analyse my resume free →
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

const FOOTER_LINKS: Record<string, { label: string; href: string }[]> = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Pricing", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
  ],
  Legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
    { label: "Cookies", href: "#" },
  ],
};

function Footer() {
  return (
    <footer className="bg-paper border-t border-line py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 lg:col-span-1">
            <BrandMark />
            <p className="text-sm text-muted mt-3 leading-relaxed max-w-[200px]">
              AI-powered skill gap analysis and personalized learning paths.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <p className="text-xs font-semibold text-ink uppercase tracking-wider mb-3">
                {section}
              </p>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="text-sm text-muted hover:text-ink transition-colors"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-line pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} SkillBridge. All rights reserved.
          </p>
          <p className="text-xs text-muted">Built with AI, for your career.</p>
        </div>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <CTABanner />
      <Footer />
    </div>
  );
}
