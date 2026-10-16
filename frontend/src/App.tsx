import React, { useState, useEffect } from "react";
import { User, Website, DetectedChange, DashboardSummary, NotificationChannel, NotificationLog } from "./types";
import { api, setTokens, getAccessToken } from "./api/client";
import { Navbar } from "./components/layout/Navbar";
import { Sidebar, NavTab } from "./components/layout/Sidebar";
import { DashboardView } from "./features/dashboard/DashboardView";
import { WebsitesListView } from "./features/websites/WebsitesListView";
import { WebsiteDetailModal } from "./features/websites/WebsiteDetailModal";
import { NewWebsiteModal } from "./features/websites/NewWebsiteModal";
import { ChangesListView } from "./features/changes/ChangesListView";
import { NotificationsView } from "./features/notifications/NotificationsView";
import { SystemHealthView } from "./features/system/SystemHealthView";
import { AuthView } from "./features/auth/AuthView";
import { DiffViewer } from "./components/diff/DiffViewer";
import { Modal } from "./components/ui/Modal";
import { OnboardingView } from "./features/onboarding/OnboardingView";
import { useTheme } from "./hooks/useTheme";

export const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [currentTab, setCurrentTab] = useState<NavTab>("dashboard");

  // Domain data
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [changes, setChanges] = useState<DetectedChange[]>([]);
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Active modals
  const [isNewWebsiteOpen, setIsNewWebsiteOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [hasDismissedOnboarding, setHasDismissedOnboarding] = useState<boolean>(() => {
    return localStorage.getItem("cd_onboarding_dismissed") === "true";
  });
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null);
  const [activeDiffChange, setActiveDiffChange] = useState<DetectedChange | null>(null);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);

  // Checking set
  const [checkingIds, setCheckingIds] = useState<Set<number>>(new Set());

  // Check auth on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await api.getMe();
        setUser(currentUser);
      } catch {
        setUser(null);
      } finally {
        setIsAuthChecking(false);
      }
    };
    initAuth();
  }, []);

  // Fetch data when authenticated
  const loadData = async (silent = false) => {
    if (!user) return;
    if (!silent) setIsLoading(true);

    try {
      const [sumRes, sitesRes, changesRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getWebsites(),
        api.getRecentChanges(30),
      ]);
      setSummary(sumRes);
      setWebsites(sitesRes);
      setChanges(changesRes);

      // If on notifications tab, load channels & logs
      if (currentTab === "notifications") {
        const [chansRes, logsRes] = await Promise.all([
          api.getNotificationChannels(),
          api.getNotificationLogs(),
        ]);
        setChannels(chansRes);
        setLogs(logsRes);
      }
    } catch (err) {
      console.error("Error loading platform data:", err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
      // Background polling every 8 seconds for real-time status updates
      const timer = setInterval(() => loadData(true), 8000);
      return () => clearInterval(timer);
    }
  }, [user, currentTab]);

  // Auth Handlers
  const handleLogin = async (credentials: { email: string; password: string }) => {
    const tokens = await api.login(credentials);
    setTokens(tokens);
    const currentUser = await api.getMe();
    setUser(currentUser);
  };

  const handleRegister = async (data: { email: string; password: string; full_name?: string }) => {
    await api.register(data);
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {}
    setTokens(null);
    setUser(null);
  };

  // Website Actions
  const handleCreateWebsite = async (data: {
    name: string;
    url: string;
    check_interval_minutes: number;
    ignored_selectors?: string[];
  }) => {
    const newSite = await api.createWebsite(data, true);
    setWebsites((prev) => [newSite, ...prev]);
    loadData(true);
  };

  const handleOnboardTarget = async (data: {
    name: string;
    url: string;
    check_interval_minutes: number;
    ignored_selectors?: string[];
  }) => {
    const newSite = await api.createWebsite(data, true);
    setWebsites((prev) => [newSite, ...prev]);
    setIsOnboardingOpen(false);
    setHasDismissedOnboarding(true);
    localStorage.setItem("cd_onboarding_dismissed", "true");
    await loadData(true);
  };

  const handleSkipOnboarding = () => {
    setIsOnboardingOpen(false);
    setHasDismissedOnboarding(true);
    localStorage.setItem("cd_onboarding_dismissed", "true");
  };

  const handleDeleteWebsite = async (id: number) => {
    await api.deleteWebsite(id);
    setWebsites((prev) => prev.filter((w) => w.id !== id));
    loadData(true);
  };

  const handleUpdateWebsite = async (
    id: number,
    data: Partial<{ name: string; url: string; check_interval_minutes: number; is_active: boolean }>
  ) => {
    const updated = await api.updateWebsite(id, data);
    setWebsites((prev) => prev.map((w) => (w.id === id ? { ...w, ...updated } : w)));
    if (selectedWebsite && selectedWebsite.id === id) {
      setSelectedWebsite((prev) => (prev ? { ...prev, ...updated } : null));
    }
    loadData(true);
  };

  const handleTriggerCheck = async (id: number) => {
    setCheckingIds((prev) => new Set(prev).add(id));
    try {
      await api.triggerCheck(id, false);
      // Brief delay then refresh
      setTimeout(() => {
        loadData(true);
      }, 3000);
    } catch (err) {
      console.error("Check failed:", err);
    } finally {
      setTimeout(() => {
        setCheckingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        loadData(true);
      }, 5000);
    }
  };

  const handleSimulateChange = async (websiteId: number) => {
    try {
      await api.simulateChange(websiteId);
      await loadData(true);
      if (selectedWebsite && selectedWebsite.id === websiteId) {
        const detailed = await api.getWebsite(websiteId);
        setSelectedWebsite(detailed);
      }
    } catch (err: any) {
      console.error("Failed to simulate content change:", err);
    }
  };

  // Detailed Website view
  const handleSelectWebsite = async (site: Website) => {
    try {
      const detailed = await api.getWebsite(site.id);
      setSelectedWebsite(detailed);
    } catch {
      setSelectedWebsite(site);
    }
  };

  // Ignored Region Actions
  const handleAddIgnoredRegion = async (websiteId: number, selector: string, description?: string) => {
    const region = await api.addIgnoredRegion(websiteId, {
      selector_type: "css",
      selector_value: selector,
      description,
    });
    if (selectedWebsite && selectedWebsite.id === websiteId) {
      setSelectedWebsite({
        ...selectedWebsite,
        ignored_regions: [...(selectedWebsite.ignored_regions || []), region],
      });
    }
    loadData(true);
  };

  const handleDeleteIgnoredRegion = async (regionId: number) => {
    await api.deleteIgnoredRegion(regionId);
    if (selectedWebsite) {
      setSelectedWebsite({
        ...selectedWebsite,
        ignored_regions: selectedWebsite.ignored_regions?.filter((r) => r.id !== regionId),
      });
    }
  };

  // Inspect Change Diff
  const handleViewChange = async (changeId: number) => {
    try {
      const detail = await api.getChangeDetail(changeId);
      setActiveDiffChange(detail);
      setIsDiffModalOpen(true);
    } catch (err) {
      console.error("Failed to load change detail:", err);
    }
  };

  // Notification Actions
  const handleCreateChannel = async (data: { channel_type: string; name: string; config: Record<string, any> }) => {
    const ch = await api.createNotificationChannel(data);
    setChannels((prev) => [ch, ...prev]);
  };

  const handleDeleteChannel = async (channelId: number) => {
    await api.deleteNotificationChannel(channelId);
    setChannels((prev) => prev.filter((c) => c.id !== channelId));
  };

  const handleTestChannel = async (channelId: number) => {
    return await api.testNotificationChannel(channelId);
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center text-xs text-neutral-500">
        Authenticating session...
      </div>
    );
  }

  if (!user) {
    return <AuthView onLogin={handleLogin} onRegister={handleRegister} />;
  }

  // Show onboarding if explicitly opened or if user has no monitored targets yet
  if (isOnboardingOpen || (websites.length === 0 && !hasDismissedOnboarding && !isLoading)) {
    return (
      <OnboardingView
        userEmail={user.email}
        onTrackTarget={handleOnboardTarget}
        onSkip={handleSkipOnboarding}
      />
    );
  }

  const changedCount = summary?.status_counts.changed || 0;

  return (
    <div className="min-h-screen bg-neutral-100/60 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col antialiased transition-colors">
      <Navbar
        user={user}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
        onOpenNewWebsiteModal={() => setIsNewWebsiteOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          changedCount={changedCount}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {currentTab === "dashboard" && (
            <DashboardView
              summary={summary}
              isLoading={isLoading}
              onSelectWebsite={(id) => {
                const s = websites.find((w) => w.id === id);
                if (s) handleSelectWebsite(s);
              }}
              onViewChange={handleViewChange}
              onRefresh={() => loadData()}
              onSimulateChange={handleSimulateChange}
              onTriggerCheck={handleTriggerCheck}
            />
          )}

          {currentTab === "websites" && (
            <WebsitesListView
              websites={websites}
              isLoading={isLoading}
              onOpenNewWebsiteModal={() => setIsNewWebsiteOpen(true)}
              onSelectWebsite={handleSelectWebsite}
              onTriggerCheck={handleTriggerCheck}
              onDeleteWebsite={handleDeleteWebsite}
              onUpdateWebsite={handleUpdateWebsite}
              onSimulateChange={handleSimulateChange}
              checkingIds={checkingIds}
            />
          )}

          {currentTab === "changes" && (
            <ChangesListView
              changes={changes}
              isLoading={isLoading}
              onViewChange={handleViewChange}
            />
          )}

          {currentTab === "notifications" && (
            <NotificationsView
              channels={channels}
              logs={logs}
              isLoading={isLoading}
              onCreateChannel={handleCreateChannel}
              onDeleteChannel={handleDeleteChannel}
              onTestChannel={handleTestChannel}
            />
          )}

          {currentTab === "system" && <SystemHealthView />}
        </main>
      </div>

      {/* New Website Modal */}
      <NewWebsiteModal
        isOpen={isNewWebsiteOpen}
        onClose={() => setIsNewWebsiteOpen(false)}
        onSubmit={handleCreateWebsite}
      />

      {/* Website Detail Modal */}
      <WebsiteDetailModal
        website={selectedWebsite}
        isOpen={!!selectedWebsite}
        onClose={() => setSelectedWebsite(null)}
        onAddIgnoredRegion={handleAddIgnoredRegion}
        onDeleteIgnoredRegion={handleDeleteIgnoredRegion}
        onViewChange={handleViewChange}
        onUpdateWebsite={handleUpdateWebsite}
        onTriggerCheck={handleTriggerCheck}
        onSimulateChange={handleSimulateChange}
        isChecking={selectedWebsite ? checkingIds.has(selectedWebsite.id) : false}
      />

      {/* Diff Inspector Modal */}
      <Modal
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
        title={activeDiffChange ? `Change Diff: ${activeDiffChange.change_percentage}% Mutation` : "Diff Inspector"}
        description={activeDiffChange?.summary || undefined}
        maxWidth="4xl"
      >
        {activeDiffChange?.diff_details ? (
          <DiffViewer
            diff={activeDiffChange.diff_details}
            previousVersionDate={activeDiffChange.previous_snapshot?.created_at}
            currentVersionDate={activeDiffChange.current_snapshot?.created_at}
            screenshotUrl={
              activeDiffChange.current_snapshot?.screenshot_path
                ? `/api/v1/storage/${activeDiffChange.current_snapshot.screenshot_path}`
                : undefined
            }
          />
        ) : (
          <div className="py-8 text-center text-xs text-neutral-500">
            Loading structured diff comparison...
          </div>
        )}
      </Modal>
    </div>
  );
};
