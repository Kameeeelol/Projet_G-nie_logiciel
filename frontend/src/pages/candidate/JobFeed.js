import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, MapPin, Clock, Building2, Send, Briefcase } from "lucide-react";
import axios from "axios";

const DOMAINS = ["all", "Technologie", "Finance", "Santé", "Marketing", "Design"];
const TYPES = ["all", "stage", "emploi"];

export default function JobFeed() {
  const { user, axiosAuth, API } = useAuth();
  const [offers, setOffers] = useState([]);
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState("all");
  const [type, setType] = useState("all");
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (domain !== "all") params.set("domain", domain);
      if (type !== "all") params.set("type", type);
      const res = await axios.get(`${API}/offers?${params.toString()}`);
      setOffers(res.data);
    } catch { toast.error("Erreur de chargement"); }
    setLoading(false);
  }, [search, domain, type, API]);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  const handleApply = async () => {
    if (!selectedOffer || !user) return;
    setApplying(true);
    try {
      await axiosAuth().post("/applications", { offer_id: selectedOffer.id, cover_letter: coverLetter });
      toast.success("Candidature envoyée !");
      setSelectedOffer(null);
      setCoverLetter("");
      fetchOffers();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erreur lors de l'envoi");
    }
    setApplying(false);
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="job-feed">
      <div>
        <h2 className="text-2xl font-semibold text-slate-50 tracking-tight">Offres disponibles</h2>
        <p className="text-sm text-slate-400 mt-1">Trouvez le stage ou l'emploi idéal</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            data-testid="search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="pl-10 bg-slate-950 border-slate-800 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 h-10 text-slate-200 placeholder:text-slate-600"
          />
        </div>
        <Select value={domain} onValueChange={setDomain}>
          <SelectTrigger data-testid="domain-filter" className="w-[160px] bg-slate-950 border-slate-800 text-slate-300 h-10">
            <SelectValue placeholder="Domaine" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            {DOMAINS.map(d => (
              <SelectItem key={d} value={d} className="text-slate-300 focus:bg-slate-800 focus:text-slate-100">
                {d === "all" ? "Tous les domaines" : d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger data-testid="type-filter" className="w-[140px] bg-slate-950 border-slate-800 text-slate-300 h-10">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            {TYPES.map(t => (
              <SelectItem key={t} value={t} className="text-slate-300 focus:bg-slate-800 focus:text-slate-100">
                {t === "all" ? "Tous les types" : t === "stage" ? "Stage" : "Emploi"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Offer list */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {offers.map((offer, i) => (
            <div
              key={offer.id}
              data-testid={`offer-card-${i}`}
              className="bg-slate-900 border border-slate-800 rounded-lg p-5 hover:border-slate-700 transition-colors cursor-pointer"
              onClick={() => setSelectedOffer(offer)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-slate-200 truncate">{offer.title}</h3>
                    <Badge className={`text-[10px] shrink-0 ${offer.type === "stage" ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20" : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"}`}>
                      {offer.type === "stage" ? "Stage" : "Emploi"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{offer.company_name}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{offer.location}</span>
                    {offer.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{offer.duration}</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">{offer.description}</p>
                </div>
                {offer.salary && <span className="text-xs font-medium text-indigo-400 shrink-0">{offer.salary}</span>}
              </div>
              {offer.requirements?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {offer.requirements.slice(0, 4).map(r => (
                    <span key={r} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">{r}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {offers.length === 0 && (
            <div className="text-center py-12">
              <Briefcase className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Aucune offre trouvée</p>
            </div>
          )}
        </div>
      )}

      {/* Apply Dialog */}
      <Dialog open={!!selectedOffer} onOpenChange={() => setSelectedOffer(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-50 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-50">{selectedOffer?.title}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedOffer?.company_name} - {selectedOffer?.location}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-slate-300 leading-relaxed">{selectedOffer?.description}</p>
            {selectedOffer?.requirements?.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 mb-2">Compétences requises:</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedOffer.requirements.map(r => (
                    <Badge key={r} variant="outline" className="text-[10px] text-slate-300 border-slate-700">{r}</Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-4 text-xs text-slate-500">
              {selectedOffer?.duration && <span>Durée: {selectedOffer.duration}</span>}
              {selectedOffer?.salary && <span>Rémunération: {selectedOffer.salary}</span>}
              {selectedOffer?.deadline && <span>Date limite: {selectedOffer.deadline}</span>}
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-2">Lettre de motivation (optionnel):</p>
              <Textarea
                data-testid="cover-letter-input"
                value={coverLetter}
                onChange={e => setCoverLetter(e.target.value)}
                placeholder="Expliquez votre motivation..."
                className="bg-slate-950 border-slate-800 focus:ring-1 focus:ring-indigo-500 text-slate-200 placeholder:text-slate-600 min-h-[100px]"
              />
            </div>
            <Button data-testid="apply-btn" onClick={handleApply} disabled={applying} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white gap-2">
              <Send className="w-4 h-4" /> {applying ? "Envoi..." : "Postuler"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
