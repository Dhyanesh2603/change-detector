import React from "react";
import { User } from "../../types";
import { LogOut, Plus, Sun, Moon, Sparkles } from "lucide-react";
import { Button } from "../ui/Button";

export interface NavbarProps {
  user: User | null;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
  onLogout: () => void;
  onOpenNewWebsiteModal: () => void;
  onOpenOnboarding?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  theme = "dark",
  onToggleTheme,
  onLogout,
  onOpenNewWebsiteModal,
  onOpenOnboarding,
}) => {
  const userInitial = (user?.full_name || user?.email || "U")[0].toUpperCase();
  const userName = user?.full_name || user?.email?.split("@")[0] || "User";

  return (
    <header className="h-16 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md px-5 sm:px-7 flex items-center justify-between sticky top-0 z-40 transition-colors">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 flex items-center justify-center font-bold text-xs shadow-xs">
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3v18" />
              <path d="M4 12h16" />
              <circle cx="12" cy="12" r="3" fill="currentColor" />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Change Detector
          </span>
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-2.5">
        {onOpenOnboarding && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenOnboarding}
            className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hidden sm:inline-flex"
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-neutral-500" />}
          >
            Quick Setup
          </Button>
        )}

        <Button
          variant="primary"
          size="sm"
          onClick={onOpenNewWebsiteModal}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Add Target
        </Button>

        <div className="h-5 w-px bg-neutral-200 dark:border-neutral-800 dark:bg-neutral-800 mx-1" />

        {/* Light / Dark Mode Toggle */}
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors cursor-pointer"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        )}

        {user && (
          <div className="flex items-center gap-2.5 pl-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-semibold flex items-center justify-center">
                {userInitial}
              </div>
              <div className="text-left hidden sm:block leading-tight">
                <div className="text-xs font-medium text-neutral-800 dark:text-neutral-200 truncate max-w-[130px]">
                  {userName}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors cursor-pointer"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
