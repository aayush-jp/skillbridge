"use client";

import {
  useState,
  useRef,
  type DragEvent,
  type ChangeEvent,
  type MouseEvent,
} from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const ALLOWED_EXTS = new Set([".pdf", ".docx"]);

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getExt(filename: string) {
  return filename.slice(filename.lastIndexOf(".")).toLowerCase();
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function SpinnerIcon() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      className="h-10 w-10 text-muted"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.25}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 16V4m0 0-4 4m4-4 4 4M4 20h16"
      />
    </svg>
  );
}

function DropIcon() {
  return (
    <svg
      className="h-10 w-10 text-blue"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.25}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4v16m0 0-4-4m4 4 4-4M4 20h16"
      />
    </svg>
  );
}

function FileIcon({ ext }: { ext: string }) {
  return (
    <div className="flex h-12 w-10 flex-col rounded border border-line bg-blue-50 text-[7px] font-bold uppercase leading-none overflow-hidden flex-shrink-0">
      <div className="flex-1 flex items-center justify-center">
        <svg
          className="h-4 w-4 text-blue"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <div className="bg-blue text-white text-center py-0.5 tracking-wide">
        {ext.slice(1)}
      </div>
    </div>
  );
}

function BrandMark() {
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
      <span className="font-semibold text-sm tracking-tight text-ink">
        SkillBridge
      </span>
    </div>
  );
}

// ── Drop zone states ───────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <UploadIcon />
      <div className="space-y-1">
        <p className="text-sm font-medium text-ink">
          Drag your resume here
        </p>
        <p className="text-xs text-muted">
          or{" "}
          <span className="text-blue underline underline-offset-2">
            browse files
          </span>
        </p>
      </div>
    </div>
  );
}

function DraggingState() {
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <DropIcon />
      <p className="text-sm font-medium text-blue">Drop it here!</p>
    </div>
  );
}

function FileSelectedState({
  file,
  onRemove,
}: {
  file: File;
  onRemove: (e: MouseEvent<HTMLButtonElement>) => void;
}) {
  const ext = getExt(file.name);
  return (
    <div className="flex items-center gap-4 text-left">
      <FileIcon ext={ext} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink truncate">{file.name}</p>
        <p className="text-xs text-muted mt-0.5">{formatBytes(file.size)}</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="flex-shrink-0 text-xs text-muted hover:text-red transition-colors px-1 py-0.5 rounded"
        aria-label="Remove file"
      >
        Remove
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ResumePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  function validateFile(f: File): string | null {
    const ext = getExt(f.name);
    if (!ALLOWED_TYPES.has(f.type) && !ALLOWED_EXTS.has(ext)) {
      return "Only PDF and DOCX files are supported";
    }
    if (f.size > MAX_BYTES) return "File must be 5 MB or smaller";
    return null;
  }

  function acceptFile(f: File) {
    const err = validateFile(f);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setFile(f);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) acceptFile(dropped);
  }

  function handleInput(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (picked) acceptFile(picked);
    e.target.value = "";
  }

  async function handleContinue() {
    if (!file || uploading) return;
    setUploading(true);
    setError(null);

    const body = new FormData();
    body.append("file", file);

    const toastId = toast.loading("Uploading resume…");

    try {
      const res = await fetch("/api/parse-resume", { method: "POST", body });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "Upload failed. Please try again.", {
          id: toastId,
        });
        setError(json.error ?? "Something went wrong. Please try again.");
        return;
      }

      toast.success("Resume uploaded successfully!", { id: toastId });
      router.push(`/skill-gap?resumeId=${json.id}`);
    } catch {
      toast.error("Network error. Please try again.", { id: toastId });
      setError("Network error. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-line bg-paper">
        <BrandMark />
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted">Step 3 of 3</span>
          <div className="h-1.5 w-24 rounded-full bg-line overflow-hidden">
            <div className="h-full w-full bg-blue rounded-full" />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Title */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-ink tracking-tight">
              Upload your resume
            </h1>
            <p className="mt-1.5 text-sm text-muted leading-relaxed">
              We&apos;ll analyse your skills and identify gaps for your target
              role. Your file stays private.
            </p>
          </div>

          {/* Drop zone */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload resume"
            onClick={() => !uploading && fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (!uploading) fileInputRef.current?.click();
              }
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => {
              if (!uploading) handleDrop(e);
              else e.preventDefault();
            }}
            className={cn(
              "relative rounded-xl border-2 border-dashed px-8 py-10 cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/40",
              isDragging
                ? "border-blue bg-blue-50"
                : file
                  ? "border-line bg-paper cursor-default"
                  : "border-line-2 bg-paper hover:border-blue/60 hover:bg-blue-50/40"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              className="sr-only"
              onChange={handleInput}
              disabled={uploading}
            />

            {isDragging ? (
              <DraggingState />
            ) : file ? (
              <FileSelectedState
                file={file}
                onRemove={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setError(null);
                }}
              />
            ) : (
              <EmptyState />
            )}
          </div>

          {/* Error */}
          {error && (
            <p role="alert" className="mt-3 text-sm text-red">
              {error}
            </p>
          )}

          {/* Hint */}
          {!error && (
            <p className="mt-3 text-xs text-muted text-center">
              PDF or DOCX &middot; Max&nbsp;5&nbsp;MB
            </p>
          )}

          {/* Continue */}
          <Button
            variant="blue"
            size="lg"
            className="w-full mt-6"
            disabled={!file || uploading}
            onClick={handleContinue}
          >
            {uploading && <SpinnerIcon />}
            Continue →
          </Button>
        </div>
      </main>
    </div>
  );
}
