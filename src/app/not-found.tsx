import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center gap-6">
      <div className="space-y-1">
        <p className="text-8xl font-bold tracking-tight text-line select-none">
          404
        </p>
        <h2 className="text-xl font-semibold text-ink">Page not found</h2>
        <p className="text-sm text-muted max-w-sm leading-relaxed mt-2">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center h-[38px] px-4 text-sm font-medium rounded-full bg-blue text-white hover:bg-blue-600 transition-colors"
        >
          Back to dashboard
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center h-[38px] px-4 text-sm font-medium rounded-full border border-line text-ink hover:bg-line transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
