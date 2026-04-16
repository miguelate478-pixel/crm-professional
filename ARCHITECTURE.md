# CRM Profesional - Arquitectura y Diseño

## Visión del Producto

**CRM Profesional** es una plataforma de gestión comercial de nivel empresarial, diseñada para equipos de ventas que requieren herramientas sofisticadas, intuitivas y visualmente refinadas. Supera a Zoho CRM en simplicidad, velocidad, diseño visual y experiencia de usuario.

## Propuesta de Valor

| Aspecto | CRM Profesional | Zoho CRM |
|--------|-----------------|----------|
| **Simplicidad** | Interfaz minimalista y clara | Interfaz recargada con muchas opciones |
| **Diseño Visual** | Premium, moderno, corporativo | Funcional pero genérico |
| **Velocidad** | Optimizado para operaciones rápidas | Puede ser lento en operaciones complejas |
| **Facilidad de Aprendizaje** | Curva de aprendizaje muy baja | Requiere capacitación extensa |
| **Productividad del Asesor** | Flujos optimizados para ventas | Muchos clics para tareas comunes |
| **Claridad para Gerencia** | Dashboards ejecutivos claros | Dashboards complejos |
| **Flexibilidad** | Configuración intuitiva | Configuración técnica |
| **Calidad de Dashboards** | Gráficos interactivos y modernos | Gráficos estáticos |
| **Experiencia Móvil** | Responsive y optimizado | Limitado en móvil |
| **Automatización** | Workflows visuales sin código | Requiere configuración técnica |

## Arquitectura Técnica

### Stack Tecnológico

- **Frontend:** React 19 + Tailwind CSS 4 + shadcn/ui
- **Backend:** Express.js + tRPC 11
- **Base de Datos:** MySQL/TiDB con Drizzle ORM
- **Autenticación:** JWT + Manus OAuth
- **Almacenamiento:** S3 compatible
- **Gráficos:** Recharts
- **Validación:** Zod
- **Testing:** Vitest

### Principios de Arquitectura

1. **Modular:** Cada módulo es independiente pero integrado
2. **Type-Safe:** TypeScript end-to-end con tRPC
3. **Escalable:** Preparado para multi-tenant
4. **Performante:** Optimizado para operaciones rápidas
5. **Seguro:** RBAC, auditoría de acciones

## Modelo de Datos

### Tablas Principales

```
organizations (multi-tenant)
├── users (roles: admin, user)
├── teams
├── leads
│   ├── lead_activities
│   ├── lead_notes
│   └── lead_tags
├── contacts
│   ├── contact_activities
│   └── contact_notes
├── companies
│   ├── company_contacts
│   └── company_opportunities
├── opportunities
│   ├── opportunity_activities
│   ├── opportunity_notes
│   ├── opportunity_products
│   └── opportunity_history
├── pipelines (stages: Prospecto, Calificado, Propuesta, Negociación, Cerrado)
├── stages
├── tasks
│   ├── task_assignees
│   └── task_reminders
├── activities (llamadas, reuniones, visitas)
├── quotations
│   ├── quotation_items
│   └── quotation_history
├── products
├── lead_sources
├── quotation_statuses (borrador, enviada, aceptada, rechazada)
├── task_statuses (pendiente, en progreso, completada)
├── custom_fields
├── audit_logs
└── reports
```

## Módulos del Sistema

### 1. Dashboard Ejecutivo
- KPIs en tiempo real: ingresos, leads activos, tasa de conversión, oportunidades
- Gráficos de tendencias: ingresos por mes, leads por fuente
- Panel de actividad reciente
- Filtros por fecha, equipo, vendedor
- Exportación de datos

### 2. Gestión de Leads
- Tabla avanzada con búsqueda y filtros
- Creación rápida de leads
- Vista de detalle con historial completo
- Asignación manual y automática
- Scoring de leads
- Deduplicación automática
- Importación masiva (CSV/Excel)

### 3. Contactos y Empresas
- Perfil 360° del contacto
- Datos de empresa asociada
- Historial de interacciones
- Notas y adjuntos
- Segmentación

### 4. Oportunidades y Pipeline
- Kanban visual drag-and-drop
- Etapas: Prospecto, Calificado, Propuesta, Negociación, Cerrado
- Monto proyectado y probabilidad
- Tareas asociadas
- Historial de cambios
- Alertas por inactividad

### 5. Tareas y Actividades
- Tareas: pendiente, en progreso, completada
- Calendario integrado
- Recordatorios
- Asignación a contactos u oportunidades
- Actividades: llamadas, reuniones, visitas

### 6. Cotizaciones
- Creación de propuestas
- Líneas de producto con precios
- Estados: borrador, enviada, aceptada, rechazada
- Cálculo automático de totales
- Historial de cambios
- Exportación a PDF

### 7. Reportes y Analítica
- Embudo de ventas
- Rendimiento por vendedor
- Forecast mensual
- Gráficos interactivos
- Exportación a Excel/PDF

### 8. Configuración del Sistema
- Gestión de usuarios y roles
- Etapas del pipeline personalizables
- Fuentes de leads
- Categorías de productos
- Campos personalizados

## Diseño Visual

### Paleta de Colores (Corporativa Azul/Índigo)

**Modo Claro:**
- Primary: #3B82F6 (Azul)
- Secondary: #6366F1 (Índigo)
- Accent: #0EA5E9 (Cyan)
- Background: #FFFFFF
- Foreground: #1F2937
- Muted: #9CA3AF

**Modo Oscuro:**
- Primary: #60A5FA (Azul claro)
- Secondary: #818CF8 (Índigo claro)
- Accent: #06B6D4 (Cyan claro)
- Background: #0F172A
- Foreground: #F1F5F9
- Muted: #64748B

### Tipografía
- Headings: Inter (sans-serif)
- Body: Inter (sans-serif)
- Monospace: JetBrains Mono

### Componentes Visuales
- Micro-animaciones sutiles (transiciones 200-300ms)
- Estados vacíos ilustrados
- Iconografía consistente (Lucide React)
- Sombras suaves y bordes redondeados
- Espaciado coherente (escala 4px)

## Fases de Desarrollo

### Fase 1: Fundación (Sprint 1)
- [x] Inicializar proyecto
- [ ] Diseñar y crear modelo de datos completo
- [ ] Implementar autenticación y roles
- [ ] Crear layout de dashboard con sidebar
- [ ] Implementar tema claro/oscuro

### Fase 2: Módulos Básicos (Sprint 2-3)
- [ ] Dashboard Ejecutivo con KPIs
- [ ] Módulo de Leads
- [ ] Módulo de Contactos
- [ ] Módulo de Empresas

### Fase 3: Pipeline y Oportunidades (Sprint 4)
- [ ] Módulo de Oportunidades con Kanban
- [ ] Pipeline visual drag-and-drop
- [ ] Historial de cambios

### Fase 4: Tareas y Actividades (Sprint 5)
- [ ] Módulo de Tareas
- [ ] Calendario integrado
- [ ] Recordatorios

### Fase 5: Cotizaciones y Reportes (Sprint 6)
- [ ] Módulo de Cotizaciones
- [ ] Reportes y Analítica
- [ ] Exportación de datos

### Fase 6: Configuración y Pulido (Sprint 7)
- [ ] Configuración del Sistema
- [ ] Campos personalizados
- [ ] Optimizaciones de rendimiento
- [ ] Testing completo

## Endpoints Principales (tRPC)

```
auth.*
├── me: obtener usuario actual
├── logout: cerrar sesión

dashboard.*
├── getKPIs: obtener métricas principales
├── getRecentActivity: obtener actividad reciente
├── getTrendData: obtener datos de tendencias

leads.*
├── list: listar leads con filtros
├── create: crear nuevo lead
├── update: actualizar lead
├── delete: eliminar lead
├── getDetail: obtener detalle completo
├── getActivities: obtener actividades del lead

contacts.*
├── list: listar contactos
├── create: crear contacto
├── update: actualizar contacto
├── getDetail: obtener perfil 360°

companies.*
├── list: listar empresas
├── create: crear empresa
├── getDetail: obtener detalle

opportunities.*
├── list: listar oportunidades
├── create: crear oportunidad
├── update: actualizar oportunidad
├── moveStage: mover entre etapas
├── getDetail: obtener detalle

tasks.*
├── list: listar tareas
├── create: crear tarea
├── update: actualizar tarea
├── updateStatus: cambiar estado

quotations.*
├── list: listar cotizaciones
├── create: crear cotización
├── update: actualizar cotización
├── updateStatus: cambiar estado
├── generatePDF: generar PDF

reports.*
├── getSalesFunnel: embudo de ventas
├── getPerformanceByUser: rendimiento por vendedor
├── getForecast: forecast mensual

config.*
├── getUsers: listar usuarios
├── createUser: crear usuario
├── updatePipeline: actualizar etapas
├── getLeadSources: obtener fuentes
├── getProducts: obtener productos
```

## Roles y Permisos

### Admin
- Acceso completo a todos los módulos
- Gestión de usuarios y roles
- Configuración del sistema
- Auditoría y logs
- Reportes avanzados

### Usuario (Vendedor)
- Acceso a leads, contactos, oportunidades
- Creación y edición de registros propios
- Visualización de pipeline
- Tareas y calendario
- Reportes básicos

## Consideraciones de Escalabilidad

1. **Multi-tenant:** Cada organización tiene datos aislados
2. **Caché:** Redis para datos frecuentes
3. **Índices:** Optimizados en leads, oportunidades
4. **Paginación:** Implementada en todas las listas
5. **Auditoría:** Todos los cambios registrados

## Roadmap Futuro

- Integraciones con email (Gmail, Outlook)
- Sincronización de calendario
- Automatizaciones avanzadas
- Mobile app nativa
- API pública para integraciones
- Webhooks para eventos
- Machine Learning para scoring
