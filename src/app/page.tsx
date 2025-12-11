"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  RefreshCw,
  Settings,
  Bell,
  Trash2,
  Edit,
  Power,
  PowerOff,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Globe,
  MessageSquare,
  Mail,
  MapPin,
  Filter,
  LogOut,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubscriptionForm } from "@/components/subscription-form";
import {
  SubscriptionFilters,
  NotificationChannel,
  GEOGRAPHIC_ZONES,
  ACTIVITY_SECTORS,
  STUDY_LEVELS,
  COMPANY_SIZES,
} from "@/lib/types";

interface Subscription {
  id: string;
  label: string;
  filters: Record<string, unknown>;
  channel: string;
  target: string;
  seen_offer_ids: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface JobRun {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  processed: number;
  new_offers: number;
  errors: number;
}

export default function Dashboard() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [jobRuns, setJobRuns] = useState<JobRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningWorker, setRunningWorker] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] =
    useState<Subscription | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push("/login");
        return;
      }
      setUserEmail(user?.email || null);
      
      // Synchroniser les offres et villes automatiquement à chaque connexion
      // (seulement si le cache est vide ou ancien)
      try {
        const { data: lastSync } = await supabase
          .from("cached_offers")
          .select("updated_at")
          .order("updated_at", { ascending: false })
          .limit(1)
          .single();

        const shouldSync = !lastSync || 
          new Date(lastSync.updated_at) < new Date(Date.now() - 15 * 60 * 1000); // 15 min

        if (shouldSync) {
          const syncRes = await fetch("/api/offers/sync", { method: "POST" });
          if (syncRes.ok) {
            const syncData = await syncRes.json();
            console.log("Offres et villes synchronisées:", syncData.message);
          }
        }
      } catch (err) {
        console.error("Erreur lors de la synchronisation:", err);
        // Ne pas bloquer l'utilisateur si la sync échoue
      }
    };
    getUser();
  }, [supabase, router]);

  const loadData = useCallback(async () => {
    try {
      const [subsRes, runsRes] = await Promise.all([
        fetch("/api/subscriptions"),
        fetch("/api/job-runs"),
      ]);
      
      if (!subsRes.ok) {
        const errorData = await subsRes.json().catch(() => ({ error: "Unknown error" }));
        console.error("Error loading subscriptions:", subsRes.status, errorData);
        throw new Error(errorData.error || `HTTP ${subsRes.status}`);
      }
      
      if (!runsRes.ok) {
        const errorData = await runsRes.json().catch(() => ({ error: "Unknown error" }));
        console.error("Error loading job runs:", runsRes.status, errorData);
        // Job runs error is not critical, continue
      }
      
      const [subs, runs] = await Promise.all([
        subsRes.json().catch(() => []),
        runsRes.json().catch(() => [])
      ]);
      
      if (Array.isArray(subs)) setSubscriptions(subs);
      if (Array.isArray(runs)) setJobRuns(runs);
    } catch (error) {
      console.error("Error loading data:", error);
      // Set empty arrays on error to prevent infinite loading
      setSubscriptions([]);
      setJobRuns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleCreateSubscription = async (data: {
    label: string;
    filters: SubscriptionFilters;
    channel: NotificationChannel;
    target: string;
  }) => {
    const res = await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      loadData();
    }
  };

  const handleEditSubscription = async (data: {
    label: string;
    filters: SubscriptionFilters;
    channel: NotificationChannel;
    target: string;
  }) => {
    if (!editingSubscription) return;
    const res = await fetch(`/api/subscriptions/${editingSubscription.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      loadData();
      setEditingSubscription(null);
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette souscription ?")) return;
    const res = await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
    if (res.ok) {
      loadData();
    }
  };

  const handleToggleActive = async (sub: Subscription) => {
    const res = await fetch(`/api/subscriptions/${sub.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !sub.is_active }),
    });
    if (res.ok) {
      loadData();
    }
  };

  const handleRunWorker = async () => {
    setRunningWorker(true);
    try {
      await fetch("/api/worker", { method: "POST" });
      loadData();
    } finally {
      setRunningWorker(false);
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "telegram":
        return <MessageSquare className="h-4 w-4 text-blue-400" />;
      case "discord":
        return <Globe className="h-4 w-4 text-violet-400" />;
      case "email":
        return <Mail className="h-4 w-4 text-emerald-400" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const parseFilters = (filters: Record<string, unknown>): SubscriptionFilters => {
    return filters as SubscriptionFilters;
  };

  const formatFilters = (filters: SubscriptionFilters): string[] => {
    const tags: string[] = [];
    
    // City filter
    if (filters.citySearch) {
      tags.push(`📍 ${filters.citySearch}`);
    }
    if (filters.countriesIds?.length) {
      tags.push(`🏳️ ${filters.countriesIds.length} pays`);
    }
    if (filters.geographicZones?.length) {
      tags.push(
        ...filters.geographicZones.map((z) => `🌍 ${GEOGRAPHIC_ZONES[z] || z}`)
      );
    }
    
    // Mission type
    if (filters.missionsTypesIds?.length) {
      tags.push(...filters.missionsTypesIds.map((t) => (t === "1" ? "VIE" : "VIA")));
    }
    
    // Duration
    if (filters.missionsDurations?.length) {
      tags.push(`⏱️ ${filters.missionsDurations.join("/")} mois`);
    }
    
    // Remote
    if (filters.teletravail?.includes("1")) {
      tags.push("🏠 Télétravail");
    }
    
    // Company
    if (filters.companySearch) {
      tags.push(`🏢 ${filters.companySearch}`);
    }
    
    // Sector
    if (filters.activitySectorId?.length) {
      if (filters.activitySectorId.length <= 2) {
        tags.push(...filters.activitySectorId.map((s) => ACTIVITY_SECTORS[s] || s));
      } else {
        tags.push(`${filters.activitySectorId.length} secteurs`);
      }
    }
    
    // Study level
    if (filters.studiesLevelId?.length) {
      tags.push(...filters.studiesLevelId.map((s) => `🎓 ${STUDY_LEVELS[s] || s}`));
    }
    
    // Company size
    if (filters.companiesSizes?.length) {
      tags.push(...filters.companiesSizes.map((s) => COMPANY_SIZES[s] || s));
    }
    
    // Indemnité
    if (filters.minIndemnite || filters.maxIndemnite) {
      const min = filters.minIndemnite || 0;
      const max = filters.maxIndemnite || "∞";
      tags.push(`💶 ${min}-${max}€`);
    }
    
    // Start date
    if (filters.startDateAfter || filters.startDateBefore) {
      const after = filters.startDateAfter ? new Date(filters.startDateAfter).toLocaleDateString() : "";
      const before = filters.startDateBefore ? new Date(filters.startDateBefore).toLocaleDateString() : "";
      if (after && before) {
        tags.push(`📅 ${after} - ${before}`);
      } else if (after) {
        tags.push(`📅 Après ${after}`);
      } else if (before) {
        tags.push(`📅 Avant ${before}`);
      }
    }
    
    // Query
    if (filters.query) {
      tags.push(`🔍 "${filters.query}"`);
    }
    
    return tags;
  };

  const lastRun = jobRuns[0];
  const activeCount = subscriptions.filter((s) => s.is_active).length;
  const totalNewOffers = jobRuns.reduce((sum, r) => sum + r.new_offers, 0);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/30">
                🌍
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">VIENOTIF</h1>
                <p className="text-xs text-slate-500">Alertes VIE/VIA</p>
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
                onClick={handleRunWorker}
                disabled={runningWorker}
              >
                {runningWorker ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                <span className="hidden sm:inline">Vérifier</span>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a href="/settings">
                  <Settings className="h-5 w-5" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Déconnexion">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Actives</p>
                  <p className="text-3xl font-bold text-white">{activeCount}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <Bell className="h-6 w-6 text-indigo-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Notifications</p>
                  <p className="text-3xl font-bold text-white">{totalNewOffers}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Dernière vérif.</p>
                  <p className="text-lg font-semibold text-white">
                    {lastRun
                      ? new Date(lastRun.started_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
                      : "Jamais"}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Statut</p>
                  <p className="text-lg font-semibold text-white flex items-center gap-2">
                    {lastRun?.status === "success" ? (
                      <>
                        <span className="status-dot active" />
                        OK
                      </>
                    ) : lastRun?.status === "failed" ? (
                      <>
                        <span className="status-dot error" />
                        Erreur
                      </>
                    ) : lastRun?.status === "running" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                        En cours
                      </>
                    ) : (
                      <>
                        <span className="status-dot inactive" />
                        —
                      </>
                    )}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    lastRun?.status === "success"
                      ? "bg-emerald-500/20"
                      : lastRun?.status === "failed"
                      ? "bg-red-500/20"
                      : "bg-slate-500/20"
                  }`}
                >
                  {lastRun?.status === "success" ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  ) : lastRun?.status === "failed" ? (
                    <XCircle className="h-6 w-6 text-red-400" />
                  ) : (
                    <Clock className="h-6 w-6 text-slate-400" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscriptions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Souscriptions</CardTitle>
              <CardDescription>
                Gérez vos alertes d'emploi
              </CardDescription>
            </div>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Nouvelle</span>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <Bell className="h-8 w-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Aucune souscription
                </h3>
                <p className="text-slate-400 mb-4">
                  Créez votre première alerte pour recevoir des notifications
                </p>
                <Button onClick={() => setFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une alerte
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {subscriptions.map((sub) => {
                  const filters = parseFilters(sub.filters);
                  const filterTags = formatFilters(filters);
                  const seenCount = Array.isArray(sub.seen_offer_ids) ? sub.seen_offer_ids.length : 0;

                  return (
                    <div
                      key={sub.id}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        sub.is_active
                          ? "border-slate-700 bg-slate-800/30"
                          : "border-slate-800 bg-slate-900/30 opacity-60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span
                              className={`status-dot ${
                                sub.is_active ? "active" : "inactive"
                              }`}
                            />
                            <h3 className="font-semibold text-white truncate">
                              {sub.label}
                            </h3>
                            <Badge variant="secondary" className="shrink-0">
                              {getChannelIcon(sub.channel)}
                              <span className="ml-1 capitalize">
                                {sub.channel}
                              </span>
                            </Badge>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {filterTags.slice(0, 5).map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {filterTags.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{filterTags.length - 5}
                              </Badge>
                            )}
                            {filterTags.length === 0 && (
                              <Badge variant="outline" className="text-xs">
                                Toutes les offres
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {seenCount} offres suivies
                            </span>
                            <span>
                              Créée le{" "}
                              {new Date(sub.created_at).toLocaleDateString("fr-FR")}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(sub)}
                            title={sub.is_active ? "Pause" : "Activer"}
                          >
                            {sub.is_active ? (
                              <Power className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <PowerOff className="h-4 w-4 text-slate-400" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingSubscription(sub);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSubscription(sub.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Runs */}
        {jobRuns.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Historique</CardTitle>
              <CardDescription>
                Dernières vérifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {jobRuns.slice(0, 10).map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/50"
                  >
                    <div className="flex items-center gap-3">
                      {run.status === "success" ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      ) : run.status === "failed" ? (
                        <XCircle className="h-5 w-5 text-red-400" />
                      ) : (
                        <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-white">
                          {new Date(run.started_at).toLocaleString("fr-FR")}
                        </p>
                        <p className="text-xs text-slate-400">
                          {run.processed} souscriptions vérifiées
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      {run.new_offers > 0 && (
                        <Badge variant="success">
                          {run.new_offers} nouvelles
                        </Badge>
                      )}
                      {run.errors > 0 && (
                        <Badge variant="destructive">{run.errors} erreurs</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Subscription Form */}
      <SubscriptionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreateSubscription}
        mode="create"
      />

      {/* Edit Form */}
      {editingSubscription && (
        <SubscriptionForm
          open={true}
          onOpenChange={() => setEditingSubscription(null)}
          onSubmit={handleEditSubscription}
          initialData={{
            label: editingSubscription.label,
            filters: parseFilters(editingSubscription.filters),
            channel: editingSubscription.channel as NotificationChannel,
            target: editingSubscription.target,
          }}
          mode="edit"
        />
      )}
    </div>
  );
}
