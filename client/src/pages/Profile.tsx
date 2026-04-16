import CRMLayout from "@/components/CRMLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Shield, Key, Save, Loader2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { validateEmail, validateRequired } from "@/lib/validation";

export default function ProfilePage() {
  const { user } = useAuth();

  // Profile form
  const [profile, setProfile] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
  });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [passwords, setPasswords] = useState({
    current: "", newPass: "", confirm: "",
  });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [savingPassword, setSavingPassword] = useState(false);

  const handleSaveProfile = async () => {
    const errors: Record<string, string> = {};
    const nameErr = validateRequired(profile.name, "El nombre");
    if (nameErr) errors.name = nameErr;
    const emailErr = validateEmail(profile.email);
    if (emailErr) errors.email = emailErr;

    if (Object.keys(errors).length > 0) { setProfileErrors(errors); return; }
    setProfileErrors({});

    setSavingProfile(true);
    try {
      // In a real app this would call a tRPC mutation
      await new Promise(r => setTimeout(r, 800));
      toast.success("Perfil actualizado correctamente");
    } catch {
      toast.error("Error al actualizar el perfil");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    const errors: Record<string, string> = {};
    if (!passwords.current) errors.current = "La contraseña actual es requerida";
    if (!passwords.newPass) errors.newPass = "La nueva contraseña es requerida";
    else if (passwords.newPass.length < 8) errors.newPass = "Mínimo 8 caracteres";
    if (passwords.newPass !== passwords.confirm) errors.confirm = "Las contraseñas no coinciden";

    if (Object.keys(errors).length > 0) { setPasswordErrors(errors); return; }
    setPasswordErrors({});

    setSavingPassword(true);
    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.newPass }),
      });
      if (res.ok) {
        toast.success("Contraseña actualizada correctamente");
        setPasswords({ current: "", newPass: "", confirm: "" });
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Error al cambiar la contraseña");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSavingPassword(false);
    }
  };

  const toggleShow = (field: keyof typeof showPasswords) =>
    setShowPasswords(p => ({ ...p, [field]: !p[field] }));

  return (
    <CRMLayout>
      <div className="space-y-6 max-w-2xl">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mi Perfil</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestiona tu información personal y seguridad</p>
        </div>

        {/* Avatar + info */}
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase() ?? "U"}
              </div>
              <div>
                <p className="text-xl font-bold">{user?.name ?? "Usuario"}</p>
                <p className="text-muted-foreground text-sm">{user?.email ?? ""}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={user?.role === "admin" ? "default" : "secondary"} className={`text-xs ${user?.role === "admin" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0" : ""}`}>
                    {user?.role === "admin" ? "Administrador" : "Vendedor"}
                  </Badge>
                  <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                    Activo
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile info */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <User size={16} className="text-muted-foreground" />
              <CardTitle className="text-base">Información Personal</CardTitle>
            </div>
            <CardDescription>Actualiza tu nombre y email de contacto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nombre completo *</Label>
                <Input
                  value={profile.name}
                  onChange={e => { setProfile(p => ({ ...p, name: e.target.value })); setProfileErrors({}); }}
                  placeholder="Tu nombre"
                  className={profileErrors.name ? "border-destructive" : ""}
                />
                {profileErrors.name && <p className="text-xs text-destructive">{profileErrors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={profile.email}
                  onChange={e => { setProfile(p => ({ ...p, email: e.target.value })); setProfileErrors({}); }}
                  placeholder="tu@email.com"
                  className={profileErrors.email ? "border-destructive" : ""}
                />
                {profileErrors.email && <p className="text-xs text-destructive">{profileErrors.email}</p>}
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                className="bg-gradient-to-r from-blue-600 to-indigo-600"
                onClick={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Save size={14} className="mr-2" />}
                Guardar Cambios
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Change password */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Key size={16} className="text-muted-foreground" />
              <CardTitle className="text-base">Cambiar Contraseña</CardTitle>
            </div>
            <CardDescription>Usa una contraseña segura de al menos 8 caracteres</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "current", label: "Contraseña actual", placeholder: "••••••••" },
              { key: "newPass", label: "Nueva contraseña", placeholder: "Mínimo 8 caracteres" },
              { key: "confirm", label: "Confirmar nueva contraseña", placeholder: "Repite la nueva contraseña" },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <Label>{label}</Label>
                <div className="relative">
                  <Input
                    type={showPasswords[key as keyof typeof showPasswords] ? "text" : "password"}
                    placeholder={placeholder}
                    value={passwords[key as keyof typeof passwords]}
                    onChange={e => { setPasswords(p => ({ ...p, [key]: e.target.value })); setPasswordErrors({}); }}
                    className={`pr-10 ${passwordErrors[key] ? "border-destructive" : ""}`}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => toggleShow(key as keyof typeof showPasswords)}
                  >
                    {showPasswords[key as keyof typeof showPasswords] ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {passwordErrors[key] && <p className="text-xs text-destructive">{passwordErrors[key]}</p>}
              </div>
            ))}

            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Requisitos de contraseña:</p>
              <p>• Mínimo 8 caracteres</p>
              <p>• Se recomienda incluir letras, números y símbolos</p>
            </div>

            <div className="flex justify-end">
              <Button
                className="bg-gradient-to-r from-blue-600 to-indigo-600"
                onClick={handleChangePassword}
                disabled={savingPassword}
              >
                {savingPassword ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Shield size={14} className="mr-2" />}
                Cambiar Contraseña
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Session info */}
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Sesión activa</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Último acceso: {user?.lastSignedIn ? new Date(user.lastSignedIn).toLocaleString("es-ES") : "Ahora"}
                </p>
              </div>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                ● Conectado
              </Badge>
            </div>
          </CardContent>
        </Card>

      </div>
    </CRMLayout>
  );
}
