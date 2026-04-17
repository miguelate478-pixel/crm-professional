import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail, Send, Inbox, RefreshCw, Loader2, ExternalLink,
  Reply, Trash2, Eye, Search, CheckCircle, AlertCircle, Plus
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function GmailPage() {
  const [location] = useLocation();
  const [folder, setFolder] = useState<"inbox" | "sent" | "all">("inbox");
  const [search, setSearch] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeForm, setComposeForm] = useState({ to: "", subject: "", body: "", cc: "" });
  const [replyTo, setReplyTo] = useState<any>(null);

  const integrationQuery = trpc.gmail.getIntegration.useQuery();
  const profileQuery = trpc.gmail.getProfile.useQuery(undefined, {
    enabled: !!integrationQuery.data,
  });
  const authUrlQuery = trpc.gmail.getAuthUrl.useQuery(undefined, {
    enabled: !integrationQuery.data,
  });
  const emailsQuery = trpc.gmail.listEmails.useQuery(
    { folder, query: search || undefined, maxResults: 30 },
    { enabled: !!integrationQuery.data }
  );
  const emailDetailQuery = trpc.gmail.getEmail.useQuery(
    { messageId: selectedEmail?.id },
    { enabled: !!selectedEmail?.id }
  );

  const connectMutation = trpc.gmail.connect.useMutation({
    onSuccess: () => {
      toast.success("Gmail conectado correctamente");
      integrationQuery.refetch();
      profileQuery.refetch();
    },
    onError: (e) => toast.error("Error al conectar: " + e.message),
  });

  const disconnectMutation = trpc.gmail.disconnect.useMutation({
    onSuccess: () => {
      toast.success("Gmail desconectado");
      integrationQuery.refetch();
    },
  });

  const sendMutation = trpc.gmail.sendEmail.useMutation({
    onSuccess: () => {
      toast.success("Email enviado");
      setComposeOpen(false);
      setReplyTo(null);
      setComposeForm({ to: "", subject: "", body: "", cc: "" });
      emailsQuery.refetch();
    },
    onError: (e) => toast.error("Error al enviar: " + e.message),
  });

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("gmail_code");
    if (code && !integrationQuery.data) {
      connectMutation.mutate({ code });
      // Clean URL
      window.history.replaceState({}, "", "/gmail");
    }
  }, []);

  const isConnected = !!integrationQuery.data;
  const emails = emailsQuery.data?.emails || [];
  const profile = profileQuery.data;

  const handleReply = (email: any) => {
    setReplyTo(email);
    setComposeForm({
      to: email.from || "",
      subject: `Re: ${email.subject || ""}`,
      body: `\n\n--- Mensaje original ---\nDe: ${email.from}\nFecha: ${email.date}\n\n`,
      cc: "",
    });
    setComposeOpen(true);
  };

  const handleSend = () => {
    if (!composeForm.to || !composeForm.subject || !composeForm.body) {
      toast.error("Completa todos los campos requeridos");
      return;
    }
    sendMutation.mutate({
      to: composeForm.to,
      subject: composeForm.subject,
      body: composeForm.body.replace(/\n/g, "<br>"),
      cc: composeForm.cc || undefined,
      replyToMessageId: replyTo?.id,
      threadId: replyTo?.threadId,
    });
  };

  // Not connected state
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 p-6">
        <div className="w-20 h-20 rounded-2xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
          <Mail className="w-10 h-10 text-red-500" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Conecta tu Gmail</h1>
          <p className="text-muted-foreground mt-2 max-w-md">
            Lee y envía emails directamente desde el CRM. Historial completo de conversaciones con cada cliente.
          </p>
        </div>

        {connectMutation.isPending ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            Conectando Gmail...
          </div>
        ) : (
          <Button
            size="lg"
            className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
            onClick={() => {
              if (authUrlQuery.data?.authUrl) {
                window.location.href = authUrlQuery.data.authUrl;
              }
            }}
            disabled={!authUrlQuery.data?.authUrl}
          >
            <Mail className="w-5 h-5 mr-2" />
            Conectar con Google
          </Button>
        )}

        <div className="text-xs text-muted-foreground text-center max-w-sm">
          Necesitas configurar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en Railway para que funcione.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <Mail className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gmail</h1>
            {profile?.email && (
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            )}
          </div>
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">
            <CheckCircle className="w-3 h-3 mr-1" />Conectado
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setComposeOpen(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Email
          </Button>
          <Button size="sm" variant="outline" onClick={() => emailsQuery.refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => disconnectMutation.mutate()}>
            Desconectar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Email list */}
        <div className="lg:col-span-1 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar emails..."
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Folder tabs */}
          <Tabs value={folder} onValueChange={(v) => setFolder(v as any)}>
            <TabsList className="w-full">
              <TabsTrigger value="inbox" className="flex-1">
                <Inbox className="w-3 h-3 mr-1" />Recibidos
              </TabsTrigger>
              <TabsTrigger value="sent" className="flex-1">
                <Send className="w-3 h-3 mr-1" />Enviados
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Email list */}
          <Card className="border-border/50">
            <CardContent className="p-0">
              {emailsQuery.isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : emails.length === 0 ? (
                <div className="py-12 text-center">
                  <Mail className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No hay emails</p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {emails.map((email: any) => (
                    <button
                      key={email.id}
                      className={`w-full text-left p-3 hover:bg-muted/30 transition-colors ${selectedEmail?.id === email.id ? "bg-muted/50" : ""} ${!email.isRead ? "bg-blue-50/30 dark:bg-blue-950/10" : ""}`}
                      onClick={() => setSelectedEmail(email)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${!email.isRead ? "font-semibold" : "font-medium"}`}>
                            {folder === "sent" ? email.to : email.from?.replace(/<.*>/, "").trim() || email.from}
                          </p>
                          <p className={`text-xs truncate mt-0.5 ${!email.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                            {email.subject}
                          </p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {email.snippet}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <p className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(email.date).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}
                          </p>
                          {!email.isRead && (
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Email detail */}
        <div className="lg:col-span-2">
          {!selectedEmail ? (
            <Card className="border-border/50 h-full flex items-center justify-center min-h-[400px]">
              <CardContent className="text-center py-12">
                <Mail className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground">Selecciona un email para leerlo</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/50">
              <CardContent className="p-5 space-y-4">
                {emailDetailQuery.isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : emailDetailQuery.data ? (
                  <>
                    {/* Email header */}
                    <div className="space-y-2 pb-4 border-b border-border/50">
                      <h2 className="text-lg font-semibold">{emailDetailQuery.data.subject}</h2>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">De: </span>
                          <span className="font-medium">{emailDetailQuery.data.from}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Para: </span>
                          <span>{emailDetailQuery.data.to}</span>
                        </div>
                        {emailDetailQuery.data.cc && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">CC: </span>
                            <span>{emailDetailQuery.data.cc}</span>
                          </div>
                        )}
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Fecha: </span>
                          <span>{new Date(emailDetailQuery.data.date).toLocaleString("es-PE")}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => handleReply(emailDetailQuery.data)}>
                          <Reply className="w-3 h-3 mr-1" />Responder
                        </Button>
                      </div>
                    </div>

                    {/* Email body */}
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none text-sm"
                      dangerouslySetInnerHTML={{ __html: emailDetailQuery.data.body || "<p>Sin contenido</p>" }}
                    />
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No se pudo cargar el email
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onOpenChange={(o) => { setComposeOpen(o); if (!o) setReplyTo(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              {replyTo ? "Responder Email" : "Nuevo Email"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Para *</Label>
                <Input
                  placeholder="email@ejemplo.com"
                  value={composeForm.to}
                  onChange={e => setComposeForm(f => ({ ...f, to: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>CC</Label>
                <Input
                  placeholder="cc@ejemplo.com"
                  value={composeForm.cc}
                  onChange={e => setComposeForm(f => ({ ...f, cc: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Asunto *</Label>
              <Input
                placeholder="Asunto del email"
                value={composeForm.subject}
                onChange={e => setComposeForm(f => ({ ...f, subject: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mensaje *</Label>
              <Textarea
                placeholder="Escribe tu mensaje aquí..."
                value={composeForm.body}
                onChange={e => setComposeForm(f => ({ ...f, body: e.target.value }))}
                rows={8}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setComposeOpen(false); setReplyTo(null); }}>
              Cancelar
            </Button>
            <Button
              onClick={handleSend}
              disabled={sendMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              {sendMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
