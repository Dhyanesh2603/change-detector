import React, { useState } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  Globe,
  GitBranch,
  BookOpen,
  Sparkles,
  ArrowRight,
  Shield,
  Clock,
  Layers,
  Activity,
  CheckCircle2,
} from "lucide-react";

export interface OnboardingViewProps {
  userEmail: string;
  onTrackTarget: (data: {
    name: string;
    url: string;
    check_interval_minutes: number;
    ignored_selectors?: string[];
  }) => Promise<void>;
  onSkip: () => void;
}

type TargetCategory = "github" | "website" | "docs";

export const OnboardingView: React.FC<OnboardingViewProps> = ({
  userEmail,
  onTrackTarget,
  onSkip,
}) => {
  const [category, setCategory] = useState<TargetCategory>("website");
  const [url, setUrl] = useState("http://127.0.0.1:5000/demo-site");
  const [name, setName] = useState("CloudScale Live Sandbox");
  const [interval, setInterval] = useState(5);
  const [ignoredSelectors, setIgnoredSelectors] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [stepMessage, setStepMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Auto-name detection when URL changes
  const handleUrlChange = (val: string) => {
    setUrl(val);
    if (!name || name === "My Target") {
      const trimmed = val.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
      if (trimmed.includes("github.com/")) {
        const repoPart = trimmed.split("github.com/")[1];
        if (repoPart) setName(`${repoPart} (GitHub)`);
      } else if (trimmed.includes("/") && !trimmed.startsWith("www.")) {
        setName(`${trimmed} (Repo)`);
      } else if (trimmed) {
        setName(trimmed.split("/")[0]);
      }
    }
  };

  const applyPreset = (presetCategory: TargetCategory, presetUrl: string, presetName: string) => {
    setCategory(presetCategory);
    setUrl(presetUrl);
    setName(presetName);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!url.trim()) {
      setError("Please specify a repository or website URL to track.");
      return;
    }

    let finalUrl = url.trim();
    // Expand GitHub shorthand if needed
    if (category === "github" && !finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      if (!finalUrl.includes("github.com")) {
        finalUrl = `https://github.com/${finalUrl}`;
      } else {
        finalUrl = `https://${finalUrl}`;
      }
    } else if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = `https://${finalUrl}`;
    }

    const finalName = name.trim() || finalUrl.replace(/^https?:\/\//, "").split("/")[0];

    const selectors = ignoredSelectors
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    setIsLoading(true);
    setStepMessage("Registering monitor & launching headless browser...");

    try {
      setTimeout(() => {
        setStepMessage("Rendering DOM & capturing cryptographic baseline...");
      }, 1200);

      await onTrackTarget({
        name: finalName,
        url: finalUrl,
        check_interval_minutes: Number(interval),
        ignored_selectors: selectors,
      });

      setStepMessage("Baseline verified. Transitioning to telemetry dashboard...");
    } catch (err: any) {
      setError(err.message || "Failed to establish initial monitor.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col items-center justify-center p-4 antialiased">
      <div className="w-full max-w-2xl border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900/60 p-6 sm:p-8 space-y-6 shadow-xs">
        {/* Step Indicator Header */}
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-[11px] font-medium">
            <Sparkles className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
            <span>Step 1: Configure Your First Monitored Target</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mt-2">
            What would you like to track?
          </h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
            Specify a GitHub repository, documentation site, or public web page to establish an initial content baseline before opening your dashboard.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* Target Category Selector */}
        <div className="grid grid-cols-3 gap-2 p-1 rounded-md bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs">
          <button
            type="button"
            onClick={() => {
              setCategory("github");
              if (!url) setUrl("https://github.com/fastapi/fastapi");
            }}
            className={`py-2 px-3 rounded flex items-center justify-center gap-2 transition-all cursor-pointer ${
              category === "github"
                ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold border border-neutral-300 dark:border-neutral-700 shadow-xs"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>GitHub Repo</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCategory("website");
              if (!url) setUrl("https://workoffiction.vercel.app");
            }}
            className={`py-2 px-3 rounded flex items-center justify-center gap-2 transition-all cursor-pointer ${
              category === "website"
                ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold border border-neutral-300 dark:border-neutral-700 shadow-xs"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Public Website</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCategory("docs");
              if (!url) setUrl("https://news.ycombinator.com");
            }}
            className={`py-2 px-3 rounded flex items-center justify-center gap-2 transition-all cursor-pointer ${
              category === "docs"
                ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold border border-neutral-300 dark:border-neutral-700 shadow-xs"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Docs / Changelog</span>
          </button>
        </div>

        {/* Quick One-Click Presets */}
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
            Quick One-Click Demo Presets:
          </div>
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => applyPreset("website", "http://127.0.0.1:5000/demo-site", "CloudScale Live Sandbox")}
              className="px-2.5 py-1 rounded bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:opacity-90 border border-neutral-900 dark:border-neutral-100 font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Sparkles className="w-3 h-3 text-neutral-400 dark:text-neutral-600" />
              <span>Live Sandbox (Recommended)</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset("github", "https://github.com/fastapi/fastapi", "FastAPI Framework")}
              className="px-2.5 py-1 rounded bg-neutral-50 dark:bg-neutral-950 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <GitBranch className="w-3 h-3 text-neutral-500" />
              <span>fastapi/fastapi</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset("website", "https://workoffiction.vercel.app", "The Last Light Blog")}
              className="px-2.5 py-1 rounded bg-neutral-50 dark:bg-neutral-950 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Globe className="w-3 h-3 text-neutral-500" />
              <span>workoffiction.vercel.app</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset("docs", "https://news.ycombinator.com", "Hacker News Frontpage")}
              className="px-2.5 py-1 rounded bg-neutral-50 dark:bg-neutral-950 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Activity className="w-3 h-3 text-neutral-500" />
              <span>news.ycombinator.com</span>
            </button>
          </div>
        </div>

        {/* Onboarding Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={category === "github" ? "GitHub Repository URL or Shorthand" : "Target URL"}
            placeholder={
              category === "github"
                ? "e.g. facebook/react or https://github.com/facebook/react"
                : "e.g. https://example.com/pricing"
            }
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            leftIcon={category === "github" ? <GitBranch className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" /> : <Globe className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Friendly Name"
              placeholder="e.g. Production API / React Core"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Check Schedule
              </label>
              <select
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
                className="flex h-8 w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-2.5 py-1 text-xs text-neutral-900 dark:text-neutral-100 focus-visible:outline-none focus-visible:border-neutral-900 dark:focus-visible:border-neutral-100 cursor-pointer"
              >
                <option value={5}>Every 5 minutes (Real-time)</option>
                <option value={15}>Every 15 minutes</option>
                <option value={30}>Every 30 minutes</option>
                <option value={60}>Every 1 hour (Recommended)</option>
                <option value={360}>Every 6 hours</option>
                <option value={1440}>Every 24 hours (Daily)</option>
              </select>
            </div>
          </div>

          <Input
            label="Ignored CSS Selectors (Optional)"
            placeholder=".footer-timestamp, .ad-banner, #cookie-notice"
            value={ignoredSelectors}
            onChange={(e) => setIgnoredSelectors(e.target.value)}
            leftIcon={<Shield className="w-3.5 h-3.5" />}
          />

          {isLoading && (
            <div className="p-3 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-neutral-900 dark:border-neutral-100 border-t-transparent animate-spin" />
              <span>{stepMessage}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="pt-2 flex items-center justify-between border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onSkip}
              disabled={isLoading}
              className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300 cursor-pointer transition-colors"
            >
              Skip to empty dashboard →
            </button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Start Tracking & Open Dashboard
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
