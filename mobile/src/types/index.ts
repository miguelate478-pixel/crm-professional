// Auth types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  role: "admin" | "user";
  avatar?: string;
  createdAt: Date;
}

export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

// Lead types
export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  source: string;
  status: "nuevo" | "contactado" | "calificado" | "descartado";
  score: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
  userId: string;
}

// Contact types
export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  city?: string;
  country?: string;
  companyId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
}

// Opportunity types
export interface Opportunity {
  id: string;
  name: string;
  amount: number;
  probability: number;
  expectedCloseDate: string;
  pipelineId: string;
  stageId: string;
  stageName?: string;
  companyId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
  userId: string;
}

// Task types
export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: "baja" | "media" | "alta";
  status: "pendiente" | "en_progreso" | "completada";
  dueDate?: string;
  assignedTo?: string;
  relatedTo?: {
    type: "lead" | "contact" | "opportunity";
    id: string;
  };
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
  userId: string;
}

// Activity types
export interface Activity {
  id: string;
  type: "llamada" | "reunion" | "visita" | "email" | "nota";
  title: string;
  description?: string;
  date: Date;
  duration?: number;
  relatedTo: {
    type: "lead" | "contact" | "opportunity";
    id: string;
  };
  createdAt: Date;
  organizationId: string;
  userId: string;
}

// Dashboard KPI types
export interface DashboardKPIs {
  totalLeads: number;
  activeOpportunities: number;
  monthlyRevenue: number;
  conversionRate: number;
  tasksOverdue: number;
  tasksToday: number;
}

// Sync types
export interface SyncQueue {
  id: string;
  action: "create" | "update" | "delete";
  entity: "lead" | "contact" | "opportunity" | "task" | "activity";
  entityId: string;
  data: Record<string, any>;
  timestamp: number;
  synced: boolean;
}

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime?: number;
  pendingChanges: number;
  error?: string;
}

// Notification types
export interface PushNotification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  timestamp: number;
  read: boolean;
}

// Geolocation types
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

// Photo types
export interface PhotoData {
  uri: string;
  width: number;
  height: number;
  base64?: string;
  timestamp: number;
  location?: LocationData;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
