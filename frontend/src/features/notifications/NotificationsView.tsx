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
  ChevronDown,
  ChevronRight,
  Info,
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
  const [channelType, setChannelType] = useState<"email" | "discord" | "telegram">("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");

  // Custom SMTP optional settings
  const [showAdvancedSmtp, setShowAdvancedSmtp] = useState(false);
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [fromEmail, setFromEmail] = useState("");

  const [testingId, setTestingId] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<{ id: number; success: boolean; msg: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let config: Record<string, any> = {};
    if (channelType === "email") {
      config = { email: email.trim() };
      if (smtpHost.trim()) config.smtp_host = smtpHost.trim();
      if (smtpPort.trim()) config.smtp_port = parseInt(smtpPort.trim(), 10) || 587;
      if (smtpUser.trim()) config.smtp_user = smtpUser.trim();
      if (smtpPassword.trim()) config.smtp_password = smtpPassword.trim();
      if (fromEmail.trim()) config.from_email = fromEmail.trim();
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
      setSmtpHost("");
      setSmtpPort("587");
      setSmtpUser("");
      setSmtpPassword("");
      setFromEmail("");
      setShowAdvancedSmtp(false);
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
        msg: res.success ? (res.message || "Test alert dispatched successfully!") : (res.error || "Failed to dispatch alert"),
      });
    } catch (err: any) {
      setTestResult({
        id: channelId,
        success: false,
        msg: err.message || "Test execution failed",
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
                {(["email", "discord", "telegram"] as const).map((t) => (
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
              placeholder="e.g. Lead Dev Email, #ops-alerts"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            {channelType === "email" && (
              <div className="space-y-2">
                <Input
                  label="Target Recipient Email"
                  placeholder="alerts-recipient@gmail.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                {/* Collapsible Custom SMTP */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedSmtp(!showAdvancedSmtp)}
                    className="flex items-center gap-1.5 text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    {showAdvancedSmtp ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    <span>{showAdvancedSmtp ? "Hide Custom SMTP Credentials" : "Configure Custom SMTP Credentials (Optional)"}</span>
                  </button>

                  {showAdvancedSmtp && (
                    <div className="mt-2 p-2.5 rounded bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2">
                      <div className="flex items-start gap-1.5 text-[10px] text-neutral-600 dark:text-neutral-400 bg-blue-50 dark:bg-blue-950/30 p-2 rounded border border-blue-200/50 dark:border-blue-800/40">
                        <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                        <span>
                          <strong>Gmail Setup:</strong> Turn on 2-Step Verification, generate a 16-char password at <em>Google Account &gt; Security &gt; App Passwords</em>, and enter it below.
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          label="SMTP Host"
                          placeholder="smtp.gmail.com"
                          value={smtpHost}
                          onChange={(e) => setSmtpHost(e.target.value)}
                        />
                        <Input
                          label="SMTP Port"
                          placeholder="587"
                          value={smtpPort}
                          onChange={(e) => setSmtpPort(e.target.value)}
                        />
                      </div>

                      <Input
                        label="SMTP Username"
                        placeholder="your-email@gmail.com"
                        type="text"
                        value={smtpUser}
                        onChange={(e) => setSmtpUser(e.target.value)}
                      />

                      <Input
                        label="SMTP App Password"
                        placeholder="16-character Google App Password"
                        type="password"
                        value={smtpPassword}
                        onChange={(e) => setSmtpPassword(e.target.value)}
                      />

                      <Input
                        label="Sender Address (From Email)"
                        placeholder="your-email@gmail.com (defaults to SMTP User)"
                        type="email"
                        value={fromEmail}
                        onChange={(e) => setFromEmail(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {channelType === "discord" && (
              <Input
                label="Discord Webhook URL"
                placeholder="https://discord.com/api/webhooks/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
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
        <div className="lg:col-span-2 space-y-3">
          {/* Active Test Feedback Banner */}
          {testResult && (
            <div
              className={`p-3 rounded border text-xs flex items-start gap-2.5 transition-all ${
                testResult.success
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                  : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
              }`}
            >
              {testResult.success ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-semibold">
                  {testResult.success ? "Test Alert Dispatched Successfully" : "Test Alert Delivery Failed"}
                </div>
                <div className="text-[11px] mt-0.5 leading-relaxed opacity-95 break-words">
                  {testResult.msg}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTestResult(null)}
                className="text-[11px] underline opacity-70 hover:opacity-100"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="border border-neutral-200 dark:border-neutral-800 rounded bg-white dark:bg-neutral-950 overflow-hidden">
            <div className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider flex items-center justify-between">
              <span>Active Notification Endpoints ({channels.length})</span>
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
                      No alert channels configured. Add an email, Discord webhook, or Telegram bot to receive instant alerts.
                    </td>
                  </tr>
                ) : (
                  channels.map((ch) => {
                    const isTesting = testingId === ch.id;

                    return (
                      <tr key={ch.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40">
                        <td className="py-2 px-3 uppercase text-[10px] text-neutral-500 whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium">
                            {ch.channel_type}
                          </span>
                        </td>

                        <td className="py-2 px-3 font-semibold text-neutral-800 dark:text-neutral-200">
                          {ch.name}
                        </td>

                        <td className="py-2 px-3 text-neutral-600 dark:text-neutral-400 text-[11px]">
                          {ch.channel_type === "email" ? (
                            <div className="flex items-center gap-1.5">
                              <span className="truncate max-w-xs">{ch.config.email || "No email"}</span>
                              <span className="text-[9px] px-1 py-0.2 rounded bg-neutral-100 dark:bg-neutral-900 text-neutral-500 border border-neutral-200 dark:border-neutral-800">
                                {ch.config.smtp_user ? "Custom SMTP" : "Server SMTP"}
                              </span>
                            </div>
                          ) : ch.channel_type === "discord" ? (
                            <span className="truncate max-w-xs block">
                              {ch.config.webhook_url ? `${ch.config.webhook_url.substring(0, 32)}...` : "Webhook configured"}
                            </span>
                          ) : (
                            <span className="truncate max-w-xs block">
                              {ch.config.chat_id || "Telegram configured"}
                            </span>
                          )}
                        </td>

                        <td className="py-2 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
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
              <th className="py-2 px-3">Channel / Target</th>
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
              logs.map((log) => {
                const isSent = log.status === "SENT";
                const isSuppressed = log.status === "SUPPRESSED";
                const isFailed = log.status === "FAILED";

                return (
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
                          isSent
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                            : isSuppressed
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                            : "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-neutral-500 font-mono text-[11px]">
                      Channel #{log.channel_id} (Change #{log.change_id})
                    </td>
                    <td className="py-2 px-3 text-neutral-600 dark:text-neutral-400 text-[11px] max-w-sm">
                      {log.error_message ? (
                        <span className={`font-mono text-[10px] ${isSuppressed ? "text-amber-600 dark:text-amber-400" : "text-red-500"}`}>
                          {log.error_message}
                        </span>
                      ) : (
                        "Dispatched successfully to mail server"
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
