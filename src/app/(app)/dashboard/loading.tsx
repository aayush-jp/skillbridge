import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-line", className)} />;
}

export default function DashboardLoading() {
  return (
    <>
      {/* Row 1: Welcome skeleton */}
      <div className="mb-7 space-y-2">
        <Bone className="h-8 w-72" />
        <Bone className="h-4 w-48" />
      </div>

      <div className="grid grid-cols-12 gap-5">

          {/* Card 1: Target Role */}
          <div className="col-span-12 lg:col-span-8 bg-paper border border-line rounded-xl p-6">
            <Bone className="h-3 w-24 mb-4" />
            <div className="flex items-start gap-6">
              <Bone className="w-36 h-36 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-3 pt-1">
                <Bone className="h-7 w-52" />
                <Bone className="h-5 w-28 rounded-full" />
                <Bone className="h-10 w-14 rounded-lg" />
                <Bone className="h-4 w-36" />
              </div>
            </div>
          </div>

          {/* Card 2: Streak */}
          <div className="col-span-12 lg:col-span-4 bg-paper border border-line rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <Bone className="w-9 h-9 rounded-full flex-shrink-0" />
              <div className="space-y-1.5">
                <Bone className="h-5 w-32" />
                <Bone className="h-3 w-24" />
              </div>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <Bone className="h-2.5 w-3 rounded" />
                  <Bone className="w-7 h-7 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Continue Learning */}
          <div className="col-span-12 lg:col-span-8 bg-paper border border-line rounded-xl p-6">
            <Bone className="h-3 w-36 mb-4" />
            <div className="mb-4 space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <Bone className="h-5 w-64" />
                <Bone className="h-3 w-8" />
              </div>
              <Bone className="h-1.5 w-full rounded-full" />
              <Bone className="h-3 w-44" />
            </div>
            <Bone className="h-9 w-28 rounded-full mb-5" />
            <div className="border-t border-line pt-4 space-y-1">
              <Bone className="h-3 w-16 mb-2" />
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex items-center gap-3 py-1.5">
                  <Bone className="w-5 h-5 rounded-full flex-shrink-0" />
                  <Bone className="h-4 flex-1" />
                  <Bone className="h-3 w-8" />
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: Quick Stats */}
          <div className="col-span-12 lg:col-span-4 bg-paper border border-line rounded-xl p-6">
            <Bone className="h-3 w-24 mb-4" />
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Bone className="w-8 h-8 rounded-lg flex-shrink-0" />
                    <Bone className="h-3.5 w-36" />
                  </div>
                  <Bone className="h-4 w-12" />
                </div>
              ))}
            </div>
          </div>

          {/* Card 5: Recent Activity */}
          <div className="col-span-12 bg-paper border border-line rounded-xl p-6">
            <Bone className="h-3 w-32 mb-4" />
            <div className="divide-y divide-line">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="flex items-start gap-4 py-3.5 first:pt-0 last:pb-0">
                  <Bone className="w-7 h-7 rounded-full flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1.5">
                    <Bone className="h-4 w-36" />
                    <Bone className="h-3 w-56" />
                  </div>
                  <div className="space-y-1 text-right flex-shrink-0">
                    <Bone className="h-4 w-10 ml-auto" />
                    <Bone className="h-3 w-14 ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          </div>

      </div>
    </>
  );
}
