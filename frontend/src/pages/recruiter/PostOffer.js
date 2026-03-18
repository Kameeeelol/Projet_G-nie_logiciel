import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, X, Send } from "lucide-react";

export default function PostOffer() {
  const { axiosAuth } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "", type: "stage", description: "", requirements: [], location: "", duration: "", domain: "Technologie", contract_type: "Stage", deadline: "", salary: ""
  });
  const [newReq, setNewReq] = useState("");
  const [publishing, setPublishing] = useState(false);

  const addRequirement = () => {
    if (newReq.trim() && !form.requirements.includes(newReq.trim())) {
      setForm(f => ({ ...f, requirements: [...f.requirements, newReq.trim()] }));
      setNewReq("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.location) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }
    setPublishing(true);
    try {
      await axiosAuth().post("/offers", form);
      toast.success("Offre publiée avec succès !");
      navigate("/recruteur/offres");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erreur de publication");
    }
    setPublishing(false);
  };

  const inputCls = "bg-slate-950 border-slate-800 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 h-10 text-slate-200 placeholder:text-slate-600";

  return (
    <div className="max-w-2xl space-y-8 animate-fade-in" data-testid="post-offer">
      <div>
        <h2 className="text-2xl font-semibold text-slate-50 tracking-tight">Publier une offre</h2>
        <p className="text-sm text-slate-400 mt-1">Créez une nouvelle offre de stage ou d'emploi</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
          <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wide">Informations de l'offre</h3>
          <div>
            <Label className="text-[13px] text-slate-400">Titre du poste *</Label>
            <Input data-testid="offer-title-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="ex: Développeur Full-Stack React" className={`mt-1.5 ${inputCls}`} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-[13px] text-slate-400">Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v, contract_type: v === "stage" ? "Stage" : "CDI" }))}>
                <SelectTrigger data-testid="offer-type-select" className={`mt-1.5 ${inputCls}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="stage" className="text-slate-300 focus:bg-slate-800 focus:text-slate-100">Stage</SelectItem>
                  <SelectItem value="emploi" className="text-slate-300 focus:bg-slate-800 focus:text-slate-100">Emploi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[13px] text-slate-400">Domaine</Label>
              <Select value={form.domain} onValueChange={v => setForm(f => ({ ...f, domain: v }))}>
                <SelectTrigger data-testid="offer-domain-select" className={`mt-1.5 ${inputCls}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  {["Technologie", "Finance", "Santé", "Marketing", "Design", "Autre"].map(d => (
                    <SelectItem key={d} value={d} className="text-slate-300 focus:bg-slate-800 focus:text-slate-100">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-[13px] text-slate-400">Description *</Label>
            <Textarea data-testid="offer-description-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Décrivez le poste en détail..." className="mt-1.5 bg-slate-950 border-slate-800 focus:ring-1 focus:ring-indigo-500 text-slate-200 placeholder:text-slate-600 min-h-[120px]" required />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-[13px] text-slate-400">Localisation *</Label>
              <Input data-testid="offer-location-input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Paris" className={`mt-1.5 ${inputCls}`} required />
            </div>
            <div>
              <Label className="text-[13px] text-slate-400">Durée</Label>
              <Input data-testid="offer-duration-input" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="6 mois / CDI" className={`mt-1.5 ${inputCls}`} />
            </div>
            <div>
              <Label className="text-[13px] text-slate-400">Rémunération</Label>
              <Input data-testid="offer-salary-input" value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} placeholder="1200€/mois" className={`mt-1.5 ${inputCls}`} />
            </div>
          </div>
          <div>
            <Label className="text-[13px] text-slate-400">Date limite</Label>
            <Input data-testid="offer-deadline-input" type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className={`mt-1.5 ${inputCls} w-48`} />
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wide mb-4">Compétences requises</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {form.requirements.map(r => (
              <Badge key={r} className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20 gap-1 pr-1">
                {r}
                <button onClick={() => setForm(f => ({ ...f, requirements: f.requirements.filter(x => x !== r) }))} className="ml-1 hover:text-red-400"><X className="w-3 h-3" /></button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input data-testid="requirement-input" value={newReq} onChange={e => setNewReq(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addRequirement())} placeholder="Ajouter une compétence" className={`flex-1 ${inputCls}`} />
            <Button type="button" data-testid="add-requirement-btn" onClick={addRequirement} variant="outline" className="border-slate-800 text-slate-300 hover:bg-slate-800"><Plus className="w-4 h-4" /></Button>
          </div>
        </div>

        <Button data-testid="publish-offer-btn" type="submit" disabled={publishing} className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-medium gap-2">
          <Send className="w-4 h-4" /> {publishing ? "Publication..." : "Publier l'offre"}
        </Button>
      </form>
    </div>
  );
}
