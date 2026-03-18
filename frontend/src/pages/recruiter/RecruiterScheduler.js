import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CalendarDays, Clock, MapPin, Video, User, MessageSquare } from "lucide-react";
import { fr } from "date-fns/locale";

export default function RecruiterScheduler() {
  const { axiosAuth } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const fetchInterviews = async () => {
    try {
      const res = await axiosAuth().get("/interviews");
      setInterviews(res.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchInterviews(); }, [axiosAuth]);

  const interviewDates = interviews.map(i => new Date(i.date));
  const selectedDateStr = selectedDate?.toISOString().split("T")[0];
  const dayInterviews = interviews.filter(i => i.date === selectedDateStr);

  const updateFeedback = async (id, feedback) => {
    try {
      await axiosAuth().put(`/interviews/${id}`, { feedback });
      toast.success("Feedback enregistré");
      fetchInterviews();
    } catch { toast.error("Erreur"); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="recruiter-scheduler">
      <div>
        <h2 className="text-2xl font-semibold text-slate-50 tracking-tight">Planificateur d'entretiens</h2>
        <p className="text-sm text-slate-400 mt-1">Gérez vos entretiens et laissez vos feedback</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              locale={fr}
              modifiers={{ interview: interviewDates }}
              modifiersClassNames={{ interview: "bg-emerald-500/20 text-emerald-300 font-medium" }}
              className="text-slate-200"
            />
          </div>
        </div>

        <div className="lg:col-span-7 space-y-3">
          <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-emerald-400" />
            {selectedDate?.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </h3>

          {dayInterviews.length > 0 ? (
            dayInterviews.map(interview => (
              <InterviewCard key={interview.id} interview={interview} onFeedback={updateFeedback} />
            ))
          ) : (
            <div className="border border-dashed border-slate-800 rounded-lg p-8 text-center">
              <CalendarDays className="w-6 h-6 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Aucun entretien ce jour</p>
            </div>
          )}

          {interviews.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Tous les entretiens</h3>
              <div className="space-y-2">
                {interviews.map(i => (
                  <div key={i.id} className="flex items-center gap-4 p-3 bg-slate-900/50 border border-slate-800 rounded-md">
                    <div className="text-center min-w-[50px]">
                      <p className="text-lg font-semibold text-emerald-400">{new Date(i.date).getDate()}</p>
                      <p className="text-[10px] text-slate-500 uppercase">{new Date(i.date).toLocaleDateString("fr-FR", { month: "short" })}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 truncate">{i.candidate_name || "Candidat"}</p>
                      <p className="text-xs text-slate-500">{i.time} - {i.offer_title}</p>
                    </div>
                    <Badge className={`text-[10px] ${i.status === "planifie" ? "bg-blue-500/10 text-blue-400" : i.status === "termine" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400"}`}>
                      {i.status === "planifie" ? "Planifié" : i.status === "termine" ? "Terminé" : i.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InterviewCard({ interview, onFeedback }) {
  const [feedback, setFeedback] = useState(interview.feedback || "");
  const [editing, setEditing] = useState(false);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4" data-testid={`scheduler-interview-${interview.id}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-400" />
            <p className="text-sm font-medium text-slate-200">{interview.candidate_name || "Candidat"}</p>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{interview.offer_title}</p>
        </div>
        <Badge className={`text-[10px] ${interview.type === "visio" ? "bg-blue-500/10 text-blue-300 border-blue-500/20" : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"}`}>
          {interview.type === "visio" ? "Visio" : "Présentiel"}
        </Badge>
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{interview.time}</span>
        {interview.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{interview.location}</span>}
      </div>
      {/* Feedback */}
      <div className="mt-3 pt-3 border-t border-slate-800">
        {editing ? (
          <div className="space-y-2">
            <Textarea value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Notez vos impressions..." className="bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600 min-h-[60px] text-xs" />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => { onFeedback(interview.id, feedback); setEditing(false); }} className="bg-emerald-500 hover:bg-emerald-600 text-white h-7 text-xs">Enregistrer</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="text-slate-400 h-7 text-xs">Annuler</Button>
            </div>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="text-xs text-slate-500 hover:text-emerald-400 flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> {interview.feedback ? "Modifier le feedback" : "Ajouter un feedback"}
          </button>
        )}
        {interview.feedback && !editing && <p className="text-xs text-slate-400 mt-2 italic">{interview.feedback}</p>}
      </div>
    </div>
  );
}
