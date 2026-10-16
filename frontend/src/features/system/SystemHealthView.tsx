import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Server, CheckCircle2, ShieldCheck, Database, Cpu, HardDrive, RefreshCw } from "lucide-react";

export const SystemHealthView: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const systems = [
    {
      name: "FastAPI Modular Monolith API",
      status: "Operational",
      latency: "1.2ms",
      desc: "Python 3.13 / ASGI / HTTP/2 Async Worker",
      icon: Server,
    },
    {
      name: "Database (PostgreSQL / SQLite 3NF)",
      status: "Operational",
      latency: "0.8ms",
      desc: "SQLAlchemy 2.0 AsyncPool / 7 Normalized Entities",
      icon: Database,
    },
    {
      name: "Playwright Headless Browser Automation",
      status: "Ready",
      latency: "Active",
      desc: "Chromium 131 / NetworkIdle Sync / DOM Extraction",
      icon: Cpu,
    },
    {
      name: "Diff & Semantic Normalization Engine",
      status: "Ready",
      latency: "Active",
      desc: "SHA-256 Hash Engine / BS4 Noise Filters / Unified Diff",
      icon: ShieldCheck,
    },
    {
      name: "Snapshot Persistence Storage",
      status: "Mounted",
      latency: "Local Disk / S3 Ready",
      desc: "Deterministic Asset Storage for HTML, Text & Screenshots",
      icon: HardDrive,
    },
  ];

  return (
    <div className="space-y-4 text-xs">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Server className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
            <span>System Infrastructure Health</span>
          </h2>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Internal telemetry of background workers, database connection pools, and browser runtimes
          </p>
        </div>

        <Button
          variant="outline"
          size="xs"
          onClick={handleRefresh}
          isLoading={isRefreshing}
          leftIcon={<RefreshCw className="w-3 h-3" />}
        >
          Refresh Status
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {systems.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              className="p-3.5 rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 flex items-center justify-center shrink-0 text-neutral-700 dark:text-neutral-300">
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">{s.name}</h4>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-semibold shrink-0">
                    {s.status}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">{s.desc}</p>
                <div className="text-[10px] text-neutral-600 dark:text-neutral-400 font-mono mt-1.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Telemetry: {s.latency}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deployment & Runtime Architecture Specs */}
      <Card>
        <CardHeader>
          <CardTitle>Architecture & Runtime Specifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-neutral-700 dark:text-neutral-300 text-[11px]">
            <div className="p-2.5 rounded bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 space-y-1">
              <div className="text-neutral-500 text-[10px] uppercase font-bold">Pattern</div>
              <div className="font-semibold text-neutral-800 dark:text-neutral-200">Modular Monolith</div>
              <div className="text-neutral-500 text-[10px]">Independent bounded modules</div>
            </div>
            <div className="p-2.5 rounded bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 space-y-1">
              <div className="text-neutral-500 text-[10px] uppercase font-bold">Browser Isolation</div>
              <div className="font-semibold text-neutral-800 dark:text-neutral-200">Playwright Headless</div>
              <div className="text-neutral-500 text-[10px]">Chromium context sandboxing</div>
            </div>
            <div className="p-2.5 rounded bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 space-y-1">
              <div className="text-neutral-500 text-[10px] uppercase font-bold">Database Model</div>
              <div className="font-semibold text-neutral-800 dark:text-neutral-200">3NF Normalized</div>
              <div className="text-neutral-500 text-[10px]">7 Relational Tables</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
