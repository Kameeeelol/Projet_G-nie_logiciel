import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Send, Clock, MessageSquare, XCircle, CheckCircle } from "lucide-react";

const COLUMNS = [
  { key: "envoyee", label: "Envoyée", icon: Send, color: "text-slate-400", bg: "bg-slate-500/10" },
  { key: "en_cours", label: "En cours", icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
  { key: "entretien", label: "Entretien", icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-500/10" },
  { key: "acceptee", label: "Acceptée", icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { key: "refusee", label: "Refusée", icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
];

export default function ApplicationTracker() {
  const { axiosAuth } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosAuth().get("/applications")
      .then(res => setApplications(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [axiosAuth]);

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="application-tracker">
      <div>
        <h2 className="text-2xl font-semibold text-slate-50 tracking-tight">Mes candidatures</h2>
        <p className="text-sm text-slate-400 mt-1">Suivez l'avancement de vos candidatures</p>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {COLUMNS.map(col => {
          const colApps = applications.filter(a => a.status === col.key);
          return (
            <div key={col.key} className="space-y-3" data-testid={`kanban-column-${col.key}`}>
              <div className="flex items-center gap-2 px-1">
                <col.icon className={`w-4 h-4 ${col.color}`} />
                <span className="text-xs font-medium text-slate-300">{col.label}</span>
                <Badge className={`text-[10px] ${col.bg} ${col.color} border-0 ml-auto`}>{colApps.length}</Badge>
              </div>
              <div className="space-y-2 min-h-[100px]">
                {colApps.map(app => (
                  <div
                    key={app.id}
                    data-testid={`app-card-${app.id}`}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-3 hover:border-slate-700 transition-colors"
                  >
                    <p className="text-sm font-medium text-slate-200 leading-tight">{app.offer_title}</p>
                    <p className="text-xs text-slate-500 mt-1">{app.company_name}</p>
                    <p className="text-[10px] text-slate-600 mt-2">
                      {new Date(app.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                ))}
                {colApps.length === 0 && (
                  <div className="border border-dashed border-slate-800 rounded-lg p-4 text-center">
                    <p className="text-xs text-slate-600">Aucune candidature</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
