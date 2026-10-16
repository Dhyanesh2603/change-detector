import React, { useState } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Activity, Lock, Mail, User as UserIcon } from "lucide-react";

export interface AuthViewProps {
  onLogin: (credentials: { email: string; password: string }) => Promise<void>;
  onRegister: (data: { email: string; password: string; full_name?: string }) => Promise<void>;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLogin, onRegister }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isRegister) {
        await onRegister({
          email: email.trim(),
          password,
          full_name: fullName.trim() || undefined,
        });
        // After register, auto-login
        await onLogin({ email: email.trim(), password });
      } else {
        await onLogin({ email: email.trim(), password });
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail("dev_engineer@example.com");
    setPassword("SecurePassword123!");
    if (isRegister) {
      setFullName("Lead Engineer");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="w-full max-w-sm border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900/60 p-6 space-y-5 shadow-xs">
        {/* Header */}
        <div className="space-y-1.5 text-center">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-xs mb-1">
            <Activity className="w-4 h-4" />
          </div>
          <h1 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Website Change Detector
          </h1>
          <p className="text-xs text-neutral-500">
            {isRegister ? "Create your account" : "Sign in to your account"}
          </p>
        </div>

        {error && (
          <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {isRegister && (
            <Input
              label="Full Name"
              placeholder="e.g. Alex Smith"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              leftIcon={<UserIcon className="w-3.5 h-3.5" />}
            />
          )}

          <Input
            label="Email Address"
            type="email"
            placeholder="developer@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-3.5 h-3.5" />}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-3.5 h-3.5" />}
            required
          />

          <Button type="submit" variant="primary" size="md" isLoading={isLoading} className="w-full mt-2">
            {isRegister ? "Register & Launch" : "Sign In"}
          </Button>
        </form>

        <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-600 dark:text-neutral-400">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors cursor-pointer"
          >
            {isRegister ? "Existing user? Sign in" : "Need account? Register"}
          </button>

          <button
            type="button"
            onClick={handleDemoFill}
            className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300 cursor-pointer"
          >
            Auto-fill Demo
          </button>
        </div>
      </div>
    </div>
  );
};
