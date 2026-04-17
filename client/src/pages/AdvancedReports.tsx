import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { Download, RefreshCw, Grid3x3, List } from "lucide-react";

interface Report {
  id: string;
  name: string;
  description: string;
  chartType: string;
}

interface ReportData {
  title: string;
  description: string;
  data: any[];
  chartType: "bar" | "line" | "pie" | "area" | "table";
  generatedAt: string;
}

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function AdvancedReportsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [generatedReports, setGeneratedReports] = useState<Record<string, ReportData>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const availableReportsQuery = trpc.advancedReports.getAvailableReports.useQuery();
  const generateReportMutation = trpc.advancedReports.generateReport.useMutation();
  const exportCSVMutation = trpc.advancedReports.exportReportCSV.useMutation();
  const exportPDFMutation = trpc.advancedReports.exportReportPDF.useMutation();

  const availableReports = availableReportsQuery.data || [];

  const handleGenerateReport = async (reportId: string) => {
    setLoading((prev) => ({ ...prev, [reportId]: true }));
    try {
      const report = await generateReportMutation.mutateAsync({ reportId });
      setGeneratedReports((prev) => ({ ...prev, [reportId]: report }));
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setLoading((prev) => ({ ...prev, [reportId]: false }));
    }
  };

  const handleExportCSV = async (reportId: string) => {
    try {
      const result = await exportCSVMutation.mutateAsync({ reportId });
      if (result.success && result.data && result.filename) {
        // Create a blob and download
        const blob = new Blob([result.data], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename;
        a.style.display = "none";
        document.body.appendChild(a);
        
        // Use setTimeout to ensure the element is in the DOM
        setTimeout(() => {
          a.click();
          window.URL.revokeObjectURL(url);
          
          // Safely remove the element
          if (a.parentNode) {
            a.parentNode.removeChild(a);
          }
        }, 100);
      }
    } catch (error) {
      console.error("Error exporting report:", error);
    }
  };

  const handleExportPDF = async (reportId: string) => {
    try {
      const result = await exportPDFMutation.mutateAsync({ reportId });
      if (result.success && result.html) {
        // Open HTML in new window for printing to PDF
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(result.html);
          newWindow.document.close();
          // Trigger print dialog
          setTimeout(() => newWindow.print(), 500);
        }
      }
    } catch (error) {
      console.error("Error exporting PDF:", error);
    }
  };

  const renderChart = (report: ReportData) => {
    const { chartType, data } = report;

    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" />
            </LineChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="value" fill="#3b82f6" stroke="#3b82f6" />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "table":
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  {Object.keys(data[0] || {}).map((key) => (
                    <th key={key} className="px-4 py-2 text-left font-semibold">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row: any, idx: number) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    {Object.values(row).map((value: any, vidx: number) => (
                      <td key={vidx} className="px-4 py-2">
                        {typeof value === "number" ? value.toLocaleString() : String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return <div>Unsupported chart type: {chartType}</div>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Reports</h1>
          <p className="text-gray-600 mt-1">Generate and analyze comprehensive business reports</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Available Reports */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Reports</h2>
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
          {availableReports.map((report: Report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{report.name}</CardTitle>
                    <CardDescription className="text-sm mt-1">{report.description}</CardDescription>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {report.chartType}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleGenerateReport(report.id)}
                  disabled={loading[report.id]}
                  className="w-full"
                >
                  {loading[report.id] ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Generated Reports */}
      {Object.keys(generatedReports).length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Generated Reports</h2>
          <Tabs defaultValue={Object.keys(generatedReports)[0]} className="w-full">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(Object.keys(generatedReports).length, 4)}, 1fr)` }}>
              {Object.entries(generatedReports).map(([reportId, report]) => (
                <TabsTrigger key={reportId} value={reportId} className="text-xs">
                  {report.title}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(generatedReports).map(([reportId, report]) => (
              <TabsContent key={reportId} value={reportId}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{report.title}</CardTitle>
                        <CardDescription>{report.description}</CardDescription>
                        <p className="text-xs text-gray-500 mt-2">
                          Generated: {new Date(report.generatedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportCSV(reportId)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          CSV
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportPDF(reportId)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white p-4 rounded-lg border">
                      {renderChart(report)}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}

      {/* Empty State */}
      {Object.keys(generatedReports).length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-600 text-center">
              Select a report above to generate and view data
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
