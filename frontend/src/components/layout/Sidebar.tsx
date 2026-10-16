import React from "react";
import { LayoutDashboard, Globe, History, Bell, Server } from "lucide-react";
import { cn } from "../../utils/cn";

export type NavTab = "dashboard" | "websites" | "changes" | "notifications" | "system";

export interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  changedCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  changedCount = 0,
}) => {
  const navItems = [
    { id: "dashboard" as NavTab, label: "Dashboard", icon: LayoutDashboard },
    { id: "websites" as NavTab, label: "Monitors", icon: Globe },
    { id: "changes" as NavTab, label: "Change History", icon: History, count: changedCount },
    { id: "notifications" as NavTab, label: "Alert Channels", icon: Bell },
    { id: "system" as NavTab, label: "System Health", icon: Server },
  ];

  return (
    <aside className="w-56 shrink-0 border-r border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-[#09090b] p-3 flex flex-col justify-between select-none transition-colors">
      <div className="space-y-1">
        <div className="px-2.5 py-1 text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-semibold">
          Platform
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={cn(
                "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors text-left cursor-pointer",
                isActive
                  ? "bg-neutral-200/80 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold shadow-2xs"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={cn("w-4 h-4", isActive ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-500 dark:text-neutral-400")} />
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold border border-neutral-300 dark:border-neutral-700">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Engine Status Card */}
      <div className="p-2.5 border border-neutral-200 dark:border-neutral-800/80 rounded-lg bg-white dark:bg-neutral-900/40 text-[11px] text-neutral-500 space-y-1.5">
        <div className="flex justify-between items-center text-[10px]">
          <span className="text-neutral-500">Browser Engine</span>
          <span className="text-neutral-800 dark:text-neutral-200 font-medium">Playwright v1.49</span>
        </div>
        <div className="flex justify-between items-center text-[10px]">
          <span className="text-neutral-500">Diff Engine</span>
          <span className="text-neutral-800 dark:text-neutral-200 font-medium font-mono text-[10px]">SHA-256</span>
        </div>
        <div className="flex justify-between items-center text-[10px]">
          <span className="text-neutral-500">Scheduler</span>
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Active</span>
          </span>
        </div>
      </div>
    </aside>
  );
};
