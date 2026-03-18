import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Briefcase, Users, Calendar, FileText, ArrowRight } from "lucide-react";

export default function RecruiterHome() {
  const { axiosAuth } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentApps, setRecentApps] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const api = axiosAuth();
    Promise.all([
      api.get("/stats"),
      api.get("/applications"),
    ]).then(([s, a]) => {
      setStats(s.data);
      setRecentApps(a.data.slice(0, 5));
    }).catch(() => {});
  }, [axiosAuth]);

  const statCards = stats ? [
    { label: "Offres actives", value: stats.active_offers, icon: FileText, color: "text-emerald-400" },
    { label: "Total offres", value: stats.total_offers, icon: Briefcase, color: "text-indigo-400" },
    { label: "Candidatures reçues", value: stats.total_applications, icon: Users, color: "text-amber-400" },
    { label: "Entretiens planifiés", value: stats.interviews, icon: Calendar, color: "text-blue-400" },
  ] : [];

  return (
    <div className="space-y-8 animate-fade-in" data-testid="recruiter-home">
      <div>
        <h2 className="text-2xl font-semibold text-slate-50 tracking-tight">Tableau de bord</h2>
        <p className="text-sm text-slate-400 mt-1">Vue d'ensemble du recrutement</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-lg p-5 hover:border-slate-700 transition-colors" data-testid={`rstat-${i}`}>
            <s.icon className={`w-5 h-5 ${s.color} mb-3`} />
            <p className="text-2xl font-semibold text-slate-50">{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent applications */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-200">Dernières candidatures</h3>
          <button onClick={() => navigate("/recruteur/candidats")} className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
            Voir tout <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg divide-y divide-slate-800">
          {recentApps.map(app => (
            <div key={app.id} className="flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors" data-testid={`recent-app-${app.id}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 text-xs font-medium">
                  {app.candidate_name?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="text-sm text-slate-200">{app.candidate_name}</p>
                  <p className="text-xs text-slate-500">{app.offer_title}</p>
                </div>
              </div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                app.status === "envoyee" ? "bg-slate-500/10 text-slate-400" :
                app.status === "en_cours" ? "bg-amber-500/10 text-amber-400" :
                app.status === "entretien" ? "bg-blue-500/10 text-blue-400" :
                app.status === "acceptee" ? "bg-emerald-500/10 text-emerald-400" :
                "bg-red-500/10 text-red-400"
              }`}>
                {app.status === "envoyee" ? "Envoyée" : app.status === "en_cours" ? "En cours" : app.status === "entretien" ? "Entretien" : app.status === "acceptee" ? "Acceptée" : "Refusée"}
              </span>
            </div>
          ))}
          {recentApps.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-8">Aucune candidature reçue</p>
          )}
        </div>
      </div>
    </div>
  );
}
