import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-line", className)} />;
}

export default function OnboardingLoading() {
  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1.5">
          <Bone className="h-7 w-48" />
          <Bone className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {[1, 2, 3].map((n) => (
            <Bone key={n} className="h-2 w-8 rounded-full" />
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <Bone className="h-1 w-full rounded-full mb-10" />

      {/* Domain cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {Array.from({ length: 8 }).map((_, i) => (
          <Bone key={i} className="h-28 rounded-xl" />
        ))}
      </div>

      {/* Footer CTA */}
      <div className="flex justify-end">
        <Bone className="h-12 w-36 rounded-full" />
      </div>
    </div>
  );
}
