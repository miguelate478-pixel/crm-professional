import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Edit2, Play, Clock, Mail } from "lucide-react";

interface ScheduledReport {
  id: number;
  reportId: string;
  name: string;
  frequency: "daily" | "weekly" | "monthly";
  hour: number;
  minute: number;
  recipients: string;
  format: "csv" | "pdf";
  isActive: boolean;
  nextRun: string | null;
  lastRun: string | null;
}

export default function ScheduledReportsPage() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    reportId: "sales_funnel",
    name: "",
    frequency: "daily" as const,
    hour: 9,
    minute: 0,
    recipients: "",
    format: "pdf" as const,
  });

  const listQuery = trpc.scheduledReports.list.useQuery({});
  const createMutation = trpc.scheduledReports.create.useMutation();
  const updateMutation = trpc.scheduledReports.update.useMutation();
  const deleteMutation = trpc.scheduledReports.delete.useMutation();
  const toggleMutation = trpc.scheduledReports.toggleActive.useMutation();
  const testRunMutation = trpc.scheduledReports.testRun.useMutation();

  const scheduledReports = listQuery.data || [];

  const handleCreate = async () => {
    if (!formData.name || !formData.recipients) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      await createMutation.mutateAsync({
        ...formData,
        recipients: formData.recipients.split(",").map((e) => e.trim()),
      });
      setFormData({
        reportId: "sales_funnel",
        name: "",
        frequency: "daily",
        hour: 9,
        minute: 0,
        recipients: "",
        format: "pdf",
      });
      setOpen(false);
      listQuery.refetch();
    } catch (error) {
      console.error("Error creating scheduled report:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this scheduled report?")) {
      try {
        await deleteMutation.mutateAsync({ id });
        listQuery.refetch();
      } catch (error) {
        console.error("Error deleting scheduled report:", error);
      }
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await toggleMutation.mutateAsync({ id });
      listQuery.refetch();
    } catch (error) {
      console.error("Error toggling scheduled report:", error);
    }
  };

  const handleTestRun = async (id: number) => {
    try {
      const result = await testRunMutation.mutateAsync({ id });
      alert(result.message);
    } catch (error) {
      console.error("Error running test:", error);
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      daily: "Every Day",
      weekly: "Every Week",
      monthly: "Every Month",
    };
    return labels[frequency] || frequency;
  };

  const getNextRunLabel = (nextRun: string | null) => {
    if (!nextRun) return "Not scheduled";
    const date = new Date(nextRun);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scheduled Reports</h1>
          <p className="text-gray-600 mt-1">Automate report generation and delivery</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Schedule Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule a New Report</DialogTitle>
              <DialogDescription>
                Configure automatic report generation and delivery
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Report Selection */}
              <div>
                <label className="text-sm font-medium">Report</label>
                <Select value={formData.reportId} onValueChange={(value) => setFormData({ ...formData, reportId: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales_funnel">Sales Funnel</SelectItem>
                    <SelectItem value="pipeline_by_stage">Pipeline by Stage</SelectItem>
                    <SelectItem value="revenue_forecast">Revenue Forecast</SelectItem>
                    <SelectItem value="lead_source_analysis">Lead Source Analysis</SelectItem>
                    <SelectItem value="conversion_rate">Conversion Rate</SelectItem>
                    <SelectItem value="monthly_revenue">Monthly Revenue</SelectItem>
                    <SelectItem value="top_opportunities">Top Opportunities</SelectItem>
                    <SelectItem value="lead_age">Lead Age</SelectItem>
                    <SelectItem value="opportunity_age">Opportunity Age</SelectItem>
                    <SelectItem value="average_deal_size">Average Deal Size</SelectItem>
                    <SelectItem value="sales_cycle_length">Sales Cycle Length</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Name */}
              <div>
                <label className="text-sm font-medium">Schedule Name</label>
                <Input
                  placeholder="e.g., Weekly Sales Report"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Frequency */}
              <div>
                <label className="text-sm font-medium">Frequency</label>
                <Select value={formData.frequency} onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Time */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Hour</label>
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    value={formData.hour}
                    onChange={(e) => setFormData({ ...formData, hour: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Minute</label>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={formData.minute}
                    onChange={(e) => setFormData({ ...formData, minute: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              {/* Recipients */}
              <div>
                <label className="text-sm font-medium">Recipients (comma-separated emails)</label>
                <Input
                  placeholder="user@example.com, admin@example.com"
                  value={formData.recipients}
                  onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                />
              </div>

              {/* Format */}
              <div>
                <label className="text-sm font-medium">Format</label>
                <Select value={formData.format} onValueChange={(value: any) => setFormData({ ...formData, format: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending} className="flex-1">
                  {createMutation.isPending ? "Creating..." : "Create Schedule"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Scheduled Reports List */}
      {scheduledReports.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-600 text-center">
              No scheduled reports yet. Create one to automate report delivery.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {scheduledReports.map((report: ScheduledReport) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{report.name}</CardTitle>
                      <Badge variant={report.isActive ? "default" : "secondary"}>
                        {report.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <CardDescription className="mt-1">
                      {getFrequencyLabel(report.frequency)} at {String(report.hour).padStart(2, "0")}:
                      {String(report.minute).padStart(2, "0")}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTestRun(report.id)}
                      disabled={testRunMutation.isPending}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggle(report.id)}
                      disabled={toggleMutation.isPending}
                    >
                      {report.isActive ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(report.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{JSON.parse(report.recipients).join(", ")}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Next run: {getNextRunLabel(report.nextRun)}</span>
                </div>
                {report.lastRun && (
                  <div className="text-gray-500 text-xs">
                    Last run: {new Date(report.lastRun).toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
