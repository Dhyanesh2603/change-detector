import React, { useState } from "react";
import { Website, IgnoredRegion, Snapshot, DetectedChange } from "../../types";
import { api } from "../../api/client";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { formatRelativeTime, formatExactDateTime, formatNormalTime, formatNormalDateTime } from "../../utils/date";
import {
  Plus,
  Trash2,
  Eye,
  ExternalLink,
  ShieldAlert,
  Camera,
  Layers,
  Settings,
  Play,
  Check,
  FileText,
  Clock,
  Globe,
  Radio,
  Sparkles,
} from "lucide-react";

export interface WebsiteDetailModalProps {
  website: Website | null;
  isOpen: boolean;
  onClose: () => void;
  onAddIgnoredRegion: (websiteId: number, selector: string, description?: string) => Promise<void>;
  onDeleteIgnoredRegion: (regionId: number) => Promise<void>;
  onViewChange: (changeId: number) => void;
  onUpdateWebsite?: (
    websiteId: number,
    data: Partial<{ name: string; url: string; check_interval_minutes: number; is_active: boolean }>
  ) => Promise<void>;
  onTriggerCheck?: (websiteId: number) => Promise<void>;
  onSimulateChange?: (websiteId: number) => Promise<void>;
  isChecking?: boolean;
}

export const WebsiteDetailModal: React.FC<WebsiteDetailModalProps> = ({
  website,
  isOpen,
  onClose,
  onAddIgnoredRegion,
  onDeleteIgnoredRegion,
  onViewChange,
  onUpdateWebsite,
  onTriggerCheck,
  onSimulateChange,
  isChecking = false,
}) => {
  const [activeTab, setActiveTab] = useState<"noise-filters" | "snapshots" | "changes" | "settings">("noise-filters");
  const [newSelector, setNewSelector] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Settings form state
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editInterval, setEditInterval] = useState(60);
  const [editIsActive, setEditIsActive] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSavedMessage, setSettingsSavedMessage] = useState<string | null>(null);

  // Snapshot Inspection state
  const [inspectedSnapshot, setInspectedSnapshot] = useState<{
    id: number;
    raw_html?: string;
    normalized_text?: string;
    screenshot_path?: string;
    content_hash?: string;
    page_title?: string;
  } | null>(null);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false);

  // Sync settings form state when website changes
  React.useEffect(() => {
    if (website) {
      setEditName(website.name);
      setEditUrl(website.url);
      setEditInterval(website.check_interval_minutes);
      setEditIsActive(website.is_active);
      setSettingsSavedMessage(null);
      setInspectedSnapshot(null);
    }
  }, [website]);

  if (!website) return null;

  const handleAddSelector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSelector.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddIgnoredRegion(website.id, newSelector.trim(), newDescription.trim() || undefined);
      setNewSelector("");
      setNewDescription("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateWebsite) return;
    setIsSavingSettings(true);
    setSettingsSavedMessage(null);
    try {
      await onUpdateWebsite(website.id, {
        name: editName.trim(),
        url: editUrl.trim(),
        check_interval_minutes: Number(editInterval),
        is_active: editIsActive,
      });
      setSettingsSavedMessage("Configuration saved successfully");
      setTimeout(() => setSettingsSavedMessage(null), 3000);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleInspectSnapshot = async (snapshotId: number) => {
    setIsLoadingSnapshot(true);
    try {
      const detail = await api.getSnapshotDetail(snapshotId);
      setInspectedSnapshot({
        id: detail.id,
        raw_html: detail.raw_html,
        normalized_text: detail.normalized_text,
        screenshot_path: detail.screenshot_path,
        content_hash: detail.content_hash,
        page_title: detail.page_title,
      });
    } catch (err) {
      console.error("Failed to load snapshot detail:", err);
    } finally {
      setIsLoadingSnapshot(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Monitor Configuration: ${website.name}`}
      description={website.url}
      maxWidth="4xl"
    >
      <div className="space-y-4 text-xs">
        {/* Quick Metadata Bar & Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2.5 rounded bg-neutral-100 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-[11px]">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 flex-1">
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase">Status</span>
              <div className="mt-0.5">
                <Badge status={isChecking ? "CHECKING" : website.status} />
              </div>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase">Interval</span>
              <span className="text-neutral-800 dark:text-neutral-200 font-medium">Every {website.check_interval_minutes}m</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase">Last Checked</span>
              <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                {formatRelativeTime(website.last_checked_at)}
              </span>
              <span className="text-[10px] text-neutral-500 block font-mono">
                {formatNormalTime(website.last_checked_at, true)}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase">Last Changed</span>
              <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                {website.last_changed_at ? formatRelativeTime(website.last_changed_at) : "Never"}
              </span>
              <span className="text-[10px] text-neutral-500 block font-mono">
                {website.last_changed_at ? formatNormalTime(website.last_changed_at, true) : "No diff detected"}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase">Mode</span>
              <span className={website.is_active ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-neutral-500"}>
                {website.is_active ? "Active" : "Paused"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onSimulateChange && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => onSimulateChange(website.id)}
                className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100"
                leftIcon={<Sparkles className="w-3 h-3 text-neutral-500" />}
                title="Simulate text changes to test diff engine"
              >
                Simulate Content Change
              </Button>
            )}

            {onTriggerCheck && (
              <Button
                variant="primary"
                size="xs"
                onClick={() => onTriggerCheck(website.id)}
                isLoading={isChecking}
                leftIcon={!isChecking && <Play className="w-3 h-3" />}
              >
                Run Check Now
              </Button>
            )}
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 gap-2">
          <button
            onClick={() => setActiveTab("noise-filters")}
            className={`pb-2 px-1 text-xs transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === "noise-filters"
                ? "border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100 font-semibold"
                : "border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Noise Filters ({website.ignored_regions?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("snapshots")}
            className={`pb-2 px-1 text-xs transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === "snapshots"
                ? "border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100 font-semibold"
                : "border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Snapshots ({website.recent_snapshots?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("changes")}
            className={`pb-2 px-1 text-xs transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === "changes"
                ? "border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100 font-semibold"
                : "border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Change Log ({website.recent_changes?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`pb-2 px-1 text-xs transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === "settings"
                ? "border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100 font-semibold"
                : "border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </div>

        {/* Tab 1: Noise Filters / Ignored Regions */}
        {activeTab === "noise-filters" && (
          <div className="space-y-4">
            <div className="p-3 bg-neutral-50 dark:bg-neutral-900/30 rounded border border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">How Noise Filtering Works:</span> Elements matching these CSS selectors (e.g. dynamic ads, timestamps, cookie banners, chat widgets) are automatically stripped from the DOM before computing the cryptographic SHA-256 hash and running diffs.
            </div>

            {/* Add Selector Form */}
            <form onSubmit={handleAddSelector} className="flex flex-col sm:flex-row gap-2 items-end">
              <div className="flex-1 w-full">
                <Input
                  label="CSS Selector (e.g. .ad-container, #live-counter, footer .timestamp)"
                  placeholder=".sidebar-trending, #cookie-consent"
                  value={newSelector}
                  onChange={(e) => setNewSelector(e.target.value)}
                  required
                />
              </div>
              <div className="flex-1 w-full">
                <Input
                  label="Description / Purpose (Optional)"
                  placeholder="Ignores dynamic visitor counter"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting} leftIcon={<Plus className="w-3 h-3" />}>
                Add Rule
              </Button>
            </form>

            {/* Selector List */}
            <div className="border border-neutral-200 dark:border-neutral-800 rounded bg-white dark:bg-neutral-950 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 text-neutral-600 dark:text-neutral-400 text-[10px] uppercase font-semibold">
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">CSS Selector</th>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-900">
                  {(!website.ignored_regions || website.ignored_regions.length === 0) ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-neutral-500">
                        No custom noise selectors configured yet. Built-in global filters (ads, cookies, tracking scripts, timestamps) apply automatically.
                      </td>
                    </tr>
                  ) : (
                    website.ignored_regions.map((region) => (
                      <tr key={region.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40">
                        <td className="py-2 px-3 text-neutral-500 uppercase text-[10px]">{region.selector_type}</td>
                        <td className="py-2 px-3 font-semibold text-neutral-900 dark:text-neutral-100">{region.selector_value}</td>
                        <td className="py-2 px-3 text-neutral-600 dark:text-neutral-400">{region.description || "—"}</td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => onDeleteIgnoredRegion(region.id)}
                            className="p-1 text-neutral-400 hover:text-red-500 rounded transition-colors cursor-pointer"
                            title="Remove selector"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Snapshots Timeline */}
        {activeTab === "snapshots" && (
          <div className="space-y-3">
            <div className="border border-neutral-200 dark:border-neutral-800 rounded bg-white dark:bg-neutral-950 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 text-neutral-600 dark:text-neutral-400 text-[10px] uppercase font-semibold">
                    <th className="py-2 px-3">Captured</th>
                    <th className="py-2 px-3">SHA-256 Hash</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Latency</th>
                    <th className="py-2 px-3">Text Size</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-900">
                  {(!website.recent_snapshots || website.recent_snapshots.length === 0) ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-neutral-500">
                        No snapshots stored yet. Run a check to create baseline.
                      </td>
                    </tr>
                  ) : (
                    website.recent_snapshots.map((snap) => (
                      <tr key={snap.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40">
                        <td className="py-2 px-3 text-neutral-800 dark:text-neutral-300">{formatExactDateTime(snap.created_at)}</td>
                        <td className="py-2 px-3 text-neutral-500 font-mono text-[11px] truncate max-w-[140px]" title={snap.content_hash}>
                          {snap.content_hash.substring(0, 12)}...
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">HTTP {snap.http_status}</span>
                        </td>
                        <td className="py-2 px-3 text-neutral-600 dark:text-neutral-400">{snap.response_time_ms}ms</td>
                        <td className="py-2 px-3 text-neutral-600 dark:text-neutral-400">{snap.text_length} chars</td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleInspectSnapshot(snap.id)}
                              className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 text-[11px] underline flex items-center gap-1 cursor-pointer"
                              title="Inspect sanitized text & screenshot"
                            >
                              <FileText className="w-3 h-3 text-neutral-500" />
                              <span>Inspect</span>
                            </button>
                            {snap.screenshot_path && (
                              <a
                                href={`/api/v1/storage/${snap.screenshot_path}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 text-[11px]"
                              >
                                PNG
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Inline Snapshot Content Inspector */}
            {inspectedSnapshot && (
              <div className="p-3 border border-neutral-200 dark:border-neutral-800 rounded bg-neutral-50 dark:bg-neutral-900/70 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">Snapshot #{inspectedSnapshot.id}</span>
                    <span className="text-neutral-500 truncate max-w-sm">Hash: {inspectedSnapshot.content_hash}</span>
                  </div>
                  <button
                    onClick={() => setInspectedSnapshot(null)}
                    className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300 text-[11px] cursor-pointer"
                  >
                    Close Preview
                  </button>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-neutral-500 uppercase font-semibold">Normalized Text Content:</span>
                  <div className="max-h-52 overflow-y-auto p-2 rounded bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-800 dark:text-neutral-300 whitespace-pre-wrap font-mono leading-relaxed">
                    {inspectedSnapshot.normalized_text || "No text extracted."}
                  </div>
                </div>

                {inspectedSnapshot.screenshot_path && (
                  <div className="pt-2">
                    <a
                      href={`/api/v1/storage/${inspectedSnapshot.screenshot_path}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200 hover:underline text-xs"
                    >
                      <Camera className="w-3.5 h-3.5 text-neutral-500" />
                      <span>View Captured Full-Page Screenshot</span>
                      <ExternalLink className="w-3 h-3 text-neutral-400" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Detected Changes */}
        {activeTab === "changes" && (
          <div className="border border-neutral-200 dark:border-neutral-800 rounded bg-white dark:bg-neutral-950 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 text-neutral-600 dark:text-neutral-400 text-[10px] uppercase font-semibold">
                  <th className="py-2 px-3">Detected At</th>
                  <th className="py-2 px-3">Change %</th>
                  <th className="py-2 px-3">Diff Summary</th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-900">
                {(!website.recent_changes || website.recent_changes.length === 0) ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-neutral-500">
                      No changes detected for this website yet.
                    </td>
                  </tr>
                ) : (
                  website.recent_changes.map((change) => (
                    <tr key={change.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40">
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="text-neutral-800 dark:text-neutral-300 font-medium">{formatRelativeTime(change.detected_at)}</div>
                        <div className="text-[10px] text-neutral-500 font-mono">{formatNormalDateTime(change.detected_at)}</div>
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold border border-neutral-200 dark:border-neutral-700">
                          {change.change_percentage}%
                        </span>
                      </td>
                      <td className="py-2 px-3 text-neutral-600 dark:text-neutral-400 truncate max-w-sm">{change.summary}</td>
                      <td className="py-2 px-3 text-right">
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => {
                            onClose();
                            onViewChange(change.id);
                          }}
                          leftIcon={<Eye className="w-3 h-3 text-neutral-500" />}
                        >
                          View Diff
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Settings & Configuration */}
        {activeTab === "settings" && (
          <form onSubmit={handleSaveSettings} className="space-y-4">
            {settingsSavedMessage && (
              <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>{settingsSavedMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Monitor Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />

              <Input
                label="Target URL"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                leftIcon={<Globe className="w-3.5 h-3.5" />}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Check Frequency
                </label>
                <select
                  value={editInterval}
                  onChange={(e) => setEditInterval(Number(e.target.value))}
                  className="flex h-8 w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900/80 px-2.5 py-1 text-xs text-neutral-900 dark:text-neutral-100 focus-visible:outline-none focus-visible:border-neutral-900 dark:focus-visible:border-neutral-100 cursor-pointer"
                >
                  <option value={5}>Every 5 minutes (Real-time)</option>
                  <option value={15}>Every 15 minutes</option>
                  <option value={30}>Every 30 minutes</option>
                  <option value={60}>Every 1 hour (Default)</option>
                  <option value={360}>Every 6 hours</option>
                  <option value={1440}>Every 24 hours (Daily)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Monitoring State
                </label>
                <div className="flex items-center gap-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-neutral-800 dark:text-neutral-200">
                    <input
                      type="radio"
                      name="isActive"
                      checked={editIsActive}
                      onChange={() => setEditIsActive(true)}
                      className="accent-neutral-900 dark:accent-neutral-100"
                    />
                    <span>Active (Scheduled)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-neutral-500 dark:text-neutral-400">
                    <input
                      type="radio"
                      name="isActive"
                      checked={!editIsActive}
                      onChange={() => setEditIsActive(false)}
                      className="accent-neutral-900 dark:accent-neutral-100"
                    />
                    <span>Paused</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-200 dark:border-neutral-800">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSavingSettings}
                leftIcon={<Check className="w-3.5 h-3.5" />}
              >
                Save Settings
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
