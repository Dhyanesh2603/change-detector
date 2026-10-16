import React, { useState } from "react";
import { DashboardSummary } from "../../types";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { formatRelativeTime, formatNormalTime } from "../../utils/date";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowUpRight,
  Zap,
  Globe,
  Radio,
  Plus,
  Minus,
  FileText,
  Sparkles,
  Eye,
  Play,
  RotateCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface DashboardViewProps {
  summary: DashboardSummary | null;
  isLoading: boolean;
  onSelectWebsite: (id: number) => void;
  onViewChange: (changeId: number) => void;
  onRefresh?: () => void;
  onSimulateChange?: (websiteId: number) => Promise<void>;
  onTriggerCheck?: (websiteId: number) => Promise<void>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  isLoading,
  onSelectWebsite,
  onViewChange,
  onRefresh,
  onSimulateChange,
  onTriggerCheck,
}) => {
  const [simulatingId, setSimulatingId] = useState<number | null>(null);

  if (isLoading && !summary) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 rounded bg-neutral-900 border border-neutral-800" />
          ))}
        </div>
        <div className="h-64 rounded bg-neutral-900 border border-neutral-800" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-8 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 text-center">
        <p className="text-xs text-neutral-400 mb-3">Telemetry summary is currently unavailable.</p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 border border-neutral-700 transition-colors cursor-pointer"
          >
            Retry Telemetry Fetch
          </button>
        )}
      </div>
    );
  }

  const { status_counts, total_checks_24h, total_changes_24h, average_response_time_ms, recent_activity, health_metrics } = summary;

  const handleSimulate = async (websiteId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSimulateChange) return;
    setSimulatingId(websiteId);
    try {
      await onSimulateChange(websiteId);
    } finally {
      setSimulatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 shadow-2xs transition-colors">
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
            <span>Total Monitors</span>
            <Globe className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
          </div>
          <div className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mt-1">{status_counts.total}</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">{total_checks_24h} checks in 24h</div>
        </div>

        <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 shadow-2xs transition-colors">
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
            <span>Healthy Sites</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mt-1">{status_counts.healthy}</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">Content unchanged</div>
        </div>

        <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 shadow-2xs transition-colors">
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
            <span>Changed Sites</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-xl font-bold tracking-tight text-amber-600 dark:text-amber-400 mt-1">{status_counts.changed}</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">{total_changes_24h} detected today</div>
        </div>

        <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 shadow-2xs transition-colors">
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
            <span>Failed / Errors</span>
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-xl font-bold tracking-tight text-rose-600 dark:text-rose-400 mt-1">{status_counts.failed}</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">HTTP error or timeout</div>
        </div>

        <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 shadow-2xs transition-colors">
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
            <span>Avg Response</span>
            <Zap className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
          </div>
          <div className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mt-1">{average_response_time_ms}ms</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">Headless render time</div>
        </div>
      </div>

      {/* Latency & Throughput Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 mb-2">
          <div>
            <CardTitle>Page Render Latency (Last 24h)</CardTitle>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Playwright browser automation response times in milliseconds
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-neutral-400 dark:bg-neutral-600 border border-neutral-500" />
            <span>Response Latency (ms)</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={health_metrics} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#71717a" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#71717a" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="timestamp" stroke="#71717a" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderColor: "#3f3f46",
                    fontSize: "11px",
                    fontFamily: "monospace",
                    borderRadius: "4px",
                  }}
                  itemStyle={{ color: "#f4f4f5" }}
                />
                <Area
                  type="monotone"
                  dataKey="response_time_ms"
                  stroke="#71717a"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#latencyGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Live Content Change Activity Stream with Inlined Text Diffs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 mb-2">
          <div>
            <CardTitle>Monitored Content Stream & Detected Text Changes</CardTitle>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Real-time text additions, deletions, and tracked baseline extracts across monitored websites
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">Live Sync</span>
          </div>
        </CardHeader>
        <CardContent>
          {recent_activity.length === 0 ? (
            <div className="py-10 text-center text-xs text-neutral-500">
              <Globe className="w-6 h-6 mx-auto mb-2 text-neutral-400 dark:text-neutral-600" />
              <p className="text-neutral-700 dark:text-neutral-300 font-semibold">No monitored websites active</p>
              <p className="text-[11px] mt-1 text-neutral-500">
                Add a website from the Monitors tab to begin capturing baselines and detecting content mutations.
              </p>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {recent_activity.map((item) => {
                const isChange = item.event_type === "change_detected";
                const isSimulating = simulatingId === item.website_id;

                return (
                  <div
                    key={`${item.event_type}-${item.id}`}
                    className="p-3.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 hover:bg-neutral-50 dark:hover:bg-neutral-900/70 transition-all space-y-2.5 shadow-none"
                  >
                    {/* Header Row */}
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isChange ? "bg-amber-600 dark:bg-amber-400" : "bg-emerald-600 dark:bg-emerald-400"
                          }`}
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => onSelectWebsite(item.website_id)}
                              className="font-bold text-neutral-900 dark:text-neutral-100 hover:text-neutral-600 dark:hover:text-neutral-300 hover:underline cursor-pointer truncate text-sm"
                            >
                              {item.website_name}
                            </button>
                            <span className="text-[11px] text-neutral-500 truncate max-w-xs">{item.website_url}</span>
                            {isChange && item.change_percentage !== undefined ? (
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold border border-neutral-300 dark:border-neutral-700">
                                {item.change_percentage}% Mutation
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold border border-neutral-200 dark:border-neutral-700">
                                Baseline Active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5">{item.summary}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right text-[11px] leading-tight">
                          <span className="font-medium text-neutral-800 dark:text-neutral-200 block">
                            {formatRelativeTime(item.occurred_at)}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono block">
                            {formatNormalTime(item.occurred_at, true)}
                          </span>
                        </div>
                        {onSimulateChange && (
                          <button
                            onClick={(e) => handleSimulate(item.website_id, e)}
                            disabled={isSimulating}
                            className="px-2 py-0.5 rounded bg-white hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-[10px] text-neutral-700 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            title="Simulate text change on this monitor"
                          >
                            <Sparkles className="w-3 h-3 text-neutral-500 dark:text-neutral-400" />
                            <span>{isSimulating ? "Mutating..." : "Simulate Change"}</span>
                          </button>
                        )}
                        {isChange && (
                          <button
                            onClick={() => onViewChange(item.id)}
                            className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-900 border border-neutral-900 dark:border-neutral-200 text-[10px] transition-colors flex items-center gap-1 cursor-pointer font-medium"
                          >
                            <span>Inspect Diff</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* INLINED TEXT DIFF PREVIEW: Added Lines */}
                    {item.text_preview_added && item.text_preview_added.length > 0 && (
                      <div className="rounded bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 p-2 text-[11px] space-y-1">
                        <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                          <Plus className="w-3 h-3" />
                          <span>Detected Added Content ({item.lines_added || item.text_preview_added.length} lines):</span>
                        </div>
                        {item.text_preview_added.map((line, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 leading-relaxed text-emerald-900 dark:text-emerald-200">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold select-none shrink-0">+</span>
                            <span className="whitespace-pre-wrap break-all">{line}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* INLINED TEXT DIFF PREVIEW: Removed Lines */}
                    {item.text_preview_removed && item.text_preview_removed.length > 0 && (
                      <div className="rounded bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 p-2 text-[11px] space-y-1">
                        <div className="text-[10px] font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                          <Minus className="w-3 h-3" />
                          <span>Detected Removed Content ({item.lines_removed || item.text_preview_removed.length} lines):</span>
                        </div>
                        {item.text_preview_removed.map((line, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 leading-relaxed text-rose-900 dark:text-rose-300">
                            <span className="text-rose-600 dark:text-rose-400 font-bold select-none shrink-0">-</span>
                            <span className="whitespace-pre-wrap break-all line-through opacity-85">{line}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* BASELINE TRACKED TEXT PREVIEW (When no changes have mutated yet) */}
                    {!isChange && item.tracked_text_snippet && (
                      <div className="rounded bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 p-2.5 text-[11px] space-y-1">
                        <div className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                          <FileText className="w-3 h-3 text-neutral-500" />
                          <span>Monitored Baseline Text Extract:</span>
                        </div>
                        <div className="text-neutral-700 dark:text-neutral-400 leading-relaxed font-mono whitespace-pre-wrap line-clamp-3 bg-white dark:bg-neutral-900/50 p-1.5 rounded border border-neutral-200 dark:border-neutral-800/60">
                          {item.tracked_text_snippet}
                        </div>
                        <div className="text-[10px] text-neutral-500 pt-0.5">
                          SHA-256 hash verified • Standing by for remote content updates. Click &quot;Simulate Change&quot; to test diff detection immediately.
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
