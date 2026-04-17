import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import {
  BarChart3, CheckSquare, ChevronLeft, ChevronRight,
  FileText, LayoutDashboard, LogOut, Moon, Settings, Sun,
  Target, Users, Building2, Bell, Search, TrendingUp, Trophy,
  User, DollarSign, AlertCircle, Clock, Package, Menu, Inbox, Video, Zap, MessageCircle, Mail, Phone,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

interface CRMLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { label: "Dashboard",    path: "/dashboard",    icon: LayoutDashboard, group: "principal" },
  { label: "Cola de Trabajo", path: "/workqueue", icon: Inbox,           group: "principal" },
  { label: "Leads",        path: "/leads",        icon: Users,           group: "comercial" },
  { label: "Contactos",    path: "/contacts",     icon: Building2,       group: "comercial" },
  { label: "Empresas",     path: "/companies",    icon: Building2,       group: "comercial" },
  { label: "Oportunidades",path: "/opportunities",icon: Target,          group: "comercial" },
  { label: "Tareas",       path: "/tasks",        icon: CheckSquare,     group: "actividad" },
  { label: "Reuniones",    path: "/meetings",     icon: Video,           group: "actividad" },
  { label: "Llamadas",     path: "/calls",        icon: Phone,           group: "actividad" },
  { label: "WhatsApp",     path: "/whatsapp",     icon: MessageCircle,   group: "actividad" },
  { label: "Gmail",        path: "/gmail",        icon: Mail,            group: "actividad" },
  { label: "Cotizaciones", path: "/quotes",       icon: FileText,        group: "actividad" },
  { label: "Productos",    path: "/products",     icon: Package,         group: "actividad" },
  { label: "Inventario",   path: "/inventory",    icon: Package,         group: "actividad" },
  { label: "Facturas",     path: "/invoices",     icon: DollarSign,      group: "actividad" },
  { label: "Metas",        path: "/goals",        icon: Trophy,          group: "analítica" },
  { label: "Informes",     path: "/reports",      icon: BarChart3,       group: "analítica" },
  { label: "Análisis",     path: "/analytics",    icon: TrendingUp,      group: "analítica" },
  { label: "Automatizaciones", path: "/automations", icon: Zap,          group: "analítica" },
  { label: "Integraciones",path: "/integrations", icon: Zap,             group: "sistema" },
  { label: "Configuración",path: "/settings",     icon: Settings,        group: "sistema" },
];

const groups = [
  { key: "principal", label: null },
  { key: "comercial", label: "COMERCIAL" },
  { key: "actividad", label: "ACTIVIDAD" },
  { key: "analítica", label: "ANALÍTICA" },
  { key: "sistema", label: "SISTEMA" },
];

// ── Global Search ──────────────────────────────────────────────────────────────

function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data } = trpc.search.global.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length >= 1 }
  );

  const hasResults = data && (
    data.leads.length > 0 || data.contacts.length > 0 || data.opportunities.length > 0
  );

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (path: string) => {
    navigate(path);
    setQuery("");
    setDebouncedQuery("");
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Buscar leads, contactos, oportunidades..."
        className="pl-9 h-9 bg-muted/50 border-0 text-sm focus-visible:ring-1"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />

      {open && debouncedQuery && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          {!hasResults ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Sin resultados para "{debouncedQuery}"
            </div>
          ) : (
            <div className="py-1.5 max-h-80 overflow-y-auto">
              {data!.leads.length > 0 && (
                <div>
                  <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Leads</p>
                  {data!.leads.map(l => (
                    <button
                      key={l.id}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/60 transition-colors text-left"
                      onClick={() => handleSelect(`/leads/${l.id}`)}
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                        {l.firstName.charAt(0)}{l.lastName?.charAt(0) ?? ""}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{l.firstName} {l.lastName}</p>
                        {l.email && <p className="text-xs text-muted-foreground truncate">{l.email}</p>}
                      </div>
                      <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded-full flex-shrink-0">Lead</span>
                    </button>
                  ))}
                </div>
              )}
              {data!.contacts.length > 0 && (
                <div>
                  <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Contactos</p>
                  {data!.contacts.map(c => (
                    <button
                      key={c.id}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/60 transition-colors text-left"
                      onClick={() => handleSelect(`/contacts`)}
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                        {c.firstName.charAt(0)}{c.lastName?.charAt(0) ?? ""}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.firstName} {c.lastName}</p>
                        {c.email && <p className="text-xs text-muted-foreground truncate">{c.email}</p>}
                      </div>
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-full flex-shrink-0">Contacto</span>
                    </button>
                  ))}
                </div>
              )}
              {data!.opportunities.length > 0 && (
                <div>
                  <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Oportunidades</p>
                  {data!.opportunities.map(o => (
                    <button
                      key={o.id}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/60 transition-colors text-left"
                      onClick={() => handleSelect(`/opportunities/${o.id}`)}
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white flex-shrink-0">
                        <DollarSign size={12} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{o.name}</p>
                        {o.amount != null && <p className="text-xs text-muted-foreground">${Number(o.amount).toLocaleString()}</p>}
                      </div>
                      <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-full flex-shrink-0">Oportunidad</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Notifications Bell ─────────────────────────────────────────────────────────

function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);

  const { data } = trpc.notifications.get.useQuery(undefined, {
    refetchInterval: 60_000,
  });

  const total = data?.total ?? 0;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        className="relative p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(v => !v)}
      >
        <Bell size={18} />
        {total > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-80 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="font-semibold text-sm">Notificaciones</p>
            {total > 0 && <p className="text-xs text-muted-foreground mt-0.5">{total} elemento{total !== 1 ? "s" : ""} requieren atención</p>}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {total === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                <Bell size={24} className="mx-auto mb-2 opacity-30" />
                Sin notificaciones pendientes
              </div>
            ) : (
              <>
                {(data?.overdueTasks ?? []).length > 0 && (
                  <div>
                    <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest bg-muted/30">Tareas vencidas</p>
                    {data!.overdueTasks.map(t => (
                      <button
                        key={t.id}
                        className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-muted/60 transition-colors text-left"
                        onClick={() => { navigate("/tasks"); setOpen(false); }}
                      >
                        <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <AlertCircle size={13} className="text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{t.title}</p>
                          {t.dueDate && (
                            <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
                              <Clock size={10} /> Venció: {t.dueDate}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {(data?.staleOpps ?? []).length > 0 && (
                  <div>
                    <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest bg-muted/30">Oportunidades estancadas</p>
                    {data!.staleOpps.map(o => (
                      <button
                        key={o.id}
                        className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-muted/60 transition-colors text-left"
                        onClick={() => { navigate(`/opportunities/${o.id}`); setOpen(false); }}
                      >
                        <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <AlertCircle size={13} className="text-amber-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{o.name}</p>
                          <p className="text-xs text-amber-500 flex items-center gap-1 mt-0.5">
                            <Clock size={10} /> Sin actividad hace +7 días
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Layout ─────────────────────────────────────────────────────────────────────

export default function CRMLayout({ children }: CRMLayoutProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location, navigate] = useLocation();

  const isActive = (path: string) =>
    location === path || (path === "/dashboard" && location === "/");

  const handleLogout = async () => { await logout(); };
  const handleNav = (path: string) => { navigate(path); setMobileOpen(false); };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          ${collapsed ? "w-[72px]" : "w-64"} 
          flex-shrink-0 bg-slate-950 text-white flex flex-col border-r border-slate-800/60 
          transition-all duration-300 ease-in-out
          fixed lg:relative inset-y-0 left-0 z-50
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className={`h-16 flex items-center border-b border-slate-800/60 ${collapsed ? "justify-center px-0" : "px-5 justify-between"}`}>
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-lg shadow-indigo-500/30">
                CR
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-white">CRM Pro</span>
                <p className="text-[10px] text-slate-400 leading-none mt-0.5">Plataforma Comercial</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-lg shadow-indigo-500/30">
              CR
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5 scrollbar-thin">
          {groups.map(({ key, label }) => {
            const items = navigationItems.filter(i => i.group === key);
            if (!items.length) return null;
            return (
              <div key={key}>
                {label && !collapsed && (
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-1.5">
                    {label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <button
                        key={item.path}
                        onClick={() => handleNav(item.path)}
                        title={collapsed ? item.label : undefined}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 relative cursor-pointer ${
                          active
                            ? "bg-gradient-to-r from-blue-600/90 to-indigo-600/90 text-white shadow-md shadow-indigo-500/20"
                            : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                        } ${collapsed ? "justify-center" : ""}`}
                      >
                        <Icon size={18} className={`flex-shrink-0 ${active ? "text-white" : ""}`} />
                        {!collapsed && (
                          <span className="text-sm font-medium">{item.label}</span>
                        )}
                        {active && !collapsed && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800/60 space-y-2">
          {!collapsed && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-900/50">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name || "Usuario"}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email || ""}</p>
              </div>
            </div>
          )}
          <div className={`flex gap-1 ${collapsed ? "flex-col" : ""}`}>
            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
              className="flex-1 flex items-center justify-center p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="flex-1 flex items-center justify-center p-2 hover:bg-red-900/30 rounded-lg transition-colors text-slate-400 hover:text-red-400"
            >
              <LogOut size={16} />
            </button>
            {collapsed && (
              <button
                onClick={() => setCollapsed(false)}
                className="flex items-center justify-center p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Top bar */}
        <header className="h-16 bg-background/95 backdrop-blur border-b border-border flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground mr-1"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={18} />
            </button>
            <GlobalSearch />
          </div>
          <div className="flex items-center gap-3">
            <NotificationsBell />
            <div className="flex items-center gap-2 pl-3 border-l border-border">
              <button
                onClick={() => navigate("/profile")}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium leading-none">{user?.name || "Usuario"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {user?.role === "admin" ? "Administrador" : "Vendedor"}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
