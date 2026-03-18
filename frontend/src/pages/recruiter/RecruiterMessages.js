import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageSquare, User } from "lucide-react";

export default function RecruiterMessages() {
  const { user, axiosAuth, API } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);

  const fetchConversations = useCallback(async () => {
    try { const res = await axiosAuth().get("/conversations"); setConversations(res.data); } catch {}
  }, [axiosAuth]);

  const fetchMessages = useCallback(async (convoId) => {
    try { const res = await axiosAuth().get(`/messages/${convoId}`); setMessages(res.data); } catch {}
  }, [axiosAuth]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);
  useEffect(() => { if (activeConvo) fetchMessages(activeConvo.id); }, [activeConvo, fetchMessages]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (!user) return;
    const wsUrl = API.replace("https://", "wss://").replace("http://", "ws://");
    const ws = new WebSocket(`${wsUrl}/ws/${user.id}`);
    wsRef.current = ws;
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "new_message") { setMessages(prev => [...prev, data.message]); fetchConversations(); }
    };
    const ping = setInterval(() => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping" })); }, 30000);
    return () => { clearInterval(ping); ws.close(); };
  }, [user, API, fetchConversations]);

  const handleSend = async () => {
    if (!newMsg.trim() || !activeConvo) return;
    setSending(true);
    try {
      await axiosAuth().post("/messages", { conversation_id: activeConvo.id, recipient_id: activeConvo.other_user.id, content: newMsg });
      setNewMsg("");
      fetchMessages(activeConvo.id);
      fetchConversations();
    } catch {}
    setSending(false);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4 animate-fade-in" data-testid="recruiter-messages">
      <div className="w-72 shrink-0 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-sm font-medium text-slate-200 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-400" /> Messages
          </h3>
        </div>
        <ScrollArea className="h-[calc(100%-56px)]">
          {conversations.map(convo => (
            <button key={convo.id} data-testid={`rconvo-${convo.id}`} onClick={() => setActiveConvo(convo)}
              className={`w-full text-left p-3 border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors ${activeConvo?.id === convo.id ? "bg-slate-800/50" : ""}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0"><User className="w-4 h-4 text-emerald-300" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-200 truncate">{convo.other_user?.full_name || "Utilisateur"}</p>
                  <p className="text-xs text-slate-500 truncate">{convo.last_message}</p>
                </div>
              </div>
            </button>
          ))}
          {conversations.length === 0 && <p className="text-xs text-slate-500 text-center py-8">Aucune conversation</p>}
        </ScrollArea>
      </div>

      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg flex flex-col overflow-hidden">
        {activeConvo ? (
          <>
            <div className="p-4 border-b border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center"><User className="w-4 h-4 text-emerald-300" /></div>
              <div>
                <p className="text-sm font-medium text-slate-200">{activeConvo.other_user?.full_name}</p>
                <p className="text-xs text-slate-500">Candidat</p>
              </div>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-lg px-3 py-2 ${msg.sender_id === user?.id ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-200"}`}>
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${msg.sender_id === user?.id ? "text-emerald-200" : "text-slate-500"}`}>
                        {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-slate-800">
              <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                <Input data-testid="rmessage-input" value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Écrire un message..."
                  className="flex-1 bg-slate-950 border-slate-800 focus:ring-1 focus:ring-emerald-500 h-10 text-slate-200 placeholder:text-slate-600" />
                <Button data-testid="rsend-message-btn" type="submit" disabled={sending || !newMsg.trim()} className="bg-emerald-500 hover:bg-emerald-600 text-white h-10 px-4">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center"><MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-3" /><p className="text-sm text-slate-500">Sélectionnez une conversation</p></div>
          </div>
        )}
      </div>
    </div>
  );
}
