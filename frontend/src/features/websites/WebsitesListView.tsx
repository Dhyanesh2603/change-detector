import React, { useState, useMemo } from "react";
import { Website, HealthStatus } from "../../types";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { formatRelativeTime, formatNormalTime, formatNormalDateTime } from "../../utils/date";
import {
  Play,
  Pause,
  Settings,
  Trash2,
  Search,
  ExternalLink,
  Plus,
  RefreshCw,
  Clock,
  Filter,
  Sparkles,
} from "lucide-react";

export interface WebsitesListViewProps {
  websites: Website[];
  isLoading: boolean;
  onOpenNewWebsiteModal: () => void;
  onSelectWebsite: (website: Website) => void;
  onTriggerCheck: (id: number) => Promise<void>;
  onDeleteWebsite: (id: number) => Promise<void>;
  onUpdateWebsite?: (
    websiteId: number,
    data: Partial<{ name: string; url: string; check_interval_minutes: number; is_active: boolean }>
  ) => Promise<void>;
  onSimulateChange?: (websiteId: number) => Promise<void>;
  checkingIds: Set<number>;
}

export const WebsitesListView: React.FC<WebsitesListViewProps> = ({
  websites,
  isLoading,
  onOpenNewWebsiteModal,
  onSelectWebsite,
  onTriggerCheck,
  onDeleteWebsite,
  onUpdateWebsite,
  onSimulateChange,
  checkingIds,
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filteredWebsites = useMemo(() => {
    return websites.filter((site) => {
      const matchesSearch =
        site.name.toLowerCase().includes(search.toLowerCase()) ||
        site.url.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;
      if (statusFilter === "ALL") return true;
      return site.status.toUpperCase() === statusFilter;
    });
  }, [websites, search, statusFilter]);

  const filterTabs = [
    { id: "ALL", label: "All Monitors", count: websites.length },
    { id: "HEALTHY", label: "Healthy", count: websites.filter((w) => w.status === "HEALTHY").length },
    { id: "CHANGED", label: "Changed", count: websites.filter((w) => w.status === "CHANGED").length },
    { id: "FAILED", label: "Failed", count: websites.filter((w) => w.status === "FAILED").length },
  ];

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1 border border-neutral-200 dark:border-neutral-800 rounded bg-white dark:bg-neutral-900/60 p-0.5">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold shadow-xs"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] text-neutral-500 font-normal">({tab.count})</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="w-64">
            <Input
              placeholder="Search by name or URL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-3.5 h-3.5" />}
            />
          </div>

          <Button variant="primary" size="sm" onClick={onOpenNewWebsiteModal} leftIcon={<Plus className="w-3.5 h-3.5" />}>
            New Monitor
          </Button>
        </div>
      </div>

      {/* Websites Dense Table */}
      <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 text-neutral-600 dark:text-neutral-400 font-semibold uppercase text-[10px] tracking-wider select-none">
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Target Name & URL</th>
                <th className="py-2.5 px-3">Schedule</th>
                <th className="py-2.5 px-3">Last Checked</th>
                <th className="py-2.5 px-3">Last Changed</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-900/80">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500">
                    Loading monitored websites...
                  </td>
                </tr>
              ) : filteredWebsites.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-neutral-500">
                    <p className="font-semibold text-neutral-800 dark:text-neutral-300">No monitored websites found</p>
                    <p className="text-[11px] mt-1 text-neutral-500">
                      Add a website to begin real-time change detection and screenshot versioning.
                    </p>
                    <Button variant="primary" size="xs" onClick={onOpenNewWebsiteModal} className="mt-3">
                      Add First Website
                    </Button>
                  </td>
                </tr>
              ) : (
                filteredWebsites.map((site) => {
                  const isChecking = checkingIds.has(site.id) || site.status === "CHECKING";

                  return (
                    <tr
                      key={site.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors group"
                    >
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <Badge status={isChecking ? "CHECKING" : site.status} />
                      </td>

                      <td className="py-2.5 px-3 max-w-xs">
                        <div className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                          <button
                            onClick={() => onSelectWebsite(site)}
                            className="hover:text-neutral-900 dark:hover:text-neutral-100 hover:underline text-left truncate cursor-pointer"
                          >
                            {site.name}
                          </button>
                          <a
                            href={site.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-neutral-500 hover:text-neutral-300 shrink-0"
                            title="Visit live target"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="text-[11px] text-neutral-500 truncate font-mono">
                          {site.url}
                        </div>
                        {site.last_error_message && (
                          <div className="text-[10px] text-red-400 truncate mt-0.5" title={site.last_error_message}>
                            Error: {site.last_error_message}
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap text-neutral-700 dark:text-neutral-300">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          <span>Every {site.check_interval_minutes}m</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap text-[11px]">
                        <div className="font-medium text-neutral-800 dark:text-neutral-200">
                          {formatRelativeTime(site.last_checked_at)}
                        </div>
                        <div className="text-[10px] text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                          <span>{formatNormalTime(site.last_checked_at, true)}</span>
                          {site.last_status_code && <span>• HTTP {site.last_status_code}</span>}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap text-[11px]">
                        {site.last_changed_at ? (
                          <div>
                            <div className="font-medium text-neutral-800 dark:text-neutral-200">
                              {formatRelativeTime(site.last_changed_at)}
                            </div>
                            <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                              {formatNormalDateTime(site.last_changed_at)}
                            </div>
                          </div>
                        ) : (
                          <div className="text-neutral-500 text-[11px]">
                            <span className="text-neutral-600 dark:text-neutral-400">Never</span>
                            <span className="text-[10px] text-neutral-400 dark:text-neutral-600 block">No diff detected</span>
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          {onUpdateWebsite && (
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => onUpdateWebsite(site.id, { is_active: !site.is_active })}
                              title={site.is_active ? "Pause scheduled monitoring" : "Resume scheduled monitoring"}
                              className={site.is_active ? "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300" : "text-emerald-600 dark:text-emerald-400"}
                            >
                              {site.is_active ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                            </Button>
                          )}

                          {onSimulateChange && (
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => onSimulateChange(site.id)}
                              title="Simulate text change & test diff engine"
                              className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100"
                              leftIcon={<Sparkles className="w-3 h-3 text-neutral-500" />}
                            >
                              Test Change
                            </Button>
                          )}

                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => onTriggerCheck(site.id)}
                            isLoading={isChecking}
                            title="Trigger immediate check"
                            leftIcon={!isChecking && <Play className="w-3 h-3 text-neutral-500" />}
                          >
                            Check
                          </Button>

                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => onSelectWebsite(site)}
                            title="View snapshots, diffs & noise filters"
                          >
                            <Settings className="w-3 h-3 text-neutral-500 dark:text-neutral-400" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => {
                              if (confirm(`Delete monitor "${site.name}"? All snapshot history will be removed.`)) {
                                onDeleteWebsite(site.id);
                              }
                            }}
                            className="text-neutral-500 hover:text-red-400"
                            title="Delete website"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
