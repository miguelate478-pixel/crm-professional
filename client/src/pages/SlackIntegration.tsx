import CRMLayout from "@/components/CRMLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Slack, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function SlackIntegrationPage() {
  const { data: status, isLoading } = trpc.slack.getStatus.useQuery();
  const { data: oauthUrl } = trpc.slack.getOAuthUrl.useQuery();

  const handleConnect = () => {
    if (oauthUrl?.url) {
      window.location.href = oauthUrl.url;
    } else {
      toast.error("OAuth URL not available");
    }
  };

  return (
    <CRMLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Slack Integration</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Connect your CRM with Slack for notifications and commands
            </p>
          </div>
          <Slack size={40} className="text-blue-600" />
        </div>

        {/* Status Card */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-muted-foreground" />
          </div>
        ) : status?.configured ? (
          <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle size={24} className="text-green-600" />
                <div>
                  <p className="font-semibold text-green-900 dark:text-green-100">Connected to Slack</p>
                  <p className="text-sm text-green-700 dark:text-green-200">Your CRM is connected to Slack</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertCircle size={24} className="text-amber-600" />
                <div>
                  <p className="font-semibold text-amber-900 dark:text-amber-100">Not Connected</p>
                  <p className="text-sm text-amber-700 dark:text-amber-200">Connect your Slack workspace to enable notifications and commands</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Notifications</p>
                <p className="text-sm text-muted-foreground">Get notified in Slack when new leads, opportunities, or tasks are created</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Slash Commands</p>
                <p className="text-sm text-muted-foreground">Create leads, opportunities, and tasks directly from Slack using commands</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Task Assignment</p>
                <p className="text-sm text-muted-foreground">Receive direct messages when tasks are assigned to you</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commands */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Available Commands</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="font-mono text-sm font-semibold">/crm-lead</p>
              <p className="text-sm text-muted-foreground mt-1">Create a new lead from Slack</p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="font-mono text-sm font-semibold">/crm-opp</p>
              <p className="text-sm text-muted-foreground mt-1">Create a new opportunity from Slack</p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="font-mono text-sm font-semibold">/crm-task</p>
              <p className="text-sm text-muted-foreground mt-1">Create a new task from Slack</p>
            </div>
          </CardContent>
        </Card>

        {/* Channels */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Recommended Channels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-semibold text-sm">#leads</p>
                <p className="text-xs text-muted-foreground">Notifications for new leads</p>
              </div>
              <Badge variant="outline">Recommended</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-semibold text-sm">#opportunities</p>
                <p className="text-xs text-muted-foreground">Notifications for new opportunities</p>
              </div>
              <Badge variant="outline">Recommended</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-semibold text-sm">#tasks</p>
                <p className="text-xs text-muted-foreground">Notifications for new tasks</p>
              </div>
              <Badge variant="outline">Recommended</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="space-y-3 list-decimal list-inside">
              <li className="text-sm">
                <span className="font-semibold">Click "Connect to Slack"</span> button below
              </li>
              <li className="text-sm">
                <span className="font-semibold">Authorize the app</span> in your Slack workspace
              </li>
              <li className="text-sm">
                <span className="font-semibold">Create the recommended channels</span> (#leads, #opportunities, #tasks)
              </li>
              <li className="text-sm">
                <span className="font-semibold">Start using commands</span> like /crm-lead, /crm-opp, /crm-task
              </li>
              <li className="text-sm">
                <span className="font-semibold">Receive notifications</span> automatically in your channels
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Connect Button */}
        {!status?.configured && (
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handleConnect}
              className="bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              <Slack size={18} className="mr-2" />
              Connect to Slack
            </Button>
          </div>
        )}

        {/* Info */}
        <Card className="border-border/50 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <p className="text-sm text-muted-foreground">
              For more information about Slack integration, visit our{" "}
              <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
                documentation
              </a>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </CRMLayout>
  );
}
