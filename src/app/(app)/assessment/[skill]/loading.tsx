import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-line", className)} />;
}

export default function AssessmentLoading() {
  return (
    <div className="max-w-2xl mx-auto py-6">
      {/* Quiz header */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1.5">
          <Bone className="h-6 w-48" />
          <Bone className="h-3.5 w-32" />
        </div>
        {/* Timer */}
        <Bone className="h-9 w-24 rounded-full" />
      </div>

      {/* Progress bar */}
      <div className="mb-8 space-y-2">
        <div className="flex justify-between">
          <Bone className="h-3 w-28" />
          <Bone className="h-3 w-16" />
        </div>
        <Bone className="h-1.5 w-full rounded-full" />
      </div>

      {/* Question card */}
      <div className="bg-paper border border-line rounded-xl overflow-hidden">
        {/* Question */}
        <div className="px-6 py-6 border-b border-line space-y-2">
          <Bone className="h-3 w-24 mb-3" />
          <Bone className="h-5 w-full" />
          <Bone className="h-5 w-4/5" />
        </div>

        {/* Answer options */}
        <div className="px-6 py-5 space-y-3">
          {["A", "B", "C", "D"].map((opt) => (
            <div
              key={opt}
              className="flex items-center gap-4 p-4 rounded-xl border border-line"
            >
              <Bone className="h-8 w-8 rounded-full flex-shrink-0" />
              <Bone className="h-4 flex-1" />
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="px-6 py-4 border-t border-line flex justify-end">
          <Bone className="h-10 w-28 rounded-full" />
        </div>
      </div>
    </div>
  );
}
