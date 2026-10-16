import React, { useState, useRef, useCallback } from "react";
import { DiffPayload, DiffChunk } from "../../types";
import {
  Columns,
  AlignJustify,
  Copy,
  Check,
  Info,
  Sliders,
  SplitSquareVertical,
  Layers,
  ExternalLink,
  ImageIcon
} from "lucide-react";
import { Button } from "../ui/Button";

export interface DiffViewerProps {
  diff: DiffPayload;
  previousVersionDate?: string;
  currentVersionDate?: string;
  screenshotUrl?: string;
  previousScreenshotUrl?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  diff,
  previousVersionDate,
  currentVersionDate,
  screenshotUrl,
  previousScreenshotUrl,
}) => {
  const [activeTab, setActiveTab] = useState<"diff" | "visual">("diff");
  const [codeMode, setCodeMode] = useState<"side-by-side" | "unified">("side-by-side");
  const [visualMode, setVisualMode] = useState<"slider" | "side-by-side" | "blend">("slider");
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [blendOpacity, setBlendOpacity] = useState<number>(50);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const sliderRef = useRef<HTMLDivElement>(null);

  const copyUnifiedDiff = () => {
    navigator.clipboard.writeText(diff.unified_diff || diff.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSliderMove = useCallback((clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const pos = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.min(100, Math.max(0, pos)));
  }, []);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleSliderMove(e.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  const hasBothScreenshots = !!(previousScreenshotUrl && screenshotUrl);
  const hasAnyScreenshot = !!(screenshotUrl || previousScreenshotUrl);

  return (
    <div className="w-full rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs overflow-hidden select-none">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/40">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            Diff Engine
          </span>
          <span className="px-2 py-0.5 rounded text-[11px] bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300 font-medium border border-neutral-300 dark:border-neutral-700">
            {diff.change_percentage}% change
          </span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">+{diff.lines_added}</span>
          <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">-{diff.lines_removed}</span>
          {diff.lines_modified > 0 && (
            <span className="text-[11px] text-neutral-600 dark:text-neutral-400 font-medium">{diff.lines_modified} modified</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Main Tab Switcher: Code Diff vs Visual Comparison */}
          {hasAnyScreenshot && (
            <div className="flex items-center border border-neutral-200 dark:border-neutral-800 rounded-md p-0.5 bg-neutral-100 dark:bg-neutral-900">
              <button
                onClick={() => setActiveTab("diff")}
                className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                  activeTab === "diff"
                    ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium shadow-2xs"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
                }`}
              >
                Code Diff
              </button>
              <button
                onClick={() => setActiveTab("visual")}
                className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "visual"
                    ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium shadow-2xs"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Visual Comparison</span>
              </button>
            </div>
          )}

          {/* Sub-controls for Code Diff */}
          {activeTab === "diff" && (
            <>
              <div className="flex items-center border border-neutral-200 dark:border-neutral-800 rounded-md p-0.5 bg-neutral-100 dark:bg-neutral-900">
                <button
                  onClick={() => setCodeMode("side-by-side")}
                  className={`p-1.5 rounded transition-colors cursor-pointer ${
                    codeMode === "side-by-side"
                      ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-2xs"
                      : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                  }`}
                  title="Side-by-side view"
                >
                  <Columns className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setCodeMode("unified")}
                  className={`p-1.5 rounded transition-colors cursor-pointer ${
                    codeMode === "unified"
                      ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-2xs"
                      : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                  }`}
                  title="Unified diff view"
                >
                  <AlignJustify className="w-3.5 h-3.5" />
                </button>
              </div>

              <Button
                variant="outline"
                size="xs"
                onClick={copyUnifiedDiff}
                leftIcon={copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              >
                {copied ? "Copied" : "Copy Diff"}
              </Button>
            </>
          )}

          {/* Sub-controls for Visual Comparison */}
          {activeTab === "visual" && hasBothScreenshots && (
            <div className="flex items-center border border-neutral-200 dark:border-neutral-800 rounded-md p-0.5 bg-neutral-100 dark:bg-neutral-900">
              <button
                onClick={() => setVisualMode("slider")}
                className={`px-2 py-1 text-xs rounded transition-colors cursor-pointer flex items-center gap-1 ${
                  visualMode === "slider"
                    ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium shadow-2xs"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
                }`}
                title="Interactive Split Slider"
              >
                <Sliders className="w-3 h-3" />
                <span>Split Slider</span>
              </button>
              <button
                onClick={() => setVisualMode("side-by-side")}
                className={`px-2 py-1 text-xs rounded transition-colors cursor-pointer flex items-center gap-1 ${
                  visualMode === "side-by-side"
                    ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium shadow-2xs"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
                }`}
                title="Side by Side Images"
              >
                <SplitSquareVertical className="w-3 h-3" />
                <span>Dual View</span>
              </button>
              <button
                onClick={() => setVisualMode("blend")}
                className={`px-2 py-1 text-xs rounded transition-colors cursor-pointer flex items-center gap-1 ${
                  visualMode === "blend"
                    ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium shadow-2xs"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
                }`}
                title="Opacity Blend Overlay"
              >
                <Layers className="w-3 h-3" />
                <span>Blend</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Change Intelligence Banner */}
      <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-900/40 border-b border-neutral-200 dark:border-neutral-800 text-xs space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {diff.severity && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                diff.severity === "CRITICAL"
                  ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                  : diff.severity === "HIGH"
                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                  : diff.severity === "MEDIUM"
                  ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700"
              }`}>
                {diff.severity} IMPACT
              </span>
            )}

            {diff.category_label && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
                {diff.category_label}
              </span>
            )}
          </div>

          {diff.key_entities && diff.key_entities.length > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
              <span className="text-[10px] uppercase font-medium">Entities:</span>
              {diff.key_entities.map((ent, idx) => (
                <span key={idx} className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-neutral-200/60 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700">
                  {ent}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-start gap-2 text-neutral-800 dark:text-neutral-200">
          <Info className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed font-medium">
            {diff.executive_summary || diff.summary}
          </p>
        </div>
      </div>

      {/* MAIN VIEWPORT */}
      {activeTab === "visual" ? (
        /* VISUAL COMPARISON SUITE */
        <div className="p-4 bg-neutral-100 dark:bg-neutral-950 flex flex-col items-center">
          {hasBothScreenshots ? (
            <div className="w-full max-w-4xl space-y-3">
              {/* Controls bar depending on visualMode */}
              {visualMode === "slider" && (
                <div className="flex items-center justify-between gap-4 p-2.5 rounded-md bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">
                    &larr; Baseline ({previousVersionDate ? new Date(previousVersionDate).toLocaleTimeString() : "Before"})
                  </span>
                  <div className="flex items-center gap-2 flex-1 max-w-xs">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={sliderPos}
                      onChange={(e) => setSliderPos(Number(e.target.value))}
                      className="w-full accent-neutral-900 dark:accent-neutral-100 cursor-pointer"
                    />
                    <span className="font-mono text-[11px] w-9 text-right text-neutral-600 dark:text-neutral-400">
                      {Math.round(sliderPos)}%
                    </span>
                  </div>
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">
                    Current ({currentVersionDate ? new Date(currentVersionDate).toLocaleTimeString() : "After"}) &rarr;
                  </span>
                </div>
              )}

              {visualMode === "blend" && (
                <div className="flex items-center justify-between gap-4 p-2.5 rounded-md bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">
                    100% Baseline
                  </span>
                  <div className="flex items-center gap-2 flex-1 max-w-xs">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={blendOpacity}
                      onChange={(e) => setBlendOpacity(Number(e.target.value))}
                      className="w-full accent-neutral-900 dark:accent-neutral-100 cursor-pointer"
                    />
                    <span className="font-mono text-[11px] w-9 text-right text-neutral-600 dark:text-neutral-400">
                      {blendOpacity}%
                    </span>
                  </div>
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">
                    100% Current
                  </span>
                </div>
              )}

              {/* Display Area */}
              {visualMode === "slider" && (
                <div
                  ref={sliderRef}
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                  onMouseMove={handleMouseMove}
                  onTouchMove={handleTouchMove}
                  className="relative w-full overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-900 shadow-md cursor-ew-resize select-none"
                  style={{ maxHeight: "560px" }}
                >
                  {/* Current Snapshot (Underneath / Right side) */}
                  <img
                    src={screenshotUrl}
                    alt="Current snapshot"
                    className="w-full h-auto object-top block pointer-events-none"
                  />
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-neutral-900/80 backdrop-blur-xs text-neutral-200 text-[10px] font-medium border border-neutral-700/60 pointer-events-none">
                    Current Version
                  </div>

                  {/* Previous Snapshot (Clipped on Left side) */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                  >
                    <img
                      src={previousScreenshotUrl}
                      alt="Previous baseline"
                      className="w-full h-auto object-top block pointer-events-none"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-neutral-900/80 backdrop-blur-xs text-neutral-200 text-[10px] font-medium border border-neutral-700/60 pointer-events-none">
                      Baseline Version
                    </div>
                  </div>

                  {/* Draggable Divider Line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
                    style={{ left: `${sliderPos}%` }}
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white border-2 border-neutral-900 dark:border-white shadow-lg flex items-center justify-center font-bold text-xs">
                      &harr;
                    </div>
                  </div>
                </div>
              )}

              {visualMode === "side-by-side" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                  <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-white dark:bg-neutral-900">
                    <div className="px-3 py-1.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-[11px] font-medium text-neutral-600 dark:text-neutral-400 flex items-center justify-between">
                      <span>Baseline Version</span>
                      {previousScreenshotUrl && (
                        <a
                          href={previousScreenshotUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center gap-1"
                        >
                          <span>Full size</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                    <div className="max-h-[500px] overflow-y-auto">
                      <img src={previousScreenshotUrl} alt="Baseline" className="w-full h-auto object-top" />
                    </div>
                  </div>

                  <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-white dark:bg-neutral-900">
                    <div className="px-3 py-1.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-[11px] font-medium text-neutral-600 dark:text-neutral-400 flex items-center justify-between">
                      <span>Current Version</span>
                      {screenshotUrl && (
                        <a
                          href={screenshotUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center gap-1"
                        >
                          <span>Full size</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                    <div className="max-h-[500px] overflow-y-auto">
                      <img src={screenshotUrl} alt="Current" className="w-full h-auto object-top" />
                    </div>
                  </div>
                </div>
              )}

              {visualMode === "blend" && (
                <div className="relative w-full overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-900 shadow-md">
                  <img
                    src={previousScreenshotUrl}
                    alt="Baseline base"
                    className="w-full h-auto object-top block"
                  />
                  <img
                    src={screenshotUrl}
                    alt="Current overlay"
                    className="absolute inset-0 w-full h-auto object-top"
                    style={{ opacity: blendOpacity / 100 }}
                  />
                </div>
              )}
            </div>
          ) : (
            /* Single Screenshot Fallback */
            <div className="w-full max-w-4xl border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-white dark:bg-neutral-900 shadow-md">
              <div className="px-3.5 py-2 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 flex items-center justify-between">
                <span>Current Page Snapshot</span>
                <a
                  href={screenshotUrl || previousScreenshotUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center gap-1"
                >
                  <span>Open Full Size</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <img
                src={screenshotUrl || previousScreenshotUrl}
                alt="Website snapshot"
                className="w-full h-auto object-top"
              />
            </div>
          )}
        </div>
      ) : codeMode === "side-by-side" ? (
        /* CODE DIFF - SIDE BY SIDE */
        <div className="overflow-x-auto">
          {/* Header Labels */}
          <div className="grid grid-cols-2 text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-900/60">
            <div className="px-3 py-1.5 border-r border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <span>Previous Version</span>
              <span className="text-[10px] text-neutral-500 font-mono">{previousVersionDate || "Baseline"}</span>
            </div>
            <div className="px-3 py-1.5 flex items-center justify-between">
              <span>Current Version</span>
              <span className="text-[10px] text-neutral-500 font-mono">{currentVersionDate || "Latest"}</span>
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
        /* CODE DIFF - UNIFIED */
        <div className="overflow-x-auto p-3 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800">
          <pre className="font-mono text-xs leading-relaxed text-neutral-800 dark:text-neutral-300 whitespace-pre">
            {diff.unified_diff || "No unified diff available."}
          </pre>
        </div>
      )}
    </div>
  );
};
