import React, { useState } from "react";
import { NotificationChannel, NotificationLog } from "../../types";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { formatRelativeTime, formatNormalTime } from "../../utils/date";
import {
  Bell,
  Mail,
  MessageSquare,
  Send,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Play,
} from "lucide-react";

export interface NotificationsViewProps {
  channels: NotificationChannel[];
  logs: NotificationLog[];
  isLoading: boolean;
  onCreateChannel: (data: {
    channel_type: string;
    name: string;
    config: Record<string, any>;
  }) => Promise<void>;
  onDeleteChannel: (channelId: number) => Promise<void>;
  onTestChannel: (channelId: number) => Promise<{ success: boolean; message?: string; error?: string }>;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  channels,
  logs,
  isLoading,
  onCreateChannel,
  onDeleteChannel,
  onTestChannel,
}) => {
  const [channelType, setChannelType] = useState<"email" | "discord" | "telegram">("discord");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [testingId, setTestingId] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<{ id: number; success: boolean; msg: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let config: Record<string, any> = {};
    if (channelType === "email") {
      config = { email: email.trim() };
    } else if (channelType === "discord") {
      config = { webhook_url: webhookUrl.trim() };
    } else if (channelType === "telegram") {
      config = { bot_token: botToken.trim(), chat_id: chatId.trim() };
    }

    setIsSubmitting(true);
    try {
      await onCreateChannel({
        channel_type: channelType,
        name: name.trim(),
        config,
      });
      setName("");
      setEmail("");
      setWebhookUrl("");
      setBotToken("");
      setChatId("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTest = async (channelId: number) => {
    setTestingId(channelId);
    setTestResult(null);
    try {
      const res = await onTestChannel(channelId);
      setTestResult({
        id: channelId,
        success: res.success,
        msg: res.success ? (res.message || "Test sent!") : (res.error || "Failed"),
      });
    } catch (err: any) {
      setTestResult({
        id: channelId,
        success: false,
        msg: err.message || "Test failed",
      });
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Header */}
      <div>
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <Bell className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
          <span>Alert Channels & Integrations</span>
        </h2>
        <p className="text-[11px] text-neutral-500 mt-0.5">
          Configure real-time webhooks, SMTP emails, and Telegram bots triggered on detected website changes
        </p>
      </div>

      {/* Grid: Create Channel Form & Configured Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* New Channel Form */}
        <div className="p-3.5 rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 space-y-3">
          <h3 className="font-semibold text-neutral-800 dark:text-neutral-200 uppercase text-[11px] tracking-wider border-b border-neutral-200 dark:border-neutral-800 pb-2">
            Add Alert Channel
          </h3>

          <form onSubmit={handleCreate} className="space-y-2.5">
            <div>
              <label className="block text-[11px] text-neutral-600 dark:text-neutral-400 mb-1">Channel Type</label>
              <div className="grid grid-cols-3 gap-1">
                {(["discord", "email", "telegram"] as const).map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setChannelType(t)}
                    className={`py-1 text-center rounded border capitalize cursor-pointer transition-colors text-xs ${
                      channelType === t
                        ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-neutral-900 dark:border-neutral-100 font-semibold"
                        : "bg-neutral-50 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-200"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Channel Name"
              placeholder="e.g. #ops-alerts, Lead Dev Email"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            {channelType === "discord" && (
              <Input
                label="Discord Webhook URL"
                placeholder="https://discord.com/api/webhooks/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                required
              />
            )}

            {channelType === "email" && (
              <Input
                label="Target Email Address"
                placeholder="dev-alerts@company.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            )}

            {channelType === "telegram" && (
              <>
                <Input
                  label="Bot Token"
                  placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  required
                />
                <Input
                  label="Chat ID"
                  placeholder="-100123456789 or @channel"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  required
                />
              </>
            )}

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              className="w-full mt-2"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Channel
            </Button>
          </form>
        </div>

        {/* Configured Channels Table */}
        <div className="lg:col-span-2 border border-neutral-200 dark:border-neutral-800 rounded bg-white dark:bg-neutral-950 overflow-hidden">
          <div className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
            Active Notification Endpoints ({channels.length})
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 text-neutral-600 dark:text-neutral-400 text-[10px] uppercase font-semibold">
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3">Name</th>
                <th className="py-2 px-3">Destination</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-900">
              {channels.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-neutral-500">
                    No alert channels configured. Add a webhook or email to receive instant change notifications.
                  </td>
                </tr>
              ) : (
                channels.map((ch) => {
                  const isTesting = testingId === ch.id;
                  const resultForThis = testResult?.id === ch.id ? testResult : null;

                  return (
                    <tr key={ch.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40">
                      <td className="py-2 px-3 uppercase text-[10px] text-neutral-500 whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300">
                          {ch.channel_type}
                        </span>
                      </td>

                      <td className="py-2 px-3 font-semibold text-neutral-800 dark:text-neutral-200">
                        {ch.name}
                      </td>

                      <td className="py-2 px-3 text-neutral-600 dark:text-neutral-400 truncate max-w-xs text-[11px]">
                        {ch.config.webhook_url
                          ? `${ch.config.webhook_url.substring(0, 32)}...`
                          : ch.config.email || ch.config.chat_id || "Configured"}
                      </td>

                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {resultForThis && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded ${
                                resultForThis.success
                                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                                  : "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20"
                              }`}
                            >
                              {resultForThis.msg}
                            </span>
                          )}

                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => handleTest(ch.id)}
                            isLoading={isTesting}
                            title="Send test alert"
                            leftIcon={!isTesting && <Play className="w-3 h-3 text-neutral-500" />}
                          >
                            Test
                          </Button>

                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => onDeleteChannel(ch.id)}
                            className="text-neutral-400 hover:text-red-500"
                            title="Delete channel"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Notification Delivery Audit Log */}
      <div className="border border-neutral-200 dark:border-neutral-800 rounded bg-white dark:bg-neutral-950 overflow-hidden">
        <div className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider flex items-center justify-between">
          <span>Alert Dispatch Audit History</span>
          <span className="text-neutral-500 text-[10px]">Last 50 events</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 text-neutral-600 dark:text-neutral-400 text-[10px] uppercase font-semibold">
              <th className="py-2 px-3">Dispatched</th>
              <th className="py-2 px-3">Delivery Status</th>
              <th className="py-2 px-3">Channel ID</th>
              <th className="py-2 px-3">Details / Errors</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-900">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-neutral-500">
                  No notification events dispatched yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40">
                  <td className="py-2 px-3 whitespace-nowrap">
                    <div className="font-medium text-neutral-800 dark:text-neutral-300">
                      {formatRelativeTime(log.sent_at || log.created_at)}
                    </div>
                    <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                      {formatNormalTime(log.sent_at || log.created_at, true)}
                    </div>
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        log.status === "SENT"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-neutral-500 font-mono text-[11px]">
                    Channel #{log.channel_id} (Change #{log.change_id})
                  </td>
                  <td className="py-2 px-3 text-neutral-600 dark:text-neutral-400 text-[11px] truncate max-w-sm">
                    {log.error_message ? (
                      <span className="text-red-500 font-mono">{log.error_message}</span>
                    ) : (
                      "Dispatched successfully without errors"
                    )}
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
