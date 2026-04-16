import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, TrendingUp, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim()) { toast.error("El nombre de la empresa es requerido"); return; }
    if (!name.trim()) { toast.error("Tu nombre es requerido"); return; }
    if (!email.trim()) { toast.error("El email es requerido"); return; }
    if (!password) { toast.error("La contraseña es requerida"); return; }
    if (password.length < 8) { toast.error("La contraseña debe tener al menos 8 caracteres"); return; }
    if (password !== confirmPassword) { toast.error("Las contraseñas no coinciden"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, name, email, password, confirmPassword }),
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        toast.success("¡Cuenta creada exitosamente!");
        window.location.href = "/";
      } else {
        toast.error(data.error || "Error al crear la cuenta");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center font-bold text-white text-xl shadow-2xl shadow-indigo-500/40 mb-4">
            CR
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">CRM Pro</h1>
          <p className="text-slate-400 text-sm mt-1">Plataforma Comercial</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-1">Crear cuenta</h2>
          <p className="text-slate-400 text-sm mb-6">Registra tu empresa y empieza gratis</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Nombre de la empresa *</Label>
              <Input
                type="text"
                placeholder="Mi Empresa S.A."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                autoComplete="organization"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Tu nombre *</Label>
              <Input
                type="text"
                placeholder="Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                autoComplete="name"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Email *</Label>
              <Input
                type="email"
                placeholder="juan@miempresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Contraseña * (mín. 8 caracteres)</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Confirmar contraseña *</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-11 text-base font-semibold shadow-lg shadow-indigo-500/25 mt-2"
              disabled={loading}
            >
              {loading ? <Loader2 size={18} className="mr-2 animate-spin" /> : null}
              Crear cuenta gratis
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-xs text-slate-500 text-center">
              ¿Ya tienes cuenta?{" "}
              <a href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
                Iniciar sesión
              </a>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-slate-600">
          <TrendingUp size={12} />
          CRM Pro · Plataforma Comercial Empresarial
        </div>
      </div>
    </div>
  );
}
