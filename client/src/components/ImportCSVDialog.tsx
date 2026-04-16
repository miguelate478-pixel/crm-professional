import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Download } from "lucide-react";
import { parseLeadsCSV, type ParsedCSVRow } from "@/lib/export";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ImportCSVDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportCSVDialog({ open, onClose, onSuccess }: ImportCSVDialogProps) {
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [parsed, setParsed] = useState<ParsedCSVRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [imported, setImported] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const createLead = trpc.leads.create.useMutation();

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { data, errors } = parseLeadsCSV(text);
      setParsed(data);
      setErrors(errors);
      setStep("preview");
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".csv") || file.type === "text/csv")) {
      handleFile(file);
    } else {
      toast.error("Solo se aceptan archivos CSV");
    }
  };

  const handleImport = async () => {
    setStep("importing");
    let count = 0;
    for (const row of parsed) {
      try {
        await createLead.mutateAsync({
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          phone: row.phone,
          company: row.company,
          jobTitle: row.jobTitle,
          source: row.source,
          notes: row.notes,
          status: "nuevo",
        });
        count++;
        setImported(count);
      } catch {
        // continue on error
      }
    }
    setStep("done");
    setImported(count);
  };

  const handleClose = () => {
    if (step === "done") onSuccess();
    setStep("upload");
    setParsed([]);
    setErrors([]);
    setImported(0);
    onClose();
  };

  const downloadTemplate = () => {
    const csv = "Nombre,Apellido,Email,Telefono,Empresa,Cargo,Fuente,Notas\nJuan,García,juan@empresa.com,+57 300 000 0000,Tech Solutions,CEO,Sitio Web,Interesado en producto A";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Leads desde CSV</DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4 py-2">
            <div
              className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/5 transition-colors"
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={36} className="mx-auto text-muted-foreground/50 mb-3" />
              <p className="font-medium">Arrastra tu archivo CSV aquí</p>
              <p className="text-sm text-muted-foreground mt-1">o haz clic para seleccionar</p>
              <p className="text-xs text-muted-foreground mt-3">Formatos: .csv · Máximo 5,000 filas</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText size={15} />
                <span>¿No tienes el formato correcto?</span>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download size={13} className="mr-1.5" /> Descargar plantilla
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle size={16} />
                <span className="text-sm font-medium">{parsed.length} leads listos para importar</span>
              </div>
              {errors.length > 0 && (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle size={16} />
                  <span className="text-sm">{errors.length} filas con errores (se omitirán)</span>
                </div>
              )}
            </div>

            {errors.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3 max-h-24 overflow-y-auto">
                {errors.map((e, i) => (
                  <p key={i} className="text-xs text-amber-700 dark:text-amber-400">{e}</p>
                ))}
              </div>
            )}

            <div className="border border-border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    {["Nombre", "Email", "Teléfono", "Empresa", "Fuente"].map(h => (
                      <th key={h} className="text-left py-2 px-3 font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.slice(0, 50).map((row, i) => (
                    <tr key={i} className="border-t border-border/30 hover:bg-muted/20">
                      <td className="py-2 px-3">{row.firstName} {row.lastName}</td>
                      <td className="py-2 px-3 text-muted-foreground">{row.email || "—"}</td>
                      <td className="py-2 px-3 text-muted-foreground">{row.phone || "—"}</td>
                      <td className="py-2 px-3 text-muted-foreground">{row.company || "—"}</td>
                      <td className="py-2 px-3 text-muted-foreground">{row.source || "—"}</td>
                    </tr>
                  ))}
                  {parsed.length > 50 && (
                    <tr className="border-t border-border/30">
                      <td colSpan={5} className="py-2 px-3 text-center text-muted-foreground">
                        ... y {parsed.length - 50} más
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="py-10 text-center space-y-4">
            <Loader2 size={40} className="mx-auto animate-spin text-blue-500" />
            <div>
              <p className="font-medium">Importando leads...</p>
              <p className="text-sm text-muted-foreground mt-1">{imported} de {parsed.length} procesados</p>
            </div>
            <div className="w-full bg-muted rounded-full h-2 max-w-xs mx-auto overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${parsed.length > 0 ? (imported / parsed.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="py-10 text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={32} className="text-emerald-500" />
            </div>
            <p className="text-lg font-semibold">¡Importación completada!</p>
            <p className="text-muted-foreground">{imported} leads importados exitosamente</p>
          </div>
        )}

        <DialogFooter>
          {step === "upload" && (
            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")}>Volver</Button>
              <Button
                className="bg-gradient-to-r from-blue-600 to-indigo-600"
                onClick={handleImport}
                disabled={parsed.length === 0}
              >
                <Upload size={14} className="mr-1.5" /> Importar {parsed.length} leads
              </Button>
            </>
          )}
          {step === "done" && (
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600" onClick={handleClose}>
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
