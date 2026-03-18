import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Users, Mail, MapPin, GraduationCap, FileText, Calendar, MessageSquare } from "lucide-react";

const STATUS_MAP = {
  envoyee: { label: "Envoyée", cls: "bg-slate-500/10 text-slate-400" },
  en_cours: { label: "En cours", cls: "bg-amber-500/10 text-amber-400" },
  entretien: { label: "Entretien", cls: "bg-blue-500/10 text-blue-400" },
  acceptee: { label: "Acceptée", cls: "bg-emerald-500/10 text-emerald-400" },
  refusee: { label: "Refusée", cls: "bg-red-500/10 text-red-400" },
};

export default function ApplicantReview() {
  const { user, axiosAuth } = useAuth();
  const [offers, setOffers] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scheduleDialog, setScheduleDialog] = useState(null);
  const [interviewForm, setInterviewForm] = useState({ date: "", time: "", type: "visio", location: "", notes: "" });

  useEffect(() => {
    axiosAuth().get("/offers/mine")
      .then(res => { setOffers(res.data); if (res.data.length > 0) setSelectedOffer(res.data[0].id); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [axiosAuth]);

  useEffect(() => {
    if (selectedOffer) {
      axiosAuth().get(`/applications/offer/${selectedOffer}`)
        .then(res => setApplications(res.data))
        .catch(() => setApplications([]));
    }
  }, [selectedOffer, axiosAuth]);

  const updateStatus = async (appId, status) => {
    try {
      await axiosAuth().put(`/applications/${appId}/status`, { status });
      toast.success("Statut mis à jour");
      const res = await axiosAuth().get(`/applications/offer/${selectedOffer}`);
      setApplications(res.data);
    } catch { toast.error("Erreur"); }
  };

  const scheduleInterview = async () => {
    if (!scheduleDialog || !interviewForm.date || !interviewForm.time) {
      toast.error("Veuillez remplir la date et l'heure");
      return;
    }
    try {
      await axiosAuth().post("/interviews", {
        application_id: scheduleDialog.id,
        candidate_id: scheduleDialog.candidate_id,
        ...interviewForm,
      });
      toast.success("Entretien planifié");
      setScheduleDialog(null);
      setInterviewForm({ date: "", time: "", type: "visio", location: "", notes: "" });
      const res = await axiosAuth().get(`/applications/offer/${selectedOffer}`);
      setApplications(res.data);
    } catch { toast.error("Erreur"); }
  };

  const startConversation = async (candidateId) => {
    try {
      await axiosAuth().post("/messages", {
        recipient_id: candidateId,
        content: "Bonjour, nous avons bien reçu votre candidature et souhaitons en discuter avec vous.",
      });
      toast.success("Message envoyé");
    } catch { toast.error("Erreur d'envoi"); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;

  const inputCls = "bg-slate-950 border-slate-800 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 h-10 text-slate-200 placeholder:text-slate-600";

  return (
    <div className="space-y-6 animate-fade-in" data-testid="applicant-review">
      <div>
        <h2 className="text-2xl font-semibold text-slate-50 tracking-tight">Candidats</h2>
        <p className="text-sm text-slate-400 mt-1">Examinez et gérez les candidatures</p>
      </div>

      {/* Offer selector */}
      <Select value={selectedOffer || ""} onValueChange={setSelectedOffer}>
        <SelectTrigger data-testid="offer-selector" className="w-full max-w-md bg-slate-950 border-slate-800 text-slate-300 h-10">
          <SelectValue placeholder="Sélectionner une offre" />
        </SelectTrigger>
        <SelectContent className="bg-slate-900 border-slate-800">
          {offers.map(o => (
            <SelectItem key={o.id} value={o.id} className="text-slate-300 focus:bg-slate-800 focus:text-slate-100">
              {o.title} ({o.applicant_count || 0} candidat{(o.applicant_count || 0) !== 1 ? "s" : ""})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Application cards */}
      <div className="space-y-4">
        {applications.map((app, i) => {
          const profile = app.candidate_profile || {};
          return (
            <div key={app.id} className="bg-slate-900 border border-slate-800 rounded-lg p-5" data-testid={`applicant-card-${i}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 text-sm font-medium shrink-0">
                    {app.candidate_name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-200">{app.candidate_name}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3" />{app.candidate_email}</p>
                    {profile.location && <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{profile.location}</p>}
                    {profile.bio && <p className="text-xs text-slate-400 mt-2">{profile.bio}</p>}
                    {profile.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {profile.skills.map(s => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">{s}</span>
                        ))}
                      </div>
                    )}
                    {profile.education?.length > 0 && (
                      <div className="mt-2">
                        {profile.education.map((edu, j) => (
                          <p key={j} className="text-xs text-slate-500 flex items-center gap-1"><GraduationCap className="w-3 h-3" />{edu.degree} - {edu.school} ({edu.year})</p>
                        ))}
                      </div>
                    )}
                    {app.cover_letter && (
                      <div className="mt-3 p-3 bg-slate-950/50 rounded-md border border-slate-800">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1"><FileText className="w-3 h-3" /> Lettre de motivation</p>
                        <p className="text-xs text-slate-400">{app.cover_letter}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge className={`text-[10px] ${STATUS_MAP[app.status]?.cls || ""}`}>
                    {STATUS_MAP[app.status]?.label || app.status}
                  </Badge>
                  <Select value={app.status} onValueChange={(v) => updateStatus(app.id, v)}>
                    <SelectTrigger className="w-[130px] h-8 text-xs bg-slate-950 border-slate-800 text-slate-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      {Object.entries(STATUS_MAP).map(([k, v]) => (
                        <SelectItem key={k} value={k} className="text-slate-300 text-xs focus:bg-slate-800">{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-7 px-2 text-xs gap-1" onClick={() => setScheduleDialog(app)} data-testid={`schedule-btn-${i}`}>
                      <Calendar className="w-3 h-3" /> Planifier
                    </Button>
                    <Button variant="ghost" size="sm" className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 h-7 px-2 text-xs gap-1" onClick={() => startConversation(app.candidate_id)} data-testid={`message-btn-${i}`}>
                      <MessageSquare className="w-3 h-3" /> Message
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {applications.length === 0 && (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-lg">
            <Users className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Aucune candidature pour cette offre</p>
          </div>
        )}
      </div>

      {/* Schedule Interview Dialog */}
      <Dialog open={!!scheduleDialog} onOpenChange={() => setScheduleDialog(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-50 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-50">Planifier un entretien</DialogTitle>
            <DialogDescription className="text-slate-400">
              Entretien avec {scheduleDialog?.candidate_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[13px] text-slate-400">Date *</Label>
                <Input type="date" value={interviewForm.date} onChange={e => setInterviewForm(f => ({ ...f, date: e.target.value }))} className={`mt-1.5 ${inputCls}`} data-testid="interview-date-input" />
              </div>
              <div>
                <Label className="text-[13px] text-slate-400">Heure *</Label>
                <Input type="time" value={interviewForm.time} onChange={e => setInterviewForm(f => ({ ...f, time: e.target.value }))} className={`mt-1.5 ${inputCls}`} data-testid="interview-time-input" />
              </div>
            </div>
            <div>
              <Label className="text-[13px] text-slate-400">Type</Label>
              <Select value={interviewForm.type} onValueChange={v => setInterviewForm(f => ({ ...f, type: v }))}>
                <SelectTrigger className={`mt-1.5 ${inputCls}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="visio" className="text-slate-300 focus:bg-slate-800">Visioconférence</SelectItem>
                  <SelectItem value="presentiel" className="text-slate-300 focus:bg-slate-800">Présentiel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[13px] text-slate-400">Lieu / Lien</Label>
              <Input value={interviewForm.location} onChange={e => setInterviewForm(f => ({ ...f, location: e.target.value }))} placeholder="Lien Zoom / Adresse" className={`mt-1.5 ${inputCls}`} />
            </div>
            <div>
              <Label className="text-[13px] text-slate-400">Notes</Label>
              <Input value={interviewForm.notes} onChange={e => setInterviewForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes internes" className={`mt-1.5 ${inputCls}`} />
            </div>
            <Button data-testid="confirm-schedule-btn" onClick={scheduleInterview} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
              Confirmer l'entretien
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
