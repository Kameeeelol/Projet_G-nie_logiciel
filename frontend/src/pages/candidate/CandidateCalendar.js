import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, MapPin, Video } from "lucide-react";
import { fr } from "date-fns/locale";

export default function CandidateCalendar() {
  const { axiosAuth } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosAuth().get("/interviews")
      .then(res => setInterviews(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [axiosAuth]);

  const interviewDates = interviews.map(i => new Date(i.date));
  const selectedDateStr = selectedDate?.toISOString().split("T")[0];
  const dayInterviews = interviews.filter(i => i.date === selectedDateStr);

  return (
    <div className="space-y-6 animate-fade-in" data-testid="candidate-calendar">
      <div>
        <h2 className="text-2xl font-semibold text-slate-50 tracking-tight">Calendrier d'entretiens</h2>
        <p className="text-sm text-slate-400 mt-1">Vos prochains rendez-vous</p>
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
              modifiersClassNames={{ interview: "bg-indigo-500/20 text-indigo-300 font-medium" }}
              className="text-slate-200"
            />
          </div>
        </div>

        <div className="lg:col-span-7 space-y-3">
          <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-indigo-400" />
            {selectedDate?.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </h3>
          {dayInterviews.length > 0 ? (
            dayInterviews.map(interview => (
              <div key={interview.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4" data-testid={`calendar-interview-${interview.id}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{interview.offer_title || "Entretien"}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{interview.company_name}</p>
                  </div>
                  <Badge className={`text-[10px] ${interview.type === "visio" ? "bg-blue-500/10 text-blue-300 border-blue-500/20" : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"}`}>
                    {interview.type === "visio" ? "Visio" : "Présentiel"}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{interview.time}</span>
                  {interview.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{interview.location}</span>}
                  {interview.type === "visio" && <span className="flex items-center gap-1"><Video className="w-3 h-3" />Visioconférence</span>}
                </div>
                {interview.notes && <p className="text-xs text-slate-500 mt-2 italic">{interview.notes}</p>}
              </div>
            ))
          ) : (
            <div className="border border-dashed border-slate-800 rounded-lg p-8 text-center">
              <CalendarDays className="w-6 h-6 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Aucun entretien ce jour</p>
            </div>
          )}

          {/* All upcoming */}
          {interviews.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Tous les entretiens à venir</h3>
              <div className="space-y-2">
                {interviews.map(i => (
                  <div key={i.id} className="flex items-center gap-4 p-3 bg-slate-900/50 border border-slate-800 rounded-md">
                    <div className="text-center min-w-[50px]">
                      <p className="text-lg font-semibold text-indigo-400">{new Date(i.date).getDate()}</p>
                      <p className="text-[10px] text-slate-500 uppercase">{new Date(i.date).toLocaleDateString("fr-FR", { month: "short" })}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 truncate">{i.offer_title || "Entretien"}</p>
                      <p className="text-xs text-slate-500">{i.time} - {i.company_name}</p>
                    </div>
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
