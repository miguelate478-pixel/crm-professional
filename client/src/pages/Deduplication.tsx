import CRMLayout from "@/components/CRMLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Merge, Loader2, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { useConfirm } from "@/components/ui/confirm-dialog";

export default function DeduplicationPage() {
  const { data: duplicates, isLoading: duplicatesLoading, refetch: refetchDuplicates } = trpc.deduplication.findDuplicates.useQuery({ threshold: 85 });
  const { data: stats, isLoading: statsLoading } = trpc.deduplication.getStats.useQuery();
  const { confirm } = useConfirm();

  const merge = trpc.deduplication.mergeDuplicates.useMutation({
    onSuccess: () => {
      toast.success("Leads fusionados correctamente");
      refetchDuplicates();
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const handleMerge = async (primaryId: number, secondaryId: number) => {
    const ok = await confirm({
      title: "¿Fusionar leads?",
      description: "El lead secundario será eliminado y sus datos se combinarán con el primario.",
      confirmText: "Fusionar",
      variant: "destructive",
    });
    if (ok) {
      merge.mutate({ primaryLeadId: primaryId, secondaryLeadId: secondaryId });
    }
  };

  return (
    <CRMLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Deduplicación de Leads</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Detecta y fusiona leads duplicados automáticamente
            </p>
          </div>
          <Button 
            onClick={() => refetchDuplicates()} 
            disabled={duplicatesLoading}
            variant="outline"
          >
            {duplicatesLoading && <Loader2 size={14} className="mr-2 animate-spin" />}
            Buscar Duplicados
          </Button>
        </div>

        {/* Stats */}
        {statsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-muted-foreground" />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-border/50">
              <CardContent className="p-6">
                <p className="text-muted-foreground text-sm">Total de Leads</p>
                <p className="text-3xl font-bold mt-1">{stats.totalLeads}</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 border-amber-200 dark:border-amber-800">
              <CardContent className="p-6">
                <p className="text-muted-foreground text-sm">Duplicados Potenciales</p>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.potentialDuplicates}</p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-6">
                <p className="text-muted-foreground text-sm">Grupos de Duplicados</p>
                <p className="text-3xl font-bold mt-1">{stats.duplicateGroups}</p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Duplicates List */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Leads Duplicados Detectados</CardTitle>
          </CardHeader>
          <CardContent>
            {duplicatesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={32} className="animate-spin text-muted-foreground" />
              </div>
            ) : duplicates && duplicates.length > 0 ? (
              <div className="space-y-3">
                {duplicates.map((dup: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle size={16} className="text-amber-600" />
                          <span className="font-semibold text-sm">Similitud: {dup.similarity}%</span>
                          <Badge variant="outline" className="text-amber-600">{dup.reason}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Lead #{dup.lead1Id} ↔ Lead #{dup.lead2Id}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleMerge(dup.lead1Id, dup.lead2Id)}
                        disabled={merge.isPending}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600"
                      >
                        {merge.isPending && <Loader2 size={12} className="mr-1 animate-spin" />}
                        <Merge size={14} className="mr-1" />
                        Fusionar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle size={40} className="mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No se encontraron duplicados</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="border-border/50 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">¿Cómo funciona la deduplicación?</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Detecta emails idénticos</li>
              <li>• Detecta teléfonos idénticos</li>
              <li>• Compara nombres y empresas con similitud ≥85%</li>
              <li>• Fusiona datos combinando información más completa</li>
              <li>• Mantiene historial de fusiones en notas</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </CRMLayout>
  );
}
