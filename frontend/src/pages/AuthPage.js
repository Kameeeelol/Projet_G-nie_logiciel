import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Briefcase, ArrowLeft, GraduationCap, Building2 } from "lucide-react";
import { toast } from "sonner";

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") || null;
  const [mode, setMode] = useState("login"); // login | register
  const [role, setRole] = useState(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const user = await login(email, password);
        toast.success("Connexion réussie");
        navigate(user.role === "candidate" ? "/candidat" : "/recruteur");
      } else {
        if (!role) { toast.error("Veuillez sélectionner un rôle"); setLoading(false); return; }
        const user = await register(email, password, fullName, role);
        toast.success("Compte créé avec succès");
        navigate(user.role === "candidate" ? "/candidat" : "/recruteur");
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erreur de connexion");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex" data-testid="auth-page">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 items-center justify-center border-r border-slate-800">
        <div className="max-w-md p-12">
          <div className="flex items-center gap-2 mb-8">
            <Briefcase className="w-7 h-7 text-indigo-400" />
            <span className="text-xl font-semibold text-slate-50 tracking-tight">StageConnect</span>
          </div>
          <h2 className="text-3xl font-medium tracking-tight text-slate-50 mb-4">
            {mode === "login" ? "Bon retour parmi nous" : "Rejoignez la communauté"}
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            {mode === "login"
              ? "Connectez-vous pour accéder à votre tableau de bord et suivre vos opportunités."
              : "Créez votre compte pour commencer à explorer les offres de stages et d'emplois."}
          </p>
          <div className="mt-12 grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <p className="text-2xl font-semibold text-indigo-400">500+</p>
              <p className="text-xs text-slate-500 mt-1">Offres actives</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <p className="text-2xl font-semibold text-emerald-400">200+</p>
              <p className="text-xs text-slate-500 mt-1">Entreprises</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <button onClick={() => navigate("/")} className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-8" data-testid="back-to-home-btn">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>

          <h1 className="text-2xl font-semibold text-slate-50 tracking-tight mb-1" data-testid="auth-title">
            {mode === "login" ? "Se connecter" : "Créer un compte"}
          </h1>
          <p className="text-sm text-slate-400 mb-8">
            {mode === "login" ? "Entrez vos identifiants" : "Remplissez les informations ci-dessous"}
          </p>

          {/* Role selector (register only) */}
          {mode === "register" && (
            <div className="flex gap-3 mb-6">
              <button
                data-testid="role-candidate-btn"
                type="button"
                onClick={() => setRole("candidate")}
                className={`flex-1 flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${role === "candidate" ? "border-indigo-500 bg-indigo-500/10 text-indigo-300" : "border-slate-800 text-slate-400 hover:border-slate-700"}`}
              >
                <GraduationCap className="w-4 h-4" /> Candidat
              </button>
              <button
                data-testid="role-recruiter-btn"
                type="button"
                onClick={() => setRole("recruiter")}
                className={`flex-1 flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${role === "recruiter" ? "border-emerald-500 bg-emerald-500/10 text-emerald-300" : "border-slate-800 text-slate-400 hover:border-slate-700"}`}
              >
                <Building2 className="w-4 h-4" /> Recruteur
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <Label className="text-[13px] text-slate-400">Nom complet</Label>
                <Input data-testid="auth-fullname-input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Marie Dupont" className="mt-1.5 bg-slate-950 border-slate-800 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 h-10 text-slate-200 placeholder:text-slate-600" required />
              </div>
            )}
            <div>
              <Label className="text-[13px] text-slate-400">Email</Label>
              <Input data-testid="auth-email-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="marie@exemple.com" className="mt-1.5 bg-slate-950 border-slate-800 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 h-10 text-slate-200 placeholder:text-slate-600" required />
            </div>
            <div>
              <Label className="text-[13px] text-slate-400">Mot de passe</Label>
              <Input data-testid="auth-password-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="mt-1.5 bg-slate-950 border-slate-800 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 h-10 text-slate-200 placeholder:text-slate-600" required />
            </div>
            <Button data-testid="auth-submit-btn" type="submit" disabled={loading} className="w-full h-10 bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-all active:scale-[0.98]">
              {loading ? "Chargement..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            {mode === "login" ? "Pas encore de compte ?" : "Déjà un compte ?"}
            <button
              data-testid="auth-toggle-mode-btn"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-indigo-400 hover:text-indigo-300 ml-1 font-medium"
            >
              {mode === "login" ? "S'inscrire" : "Se connecter"}
            </button>
          </p>

          {/* Demo accounts */}
          <div className="mt-8 border-t border-slate-800 pt-6">
            <p className="text-xs text-slate-500 mb-3 uppercase tracking-wide font-medium">Comptes démo</p>
            <div className="space-y-2">
              <button
                data-testid="demo-candidate-btn"
                onClick={() => { setEmail("marie@demo.com"); setPassword("demo123"); setMode("login"); }}
                className="w-full flex items-center gap-2 p-2.5 rounded-md border border-slate-800 text-xs text-slate-400 hover:border-slate-700 hover:text-slate-300 transition-colors"
              >
                <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                <span>Candidat: marie@demo.com / demo123</span>
              </button>
              <button
                data-testid="demo-recruiter-btn"
                onClick={() => { setEmail("recruteur@techcorp.com"); setPassword("demo123"); setMode("login"); }}
                className="w-full flex items-center gap-2 p-2.5 rounded-md border border-slate-800 text-xs text-slate-400 hover:border-slate-700 hover:text-slate-300 transition-colors"
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Recruteur: recruteur@techcorp.com / demo123</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
