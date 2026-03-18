import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Building2 } from "lucide-react";

export default function CompanyProfile() {
  const { user, axiosAuth, refreshUser } = useAuth();
  const [form, setForm] = useState({
    company_name: "", company_description: "", company_sector: "", company_size: "", company_website: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        company_name: user.company_name || "",
        company_description: user.company_description || "",
        company_sector: user.company_sector || "",
        company_size: user.company_size || "",
        company_website: user.company_website || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axiosAuth().put("/profile", form);
      await refreshUser();
      toast.success("Profil entreprise mis à jour");
    } catch { toast.error("Erreur de sauvegarde"); }
    setSaving(false);
  };

  const inputCls = "bg-slate-950 border-slate-800 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 h-10 text-slate-200 placeholder:text-slate-600";

  return (
    <div className="max-w-2xl space-y-8 animate-fade-in" data-testid="company-profile">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50 tracking-tight">Profil entreprise</h2>
          <p className="text-sm text-slate-400 mt-1">Présentez votre entreprise aux candidats</p>
        </div>
        <Button data-testid="save-company-btn" onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2">
          <Save className="w-4 h-4" /> {saving ? "Sauvegarde..." : "Enregistrer"}
        </Button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">{form.company_name || "Nom de l'entreprise"}</p>
            <p className="text-xs text-slate-500">{form.company_sector || "Secteur"}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-[13px] text-slate-400">Nom de l'entreprise</Label>
            <Input data-testid="company-name-input" value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} className={`mt-1.5 ${inputCls}`} />
          </div>
          <div>
            <Label className="text-[13px] text-slate-400">Secteur</Label>
            <Select value={form.company_sector} onValueChange={v => setForm(f => ({ ...f, company_sector: v }))}>
              <SelectTrigger data-testid="company-sector-select" className={`mt-1.5 ${inputCls}`}>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                {["Technologie", "Finance", "Santé", "Marketing", "Design", "Industrie", "Autre"].map(s => (
                  <SelectItem key={s} value={s} className="text-slate-300 focus:bg-slate-800 focus:text-slate-100">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[13px] text-slate-400">Taille</Label>
            <Select value={form.company_size} onValueChange={v => setForm(f => ({ ...f, company_size: v }))}>
              <SelectTrigger data-testid="company-size-select" className={`mt-1.5 ${inputCls}`}>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                {["1-10", "10-50", "50-200", "200-500", "500+"].map(s => (
                  <SelectItem key={s} value={s} className="text-slate-300 focus:bg-slate-800 focus:text-slate-100">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[13px] text-slate-400">Site web</Label>
            <Input data-testid="company-website-input" value={form.company_website} onChange={e => setForm(f => ({ ...f, company_website: e.target.value }))} placeholder="https://" className={`mt-1.5 ${inputCls}`} />
          </div>
        </div>
        <div>
          <Label className="text-[13px] text-slate-400">Description</Label>
          <Textarea data-testid="company-description-input" value={form.company_description} onChange={e => setForm(f => ({ ...f, company_description: e.target.value }))} placeholder="Décrivez votre entreprise..." className="mt-1.5 bg-slate-950 border-slate-800 focus:ring-1 focus:ring-indigo-500 text-slate-200 placeholder:text-slate-600 min-h-[120px]" />
        </div>
      </div>
    </div>
  );
}
