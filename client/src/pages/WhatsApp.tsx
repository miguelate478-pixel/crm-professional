import CRMLayout from "@/components/CRMLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  MessageCircle, Send, Search, Phone, User, Clock,
  AlertCircle, CheckCheck, Check, Loader2, Plus, ExternalLink,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Message bubble ─────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: any }) {
  const isOut = msg.direction === "outbound";
  const time = msg.createdAt
    ? new Date(msg.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className={cn("flex mb-2", isOut ? "justify-end" : "justify-start")}>
      <div className={cn(
        "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
        isOut
          ? "bg-green-600 text-white rounded-br-sm"
          : "bg-muted text-foreground rounded-bl-sm"
      )}>
        <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
        <div className={cn("flex items-center gap-1 mt-1 text-[10px]", isOut ? "text-green-200 justify-end" : "text-muted-foreground")}>
          <span>{time}</span>
          {isOut && (
            msg.status === "sent" ? <CheckCheck size={12} /> : <Check size={12} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Conversation item ──────────────────────────────────────────────────────────

function ConversationItem({ conv, active, onClick }: { conv: any; active: boolean; onClick: () => void }) {
  const time = conv.lastMessageAt
    ? new Date(conv.lastMessageAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border/30",
        active && "bg-muted/70"
      )}
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
        <Phone size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-medium text-sm truncate">{conv.phone}</p>
          <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">{time}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
      </div>
      <Badge className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 flex-shrink-0">
        {conv.messageCount}
      </Badge>
    </button>
  );
}

// ── New conversation dialog ────────────────────────────────────────────────────

function NewConversation({ onStart }: { onStart: (phone: string) => void }) {
  const [phone, setPhone] = useState("");

  const handleStart = () => {
    if (!phone.trim()) { toast.error("Ingresa un número de teléfono"); return; }
    onStart(phone.trim());
    setPhone("");
  };

  return (
    <div className="flex gap-2 p-3 border-b border-border/50">
      <Input
        placeholder="+57 300 123 4567"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleStart()}
        className="h-9 text-sm"
      />
      <Button size="sm" onClick={handleStart} className="bg-green-600 hover:bg-green-700 h-9 px-3">
        <Plus size={16} />
      </Button>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function WhatsAppPage() {
  const [activePhone, setActivePhone] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: status } = trpc.whatsapp.status.useQuery();
  const { data: conversations = [], refetch: refetchConvs } = trpc.whatsapp.conversations.useQuery();
  const { data: messages = [], refetch: refetchMsgs } = trpc.whatsapp.messages.useQuery(
    { phone: activePhone ?? "", limit: 100 },
    { enabled: !!activePhone, refetchInterval: 5000 }
  );

  const sendMutation = trpc.whatsapp.send.useMutation({
    onSuccess: () => {
      setMessage("");
      refetchMsgs();
      refetchConvs();
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() || !activePhone) return;
    sendMutation.mutate({ phone: activePhone, message: message.trim() });
  };

  const filteredConvs = (conversations as any[]).filter(c =>
    !search || c.phone?.includes(search)
  );

  // Not configured state
  if (status && !status.configured) {
    return (
      <CRMLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
          <div className="w-20 h-20 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6">
            <MessageCircle size={40} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">WhatsApp Business</h1>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Conecta tu número de WhatsApp Business para enviar y recibir mensajes directamente desde el CRM.
          </p>

          <Card className="w-full text-left border-border/50 mb-6">
            <CardContent className="p-5 space-y-3">
              <p className="font-semibold text-sm">Para activarlo necesitas:</p>
              {[
                "Cuenta de Meta for Developers (developers.facebook.com)",
                "Número de WhatsApp Business verificado",
                "Token de acceso permanente",
                "Phone Number ID",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm">
                  <div className="w-5 h-5 rounded-full bg-green-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">{i + 1}</div>
                  <span className="text-muted-foreground">{step}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-3 w-full">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => window.open("https://developers.facebook.com/apps", "_blank")}
            >
              <ExternalLink size={14} className="mr-2" />
              Ir a Meta Developers
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.location.href = "/integrations"}
            >
              Configurar credenciales
            </Button>
          </div>

          <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-600 dark:text-amber-400 text-left w-full">
            <AlertCircle size={12} className="inline mr-1.5" />
            Agrega <code className="font-mono bg-amber-500/10 px-1 rounded">WHATSAPP_TOKEN</code> y{" "}
            <code className="font-mono bg-amber-500/10 px-1 rounded">WHATSAPP_PHONE_ID</code> en las variables de entorno de Railway.
          </div>
        </div>
      </CRMLayout>
    );
  }

  return (
    <CRMLayout>
      <div className="flex h-[calc(100vh-8rem)] rounded-xl border border-border/50 overflow-hidden bg-background">

        {/* ── Left: Conversations ── */}
        <div className="w-80 flex-shrink-0 border-r border-border/50 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold flex items-center gap-2">
                <MessageCircle size={18} className="text-green-500" />
                WhatsApp
              </h2>
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 text-xs">
                Conectado
              </Badge>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar conversación..."
                className="pl-8 h-8 text-xs"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* New conversation */}
          <NewConversation onStart={phone => setActivePhone(phone)} />

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto">
            {filteredConvs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <MessageCircle size={32} className="text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Sin conversaciones aún</p>
                <p className="text-xs text-muted-foreground mt-1">Ingresa un número arriba para empezar</p>
              </div>
            ) : (
              filteredConvs.map((conv: any) => (
                <ConversationItem
                  key={conv.phone}
                  conv={conv}
                  active={activePhone === conv.phone}
                  onClick={() => setActivePhone(conv.phone)}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Right: Chat ── */}
        <div className="flex-1 flex flex-col">
          {!activePhone ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
                <MessageCircle size={32} className="text-green-500" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Selecciona una conversación</h3>
              <p className="text-sm text-muted-foreground">
                O ingresa un número en el panel izquierdo para iniciar una nueva conversación
              </p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="h-16 border-b border-border/50 flex items-center px-5 gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white">
                  <Phone size={15} />
                </div>
                <div>
                  <p className="font-semibold text-sm">{activePhone}</p>
                  <p className="text-xs text-muted-foreground">WhatsApp Business</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-1"
                style={{ backgroundImage: "radial-gradient(circle, hsl(var(--muted)) 1px, transparent 1px)", backgroundSize: "20px 20px", backgroundOpacity: 0.3 }}>
                {(messages as any[]).length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-muted-foreground">Sin mensajes aún. Envía el primero.</p>
                  </div>
                ) : (
                  [...(messages as any[])].reverse().map((msg: any) => (
                    <MessageBubble key={msg.id} msg={msg} />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border/50">
                <div className="flex gap-2 items-end">
                  <Textarea
                    placeholder="Escribe un mensaje..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    rows={1}
                    className="resize-none min-h-[40px] max-h-32 text-sm"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!message.trim() || sendMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 h-10 w-10 p-0 flex-shrink-0"
                  >
                    {sendMutation.isPending
                      ? <Loader2 size={16} className="animate-spin" />
                      : <Send size={16} />
                    }
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  Enter para enviar · Shift+Enter para nueva línea
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </CRMLayout>
  );
}
