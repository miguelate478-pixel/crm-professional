import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import Home from "./pages/Home";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import ForgotPasswordPage from "./pages/ForgotPassword";
import ResetPasswordPage from "./pages/ResetPassword";
import AcceptInvitePage from "./pages/AcceptInvite";
import Dashboard from "./pages/Dashboard";
import LeadsPage from "./pages/Leads";
import ContactsPage from "./pages/Contacts";
import ContactDetailPage from "./pages/ContactDetail";
import OpportunitiesPage from "./pages/Opportunities";
import OpportunityDetailPage from "./pages/OpportunityDetail";
import TasksPage from "./pages/Tasks";
import QuotationsPage from "./pages/Quotations";
import ReportsPage from "./pages/Reports";
import AnalyticsPage from "./pages/Analytics";
import LeadDetailPage from "./pages/LeadDetail";
import GoalsPage from "./pages/Goals";
import SettingsPage from "./pages/Settings";
import CompaniesPage from "./pages/Companies";
import ProductsPage from "./pages/Products";
import ProfilePage from "./pages/Profile";
import WorkQueuePage from "./pages/WorkQueue";
import MeetingsPage from "./pages/Meetings";
import IntegrationsPage from "./pages/Integrations";
import WhatsAppPage from "./pages/WhatsApp";
import LeadScoringPage from "./pages/LeadScoring";
import DeduplicationPage from "./pages/Deduplication";
import SlackIntegrationPage from "./pages/SlackIntegration";
import AdvancedReportsPage from "./pages/AdvancedReports";
import ScheduledReportsPage from "./pages/ScheduledReports";
import InventoryPage from "./pages/Inventory";
import InvoicesPage from "./pages/Invoices";
import GmailPage from "./pages/Gmail";
import { Loader2 } from "lucide-react";

function Router() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">CR</span>
          </div>
          <Loader2 className="animate-spin text-blue-500" size={24} />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/forgot-password" component={ForgotPasswordPage} />
        <Route path="/reset-password" component={ResetPasswordPage} />
        <Route path="/accept-invite" component={AcceptInvitePage} />
        <Route path="/" component={Home} />
        <Route component={Home} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/leads" component={LeadsPage} />
      <Route path="/leads/:id" component={LeadDetailPage} />
      <Route path="/contacts" component={ContactsPage} />
      <Route path="/contacts/:id" component={ContactDetailPage} />
      <Route path="/opportunities" component={OpportunitiesPage} />
      <Route path="/opportunities/:id" component={OpportunityDetailPage} />
      <Route path="/tasks" component={TasksPage} />
      <Route path="/quotes" component={QuotationsPage} />
      <Route path="/reports" component={ReportsPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/goals" component={GoalsPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/companies" component={CompaniesPage} />
      <Route path="/products" component={ProductsPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/workqueue" component={WorkQueuePage} />
      <Route path="/meetings" component={MeetingsPage} />
      <Route path="/integrations" component={IntegrationsPage} />
      <Route path="/whatsapp" component={WhatsAppPage} />
      <Route path="/lead-scoring" component={LeadScoringPage} />
      <Route path="/deduplication" component={DeduplicationPage} />
      <Route path="/slack" component={SlackIntegrationPage} />
      <Route path="/advanced-reports" component={AdvancedReportsPage} />
      <Route path="/scheduled-reports" component={ScheduledReportsPage} />
      <Route path="/inventory" component={InventoryPage} />
      <Route path="/invoices" component={InvoicesPage} />
      <Route path="/gmail" component={GmailPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <TooltipProvider>
          <ConfirmProvider>
            <Toaster />
            <Router />
          </ConfirmProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
