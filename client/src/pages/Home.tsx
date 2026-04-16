import { Button } from "@/components/ui/button";
import { BarChart3, Target, Users, CheckSquare, TrendingUp, Shield } from "lucide-react";

export default function Home() {
  const handleLogin = () => {
    window.location.href = "/api/dev-login";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="px-8 py-5 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-sm shadow-lg shadow-indigo-500/30">
            CR
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight">CRM Pro</span>
            <p className="text-[10px] text-slate-400 leading-none">Plataforma Comercial</p>
          </div>
        </div>
        <Button
          onClick={handleLogin}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          Iniciar Sesión
        </Button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 text-center py-20">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-sm text-blue-400 mb-8">
          <TrendingUp size={14} />
          CRM de nivel empresarial
        </div>

        <h1 className="text-5xl md:text-6xl font-bold tracking-tight max-w-3xl leading-tight">
          Gestión comercial{" "}
          <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            superior a Zoho CRM
          </span>
        </h1>

        <p className="text-slate-400 text-lg mt-6 max-w-xl leading-relaxed">
          Plataforma CRM moderna, rápida y elegante. Gestiona leads, oportunidades, 
          cotizaciones y reportes desde un solo lugar.
        </p>

        <div className="flex items-center gap-4 mt-10">
          <Button
            onClick={handleLogin}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-base px-8 h-12 shadow-lg shadow-indigo-500/25"
          >
            Acceder al CRM
          </Button>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-20 max-w-3xl w-full">
          {[
            { icon: Users, label: "Gestión de Leads", desc: "Captura, califica y convierte prospectos" },
            { icon: Target, label: "Pipeline Visual", desc: "Kanban drag & drop por etapas" },
            { icon: BarChart3, label: "Reportes Ejecutivos", desc: "Dashboards con métricas en tiempo real" },
            { icon: CheckSquare, label: "Tareas y Agenda", desc: "Calendario integrado con recordatorios" },
            { icon: TrendingUp, label: "Cotizaciones", desc: "Propuestas profesionales con PDF" },
            { icon: Shield, label: "Multi-empresa", desc: "Roles, permisos y auditoría completa" },
          ].map((f) => (
            <div key={f.label} className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-5 text-left hover:border-slate-700 transition-colors">
              <f.icon size={20} className="text-blue-400 mb-3" />
              <p className="font-semibold text-sm">{f.label}</p>
              <p className="text-xs text-slate-400 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-slate-600 border-t border-slate-800/40">
        CRM Pro · Plataforma Comercial Empresarial
      </footer>
    </div>
  );
}
