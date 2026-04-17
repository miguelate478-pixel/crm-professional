# 🚀 Quick Start - Advanced Reports

## Acceso Rápido

### URL
```
http://localhost:5173/advanced-reports
```

### Navegación en la App
1. Inicia sesión en el CRM
2. En el menú lateral, busca "Advanced Reports" (o navega a `/advanced-reports`)
3. ¡Listo! Ya estás en la página de reportes avanzados

## Características Principales

### 1. Vista de Reportes Disponibles
- **Grid View:** Muestra los reportes en tarjetas
- **List View:** Muestra los reportes en lista
- Cada reporte tiene:
  - Nombre descriptivo
  - Descripción
  - Tipo de gráfico
  - Botón "Generate Report"

### 2. Generar un Reporte
1. Haz clic en "Generate Report" en cualquier tarjeta
2. Espera a que se carguen los datos (verás un spinner)
3. El reporte aparecerá en la sección "Generated Reports"

### 3. Visualizar Reportes
- Los reportes generados aparecen en tabs
- Cada tab muestra:
  - Título del reporte
  - Descripción
  - Fecha de generación
  - Gráfico interactivo
  - Botón "Export CSV"

### 4. Exportar Datos
1. Genera un reporte
2. Haz clic en "Export CSV"
3. El archivo se descargará automáticamente
4. Abre en Excel o Google Sheets

## Reportes Disponibles

### 1. Sales Funnel
- **Tipo:** Bar Chart
- **Descripción:** Visualización de leads a través de las etapas de ventas
- **Datos:** Cantidad de leads por etapa

### 2. Pipeline by Stage
- **Tipo:** Bar Chart
- **Descripción:** Valor total del pipeline por etapa
- **Datos:** Monto y cantidad de oportunidades por etapa

### 3. Revenue Forecast
- **Tipo:** Line Chart
- **Descripción:** Forecast de ingresos para los próximos 12 meses
- **Datos:** Ingresos proyectados por mes

### 4. Lead Source Analysis
- **Tipo:** Pie Chart
- **Descripción:** Análisis de leads por fuente
- **Datos:** Cantidad y tasa de conversión por fuente

### 5. Conversion Rate
- **Tipo:** Bar Chart
- **Descripción:** Tasas de conversión en el embudo de ventas
- **Datos:** Porcentaje de conversión por etapa

### 6. Monthly Revenue
- **Tipo:** Area Chart
- **Descripción:** Ingresos de deals cerrados por mes
- **Datos:** Ingresos acumulados por mes

### 7. Top Opportunities
- **Tipo:** Table
- **Descripción:** Top 10 oportunidades por monto
- **Datos:** Tabla con nombre, monto, etapa, probabilidad

### 8. Lead Age
- **Tipo:** Bar Chart
- **Descripción:** Distribución de leads por antigüedad
- **Datos:** Cantidad de leads por rango de edad

### 9. Opportunity Age
- **Tipo:** Bar Chart
- **Descripción:** Distribución de oportunidades por antigüedad
- **Datos:** Cantidad de oportunidades por rango de edad

### 10. Average Deal Size
- **Tipo:** Bar Chart
- **Descripción:** Tamaño promedio de deal por etapa
- **Datos:** Monto promedio por etapa

### 11. Sales Cycle Length
- **Tipo:** Bar Chart
- **Descripción:** Duración promedio del ciclo de venta
- **Datos:** Días promedio para cerrar por etapa

## Ejemplos de Uso

### Caso 1: Analizar el Embudo de Ventas
1. Genera "Sales Funnel"
2. Observa cuántos leads hay en cada etapa
3. Identifica cuellos de botella
4. Exporta a CSV para análisis detallado

### Caso 2: Revisar Ingresos Mensuales
1. Genera "Monthly Revenue"
2. Observa la tendencia de ingresos
3. Identifica meses con mejor desempeño
4. Compara con objetivos

### Caso 3: Identificar Oportunidades Principales
1. Genera "Top Opportunities"
2. Revisa las 10 oportunidades más grandes
3. Prioriza seguimiento
4. Exporta para presentación

### Caso 4: Analizar Fuentes de Leads
1. Genera "Lead Source Analysis"
2. Observa qué fuentes traen más leads
3. Identifica fuentes con mejor conversión
4. Optimiza presupuesto de marketing

## Consejos y Trucos

### 💡 Tip 1: Múltiples Reportes
- Puedes generar varios reportes a la vez
- Usa los tabs para cambiar entre ellos
- Cada reporte se mantiene en memoria

### 💡 Tip 2: Exportar para Presentaciones
- Exporta reportes a CSV
- Abre en Excel o Google Sheets
- Crea gráficos personalizados
- Incluye en presentaciones

### 💡 Tip 3: Análisis Comparativo
- Genera el mismo reporte en diferentes fechas
- Compara los datos
- Identifica tendencias

### 💡 Tip 4: Compartir Datos
- Exporta a CSV
- Comparte con el equipo
- Usa para reuniones de ventas

## Troubleshooting

### Problema: El reporte no carga
**Solución:**
1. Verifica que tengas datos en la BD
2. Recarga la página
3. Intenta con otro reporte

### Problema: Los gráficos no se ven bien
**Solución:**
1. Amplía la ventana del navegador
2. Usa modo pantalla completa
3. Intenta en otro navegador

### Problema: La exportación no funciona
**Solución:**
1. Verifica que el navegador permita descargas
2. Desactiva bloqueadores de pop-ups
3. Intenta en modo incógnito

### Problema: Los datos no son correctos
**Solución:**
1. Verifica que los datos en la BD sean correctos
2. Recarga la página
3. Contacta al administrador

## Próximas Características

### 🔜 Report Scheduling
- Programar reportes para que se generen automáticamente
- Enviar por email en horarios específicos
- Integración con Slack

### 🔜 Dashboard Builder
- Crear dashboards personalizados
- Agregar widgets drag-drop
- Guardar configuraciones

### 🔜 PDF Export
- Exportar reportes como PDF
- Incluir logos y branding
- Compartir fácilmente

### 🔜 Custom Reports
- Crear reportes personalizados
- Seleccionar campos y filtros
- Guardar como plantillas

## Soporte

Para preguntas o problemas:
1. Revisa la documentación en `ADVANCED_REPORTS_IMPLEMENTATION.md`
2. Verifica el código en `client/src/pages/AdvancedReports.tsx`
3. Contacta al equipo de desarrollo

---

**Última Actualización:** April 16, 2026
**Status:** ✅ Production Ready
**Versión:** 1.0.0
