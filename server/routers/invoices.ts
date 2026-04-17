import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

const invoiceItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().min(0.01),
  unitPrice: z.number().min(0),
  discount: z.number().min(0).max(100).default(0),
  productId: z.number().optional(),
});

export const invoicesRouter = router({
  list: protectedProcedure
    .input(z.object({
      limit: z.number().default(20),
      offset: z.number().default(0),
      status: z.enum(["borrador", "emitida", "pagada", "vencida", "anulada"]).optional(),
    }))
    .query(async ({ ctx, input }) => db.getInvoicesList(ctx.user.organizationId, input)),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => db.getInvoiceById(ctx.user.organizationId, input.id)),

  create: protectedProcedure
    .input(z.object({
      quotationId: z.number().optional(),
      opportunityId: z.number().optional(),
      contactId: z.number().optional(),
      companyId: z.number().optional(),
      dueDate: z.string().optional(),
      taxRate: z.number().min(0).max(100).default(19),
      notes: z.string().optional(),
      terms: z.string().optional(),
      items: z.array(invoiceItemSchema).min(1),
    }))
    .mutation(async ({ ctx, input }) =>
      db.createInvoice(ctx.user.organizationId, ctx.user.id, input)
    ),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["borrador", "emitida", "pagada", "vencida", "anulada"]).optional(),
      dueDate: z.string().optional(),
      notes: z.string().optional(),
      terms: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return db.updateInvoice(ctx.user.organizationId, id, data as any);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) =>
      db.deleteInvoice(ctx.user.organizationId, input.id)
    ),

  addPayment: protectedProcedure
    .input(z.object({
      invoiceId: z.number(),
      amount: z.number().min(0.01),
      method: z.enum(["efectivo", "transferencia", "tarjeta", "cheque", "otro"]),
      reference: z.string().optional(),
      notes: z.string().optional(),
      paymentDate: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) =>
      db.createPayment(ctx.user.organizationId, ctx.user.id, input)
    ),

  getPayments: protectedProcedure
    .input(z.object({ invoiceId: z.number() }))
    .query(async ({ ctx, input }) =>
      db.getPaymentsByInvoice(ctx.user.organizationId, input.invoiceId)
    ),

  exportPDF: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const invoice = await db.getInvoiceById(ctx.user.organizationId, input.id);
      if (!invoice) throw new Error("Factura no encontrada");
      const html = generateInvoiceHTML(invoice);
      return { success: true, html, filename: `${invoice.number}.html` };
    }),
});

function generateInvoiceHTML(invoice: any): string {
  const statusColors: Record<string, string> = {
    borrador: "#94a3b8",
    emitida: "#3b82f6",
    pagada: "#10b981",
    vencida: "#ef4444",
    anulada: "#6b7280",
  };
  const statusLabels: Record<string, string> = {
    borrador: "Borrador",
    emitida: "Emitida",
    pagada: "Pagada",
    vencida: "Vencida",
    anulada: "Anulada",
  };

  const itemsHTML = (invoice.items || []).map((item: any) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9">${item.description}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:center">${item.quantity}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:right">$${Number(item.unitPrice).toLocaleString("es-CO")}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:center">${item.discount}%</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600">$${Number(item.total).toLocaleString("es-CO")}</td>
    </tr>
  `).join("");

  const paymentsHTML = (invoice.payments || []).length > 0 ? `
    <div style="margin-top:32px">
      <h3 style="font-size:14px;font-weight:600;color:#374151;margin-bottom:12px">Pagos Registrados</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="background:#f8fafc">
            <th style="padding:8px 12px;text-align:left;color:#64748b">Fecha</th>
            <th style="padding:8px 12px;text-align:left;color:#64748b">Método</th>
            <th style="padding:8px 12px;text-align:left;color:#64748b">Referencia</th>
            <th style="padding:8px 12px;text-align:right;color:#64748b">Monto</th>
          </tr>
        </thead>
        <tbody>
          ${(invoice.payments || []).map((p: any) => `
            <tr>
              <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9">${p.paymentDate}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-transform:capitalize">${p.method}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9">${p.reference || "-"}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;color:#10b981;font-weight:600">$${Number(p.amount).toLocaleString("es-CO")}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  ` : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Factura ${invoice.number}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:#1e293b; background:#f8fafc; }
    .page { max-width:800px; margin:0 auto; background:white; padding:48px; }
    @media print { body { background:white; } .page { padding:32px; } }
  </style>
</head>
<body>
<div class="page">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px">
    <div>
      <div style="width:48px;height:48px;background:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:12px;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:18px;margin-bottom:12px">CR</div>
      <h1 style="font-size:24px;font-weight:700;color:#0f172a">CRM Pro</h1>
      <p style="color:#64748b;font-size:13px">Plataforma Comercial</p>
    </div>
    <div style="text-align:right">
      <div style="font-size:28px;font-weight:700;color:#0f172a">${invoice.number}</div>
      <div style="display:inline-block;margin-top:8px;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;color:white;background:${statusColors[invoice.status] || "#64748b"}">${statusLabels[invoice.status] || invoice.status}</div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:32px;padding:24px;background:#f8fafc;border-radius:12px">
    <div>
      <p style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Fecha de Emisión</p>
      <p style="font-weight:600;color:#0f172a">${invoice.issueDate}</p>
    </div>
    <div>
      <p style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Fecha de Vencimiento</p>
      <p style="font-weight:600;color:#0f172a">${invoice.dueDate || "Sin vencimiento"}</p>
    </div>
  </div>

  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px">
    <thead>
      <tr style="background:#f8fafc">
        <th style="padding:12px;text-align:left;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase">Descripción</th>
        <th style="padding:12px;text-align:center;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase">Cant.</th>
        <th style="padding:12px;text-align:right;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase">Precio</th>
        <th style="padding:12px;text-align:center;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase">Desc.</th>
        <th style="padding:12px;text-align:right;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase">Total</th>
      </tr>
    </thead>
    <tbody>${itemsHTML}</tbody>
  </table>

  <div style="display:flex;justify-content:flex-end;margin-bottom:32px">
    <div style="width:280px">
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px">
        <span style="color:#64748b">Subtotal</span>
        <span style="font-weight:600">$${Number(invoice.subtotal).toLocaleString("es-CO")}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px">
        <span style="color:#64748b">IVA (${invoice.taxRate}%)</span>
        <span style="font-weight:600">$${Number(invoice.tax).toLocaleString("es-CO")}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:12px 0;font-size:16px;font-weight:700">
        <span>Total</span>
        <span style="color:#3b82f6">$${Number(invoice.total).toLocaleString("es-CO")}</span>
      </div>
      ${invoice.paidAmount > 0 ? `
      <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:14px">
        <span style="color:#10b981">Pagado</span>
        <span style="color:#10b981;font-weight:600">$${Number(invoice.paidAmount).toLocaleString("es-CO")}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:14px;font-weight:700">
        <span style="color:#ef4444">Saldo Pendiente</span>
        <span style="color:#ef4444">$${Math.max(0, Number(invoice.total) - Number(invoice.paidAmount)).toLocaleString("es-CO")}</span>
      </div>
      ` : ""}
    </div>
  </div>

  ${invoice.notes ? `<div style="padding:16px;background:#f8fafc;border-radius:8px;margin-bottom:16px"><p style="font-size:12px;font-weight:600;color:#64748b;margin-bottom:4px">NOTAS</p><p style="font-size:13px;color:#374151">${invoice.notes}</p></div>` : ""}
  ${invoice.terms ? `<div style="padding:16px;background:#f8fafc;border-radius:8px;margin-bottom:16px"><p style="font-size:12px;font-weight:600;color:#64748b;margin-bottom:4px">TÉRMINOS Y CONDICIONES</p><p style="font-size:13px;color:#374151">${invoice.terms}</p></div>` : ""}

  ${paymentsHTML}

  <div style="margin-top:40px;padding-top:24px;border-top:1px solid #f1f5f9;text-align:center;color:#94a3b8;font-size:12px">
    CRM Pro · Plataforma Comercial Empresarial
  </div>
</div>
</body>
</html>`;
}
