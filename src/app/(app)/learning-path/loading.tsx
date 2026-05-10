import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-line", className)} />;
}

export default function LearningPathLoading() {
  return (
    <>
      {/* Header meta */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bone className="h-6 w-36 rounded-full" />
          <Bone className="h-4 w-28" />
        </div>
        <Bone className="h-4 w-20" />
      </div>

      {/* Progress bar */}
      <Bone className="h-1 w-full rounded-full mb-6" />

      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-[260px] flex-shrink-0 gap-1.5">
          <Bone className="h-3.5 w-24 mb-2" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
              <Bone className="h-7 w-7 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Bone className="h-3.5 w-full" />
                <Bone className="h-3 w-10" />
              </div>
            </div>
          ))}
        </aside>

        {/* Module content */}
        <div className="flex-1 min-w-0">
          <div className="bg-paper border border-line rounded-xl overflow-hidden">
            {/* Module header */}
            <div className="px-6 py-5 border-b border-line space-y-3">
              <Bone className="h-3 w-20" />
              <Bone className="h-7 w-3/4" />
              <div className="flex gap-2">
                <Bone className="h-6 w-10 rounded-full" />
                <Bone className="h-6 w-20 rounded-full" />
              </div>
            </div>

            {/* Module body */}
            <div className="px-6 py-5 space-y-6">
              {/* Description */}
              <div className="space-y-2">
                <Bone className="h-3 w-full" />
                <Bone className="h-3 w-5/6" />
                <Bone className="h-3 w-4/6" />
              </div>

              {/* Skills covered */}
              <div className="space-y-3">
                <Bone className="h-3 w-28" />
                <div className="flex gap-2 flex-wrap">
                  {[1, 2, 3, 4].map((n) => (
                    <Bone key={n} className="h-6 w-20 rounded-full" />
                  ))}
                </div>
              </div>

              {/* Resources */}
              <div className="space-y-3">
                <Bone className="h-3 w-24" />
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex items-center gap-3">
                    <Bone className="h-8 w-8 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Bone className="h-4 w-48" />
                      <Bone className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Button */}
              <div className="flex justify-end pt-2 border-t border-line">
                <Bone className="h-9 w-40 rounded-full mt-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
