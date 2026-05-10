import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-line", className)} />;
}

export default function SkillGapLoading() {
  return (
    <>
      {/* Status hint */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="h-4 w-4 rounded-full bg-blue-50 animate-pulse flex-shrink-0" />
        <Bone className="h-4 w-64" />
      </div>

      <div className="grid lg:grid-cols-[380px_1fr] gap-8 items-start">
        {/* Left — score card */}
        <div className="bg-paper border border-line rounded-xl p-6 flex flex-col items-center gap-5">
          <Bone className="h-44 w-44 rounded-full" />
          <div className="space-y-2 w-full text-center">
            <Bone className="h-5 w-52 mx-auto" />
            <Bone className="h-4 w-32 mx-auto" />
          </div>
          <div className="w-full space-y-1.5">
            <Bone className="h-3 w-full" />
            <Bone className="h-3 w-5/6" />
            <Bone className="h-3 w-4/6" />
          </div>
        </div>

        {/* Right — skill panels */}
        <div className="space-y-5">
          {/* Skills You Have */}
          <div className="bg-paper border border-line rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-line">
              <div className="w-2 h-2 rounded-full bg-line animate-pulse" />
              <Bone className="h-4 w-32" />
              <Bone className="h-3 w-6 ml-auto" />
            </div>
            <div className="divide-y divide-line">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="flex items-center gap-3 px-5 py-3.5">
                  <Bone className="h-4 flex-1" />
                  <Bone className="h-5 w-20 rounded-full flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Skills to Build */}
          <div className="bg-paper border border-line rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-line">
              <div className="w-2 h-2 rounded-full bg-line animate-pulse" />
              <Bone className="h-4 w-28" />
              <Bone className="h-3 w-6 ml-auto" />
            </div>
            <div className="divide-y divide-line">
              {[1, 2, 3].map((n) => (
                <div key={n} className="px-5 py-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <Bone className="h-4 flex-1" />
                    <Bone className="h-5 w-16 rounded-full flex-shrink-0" />
                  </div>
                  <Bone className="h-3 w-5/6" />
                  <div className="flex gap-2">
                    <Bone className="h-5 w-28 rounded-full" />
                    <Bone className="h-5 w-24 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-10 flex justify-center">
        <Bone className="h-12 w-56 rounded-full" />
      </div>
    </>
  );
}
