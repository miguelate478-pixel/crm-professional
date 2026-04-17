import CRMLayout from "@/components/CRMLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Flame, Zap, Snowflake, TrendingUp, RefreshCw, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function LeadScoringPage() {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.leadScoring.getStats.useQuery();
  const { data: hotLeads, isLoading: leadsLoading, refetch: refetchLeads } = trpc.leadScoring.getHotLeads.useQuery({ limit: 10 });
  
  const recalculate = trpc.leadScoring.recalculateAll.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.updated} leads actualizados`);
      refetchStats();
      refetchLeads();
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-red-600 dark:text-red-400";
    if (score >= 40) return "text-amber-600 dark:text-amber-400";
    return "text-blue-600 dark:text-blue-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return "bg-red-100 dark:bg-red-900/20";
    if (score >= 40) return "bg-amber-100 dark:bg-amber-900/20";
    return "bg-blue-100 dark:bg-blue-900/20";
  };

  const getCategory = (score: number) => {
    if (score >= 70) return { label: "Hot", icon: Flame, color: "text-red-600" };
    if (score >= 40) return { label: "Warm", icon: Zap, color: "text-amber-600" };
    return { label: "Cold", icon: Snowflake, color: "text-blue-600" };
  };

  return (
    <CRMLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Scoring Inteligente de Leads</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Sistema automático de puntuación basado en comportamiento y datos
            </p>
          </div>
          <Button 
            onClick={() => recalculate.mutate()} 
            disabled={recalculate.isPending}
            className="bg-gradient-to-r from-blue-600 to-indigo-600"
          >
            {recalculate.isPending && <Loader2 size={14} className="mr-2 animate-spin" />}
            Recalcular Todos
          </Button>
        </div>

        {/* Stats Grid */}
        {statsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-muted-foreground" />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Hot Leads</p>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.hotLeads}</p>
                  </div>
                  <Flame size={32} className="text-red-600 dark:text-red-400 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Warm Leads</p>
                    <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.warmLeads}</p>
                  </div>
                  <Zap size={32} className="text-amber-600 dark:text-amber-400 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Cold Leads</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.coldLeads}</p>
                  </div>
                  <Snowflake size={32} className="text-blue-600 dark:text-blue-400 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Score Promedio</p>
                    <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{stats.averageScore.toFixed(1)}</p>
                  </div>
                  <TrendingUp size={32} className="text-indigo-600 dark:text-indigo-400 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Hot Leads List */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Top 10 Hot Leads</CardTitle>
          </CardHeader>
          <CardContent>
            {leadsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={32} className="animate-spin text-muted-foreground" />
              </div>
            ) : hotLeads && hotLeads.length > 0 ? (
              <div className="space-y-3">
                {hotLeads.map((lead: any) => {
                  const category = getCategory(lead.calculatedScore);
                  const Icon = category.icon;
                  return (
                    <div key={lead.id} className={`p-4 rounded-lg border border-border/50 ${getScoreBg(lead.calculatedScore)}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{lead.firstName} {lead.lastName}</p>
                            <Badge variant="outline" className={category.color}>
                              <Icon size={12} className="mr-1" />
                              {category.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{lead.email || lead.phone || "Sin contacto"}</p>
                          {lead.company && <p className="text-sm text-muted-foreground">{lead.company}</p>}
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${getScoreColor(lead.calculatedScore)}`}>
                            {lead.calculatedScore.toFixed(0)}
                          </p>
                          <Progress value={lead.calculatedScore} className="w-24 mt-2" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Sin hot leads aún</p>
            )}
          </CardContent>
        </Card>

        {/* Scoring Rules Info */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Reglas de Scoring</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Completitud de datos</span>
                <span className="text-sm font-semibold">20%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Fuente del lead</span>
                <span className="text-sm font-semibold">15%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Estado del lead</span>
                <span className="text-sm font-semibold">25%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Recencia de actividad</span>
                <span className="text-sm font-semibold">20%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Empresa y contexto</span>
                <span className="text-sm font-semibold">20%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CRMLayout>
  );
}
