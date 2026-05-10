import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-line", className)} />;
}

export default function ResumeLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-full max-w-lg space-y-6">
        {/* Title block */}
        <div className="space-y-2">
          <Bone className="h-8 w-56" />
          <Bone className="h-4 w-80" />
        </div>

        {/* Drop zone */}
        <div className="rounded-xl border-2 border-dashed border-line bg-paper px-8 py-12 flex flex-col items-center gap-4">
          <Bone className="h-10 w-10 rounded-full" />
          <div className="space-y-2 text-center">
            <Bone className="h-4 w-44 mx-auto" />
            <Bone className="h-3 w-28 mx-auto" />
          </div>
        </div>

        {/* Hint */}
        <Bone className="h-3 w-40 mx-auto" />

        {/* Button */}
        <Bone className="h-12 w-full rounded-full" />
      </div>
    </div>
  );
}
