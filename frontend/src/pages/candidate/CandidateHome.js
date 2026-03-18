import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Briefcase, Send, Calendar, CheckCircle, TrendingUp, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CandidateHome() {
  const { axiosAuth } = useAuth();
  const [stats, setStats] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const api = axiosAuth();
    Promise.all([
      api.get("/stats"),
      api.get("/recommendations"),
      api.get("/interviews"),
    ]).then(([s, r, i]) => {
      setStats(s.data);
      setRecommendations(r.data.slice(0, 3));
      setInterviews(i.data.slice(0, 3));
    }).catch(() => {});
  }, [axiosAuth]);

  const statCards = stats ? [
    { label: "Candidatures", value: stats.total_applications, icon: Send, color: "text-indigo-400" },
    { label: "En attente", value: stats.pending, icon: Briefcase, color: "text-amber-400" },
    { label: "Entretiens", value: stats.interviews, icon: Calendar, color: "text-blue-400" },
    { label: "Acceptées", value: stats.accepted, icon: CheckCircle, color: "text-emerald-400" },
  ] : [];

  return (
    <div className="space-y-8 animate-fade-in" data-testid="candidate-home">
      <div>
        <h2 className="text-2xl font-semibold text-slate-50 tracking-tight">Tableau de bord</h2>
        <p className="text-sm text-slate-400 mt-1">Vue d'ensemble de vos candidatures</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-lg p-5 hover:border-slate-700 transition-colors" data-testid={`stat-${i}`}>
            <s.icon className={`w-5 h-5 ${s.color} mb-3`} />
            <p className="text-2xl font-semibold text-slate-50">{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Recommendations */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-medium text-slate-200">Offres pour vous</h3>
            </div>
            <button onClick={() => navigate("/candidat/offres")} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              Voir tout <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {recommendations.map((offer, i) => (
              <div key={offer.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors" data-testid={`recommendation-${i}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-slate-200">{offer.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{offer.company_name} - {offer.location}</p>
                  </div>
                  <Badge className={`text-[10px] ${offer.type === "stage" ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20" : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"}`}>
                    {offer.type === "stage" ? "Stage" : "Emploi"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  {offer.domain && <span className="text-xs text-slate-500">{offer.domain}</span>}
                  {offer.duration && <span className="text-xs text-slate-500">{offer.duration}</span>}
                  {offer.salary && <span className="text-xs text-indigo-400">{offer.salary}</span>}
                </div>
              </div>
            ))}
            {recommendations.length === 0 && (
              <p className="text-sm text-slate-500 py-8 text-center">Ajoutez des compétences à votre profil pour des recommandations personnalisées</p>
            )}
          </div>
        </div>

        {/* Upcoming interviews */}
        <div className="lg:col-span-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-medium text-slate-200">Prochains entretiens</h3>
          </div>
          <div className="space-y-3">
            {interviews.map((interview, i) => (
              <div key={interview.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4" data-testid={`interview-${i}`}>
                <p className="text-sm font-medium text-slate-200">{interview.offer_title || "Entretien"}</p>
                <p className="text-xs text-slate-500 mt-0.5">{interview.company_name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-blue-400">{interview.date}</span>
                  <span className="text-xs text-slate-500">{interview.time}</span>
                </div>
              </div>
            ))}
            {interviews.length === 0 && (
              <p className="text-sm text-slate-500 py-4 text-center">Aucun entretien prévu</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
