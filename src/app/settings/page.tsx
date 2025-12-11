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
