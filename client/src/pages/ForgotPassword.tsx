import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, TrendingUp, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("El email es requerido"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Error al enviar el email");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center font-bold text-white text-xl shadow-2xl shadow-indigo-500/40 mb-4">
            CR
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">CRM Pro</h1>
          <p className="text-slate-400 text-sm mt-1">Plataforma Comercial</p>
        </div>

        <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-8 shadow-2xl">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle size={48} className="mx-auto mb-4 text-emerald-500" />
              <h2 className="text-lg font-semibold text-white mb-2">¡Email enviado!</h2>
              <p className="text-slate-400 text-sm mb-6">
                Si existe una cuenta con ese email, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
              </p>
              <a href="/login" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                ← Volver al inicio de sesión
              </a>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-white mb-1">Recuperar contraseña</h2>
              <p className="text-slate-400 text-sm mb-6">
                Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-sm">Email</Label>
                  <Input
                    type="email"
                    placeholder="tu@empresa.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-11 font-semibold"
                  disabled={loading}
                >
                  {loading ? <Loader2 size={18} className="mr-2 animate-spin" /> : null}
                  Enviar enlace
                </Button>
              </form>
              <div className="mt-6 pt-5 border-t border-slate-800 text-center">
                <a href="/login" className="text-sm text-slate-400 hover:text-slate-300 flex items-center justify-center gap-1.5 transition-colors">
                  <ArrowLeft size={14} /> Volver al inicio de sesión
                </a>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-slate-600">
          <TrendingUp size={12} />
          CRM Pro · Plataforma Comercial Empresarial
        </div>
      </div>
    </div>
  );
}
