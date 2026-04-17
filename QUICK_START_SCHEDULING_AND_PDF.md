# 🚀 Quick Start - Report Scheduling & PDF Export

## Acceso Rápido

### URLs
```
http://localhost:5173/scheduled-reports    # Gestionar reportes programados
http://localhost:5173/advanced-reports     # Ver reportes con PDF export
```

---

## 📋 Report Scheduling

### Crear un Reporte Programado

1. **Navega a `/scheduled-reports`**
2. Haz clic en "Schedule Report"
3. Completa el formulario:
   - **Report:** Selecciona el reporte (ej: Sales Funnel)
   - **Schedule Name:** Nombre descriptivo (ej: "Weekly Sales Report")
   - **Frequency:** Elige daily, weekly o monthly
   - **Hour:** Hora del día (0-23)
   - **Minute:** Minuto de la hora (0-59)
   - **Recipients:** Emails separados por comas
   - **Format:** CSV o PDF
4. Haz clic en "Create Schedule"

### Gestionar Reportes Programados

**Ver todos los reportes:**
- Navega a `/scheduled-reports`
- Verás una lista de todos los reportes programados

**Información mostrada:**
- Nombre del reporte
- Frecuencia (Daily, Weekly, Monthly)
- Hora de ejecución
- Destinatarios
- Próxima ejecución
- Última ejecución
- Estado (Active/Inactive)

**Acciones disponibles:**
- ▶️ **Play** - Ejecutar test run
- **Enable/Disable** - Activar o desactivar
- 🗑️ **Delete** - Eliminar reporte programado

### Ejemplos de Configuración

#### Ejemplo 1: Reporte Diario
```
Report: Sales Funnel
Name: Daily Sales Funnel
Frequency: Daily
Hour: 09
Minute: 00
Recipients: manager@company.com
Format: PDF
```
→ Se ejecutará todos los días a las 9:00 AM

#### Ejemplo 2: Reporte Semanal
```
Report: Pipeline by Stage
Name: Weekly Pipeline Report
Frequency: Weekly
Day of Week: Monday (1)
Hour: 08
Minute: 30
Recipients: sales@company.com, director@company.com
Format: PDF
```
→ Se ejecutará todos los lunes a las 8:30 AM

#### Ejemplo 3: Reporte Mensual
```
Report: Monthly Revenue
Name: Monthly Revenue Report
Frequency: Monthly
Day of Month: 1
Hour: 10
Minute: 00
Recipients: finance@company.com, cfo@company.com
Format: CSV
```
→ Se ejecutará el 1º de cada mes a las 10:00 AM

---

## 📄 PDF Export

### Exportar un Reporte como PDF

1. **Navega a `/advanced-reports`**
2. Haz clic en "Generate Report" para cualquier reporte
3. Espera a que se carguen los datos
4. En la sección "Generated Reports", verás el reporte
5. Haz clic en el botón **"PDF"**
6. Se abrirá una nueva ventana con el reporte formateado
7. Usa el diálogo de impresión del navegador (Ctrl+P o Cmd+P)
8. Selecciona "Guardar como PDF"
9. Elige la ubicación y guarda

### Características del PDF

- ✅ Encabezado profesional con branding
- ✅ Nombre de la organización
- ✅ Título del reporte
- ✅ Descripción
- ✅ Tipo de gráfico
- ✅ Tabla de datos formateada
- ✅ Fecha y hora de generación
- ✅ Pie de página con copyright
- ✅ Diseño responsive
- ✅ Optimizado para impresión

### Exportar como CSV

1. Navega a `/advanced-reports`
2. Genera un reporte
3. Haz clic en el botón **"CSV"**
4. El archivo se descargará automáticamente
5. Abre en Excel, Google Sheets o cualquier editor de hojas de cálculo

---

## 🔄 Flujo Completo: Crear y Programar un Reporte

### Paso 1: Generar el Reporte
```
1. Ir a /advanced-reports
2. Hacer clic en "Generate Report"
3. Esperar a que se carguen los datos
4. Ver el reporte en los tabs
```

### Paso 2: Exportar como PDF
```
1. Hacer clic en "PDF"
2. Nueva ventana se abre
3. Usar Ctrl+P para imprimir
4. Guardar como PDF
```

### Paso 3: Programar Entregas Automáticas
```
1. Ir a /scheduled-reports
2. Hacer clic en "Schedule Report"
3. Seleccionar el mismo reporte
4. Configurar frecuencia y destinatarios
5. Hacer clic en "Create Schedule"
```

### Resultado
- El reporte se generará automáticamente
- Se enviará a los destinatarios
- En el formato especificado (CSV o PDF)
- En la hora y frecuencia configurada

---

## 💡 Casos de Uso

### Caso 1: Gerente de Ventas
**Objetivo:** Recibir reporte de pipeline cada lunes

```
1. Ir a /scheduled-reports
2. Crear nuevo schedule:
   - Report: Pipeline by Stage
   - Name: Weekly Pipeline
   - Frequency: Weekly (Monday)
   - Hour: 08:00
   - Recipients: manager@company.com
   - Format: PDF
3. Cada lunes a las 8:00 AM recibirá el reporte
```

### Caso 2: Director Financiero
**Objetivo:** Reporte de ingresos mensuales

```
1. Ir a /scheduled-reports
2. Crear nuevo schedule:
   - Report: Monthly Revenue
   - Name: Monthly Revenue Report
   - Frequency: Monthly (Day 1)
   - Hour: 09:00
   - Recipients: cfo@company.com, finance@company.com
   - Format: PDF
3. El 1º de cada mes recibirá el reporte
```

### Caso 3: Analista de Marketing
**Objetivo:** Exportar reporte de fuentes de leads

```
1. Ir a /advanced-reports
2. Generar "Lead Source Analysis"
3. Hacer clic en "CSV"
4. Descargar archivo
5. Abrir en Excel
6. Crear gráficos personalizados
7. Incluir en presentación
```

---

## ⚙️ Configuración Avanzada

### Múltiples Destinatarios
```
Recipients: user1@company.com, user2@company.com, user3@company.com
```
→ El reporte se enviará a los 3 usuarios

### Cambiar Formato
```
Format: CSV  → Datos en Excel
Format: PDF  → Documento formateado
```

### Cambiar Frecuencia
```
Frequency: Daily    → Todos los días
Frequency: Weekly   → Una vez por semana
Frequency: Monthly  → Una vez por mes
```

### Desactivar Temporalmente
```
1. Ir a /scheduled-reports
2. Hacer clic en "Disable"
3. El reporte no se ejecutará
4. Hacer clic en "Enable" para reactivar
```

---

## 🧪 Test Run

### Probar un Reporte Programado

1. Ir a `/scheduled-reports`
2. Encontrar el reporte
3. Hacer clic en el botón ▶️ (Play)
4. Se ejecutará inmediatamente
5. Verás un mensaje confirmando

**Útil para:**
- Verificar que el reporte funciona
- Probar antes de programar
- Verificar destinatarios
- Validar formato

---

## 📊 Monitoreo

### Ver Estado de Reportes Programados

En `/scheduled-reports` verás:
- ✅ **Active/Inactive** - Estado del reporte
- 🕐 **Next Run** - Próxima ejecución
- ⏱️ **Last Run** - Última ejecución
- 📧 **Recipients** - Destinatarios

### Información Útil

```
Next Run: 2026-04-17 09:00:00
→ El reporte se ejecutará mañana a las 9:00 AM

Last Run: 2026-04-16 09:00:00
→ Se ejecutó ayer a las 9:00 AM
```

---

## 🔧 Troubleshooting

### Problema: El reporte no se ejecuta
**Solución:**
1. Verifica que el reporte esté "Active"
2. Verifica que la hora sea correcta
3. Verifica que haya destinatarios
4. Haz un test run para verificar

### Problema: El PDF no se ve bien
**Solución:**
1. Intenta en otro navegador
2. Verifica que tengas JavaScript habilitado
3. Intenta con un reporte diferente

### Problema: No recibo el reporte
**Solución:**
1. Verifica que los emails sean correctos
2. Verifica que el reporte esté activo
3. Verifica la próxima ejecución
4. Haz un test run

### Problema: El CSV no abre en Excel
**Solución:**
1. Abre Excel primero
2. Usa "Abrir archivo"
3. Selecciona el CSV
4. Excel abrirá el asistente de importación

---

## 📚 Recursos

### Documentación Completa
- `REPORT_SCHEDULING_AND_PDF_EXPORT.md` - Guía técnica
- `ADVANCED_REPORTS_IMPLEMENTATION.md` - Reportes avanzados
- `QUICK_START_ADVANCED_REPORTS.md` - Guía de reportes

### Rutas Disponibles
- `/advanced-reports` - Ver y exportar reportes
- `/scheduled-reports` - Gestionar programaciones

### Reportes Disponibles
1. Sales Funnel
2. Pipeline by Stage
3. Revenue Forecast
4. Lead Source Analysis
5. Conversion Rate
6. Monthly Revenue
7. Top Opportunities
8. Lead Age
9. Opportunity Age
10. Average Deal Size
11. Sales Cycle Length

---

## 🎯 Próximas Características

### Próximamente
- [ ] Envío automático por email
- [ ] Notificaciones en Slack
- [ ] Plantillas de reportes
- [ ] Historial de reportes
- [ ] Compresión de archivos

---

**Última Actualización:** April 16, 2026
**Status:** ✅ Production Ready
**Versión:** 1.0.0
