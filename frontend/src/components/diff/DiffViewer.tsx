import React, { useState } from "react";
import { DiffPayload, DiffChunk } from "../../types";
import { Columns, AlignJustify, Copy, Check, Info } from "lucide-react";
import { Button } from "../ui/Button";

export interface DiffViewerProps {
  diff: DiffPayload;
  previousVersionDate?: string;
  currentVersionDate?: string;
  screenshotUrl?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  diff,
  previousVersionDate,
  currentVersionDate,
  screenshotUrl,
}) => {
  const [mode, setMode] = useState<"side-by-side" | "unified">("side-by-side");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"diff" | "screenshot">("diff");

  const copyUnifiedDiff = () => {
    navigator.clipboard.writeText(diff.unified_diff || diff.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 font-mono text-xs overflow-hidden">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            Diff Engine
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700">
            {diff.change_percentage}% change
          </span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">+{diff.lines_added}</span>
          <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">-{diff.lines_removed}</span>
          {diff.lines_modified > 0 && (
            <span className="text-[11px] text-neutral-600 dark:text-neutral-400 font-medium">{diff.lines_modified} modified</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {screenshotUrl && (
            <div className="flex items-center border border-neutral-200 dark:border-neutral-800 rounded p-0.5 bg-neutral-100 dark:bg-neutral-900">
              <button
                onClick={() => setActiveTab("diff")}
                className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                  activeTab === "diff"
                    ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium shadow-sm"
                    : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                }`}
              >
                Code Diff
              </button>
              <button
                onClick={() => setActiveTab("screenshot")}
                className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                  activeTab === "screenshot"
                    ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium shadow-sm"
                    : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                }`}
              >
                Snapshot
              </button>
            </div>
          )}

          {activeTab === "diff" && (
            <>
              <div className="flex items-center border border-neutral-200 dark:border-neutral-800 rounded p-0.5 bg-neutral-100 dark:bg-neutral-900">
                <button
                  onClick={() => setMode("side-by-side")}
                  className={`p-1 rounded transition-colors ${
                    mode === "side-by-side"
                      ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm"
                      : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                  }`}
                  title="Side-by-side view"
                >
                  <Columns className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setMode("unified")}
                  className={`p-1 rounded transition-colors ${
                    mode === "unified"
                      ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm"
                      : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                  }`}
                  title="Unified diff view"
                >
                  <AlignJustify className="w-3.5 h-3.5" />
                </button>
              </div>

              <Button variant="outline" size="xs" onClick={copyUnifiedDiff} leftIcon={copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}>
                {copied ? "Copied" : "Copy Diff"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Summary Alert Box */}
      <div className="flex items-start gap-2 px-3 py-2 bg-neutral-900/20 border-b border-neutral-800/60 text-neutral-300 text-[11px]">
        <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
        <span className="leading-relaxed">{diff.summary}</span>
      </div>

      {/* Main Content Area */}
      {activeTab === "screenshot" && screenshotUrl ? (
        <div className="p-4 bg-neutral-950 flex flex-col items-center justify-center">
          <div className="w-full max-w-4xl border border-neutral-800 rounded overflow-hidden shadow-lg bg-neutral-900">
            <div className="px-3 py-1.5 bg-neutral-900 border-b border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between">
              <span>Full Page Screenshot Capture</span>
              <a
                href={screenshotUrl}
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:underline"
              >
                Open full size
              </a>
            </div>
            <img src={screenshotUrl} alt="Website snapshot" className="w-full h-auto object-top" />
          </div>
        </div>
      ) : mode === "side-by-side" ? (
        <div className="overflow-x-auto">
          {/* Header Labels */}
          <div className="grid grid-cols-2 text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-900/60">
            <div className="px-3 py-1.5 border-r border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <span>Previous Version</span>
              <span className="text-[10px] text-neutral-500">{previousVersionDate || "Baseline"}</span>
            </div>
            <div className="px-3 py-1.5 flex items-center justify-between">
              <span>Current Version</span>
              <span className="text-[10px] text-neutral-500">{currentVersionDate || "Latest"}</span>
            </div>
          </div>

          {/* Side-by-side Chunks */}
          <div className="divide-y divide-neutral-200 dark:divide-neutral-900/40">
            {diff.chunks && diff.chunks.length > 0 ? (
              diff.chunks.map((chunk: DiffChunk, idx: number) => {
                const maxLines = Math.max(chunk.prev_lines.length, chunk.curr_lines.length);

                return (
                  <div key={idx} className="grid grid-cols-2 divide-x divide-neutral-200 dark:divide-neutral-800/80">
                    {/* Previous side */}
                    <div className="overflow-x-auto">
                      {Array.from({ length: maxLines }).map((_, lineIdx) => {
                        const line = chunk.prev_lines[lineIdx];
                        const lineNum = chunk.prev_start + lineIdx + 1;
                        const isDeleted = chunk.type === "delete" || chunk.type === "replace";

                        return (
                          <div
                            key={lineIdx}
                            className={`flex items-start px-2 py-0.5 leading-relaxed font-mono ${
                              line === undefined
                                ? "bg-neutral-50/50 dark:bg-neutral-950 text-neutral-300 dark:text-neutral-700"
                                : isDeleted
                                ? "bg-rose-50 dark:bg-rose-950/25 text-rose-900 dark:text-rose-200"
                                : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/60 dark:hover:bg-neutral-900/50"
                            }`}
                          >
                            <span className="w-8 shrink-0 text-right pr-2 text-neutral-400 dark:text-neutral-600 select-none text-[10px]">
                              {line !== undefined ? lineNum : ""}
                            </span>
                            <span className="w-4 shrink-0 text-center select-none text-rose-600 dark:text-rose-400 font-bold">
                              {line !== undefined && isDeleted ? "-" : " "}
                            </span>
                            <span className="whitespace-pre-wrap break-all flex-1">
                              {line || " "}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Current side */}
                    <div className="overflow-x-auto">
                      {Array.from({ length: maxLines }).map((_, lineIdx) => {
                        const line = chunk.curr_lines[lineIdx];
                        const lineNum = chunk.curr_start + lineIdx + 1;
                        const isAdded = chunk.type === "insert" || chunk.type === "replace";

                        return (
                          <div
                            key={lineIdx}
                            className={`flex items-start px-2 py-0.5 leading-relaxed font-mono ${
                              line === undefined
                                ? "bg-neutral-50/50 dark:bg-neutral-950 text-neutral-300 dark:text-neutral-700"
                                : isAdded
                                ? "bg-emerald-50 dark:bg-emerald-950/25 text-emerald-900 dark:text-emerald-200"
                                : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/60 dark:hover:bg-neutral-900/50"
                            }`}
                          >
                            <span className="w-8 shrink-0 text-right pr-2 text-neutral-400 dark:text-neutral-600 select-none text-[10px]">
                              {line !== undefined ? lineNum : ""}
                            </span>
                            <span className="w-4 shrink-0 text-center select-none text-emerald-600 dark:text-emerald-400 font-bold">
                              {line !== undefined && isAdded ? "+" : " "}
                            </span>
                            <span className="whitespace-pre-wrap break-all flex-1">
                              {line || " "}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-neutral-500">No content diff lines to display.</div>
            )}
          </div>
        </div>
      ) : (
        /* Unified Diff View */
        <div className="overflow-x-auto p-2 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800">
          <pre className="font-mono text-xs leading-relaxed text-neutral-800 dark:text-neutral-300 whitespace-pre">
            {diff.unified_diff || "No unified diff available."}
          </pre>
        </div>
      )}
    </div>
  );
};
