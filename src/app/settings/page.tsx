"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Save,
  Loader2,
  MessageSquare,
  Mail,
  AlertCircle,
  CheckCircle,
  User,
  LogOut,
  Send,
  Hash,
  TestTube,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

interface UserSettings {
  telegram_bot_token: string;
  smtp_host: string;
  smtp_port: number | null;
  smtp_user: string;
  smtp_pass: string;
  smtp_from: string;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [testing, setTesting] = useState<{ channel: string; status: "idle" | "testing" | "success" | "error"; message?: string }>({
    channel: "",
    status: "idle",
  });
  const [testTargets, setTestTargets] = useState({
    telegram: "",
    discord: "",
    email: "",
  });
  
  const [settings, setSettings] = useState<UserSettings>({
    telegram_bot_token: "",
    smtp_host: "",
    smtp_port: 587,
    smtp_user: "",
    smtp_pass: "",
    smtp_from: "",
  });

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }
        setUserEmail(user.email || null);

        // Get settings
        const { data: userSettings } = await supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (userSettings) {
          setSettings({
            telegram_bot_token: userSettings.telegram_bot_token || "",
            smtp_host: userSettings.smtp_host || "",
            smtp_port: userSettings.smtp_port || 587,
            smtp_user: userSettings.smtp_user || "",
            smtp_pass: userSettings.smtp_pass || "",
            smtp_from: userSettings.smtp_from || "",
          });
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [supabase, router]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Not authenticated");
      }

      // Upsert settings
      const { error } = await supabase
        .from("user_settings")
        .upsert({
          user_id: user.id,
          telegram_bot_token: settings.telegram_bot_token || null,
          smtp_host: settings.smtp_host || null,
          smtp_port: settings.smtp_port || null,
          smtp_user: settings.smtp_user || null,
          smtp_pass: settings.smtp_pass || null,
          smtp_from: settings.smtp_from || null,
        }, {
          onConflict: "user_id",
        });

      if (error) throw error;

      setMessage({ type: "success", text: "Paramètres sauvegardés avec succès" });
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: "Erreur lors de la sauvegarde" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleTestNotification = async (channel: "telegram" | "discord" | "email") => {
    const target = testTargets[channel];
    
    if (!target) {
      setTesting({
        channel,
        status: "error",
        message: `Veuillez entrer une cible pour ${channel === "telegram" ? "Telegram (Chat ID)" : channel === "discord" ? "Discord (Webhook URL)" : "Email"}`,
      });
      return;
    }

    setTesting({ channel, status: "testing" });

    try {
      const response = await fetch("/api/test-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel,
          target,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTesting({
          channel,
          status: "success",
          message: data.message || "Notification envoyée avec succès !",
        });
        // Reset message after 5 seconds
        setTimeout(() => {
          setTesting({ channel: "", status: "idle" });
        }, 5000);
      } else {
        setTesting({
          channel,
          status: "error",
          message: data.error || data.details || "Erreur lors de l'envoi",
        });
      }
    } catch (error: any) {
      setTesting({
        channel,
        status: "error",
        message: error.message || "Erreur de connexion",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">Paramètres</h1>
                <p className="text-xs text-slate-500">Configuration des notifications</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {userEmail && (
                <div className="hidden md:flex items-center gap-2 text-sm text-slate-400">
                  <User className="h-4 w-4" />
                  {userEmail}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const testPanel = document.getElementById("test-notifications-panel");
                  testPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="hidden sm:flex items-center gap-2"
              >
                <TestTube className="h-4 w-4" />
                Tests
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Déconnexion">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {message && (
          <div
            className={`mb-6 flex items-center gap-2 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                : "bg-red-500/10 border border-red-500/30 text-red-300"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            {message.text}
          </div>
        )}

        {/* Test Notifications Panel - Placed first for visibility */}
        <Card id="test-notifications-panel" className="mb-6 border-2 border-indigo-500/50 bg-indigo-950/20 shadow-lg ring-2 ring-indigo-500/20">
          <CardHeader className="bg-gradient-to-r from-indigo-950/40 to-purple-950/40 rounded-t-lg border-b border-indigo-500/30">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <TestTube className="h-6 w-6 text-indigo-400 animate-pulse" />
              Tests de Notifications
            </CardTitle>
            <CardDescription className="text-sm text-slate-300">
              Testez vos notifications (Telegram, Email, Discord) avant de créer des souscriptions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Test Telegram */}
            <div className="space-y-2">
              <Label htmlFor="telegram_test_main" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-400" />
                Test Telegram
              </Label>
              <div className="flex gap-2">
                <Input
                  id="telegram_test_main"
                  value={testTargets.telegram}
                  onChange={(e) =>
                    setTestTargets({ ...testTargets, telegram: e.target.value })
                  }
                  placeholder="Votre Chat ID (ex: 123456789)"
                  disabled={testing.status === "testing" && testing.channel === "telegram"}
                />
                <Button
                  onClick={() => handleTestNotification("telegram")}
                  disabled={testing.status === "testing" && testing.channel === "telegram"}
                  variant="outline"
                  className="shrink-0"
                >
                  {testing.status === "testing" && testing.channel === "telegram" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Tester
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Pour obtenir votre Chat ID, démarrez une conversation avec @userinfobot sur Telegram
              </p>
              {testing.channel === "telegram" && testing.status !== "idle" && (
                <div
                  className={`mt-2 p-2 rounded text-xs ${
                    testing.status === "success"
                      ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                      : testing.status === "error"
                      ? "bg-red-500/10 text-red-300 border border-red-500/30"
                      : ""
                  }`}
                >
                  {testing.status === "success" && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3" />
                      {testing.message}
                    </div>
                  )}
                  {testing.status === "error" && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-3 w-3" />
                      {testing.message}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Test Email */}
            <div className="space-y-2 pt-4 border-t border-slate-700">
              <Label htmlFor="email_test_main" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-emerald-400" />
                Test Email
              </Label>
              <div className="flex gap-2">
                <Input
                  id="email_test_main"
                  type="email"
                  value={testTargets.email}
                  onChange={(e) =>
                    setTestTargets({ ...testTargets, email: e.target.value })
                  }
                  placeholder="votre@email.com"
                  disabled={testing.status === "testing" && testing.channel === "email"}
                />
                <Button
                  onClick={() => handleTestNotification("email")}
                  disabled={testing.status === "testing" && testing.channel === "email"}
                  variant="outline"
                  className="shrink-0"
                >
                  {testing.status === "testing" && testing.channel === "email" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Tester
                    </>
                  )}
                </Button>
              </div>
              {testing.channel === "email" && testing.status !== "idle" && (
                <div
                  className={`mt-2 p-2 rounded text-xs ${
                    testing.status === "success"
                      ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                      : testing.status === "error"
                      ? "bg-red-500/10 text-red-300 border border-red-500/30"
                      : ""
                  }`}
                >
                  {testing.status === "success" && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3" />
                      {testing.message}
                    </div>
                  )}
                  {testing.status === "error" && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-3 w-3" />
                      {testing.message}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Test Discord */}
            <div className="space-y-2 pt-4 border-t border-slate-700">
              <Label htmlFor="discord_test_main" className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-indigo-400" />
                Test Discord
              </Label>
              <div className="flex gap-2">
                <Input
                  id="discord_test_main"
                  type="url"
                  value={testTargets.discord}
                  onChange={(e) =>
                    setTestTargets({ ...testTargets, discord: e.target.value })
                  }
                  placeholder="https://discord.com/api/webhooks/..."
                  disabled={testing.status === "testing" && testing.channel === "discord"}
                />
                <Button
                  onClick={() => handleTestNotification("discord")}
                  disabled={testing.status === "testing" && testing.channel === "discord"}
                  variant="outline"
                  className="shrink-0"
                >
                  {testing.status === "testing" && testing.channel === "discord" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Tester
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Créez un webhook dans les paramètres de votre canal Discord
              </p>
              {testing.channel === "discord" && testing.status !== "idle" && (
                <div
                  className={`mt-2 p-2 rounded text-xs ${
                    testing.status === "success"
                      ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                      : testing.status === "error"
                      ? "bg-red-500/10 text-red-300 border border-red-500/30"
                      : ""
                  }`}
                >
                  {testing.status === "success" && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3" />
                      {testing.message}
                    </div>
                  )}
                  {testing.status === "error" && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-3 w-3" />
                      {testing.message}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Telegram Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-400" />
              Telegram
            </CardTitle>
            <CardDescription>
              Configurez votre bot Telegram pour recevoir des notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="telegram_token">Bot Token</Label>
              <Input
                id="telegram_token"
                type="password"
                value={settings.telegram_bot_token}
                onChange={(e) =>
                  setSettings({ ...settings, telegram_bot_token: e.target.value })
                }
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
              />
              <p className="text-xs text-slate-500">
                Créez un bot via @BotFather sur Telegram pour obtenir un token
              </p>
            </div>

            {/* Test Telegram */}
            <div className="pt-4 border-t border-slate-700">
              <div className="space-y-2">
                <Label htmlFor="telegram_test">Test Telegram</Label>
                <div className="flex gap-2">
                  <Input
                    id="telegram_test"
                    value={testTargets.telegram}
                    onChange={(e) =>
                      setTestTargets({ ...testTargets, telegram: e.target.value })
                    }
                    placeholder="Votre Chat ID (ex: 123456789)"
                    disabled={testing.status === "testing" && testing.channel === "telegram"}
                  />
                  <Button
                    onClick={() => handleTestNotification("telegram")}
                    disabled={testing.status === "testing" && testing.channel === "telegram"}
                    variant="outline"
                    className="shrink-0"
                  >
                    {testing.status === "testing" && testing.channel === "telegram" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Tester
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  Pour obtenir votre Chat ID, démarrez une conversation avec @userinfobot sur Telegram
                </p>
                {testing.channel === "telegram" && (
                  <div
                    className={`mt-2 p-2 rounded text-xs ${
                      testing.status === "success"
                        ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                        : testing.status === "error"
                        ? "bg-red-500/10 text-red-300 border border-red-500/30"
                        : ""
                    }`}
                  >
                    {testing.status === "success" && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3" />
                        {testing.message}
                      </div>
                    )}
                    {testing.status === "error" && (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-3 w-3" />
                        {testing.message}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-emerald-400" />
              Email (SMTP)
            </CardTitle>
            <CardDescription>
              Configurez un serveur SMTP pour envoyer des emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtp_host">Serveur SMTP</Label>
                <Input
                  id="smtp_host"
                  value={settings.smtp_host}
                  onChange={(e) =>
                    setSettings({ ...settings, smtp_host: e.target.value })
                  }
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp_port">Port</Label>
                <Input
                  id="smtp_port"
                  type="number"
                  value={settings.smtp_port || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      smtp_port: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  placeholder="587"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp_user">Utilisateur SMTP</Label>
              <Input
                id="smtp_user"
                value={settings.smtp_user}
                onChange={(e) =>
                  setSettings({ ...settings, smtp_user: e.target.value })
                }
                placeholder="votre@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp_pass">Mot de passe SMTP</Label>
              <Input
                id="smtp_pass"
                type="password"
                value={settings.smtp_pass}
                onChange={(e) =>
                  setSettings({ ...settings, smtp_pass: e.target.value })
                }
                placeholder="••••••••"
              />
              <p className="text-xs text-slate-500">
                Pour Gmail, utilisez un mot de passe d'application
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp_from">Email d'envoi</Label>
              <Input
                id="smtp_from"
                type="email"
                value={settings.smtp_from}
                onChange={(e) =>
                  setSettings({ ...settings, smtp_from: e.target.value })
                }
                placeholder="notifications@votredomaine.com"
              />
            </div>

            {/* Test Email */}
            <div className="pt-4 border-t border-slate-700">
              <div className="space-y-2">
                <Label htmlFor="email_test">Test Email</Label>
                <div className="flex gap-2">
                  <Input
                    id="email_test"
                    type="email"
                    value={testTargets.email}
                    onChange={(e) =>
                      setTestTargets({ ...testTargets, email: e.target.value })
                    }
                    placeholder="votre@email.com"
                    disabled={testing.status === "testing" && testing.channel === "email"}
                  />
                  <Button
                    onClick={() => handleTestNotification("email")}
                    disabled={testing.status === "testing" && testing.channel === "email"}
                    variant="outline"
                    className="shrink-0"
                  >
                    {testing.status === "testing" && testing.channel === "email" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Tester
                      </>
                    )}
                  </Button>
                </div>
                {testing.channel === "email" && (
                  <div
                    className={`mt-2 p-2 rounded text-xs ${
                      testing.status === "success"
                        ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                        : testing.status === "error"
                        ? "bg-red-500/10 text-red-300 border border-red-500/30"
                        : ""
                    }`}
                  >
                    {testing.status === "success" && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3" />
                        {testing.message}
                      </div>
                    )}
                    {testing.status === "error" && (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-3 w-3" />
                        {testing.message}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Discord Test Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-indigo-400" />
              Test Discord
            </CardTitle>
            <CardDescription>
              Testez votre webhook Discord avant de créer une souscription
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="discord_test">Webhook URL</Label>
              <div className="flex gap-2">
                <Input
                  id="discord_test"
                  type="url"
                  value={testTargets.discord}
                  onChange={(e) =>
                    setTestTargets({ ...testTargets, discord: e.target.value })
                  }
                  placeholder="https://discord.com/api/webhooks/..."
                  disabled={testing.status === "testing" && testing.channel === "discord"}
                />
                <Button
                  onClick={() => handleTestNotification("discord")}
                  disabled={testing.status === "testing" && testing.channel === "discord"}
                  variant="outline"
                  className="shrink-0"
                >
                  {testing.status === "testing" && testing.channel === "discord" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Tester
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Créez un webhook dans les paramètres de votre canal Discord
              </p>
              {testing.channel === "discord" && (
                <div
                  className={`mt-2 p-2 rounded text-xs ${
                    testing.status === "success"
                      ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                      : testing.status === "error"
                      ? "bg-red-500/10 text-red-300 border border-red-500/30"
                      : ""
                  }`}
                >
                  {testing.status === "success" && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3" />
                      {testing.message}
                    </div>
                  )}
                  {testing.status === "error" && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-3 w-3" />
                      {testing.message}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Sauvegarder les paramètres
        </Button>

        {/* Info */}
        <div className="mt-8 p-4 rounded-lg bg-slate-800/30 border border-slate-700">
          <h3 className="font-semibold text-white mb-2">💡 Conseil</h3>
          <p className="text-sm text-slate-400">
            Pour Discord, vous n'avez pas besoin de configurer quoi que ce soit ici.
            Il suffit de créer un webhook dans les paramètres de votre serveur Discord
            et de l'utiliser comme cible dans vos souscriptions.
          </p>
        </div>
      </main>
    </div>
  );
}
