import React, { useState } from "react";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Plus, Globe, Clock, Shield } from "lucide-react";

export interface NewWebsiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    url: string;
    check_interval_minutes: number;
    ignored_selectors?: string[];
    min_change_percentage?: number;
    keyword_watchlist?: string;
  }) => Promise<void>;
}

export const NewWebsiteModal: React.FC<NewWebsiteModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [interval, setInterval] = useState(60);
  const [ignoredSelectors, setIgnoredSelectors] = useState("");
  const [minChangePct, setMinChangePct] = useState(0);
  const [keywordWatchlist, setKeywordWatchlist] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !url.trim()) {
      setError("Please specify website name and target URL");
      return;
    }

    const selectors = ignoredSelectors
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        url: url.trim(),
        check_interval_minutes: Number(interval),
        ignored_selectors: selectors,
        min_change_percentage: minChangePct > 0 ? Number(minChangePct) : undefined,
        keyword_watchlist: keywordWatchlist.trim() || undefined,
      });
      setName("");
      setUrl("");
      setInterval(60);
      setIgnoredSelectors("");
      setMinChangePct(0);
      setKeywordWatchlist("");
      setShowAdvanced(false);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create monitor");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Monitored Website"
      description="Configure target URL and scheduling intervals for Playwright browser capture."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        {error && (
          <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs">
            {error}
          </div>
        )}

        <Input
          label="Monitor Name"
          placeholder="e.g. OpenAI Pricing, GitHub Status, Product Page"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Input
          label="Target URL"
          placeholder="https://example.com/pricing"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          leftIcon={<Globe className="w-3.5 h-3.5" />}
          required
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
            Check Frequency
          </label>
          <div className="relative">
            <select
              value={interval}
              onChange={(e) => setInterval(Number(e.target.value))}
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
        </div>

        <Input
          label="Ignored CSS Selectors (Comma separated, optional)"
          placeholder=".timestamp, #ad-unit, .cart-count"
          value={ignoredSelectors}
          onChange={(e) => setIgnoredSelectors(e.target.value)}
          leftIcon={<Shield className="w-3.5 h-3.5" />}
        />

        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 cursor-pointer flex items-center gap-1 font-medium"
          >
            <span>{showAdvanced ? "▾ Hide" : "▸ Show"} Alert Sensitivity & Trigger Rules (Optional)</span>
          </button>

          {showAdvanced && (
            <div className="mt-2.5 p-3 rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40 space-y-2.5">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">
                    Min Change Threshold: {minChangePct}%
                  </span>
                  <span className="text-neutral-500">
                    {minChangePct === 0 ? "Alert on any change" : `>= ${minChangePct}% delta`}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={1}
                  value={minChangePct}
                  onChange={(e) => setMinChangePct(Number(e.target.value))}
                  className="w-full accent-neutral-900 dark:accent-neutral-100 cursor-pointer"
                />
              </div>

              <Input
                label="Trigger Keyword Watchlist (Optional)"
                placeholder="e.g. price, out of stock, shipping, discount"
                value={keywordWatchlist}
                onChange={(e) => setKeywordWatchlist(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-200 dark:border-neutral-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting} leftIcon={<Plus className="w-3 h-3" />}>
            Start Monitoring
          </Button>
        </div>
      </form>
    </Modal>
  );
};
