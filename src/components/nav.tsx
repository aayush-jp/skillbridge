"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NavUser {
  name: string;
  email: string;
  avatarUrl?: string | null;
}

// ── Nav link definitions ──────────────────────────────────────────────────────

interface NavLink {
  label: string;
  href: string;
  prefix?: boolean;
  icon: React.ReactNode;
}

const NAV_LINKS: NavLink[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    label: "Learning Path",
    href: "/learning-path",
    prefix: true,
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    label: "Assessments",
    href: "/assessment",
    prefix: true,
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_PALETTES = [
  "bg-blue-50 text-blue",
  "bg-green-50 text-green",
  "bg-orange-50 text-orange",
];

function paletteFor(name: string) {
  return AVATAR_PALETTES[name.charCodeAt(0) % AVATAR_PALETTES.length];
}

function initials(name: string, email: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  if (words[0]?.length) return words[0][0].toUpperCase();
  return (email[0] ?? "U").toUpperCase();
}

function isActive(pathname: string, href: string, prefix?: boolean) {
  return prefix ? pathname.startsWith(href) : pathname === href;
}

// ── Brand mark ────────────────────────────────────────────────────────────────

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

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ user, size = "sm" }: { user: NavUser; size?: "sm" | "md" }) {
  const inits = initials(user.name, user.email);
  const dim = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        referrerPolicy="no-referrer"
        className={cn("rounded-full object-cover flex-shrink-0", dim)}
      />
    );
  }

  return (
    <div className={cn("rounded-full font-semibold flex items-center justify-center flex-shrink-0", dim, paletteFor(user.name))}>
      {inits}
    </div>
  );
}

// ── Dropdown ──────────────────────────────────────────────────────────────────

function DropdownRow({
  href,
  onClick,
  danger,
  children,
}: {
  href?: string;
  onClick?: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  const cls = cn(
    "flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-lg w-full text-left transition-colors",
    danger ? "text-red hover:bg-red-50" : "text-ink hover:bg-line"
  );
  if (href) {
    return <Link href={href} onClick={onClick} className={cls}>{children}</Link>;
  }
  return <button type="button" onClick={onClick} className={cls}>{children}</button>;
}

function Dropdown({ user, onClose, onSignOut }: { user: NavUser; onClose: () => void; onSignOut: () => void }) {
  return (
    <div className="absolute right-0 top-full mt-2 w-56 bg-paper border border-line rounded-xl shadow-md overflow-hidden z-50">
      {/* User header */}
      <div className="flex items-center gap-3 px-3 py-3 border-b border-line">
        <Avatar user={user} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink truncate">{user.name}</p>
          <p className="text-xs text-muted truncate">{user.email}</p>
        </div>
      </div>

      <div className="p-1.5 space-y-0.5">
        <DropdownRow href="/profile" onClick={onClose}>
          <svg className="w-4 h-4 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Profile
        </DropdownRow>

        <DropdownRow href="/settings" onClick={onClose}>
          <svg className="w-4 h-4 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </DropdownRow>

        <div className="my-1 border-t border-line" />

        <DropdownRow danger onClick={onSignOut}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </DropdownRow>
      </div>
    </div>
  );
}

// ── Mobile drawer ─────────────────────────────────────────────────────────────

function MobileDrawer({
  open,
  user,
  pathname,
  onClose,
  onSignOut,
}: {
  open: boolean;
  user: NavUser;
  pathname: string;
  onClose: () => void;
  onSignOut: () => void;
}) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div className={cn("fixed inset-0 z-50 md:hidden", !open && "pointer-events-none")}>
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <aside
        className={cn(
          "absolute inset-y-0 left-0 w-72 bg-paper border-r border-line flex flex-col",
          "transform transition-transform duration-300 ease-in-out will-change-transform",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Navigation menu"
      >
        {/* Header row */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-line flex-shrink-0">
          <BrandMark />
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-line transition-colors text-muted hover:text-ink"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User row */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-line flex-shrink-0">
          <Avatar user={user} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink truncate">{user.name}</p>
            <p className="text-xs text-muted truncate">{user.email}</p>
          </div>
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          <p className="text-[10px] font-semibold text-muted uppercase tracking-widest px-3 pt-1 pb-2">
            Navigation
          </p>
          {NAV_LINKS.map(({ label, href, prefix, icon }) => {
            const active = isActive(pathname, href, prefix);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  active ? "bg-blue-50 text-blue" : "text-ink hover:bg-line"
                )}
              >
                <span className={active ? "text-blue" : "text-muted"}>{icon}</span>
                {label}
              </Link>
            );
          })}

          <div className="pt-3 mt-3 border-t border-line space-y-0.5">
            <p className="text-[10px] font-semibold text-muted uppercase tracking-widest px-3 pb-2">
              Account
            </p>

            <Link
              href="/profile"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink hover:bg-line transition-colors"
            >
              <svg className="w-4 h-4 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </Link>

            <Link
              href="/settings"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink hover:bg-line transition-colors"
            >
              <svg className="w-4 h-4 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </Link>
          </div>
        </nav>

        {/* Sign-out footer */}
        <div className="p-3 border-t border-line flex-shrink-0">
          <button
            type="button"
            onClick={onSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red hover:bg-red-50 transition-colors w-full"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>
    </div>
  );
}

// ── Nav (exported) ────────────────────────────────────────────────────────────

export function Nav({ user }: { user: NavUser }) {
  const router = useRouter();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside mousedown
  useEffect(() => {
    if (!dropdownOpen) return;
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [dropdownOpen]);

  // Close drawer when resizing to desktop
  useEffect(() => {
    function handle() { if (window.innerWidth >= 768) setDrawerOpen(false); }
    window.addEventListener("resize", handle, { passive: true });
    return () => window.removeEventListener("resize", handle);
  }, []);

  // Lock body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  async function handleSignOut() {
    setDropdownOpen(false);
    setDrawerOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-paper/95 backdrop-blur-sm border-b border-line">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center gap-4">
          {/* Logo */}
          <Link href="/dashboard" className="flex-shrink-0">
            <BrandMark />
          </Link>

          {/* Centre: desktop nav links */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center" aria-label="Main">
            {NAV_LINKS.map(({ label, href, prefix }) => {
              const active = isActive(pathname, href, prefix);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "px-3.5 py-2 text-sm font-medium rounded-lg transition-colors",
                    active
                      ? "bg-line text-ink"
                      : "text-muted hover:text-ink hover:bg-line/60"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right: avatar dropdown (desktop) + hamburger (mobile) */}
          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            {/* Desktop avatar dropdown */}
            <div ref={dropdownRef} className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setDropdownOpen((p) => !p)}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-line transition-colors",
                  dropdownOpen && "bg-line"
                )}
                aria-expanded={dropdownOpen}
                aria-haspopup="menu"
                aria-label="User menu"
              >
                <Avatar user={user} size="sm" />
                <svg
                  className={cn("w-3.5 h-3.5 text-muted transition-transform duration-150", dropdownOpen && "rotate-180")}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <Dropdown
                  user={user}
                  onClose={() => setDropdownOpen(false)}
                  onSignOut={handleSignOut}
                />
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-line transition-colors text-ink"
              aria-label="Open navigation menu"
              aria-expanded={drawerOpen}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <MobileDrawer
        open={drawerOpen}
        user={user}
        pathname={pathname}
        onClose={() => setDrawerOpen(false)}
        onSignOut={handleSignOut}
      />
    </>
  );
}
