"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

// ── Data ──────────────────────────────────────────────────────────────────────

type Level = "entry" | "mid" | "senior";

interface Role {
  id: string;
  name: string;
  description: string;
  level: Level;
}

interface Domain {
  id: string;
  name: string;
  emoji: string;
  roles: Role[];
}

const DOMAINS: Domain[] = [
  {
    id: "data-science",
    name: "Data Science",
    emoji: "📊",
    roles: [
      { id: "data-analyst",        name: "Data Analyst",         description: "Transform raw data into actionable insights",              level: "entry"  },
      { id: "data-scientist",      name: "Data Scientist",       description: "Build predictive models and statistical analyses",          level: "mid"    },
      { id: "ml-engineer",         name: "ML Engineer",          description: "Design, train and deploy machine learning systems",         level: "mid"    },
      { id: "bi-developer",        name: "BI Developer",         description: "Craft dashboards and self-serve reporting solutions",       level: "entry"  },
      { id: "data-engineer",       name: "Data Engineer",        description: "Build and maintain scalable data pipelines",                level: "mid"    },
      { id: "research-scientist",  name: "Research Scientist",   description: "Advance the state of the art in AI and ML research",       level: "senior" },
      { id: "ai-product-manager",  name: "AI Product Manager",   description: "Define strategy and roadmap for AI-powered products",      level: "senior" },
    ],
  },
  {
    id: "software-engineering",
    name: "Software Engineering",
    emoji: "💻",
    roles: [
      { id: "frontend-engineer",    name: "Frontend Engineer",    description: "Build responsive UIs and client-side applications",        level: "entry"  },
      { id: "backend-engineer",     name: "Backend Engineer",     description: "Design APIs, services and database layers",               level: "mid"    },
      { id: "fullstack-engineer",   name: "Full Stack Engineer",  description: "Own end-to-end features across the entire stack",         level: "mid"    },
      { id: "mobile-engineer",      name: "Mobile Engineer",      description: "Ship native or cross-platform mobile applications",       level: "mid"    },
      { id: "platform-engineer",    name: "Platform Engineer",    description: "Build internal developer tooling and platforms",          level: "senior" },
      { id: "engineering-manager",  name: "Engineering Manager",  description: "Lead teams and drive technical strategy",                 level: "senior" },
    ],
  },
  {
    id: "product-management",
    name: "Product Management",
    emoji: "📋",
    roles: [
      { id: "apm",           name: "Associate PM",          description: "Support product teams and learn the craft of product",    level: "entry"  },
      { id: "pm",            name: "Product Manager",       description: "Own roadmap, strategy and cross-functional delivery",     level: "mid"    },
      { id: "senior-pm",     name: "Senior PM",             description: "Lead strategic initiatives and mentor other PMs",         level: "senior" },
      { id: "technical-pm",  name: "Technical PM",          description: "Bridge engineering and product with deep technical depth", level: "mid"    },
      { id: "principal-pm",  name: "Principal PM",          description: "Define product vision and company-wide priorities",       level: "senior" },
    ],
  },
  {
    id: "ux-design",
    name: "UX Design",
    emoji: "🎨",
    roles: [
      { id: "ux-researcher",      name: "UX Researcher",        description: "Uncover user needs through research and testing",         level: "entry"  },
      { id: "ui-designer",        name: "UI Designer",          description: "Craft pixel-perfect interfaces and design systems",       level: "entry"  },
      { id: "product-designer",   name: "Product Designer",     description: "Own the full design process from research to delivery",   level: "mid"    },
      { id: "ux-lead",            name: "UX Lead",              description: "Lead design strategy and mentor the design org",          level: "senior" },
      { id: "design-systems-eng", name: "Design Systems Eng.",  description: "Build component libraries at design–code intersection",   level: "senior" },
    ],
  },
  {
    id: "marketing",
    name: "Marketing",
    emoji: "📈",
    roles: [
      { id: "growth-marketer",    name: "Growth Marketer",      description: "Drive acquisition and retention through experimentation",  level: "mid"    },
      { id: "content-strategist", name: "Content Strategist",   description: "Develop content strategy and editorial planning",          level: "mid"    },
      { id: "seo-specialist",     name: "SEO Specialist",       description: "Improve organic search visibility and traffic",            level: "entry"  },
      { id: "brand-manager",      name: "Brand Manager",        description: "Define and protect brand identity across channels",        level: "senior" },
      { id: "marketing-analyst",  name: "Marketing Analyst",    description: "Measure campaign performance and marketing ROI",           level: "entry"  },
    ],
  },
  {
    id: "finance",
    name: "Finance",
    emoji: "💰",
    roles: [
      { id: "financial-analyst",   name: "Financial Analyst",   description: "Model financial performance and support decisions",        level: "entry"  },
      { id: "investment-analyst",  name: "Investment Analyst",  description: "Evaluate investment opportunities and market trends",      level: "mid"    },
      { id: "risk-analyst",        name: "Risk Analyst",        description: "Identify and quantify financial and operational risk",     level: "mid"    },
      { id: "portfolio-manager",   name: "Portfolio Manager",   description: "Manage investment portfolios and client assets",           level: "senior" },
      { id: "fpa-manager",         name: "FP&A Manager",        description: "Own financial planning, forecasting and business analysis",level: "senior" },
    ],
  },
  {
    id: "cybersecurity",
    name: "Cybersecurity",
    emoji: "🔒",
    roles: [
      { id: "security-analyst",  name: "Security Analyst",     description: "Monitor systems and respond to security incidents",        level: "entry"  },
      { id: "pen-tester",        name: "Penetration Tester",   description: "Ethically exploit vulnerabilities to harden defences",     level: "mid"    },
      { id: "security-engineer", name: "Security Engineer",    description: "Build and maintain secure infrastructure and tooling",     level: "mid"    },
      { id: "cloud-security",    name: "Cloud Security Eng.",  description: "Secure cloud environments, IAM and workloads at scale",    level: "senior" },
      { id: "ciso",              name: "CISO",                 description: "Lead organisational security strategy and compliance",     level: "senior" },
    ],
  },
  {
    id: "devops",
    name: "DevOps",
    emoji: "⚙️",
    roles: [
      { id: "devops-engineer",  name: "DevOps Engineer",       description: "Automate CI/CD pipelines and improve delivery velocity",   level: "entry"  },
      { id: "sre",              name: "Site Reliability Eng.", description: "Build reliable systems with SLOs, SLIs and error budgets", level: "mid"    },
      { id: "cloud-engineer",   name: "Cloud Engineer",        description: "Design and manage cloud infrastructure at scale",          level: "mid"    },
      { id: "infra-engineer",   name: "Infrastructure Eng.",   description: "Build and operate core compute and networking layers",     level: "mid"    },
      { id: "devops-lead",      name: "DevOps Lead",           description: "Define platform engineering direction and team strategy",  level: "senior" },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const LEVEL_LABEL: Record<Level, string> = {
  entry:  "Entry level",
  mid:    "Mid level",
  senior: "Senior",
};

const LEVEL_VARIANT: Record<Level, BadgeProps["variant"]> = {
  entry:  "green",
  mid:    "blue",
  senior: "orange",
};

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-3 w-3", className)}
      fill="none"
      viewBox="0 0 12 12"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 6.5l2.5 2.5 5.5-5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none"
      fill="none"
      viewBox="0 0 20 20"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 13l4 4m-4-4a6 6 0 10-8.485-8.485A6 6 0 0013 13z" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DomainCard({
  domain,
  selected,
  onSelect,
}: {
  domain: Domain;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "relative flex flex-col gap-2 p-4 rounded-xl border-2 text-left w-full",
        "transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/40",
        selected
          ? "border-blue bg-blue-50 shadow-md"
          : "border-line bg-paper shadow-sm hover:border-blue/40 hover:shadow-md"
      )}
    >
      {selected && (
        <span className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue">
          <CheckIcon className="text-white" />
        </span>
      )}
      <span className="text-3xl leading-none select-none">{domain.emoji}</span>
      <div>
        <p className={cn("text-sm font-semibold leading-snug", selected ? "text-blue-600" : "text-ink")}>
          {domain.name}
        </p>
        <p className="text-xs text-muted mt-0.5">{domain.roles.length} roles</p>
      </div>
    </button>
  );
}

function RoleCard({
  role,
  selected,
  onSelect,
}: {
  role: Role;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left",
        "transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/40",
        selected
          ? "border-blue bg-blue-50 shadow-sm"
          : "border-line bg-paper hover:border-blue/30 hover:bg-blue-50/40"
      )}
    >
      {/* Radio indicator */}
      <span
        className={cn(
          "flex-shrink-0 flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors",
          selected ? "border-blue" : "border-line-2"
        )}
      >
        {selected && <span className="h-2 w-2 rounded-full bg-blue" />}
      </span>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-semibold", selected ? "text-blue-600" : "text-ink")}>
          {role.name}
        </p>
        <p className="text-xs text-muted mt-0.5 leading-relaxed truncate">
          {role.description}
        </p>
      </div>

      {/* Level badge */}
      <Badge variant={LEVEL_VARIANT[role.level]} className="flex-shrink-0">
        {LEVEL_LABEL[role.level]}
      </Badge>
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();

  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [selectedRole,   setSelectedRole]   = useState<Role   | null>(null);
  const [search,         setSearch]         = useState("");
  const [saving,         setSaving]         = useState(false);
  const [saveError,      setSaveError]      = useState<string | null>(null);

  // Step 2 animation state
  const [step2Mounted,  setStep2Mounted]  = useState(false);
  const [step2Visible,  setStep2Visible]  = useState(false);
  const step2Ref = useRef<HTMLDivElement>(null);

  const progress = selectedRole ? 100 : selectedDomain ? 50 : 0;

  const handleDomainSelect = useCallback(
    (domain: Domain) => {
      const isFirst = !selectedDomain;
      setSelectedDomain(domain);
      setSelectedRole(null);
      setSearch("");

      if (isFirst) {
        // Mount with opacity-0, then animate in on next paint
        setStep2Mounted(true);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setStep2Visible(true);
            // Smooth-scroll to step 2 after transition starts
            setTimeout(() => {
              step2Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 80);
          });
        });
      }
    },
    [selectedDomain]
  );

  const filteredRoles = selectedDomain
    ? selectedDomain.roles.filter((r) =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  async function handleSubmit() {
    if (!selectedDomain || !selectedRole) return;

    setSaveError(null);
    setSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth");
      return;
    }

    const { error } = await supabase.from("target_roles").insert({
      user_id: user.id,
      domain: selectedDomain.name,
      role: selectedRole.name,
    });

    if (error) {
      setSaveError(error.message);
      setSaving(false);
    } else {
      router.push("/resume");
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-paper border-b border-line">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-6">
          {/* Wordmark */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-blue flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-semibold text-sm text-ink tracking-tight">SkillBridge</span>
          </div>

          {/* Progress bar */}
          <div className="flex-1 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-line rounded-full overflow-hidden">
              <div
                className="h-full bg-blue rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-muted flex-shrink-0 tabular-nums">
              Step {selectedDomain ? "2" : "1"} of 2
            </span>
          </div>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10 pb-32 space-y-12">

          {/* ── Step 1: Domain ─────────────────────────────────────────── */}
          <section>
            <div className="mb-1">
              <span className="text-xs font-semibold text-blue uppercase tracking-widest">
                Step 1
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-ink tracking-tight">
              Choose your target domain
            </h1>
            <p className="mt-1 text-sm text-muted">
              Pick the field you want to break into or grow within.
            </p>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {DOMAINS.map((domain) => (
                <DomainCard
                  key={domain.id}
                  domain={domain}
                  selected={selectedDomain?.id === domain.id}
                  onSelect={() => handleDomainSelect(domain)}
                />
              ))}
            </div>
          </section>

          {/* ── Step 2: Role (animated entrance) ───────────────────────── */}
          {step2Mounted && (
            <section
              ref={step2Ref}
              className={cn(
                "transition-all duration-500 ease-out",
                step2Visible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-5 pointer-events-none"
              )}
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs font-semibold text-blue uppercase tracking-widest">
                  Step 2
                </span>
                {selectedDomain && (
                  <>
                    <span className="text-xs text-line-2">·</span>
                    <span className="text-xs font-medium text-muted">
                      {selectedDomain.name}
                    </span>
                  </>
                )}
              </div>
              <h2 className="text-2xl font-semibold text-ink tracking-tight">
                Choose your target role
              </h2>
              <p className="mt-1 text-sm text-muted">
                Select the specific role you are aiming for.
              </p>

              {/* Search */}
              <div className="relative mt-5">
                <SearchIcon />
                <Input
                  type="search"
                  placeholder="Search roles…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Role list */}
              <div className="mt-3 space-y-2">
                {filteredRoles.length > 0 ? (
                  filteredRoles.map((role) => (
                    <RoleCard
                      key={role.id}
                      role={role}
                      selected={selectedRole?.id === role.id}
                      onSelect={() => setSelectedRole(role)}
                    />
                  ))
                ) : (
                  <p className="text-center text-sm text-muted py-10">
                    No roles match &ldquo;{search}&rdquo;
                  </p>
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* ── Sticky footer ───────────────────────────────────────────────── */}
      <footer className="sticky bottom-0 z-20 bg-paper border-t border-line">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between gap-4">

          {/* Selection summary */}
          <div className="min-w-0">
            {selectedRole && selectedDomain ? (
              <div className="flex items-center gap-2 text-sm min-w-0">
                <span className="text-muted truncate">{selectedDomain.name}</span>
                <span className="text-line-2 flex-shrink-0">·</span>
                <span className="font-medium text-ink truncate">{selectedRole.name}</span>
              </div>
            ) : (
              <p className="text-sm text-muted">
                {selectedDomain
                  ? "Select a role to continue"
                  : "Select a domain to get started"}
              </p>
            )}

            {saveError && (
              <p className="text-xs text-red mt-0.5">{saveError}</p>
            )}
          </div>

          {/* CTA */}
          <Button
            variant="blue"
            size="lg"
            disabled={!selectedRole || saving}
            onClick={handleSubmit}
            className="flex-shrink-0"
          >
            {saving ? <SpinnerIcon /> : null}
            Continue →
          </Button>
        </div>
      </footer>
    </div>
  );
}
