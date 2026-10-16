import React, { useState } from "react";
import { DetectedChange } from "../../types";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { formatRelativeTime, formatNormalDateTime } from "../../utils/date";
import { Eye, Search, Layers, ExternalLink } from "lucide-react";

export interface ChangesListViewProps {
  changes: DetectedChange[];
  isLoading: boolean;
  onViewChange: (changeId: number) => void;
}

export const ChangesListView: React.FC<ChangesListViewProps> = ({
  changes,
  isLoading,
  onViewChange,
}) => {
  const [search, setSearch] = useState("");

  const filteredChanges = changes.filter((c) => {
    const summaryMatch = c.summary?.toLowerCase().includes(search.toLowerCase());
    return summaryMatch ?? true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
            <span>Detected Change Feed</span>
          </h2>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Audit history of content mutations that exceeded dynamic noise filters
          </p>
        </div>

        <div className="w-64">
          <Input
            placeholder="Search change summaries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-3.5 h-3.5" />}
          />
        </div>
      </div>

      <div className="border border-neutral-200 dark:border-neutral-800 rounded bg-white dark:bg-neutral-950 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 text-neutral-600 dark:text-neutral-400 text-[10px] uppercase font-semibold">
              <th className="py-2.5 px-3">Detected At</th>
              <th className="py-2.5 px-3">Change %</th>
              <th className="py-2.5 px-3">Metrics</th>
              <th className="py-2.5 px-3">Diff Summary</th>
              <th className="py-2.5 px-3 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-900">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-neutral-500">
                  Loading change history...
                </td>
              </tr>
            ) : filteredChanges.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-neutral-500">
                  <p className="font-semibold text-neutral-800 dark:text-neutral-300">No content changes recorded yet</p>
                  <p className="text-[11px] mt-1 text-neutral-500">
                    When monitored pages update with non-dynamic changes, diffs will appear here.
                  </p>
                </td>
              </tr>
            ) : (
              filteredChanges.map((change) => (
                <tr key={change.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors">
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="font-medium text-neutral-800 dark:text-neutral-300">
                      {formatRelativeTime(change.detected_at)}
                    </div>
                    <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                      {formatNormalDateTime(change.detected_at, true)}
                    </div>
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold border border-neutral-200 dark:border-neutral-700">
                      {change.change_percentage}%
                    </span>
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap text-[11px]">
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">+{change.lines_added}</span>
                    <span className="text-neutral-400 dark:text-neutral-600 mx-1">/</span>
                    <span className="text-rose-600 dark:text-rose-400 font-medium">-{change.lines_removed}</span>
                  </td>

                  <td className="py-2.5 px-3 text-neutral-700 dark:text-neutral-300 truncate max-w-md">
                    {change.summary}
                  </td>

                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <Button
                      variant="primary"
                      size="xs"
                      onClick={() => onViewChange(change.id)}
                      leftIcon={<Eye className="w-3 h-3" />}
                    >
                      Side-by-Side
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
