
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, FileDown, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMaintenanceRecords } from "@/hooks/useMaintenanceRecords";
import { useReactToPrint } from "react-to-print";
import { format, addDays, addMonths } from "date-fns";
import { de } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useMaintenanceTemplates } from "@/hooks/useMaintenanceTemplates";
import { CompletedMaintenanceReport } from "@/components/reports/CompletedMaintenanceReport";
import { UpcomingMaintenanceReport } from "@/components/reports/UpcomingMaintenanceReport";
import { toast } from "sonner";
import { exportReportsToExcel } from "@/components/reports/ReportsExport";
import { DatePicker } from "@/components/ui/date-picker";

const Reports = () => {
  const { data: records = [] } = useMaintenanceRecords();
  const { data: templates = [] } = useMaintenanceTemplates();
  const [activeTab, setActiveTab] = useState("completed");
  
  const [completedTemplateFilter, setCompletedTemplateFilter] = useState("");
  const [completedStartDate, setCompletedStartDate] = useState<Date | undefined>(
    new Date(new Date().setMonth(new Date().getMonth() - 1))
  );
  const [completedEndDate, setCompletedEndDate] = useState<Date | undefined>(new Date());
  
  const [upcomingTimeframe, setUpcomingTimeframe] = useState("month");
  const [upcomingTemplateFilter, setUpcomingTemplateFilter] = useState("");
  
  const completedReportRef = useRef<HTMLDivElement>(null);
  const upcomingReportRef = useRef<HTMLDivElement>(null);
  
  const completedRecords = records.filter(record => record.status === "abgeschlossen");
  
  const filteredCompletedRecords = completedRecords.filter(record => {
    // Filter by template
    if (completedTemplateFilter && record.template_id !== completedTemplateFilter) {
      return false;
    }
    
    // Filter by date range
    if (completedStartDate && record.performed_date && 
        new Date(record.performed_date) < completedStartDate) {
      return false;
    }
    
    if (completedEndDate && record.performed_date && 
        new Date(record.performed_date) > new Date(completedEndDate.setHours(23, 59, 59))) {
      return false;
    }
    
    return true;
  }).sort((a, b) => 
    new Date(b.performed_date || b.due_date).getTime() - 
    new Date(a.performed_date || a.due_date).getTime()
  );

  // Calculate upcoming maintenance based on template intervals
  const getUpcomingMaintenanceEndDate = () => {
    const now = new Date();
    switch (upcomingTimeframe) {
      case "week":
        return addDays(now, 7);
      case "month":
        return addMonths(now, 1);
      case "quarter":
        return addMonths(now, 3);
      case "year":
        return addMonths(now, 12);
      default:
        return addMonths(now, 1);
    }
  };
  
  const upcomingEndDate = getUpcomingMaintenanceEndDate();
  
  // Filter upcoming maintenance by template
  const filteredTemplates = upcomingTemplateFilter 
    ? templates.filter(template => template.id === upcomingTemplateFilter)
    : templates;
  
  const handlePrintCompleted = useReactToPrint({
    content: () => completedReportRef.current,
    documentTitle: 'Abgeschlossene_Wartungen_Bericht',
    pageStyle: '@page { size: portrait; margin: 10mm; }',
    onBeforePrint: () => {
      if (!completedReportRef.current) {
        toast.error("Drucken konnte nicht gestartet werden");
      }
    }
  });
  
  const handlePrintUpcoming = useReactToPrint({
    content: () => upcomingReportRef.current,
    documentTitle: 'Anstehende_Wartungen_Bericht',
    pageStyle: '@page { size: portrait; margin: 10mm; }',
    onBeforePrint: () => {
      if (!upcomingReportRef.current) {
        toast.error("Drucken konnte nicht gestartet werden");
      }
    }
  });
  
  const handleExportCompleted = () => {
    exportReportsToExcel({
      records: filteredCompletedRecords,
      reportType: 'completed',
      startDate: completedStartDate,
      endDate: completedEndDate,
      templateName: completedTemplateFilter 
        ? templates.find(t => t.id === completedTemplateFilter)?.name 
        : 'Alle'
    });
  };
  
  const handleExportUpcoming = () => {
    exportReportsToExcel({
      templates: filteredTemplates,
      reportType: 'upcoming',
      endDate: upcomingEndDate,
      timeframe: upcomingTimeframe
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Berichte</h1>
      </div>

      <Tabs defaultValue="completed" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="completed">Abgeschlossene Wartungen</TabsTrigger>
          <TabsTrigger value="upcoming">Anstehende Wartungen</TabsTrigger>
        </TabsList>
        
        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Wartungsvorlage</label>
                  <Select value={completedTemplateFilter} onValueChange={setCompletedTemplateFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Alle Vorlagen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Alle Vorlagen</SelectItem>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Von</label>
                  <DatePicker
                    date={completedStartDate} 
                    setDate={setCompletedStartDate}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Bis</label>
                  <DatePicker 
                    date={completedEndDate} 
                    setDate={setCompletedEndDate}
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleExportCompleted}>
              <FileDown className="h-4 w-4 mr-2" />
              Exportieren
            </Button>
            <Button variant="outline" onClick={handlePrintCompleted}>
              <Printer className="h-4 w-4 mr-2" />
              Drucken
            </Button>
          </div>
          
          <div ref={completedReportRef} className="print-container">
            <CompletedMaintenanceReport 
              records={filteredCompletedRecords} 
              templateName={completedTemplateFilter 
                ? templates.find(t => t.id === completedTemplateFilter)?.name 
                : 'Alle'
              }
              startDate={completedStartDate}
              endDate={completedEndDate}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Zeitraum</label>
                  <Select value={upcomingTimeframe} onValueChange={setUpcomingTimeframe}>
                    <SelectTrigger>
                      <SelectValue placeholder="Zeitraum wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Nächste Woche</SelectItem>
                      <SelectItem value="month">Nächster Monat</SelectItem>
                      <SelectItem value="quarter">Nächstes Quartal</SelectItem>
                      <SelectItem value="year">Nächstes Jahr</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Wartungsvorlage</label>
                  <Select value={upcomingTemplateFilter} onValueChange={setUpcomingTemplateFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Alle Vorlagen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Alle Vorlagen</SelectItem>
                      {templates
                        .filter(template => template.interval_months)
                        .map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleExportUpcoming}>
              <FileDown className="h-4 w-4 mr-2" />
              Exportieren
            </Button>
            <Button variant="outline" onClick={handlePrintUpcoming}>
              <Printer className="h-4 w-4 mr-2" />
              Drucken
            </Button>
          </div>
          
          <div ref={upcomingReportRef} className="print-container">
            <UpcomingMaintenanceReport 
              templates={filteredTemplates}
              timeframe={upcomingTimeframe}
              endDate={upcomingEndDate}
              records={records}
            />
          </div>
        </TabsContent>
      </Tabs>
      
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default Reports;
