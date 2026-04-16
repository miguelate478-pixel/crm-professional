import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, TrendingUp, Eye, EyeOff, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) { toast.error("La contraseña es requerida"); return; }
    if (password.length < 8) { toast.error("Mínimo 8 caracteres"); return; }
    if (password !== confirm) { toast.error("Las contraseñas no coinciden"); return; }
    if (!token) { toast.error("Token inválido"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDone(true);
      } else {
        toast.error(data.error || "Error al restablecer la contraseña");
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
        </div>

        <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-8 shadow-2xl">
          {done ? (
            <div className="text-center py-4">
              <CheckCircle size={48} className="mx-auto mb-4 text-emerald-500" />
              <h2 className="text-lg font-semibold text-white mb-2">¡Contraseña actualizada!</h2>
              <p className="text-slate-400 text-sm mb-6">Ya puedes iniciar sesión con tu nueva contraseña.</p>
              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600"
                onClick={() => window.location.href = "/login"}
              >
                Ir al inicio de sesión
              </Button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-white mb-1">Nueva contraseña</h2>
              <p className="text-slate-400 text-sm mb-6">Elige una contraseña segura de al menos 8 caracteres.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-sm">Nueva contraseña</Label>
                  <div className="relative">
                    <Input
                      type={showPwd ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 pr-10"
                      autoFocus
                    />
                    <button type="button" onClick={() => setShowPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-sm">Confirmar contraseña</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 h-11 font-semibold"
                  disabled={loading}
                >
                  {loading ? <Loader2 size={18} className="mr-2 animate-spin" /> : null}
                  Guardar contraseña
                </Button>
              </form>
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
