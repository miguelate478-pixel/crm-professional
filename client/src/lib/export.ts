/**
 * Export utilities — Excel and CSV
 */

// ── CSV Export ────────────────────────────────────────────────────────────────

export function exportToCSV(data: Record<string, any>[], filename: string) {
  if (!data.length) return;

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h] ?? "";
        const str = String(val).replace(/"/g, '""');
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str}"`
          : str;
      }).join(",")
    ),
  ];

  const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Excel Export (simple HTML table trick — works without xlsx lib) ───────────

export function exportToExcel(data: Record<string, any>[], filename: string, sheetName = "Datos") {
  if (!data.length) return;

  const headers = Object.keys(data[0]);

  let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="UTF-8"></head>
<body><table>
<tr>${headers.map(h => `<th style="background:#3B82F6;color:white;font-weight:bold;padding:8px">${h}</th>`).join("")}</tr>
${data.map(row =>
    `<tr>${headers.map(h => `<td style="padding:6px;border:1px solid #e2e8f0">${row[h] ?? ""}</td>`).join("")}</tr>`
  ).join("")}
</table></body></html>`;

  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── CSV Import parser ─────────────────────────────────────────────────────────

export interface ParsedCSVRow {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  source?: string;
  notes?: string;
}

export function parseLeadsCSV(text: string): { data: ParsedCSVRow[]; errors: string[] } {
  const lines = text.trim().split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return { data: [], errors: ["El archivo está vacío o no tiene datos"] };

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/['"]/g, ""));
  const errors: string[] = [];
  const data: ParsedCSVRow[] = [];

  // Map common header variations
  const headerMap: Record<string, string> = {
    nombre: "firstName", "first name": "firstName", firstname: "firstName", "primer nombre": "firstName",
    apellido: "lastName", "last name": "lastName", lastname: "lastName",
    email: "email", correo: "email", "correo electrónico": "email",
    telefono: "phone", teléfono: "phone", phone: "phone", celular: "phone", móvil: "phone",
    empresa: "company", company: "company", organización: "company",
    cargo: "jobTitle", "job title": "jobTitle", puesto: "jobTitle",
    fuente: "source", source: "source", canal: "source",
    notas: "notes", notes: "notes", comentarios: "notes",
  };

  const mappedHeaders = headers.map(h => headerMap[h] || h);

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: any = {};

    mappedHeaders.forEach((key, idx) => {
      row[key] = values[idx]?.trim() || undefined;
    });

    if (!row.firstName) {
      errors.push(`Fila ${i + 1}: Nombre requerido`);
      continue;
    }

    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      errors.push(`Fila ${i + 1}: Email inválido (${row.email})`);
      row.email = undefined;
    }

    data.push(row as ParsedCSVRow);
  }

  return { data, errors };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
