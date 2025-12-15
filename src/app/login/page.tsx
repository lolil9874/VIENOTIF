"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, Lock, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error);
        console.error("Error details:", {
          message: error.message,
          status: error.status,
          name: error.name
        });
        
        // Check for network/DNS errors
        if (error.message.includes("Failed to fetch") || 
            error.message.includes("ERR_NAME_NOT_RESOLVED") ||
            error.message.includes("NetworkError") ||
            error.name === "AuthApiError" && error.status === undefined) {
          setError(
            "Erreur de connexion: Impossible de joindre le serveur d'authentification. " +
            "Vérifiez votre connexion internet ou contactez le support si le problème persiste."
          );
          return;
        }
        
        if (error.message.includes("Invalid login credentials") || error.message.includes("Invalid credentials")) {
          setError("Email ou mot de passe incorrect. Vérifiez vos identifiants.");
        } else if (error.message.includes("Email not confirmed") || error.message.includes("email_not_confirmed")) {
          setError("Email non vérifié. Vérifiez votre boîte mail ou désactivez la vérification email dans Supabase Settings > Authentication.");
        } else if (error.message.includes("User not found") || error.message.includes("user_not_found")) {
          setError("Aucun compte trouvé avec cet email. Créez un compte d'abord.");
        } else if (error.message.includes("Invalid API key")) {
          setError("Erreur de configuration: Clé API invalide. Contactez le support.");
        } else {
          setError(error.message || "Erreur de connexion. Vérifiez vos identifiants.");
        }
        return;
      }

      // Verify that we have a session
      if (data.session) {
        console.log("Login successful, session created");
        router.push("/");
        router.refresh();
      } else {
        console.error("Login succeeded but no session");
        setError("Connexion réussie mais session non créée. Réessayez.");
      }
    } catch (err: any) {
      console.error("Login exception:", err);
      if (err?.message?.includes("NEXT_PUBLIC_SUPABASE_URL") || err?.message?.includes("not defined")) {
        setError("Erreur de configuration: Variables d'environnement manquantes. Contactez le support.");
      } else {
        setError("Une erreur est survenue lors de la connexion: " + (err?.message || "Erreur inconnue"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/30 mx-auto mb-4">
            🌍
          </div>
          <CardTitle className="text-2xl">Connexion</CardTitle>
          <CardDescription>
            Connectez-vous à votre compte VIENOTIF
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Se connecter
            </Button>

            <p className="text-center text-sm text-slate-400">
              Pas encore de compte ?{" "}
              <Link href="/register" className="text-indigo-400 hover:underline">
                S'inscrire
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

