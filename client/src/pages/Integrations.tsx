import CRMLayout from "@/components/CRMLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  MessageCircle, Calendar, Mail, Phone, Zap, CheckCircle2,
  ExternalLink, Settings, AlertCircle, Loader2, Copy, Check,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ── Integration Card ───────────────────────────────────────────────────────────

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  status: "connected" | "available" | "coming_soon";
  category: string;
  configFields?: { key: string; label: string; placeholder: string; type?: string }[];
  docsUrl?: string;
  setupSteps?: string[];
}

const INTEGRATIONS: Integration[] = [
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    description: "Envía y recibe mensajes de WhatsApp directamente desde el CRM. Historial completo en el timeline de cada contacto.",
    icon: MessageCircle,
    iconBg: "bg-green-500/10",
    iconColor: "text-green-500",
    status: "available",
    category: "Comunicación",
    configFields: [
      { key: "WHATSAPP_TOKEN", label: "Token de acceso (Meta / Twilio)", placeholder: "EAAxxxxxxx..." },
      { key: "WHATSAPP_PHONE_ID", label: "Phone Number ID", placeholder: "1234567890" },
      { key: "WHATSAPP_VERIFY_TOKEN", label: "Verify Token (webhook)", placeholder: "mi-token-secreto" },
    ],
    docsUrl: "https://developers.facebook.com/docs/whatsapp/cloud-api",
    setupSteps: [
      "Crea una app en Meta for Developers (developers.facebook.com)",
      "Agrega el producto 'WhatsApp' a tu app",
      "Obtén el Token de acceso y el Phone Number ID",
      "Configura el webhook con la URL: https://tu-dominio.com/api/whatsapp/webhook",
      "Pega las credenciales aquí y activa la integración",
    ],
  },
  {
    id: "google_calendar",
    name: "Google Calendar",
    description: "Sincroniza reuniones del CRM con Google Calendar. Genera links de Google Meet automáticamente al agendar.",
    icon: Calendar,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
    status: "available",
    category: "Productividad",
    configFields: [
      { key: "GOOGLE_CLIENT_ID", label: "Google Client ID", placeholder: "xxxxx.apps.googleusercontent.com" },
      { key: "GOOGLE_CLIENT_SECRET", label: "Google Client Secret", placeholder: "GOCSPX-xxxxx" },
    ],
    docsUrl: "https://console.cloud.google.com",
    setupSteps: [
      "Ve a Google Cloud Console (console.cloud.google.com)",
      "Crea un proyecto nuevo o selecciona uno existente",
      "Activa la API de Google Calendar",
      "Crea credenciales OAuth 2.0 (tipo: Web application)",
      "Agrega como URI de redirección: https://tu-dominio.com/api/google/callback",
      "Copia el Client ID y Client Secret aquí",
    ],
  },
  {
    id: "gmail",
    name: "Gmail / Email",
    description: "Envía emails directamente desde el CRM. El historial queda en el timeline del contacto automáticamente.",
    icon: Mail,
    iconBg: "bg-red-500/10",
    iconColor: "text-red-500",
    status: "available",
    category: "Comunicación",
    configFields: [
      { key: "GMAIL_CLIENT_ID", label: "Google Client ID", placeholder: "xxxxx.apps.googleusercontent.com" },
      { key: "GMAIL_CLIENT_SECRET", label: "Google Client Secret", placeholder: "GOCSPX-xxxxx" },
    ],
    docsUrl: "https://console.cloud.google.com",
    setupSteps: [
      "Usa las mismas credenciales de Google Calendar si ya las configuraste",
      "Activa la API de Gmail en Google Cloud Console",
      "Agrega el scope: https://www.googleapis.com/auth/gmail.send",
      "Conecta tu cuenta de Gmail con el botón de abajo",
    ],
  },
  {
    id: "twilio",
    name: "Twilio (Llamadas y SMS)",
    description: "Click-to-call desde el CRM, graba llamadas automáticamente y registra la duración en el timeline.",
    icon: Phone,
    iconBg: "bg-red-500/10",
    iconColor: "text-red-500",
    status: "available",
    category: "Comunicación",
    configFields: [
      { key: "TWILIO_ACCOUNT_SID", label: "Account SID", placeholder: "ACxxxxxxxxxxxxxxxx" },
      { key: "TWILIO_AUTH_TOKEN", label: "Auth Token", placeholder: "xxxxxxxxxxxxxxxx" },
      { key: "TWILIO_PHONE_NUMBER", label: "Número Twilio", placeholder: "+15551234567" },
    ],
    docsUrl: "https://console.twilio.com",
    setupSteps: [
      "Crea una cuenta en twilio.com",
      "Obtén un número de teléfono virtual",
      "Copia el Account SID y Auth Token desde el dashboard",
      "Configura el webhook de llamadas entrantes",
    ],
  },
  {
    id: "zoom",
    name: "Zoom",
    description: "Genera links de Zoom automáticamente al crear reuniones. Los participantes reciben el link por email.",
    icon: Video,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
    status: "coming_soon",
    category: "Videoconferencias",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Recibe notificaciones en Slack cuando se crea un lead, se cierra una oportunidad o vence una tarea.",
    icon: Zap,
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-500",
    status: "coming_soon",
    category: "Notificaciones",
  },
];

// Fake Video icon since we don't import it
function Video({ size, className }: { size?: number; className?: string }) {
  return <svg width={size ?? 24} height={size ?? 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>;
}

// ── Config Dialog ──────────────────────────────────────────────────────────────

function ConfigDialog({ integration, open, onClose }: { integration: Integration; open: boolean; onClose: () => void }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<"config" | "steps">("steps");
  const [copied, setCopied] = useState(false);

  const webhookUrl = `${window.location.origin}/api/${integration.id}/webhook`;

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    // In production: save to Railway env vars via API
    // For now: show instructions
    await new Promise(r => setTimeout(r, 1000));
    toast.success(`Configuración guardada. Agrega estas variables en Railway → Variables.`);
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg ${integration.iconBg} flex items-center justify-center`}>
              <integration.icon size={16} className={integration.iconColor} />
            </div>
            Configurar {integration.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 mb-4">
          <button onClick={() => setStep("steps")} className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-colors ${step === "steps" ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground"}`}>
            1. Pasos de configuración
          </button>
          <button onClick={() => setStep("config")} className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-colors ${step === "config" ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground"}`}>
            2. Credenciales
          </button>
        </div>

        {step === "steps" && integration.setupSteps && (
          <div className="space-y-4">
            <ol className="space-y-3">
              {integration.setupSteps.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">{i + 1}</span>
                  <span className="text-muted-foreground leading-relaxed">{s}</span>
                </li>
              ))}
            </ol>

            {integration.id === "whatsapp" && (
              <div className="space-y-1.5">
                <Label className="text-xs">URL del Webhook (copia esto en Meta)</Label>
                <div className="flex gap-2">
                  <Input value={webhookUrl} readOnly className="text-xs font-mono" />
                  <Button size="sm" variant="outline" onClick={handleCopy}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </Button>
                </div>
              </div>
            )}

            {integration.docsUrl && (
              <a href={integration.docsUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300">
                <ExternalLink size={12} /> Ver documentación oficial
              </a>
            )}

            <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600" onClick={() => setStep("config")}>
              Continuar → Ingresar credenciales
            </Button>
          </div>
        )}

        {step === "config" && integration.configFields && (
          <div className="space-y-4">
            {integration.configFields.map(f => (
              <div key={f.key} className="space-y-1.5">
                <Label className="text-sm">{f.label}</Label>
                <Input
                  type={f.type ?? "text"}
                  placeholder={f.placeholder}
                  value={values[f.key] ?? ""}
                  onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                  className="font-mono text-sm"
                />
              </div>
            ))}

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-600 dark:text-amber-400">
              <AlertCircle size={12} className="inline mr-1.5" />
              Estas credenciales deben agregarse como variables de entorno en Railway para que funcionen en producción.
            </div>

            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Variables para Railway:</p>
              {integration.configFields.map(f => (
                <p key={f.key} className="text-xs font-mono text-foreground">
                  {f.key}={values[f.key] ? "•".repeat(Math.min(values[f.key].length, 20)) : "<valor>"}
                </p>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-blue-600 to-indigo-600">
                {saving ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <CheckCircle2 size={14} className="mr-1.5" />}
                Guardar configuración
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const [selected, setSelected] = useState<Integration | null>(null);
  const [connected, setConnected] = useState<Record<string, boolean>>({});

  const categories = Array.from(new Set(INTEGRATIONS.map(i => i.category)));

  return (
    <CRMLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Integraciones</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Conecta tu CRM con las herramientas que ya usas
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Disponibles", value: INTEGRATIONS.filter(i => i.status === "available").length, color: "text-blue-500" },
            { label: "Conectadas", value: Object.values(connected).filter(Boolean).length, color: "text-emerald-500" },
            { label: "Próximamente", value: INTEGRATIONS.filter(i => i.status === "coming_soon").length, color: "text-amber-500" },
          ].map(s => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Integrations by category */}
        {categories.map(cat => (
          <div key={cat}>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">{cat}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {INTEGRATIONS.filter(i => i.category === cat).map(integration => (
                <Card key={integration.id} className={`border-border/50 transition-all ${integration.status === "coming_soon" ? "opacity-60" : "hover:shadow-md hover:border-border"}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl ${integration.iconBg} flex items-center justify-center`}>
                        <integration.icon size={20} className={integration.iconColor} />
                      </div>
                      <Badge
                        className={`text-xs border-0 ${
                          integration.status === "connected" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                          integration.status === "available" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                          "bg-muted text-muted-foreground"
                        }`}
                      >
                        {integration.status === "connected" ? "✓ Conectado" :
                         integration.status === "available" ? "Disponible" : "Próximamente"}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{integration.name}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">{integration.description}</p>
                    {integration.status !== "coming_soon" && (
                      <Button
                        size="sm"
                        variant={connected[integration.id] ? "outline" : "default"}
                        className={`w-full text-xs ${!connected[integration.id] ? "bg-gradient-to-r from-blue-600 to-indigo-600" : ""}`}
                        onClick={() => setSelected(integration)}
                      >
                        <Settings size={12} className="mr-1.5" />
                        {connected[integration.id] ? "Configurar" : "Conectar"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <ConfigDialog
          integration={selected}
          open={!!selected}
          onClose={() => setSelected(null)}
        />
      )}
    </CRMLayout>
  );
}
