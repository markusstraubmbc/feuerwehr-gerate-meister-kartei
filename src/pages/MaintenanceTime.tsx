
import { useState, useRef } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarIcon, FileDown, Printer } from "lucide-react";
import { useMaintenanceRecords } from "@/hooks/useMaintenanceRecords";
import { useCategories } from "@/hooks/useCategories";
import { usePersons } from "@/hooks/usePersons";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReactToPrint } from "react-to-print";
import * as XLSX from 'xlsx';
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const formSchema = z.object({
  categoryId: z.string().optional(),
  personId: z.string().optional(),
  startDate: z.date({
    required_error: "Startdatum ist erforderlich",
  }),
  endDate: z.date({
    required_error: "Enddatum ist erforderlich",
  }),
});

const MaintenanceTime = () => {
  const { data: maintenanceRecords = [] } = useMaintenanceRecords();
  const { data: categories = [] } = useCategories();
  const { data: persons = [] } = usePersons();
  const [activeTab, setActiveTab] = useState("summary");
  
  const printRef = useRef<HTMLDivElement>(null);
  
  // Default to last month
  const defaultStartDate = startOfMonth(subMonths(new Date(), 1));
  const defaultEndDate = endOfMonth(subMonths(new Date(), 1));
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: undefined,
      personId: undefined,
      startDate: defaultStartDate,
      endDate: defaultEndDate,
    },
  });
  
  const { categoryId, personId, startDate, endDate } = form.watch();
  
  // Filter maintenance records based on form values
  const filteredRecords = maintenanceRecords.filter(record => {
    // Filter by status - only include completed records
    if (record.status !== "abgeschlossen") {
      return false;
    }
    
    // Filter by date range
    if (!record.performed_date) {
      return false;
    }
    
    const performedDate = new Date(record.performed_date);
    if (performedDate < startDate || performedDate > endDate) {
      return false;
    }
    
    // Filter by category
    if (categoryId && record.equipment?.category_id !== categoryId) {
      return false;
    }
    
    // Filter by person
    if (personId && record.performed_by !== personId) {
      return false;
    }
    
    return true;
  });
  
  // Calculate summary statistics
  const totalTime = filteredRecords.reduce((sum, record) => sum + (record.minutes_spent || 0), 0);
  const totalCount = filteredRecords.length;
  const averageTime = totalCount > 0 ? Math.round(totalTime / totalCount) : 0;
  
  // Calculate statistics by category
  const categorySummary = categories.map(category => {
    const categoryRecords = filteredRecords.filter(record => record.equipment?.category_id === category.id);
    const count = categoryRecords.length;
    const time = categoryRecords.reduce((sum, record) => sum + (record.minutes_spent || 0), 0);
    const average = count > 0 ? Math.round(time / count) : 0;
    
    return {
      id: category.id,
      name: category.name,
      count,
      time,
      average
    };
  }).filter(cat => cat.count > 0).sort((a, b) => b.time - a.time);
  
  // Calculate statistics by person
  const personSummary = persons.map(person => {
    const personRecords = filteredRecords.filter(record => record.performed_by === person.id);
    const count = personRecords.length;
    const time = personRecords.reduce((sum, record) => sum + (record.minutes_spent || 0), 0);
    const average = count > 0 ? Math.round(time / count) : 0;
    
    return {
      id: person.id,
      name: `${person.first_name} ${person.last_name}`,
      count,
      time,
      average
    };
  }).filter(p => p.count > 0).sort((a, b) => b.time - a.time);
  
  // Prepare chart data
  const categoryChartData = categorySummary.map(cat => ({
    name: cat.name,
    "Gesamt (Minuten)": cat.time,
    "Durchschnitt pro Wartung": cat.average,
  }));
  
  const personChartData = personSummary.map(p => ({
    name: p.name,
    "Gesamt (Minuten)": p.time,
    "Durchschnitt pro Wartung": p.average,
  }));
  
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: 'Wartungs-Zeitauswertung',
    pageStyle: '@page { size: auto; margin: 10mm; } @media print { body { font-size: 12pt; } }',
  });
  
  const handleExport = () => {
    try {
      // Prepare workbook with multiple sheets
      const workbook = XLSX.utils.book_new();
      
      // Add summary sheet
      const summaryData = [
        {
          "Zeitraum": `${format(startDate, "dd.MM.yyyy", { locale: de })} - ${format(endDate, "dd.MM.yyyy", { locale: de })}`,
          "Anzahl Wartungen": totalCount,
          "Gesamtzeit (Minuten)": totalTime,
          "Durchschnitt pro Wartung": averageTime
        }
      ];
      
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Zusammenfassung');
      
      // Add category summary sheet
      const categoryData = categorySummary.map(cat => ({
        "Kategorie": cat.name,
        "Anzahl Wartungen": cat.count,
        "Gesamtzeit (Minuten)": cat.time,
        "Durchschnitt pro Wartung": cat.average
      }));
      
      const categorySheet = XLSX.utils.json_to_sheet(categoryData);
      XLSX.utils.book_append_sheet(workbook, categorySheet, 'Nach Kategorie');
      
      // Add person summary sheet
      const personData = personSummary.map(p => ({
        "Person": p.name,
        "Anzahl Wartungen": p.count,
        "Gesamtzeit (Minuten)": p.time,
        "Durchschnitt pro Wartung": p.average
      }));
      
      const personSheet = XLSX.utils.json_to_sheet(personData);
      XLSX.utils.book_append_sheet(workbook, personSheet, 'Nach Person');
      
      // Add detailed records sheet
      const detailedData = filteredRecords.map(record => ({
        "Datum": format(new Date(record.performed_date!), "dd.MM.yyyy", { locale: de }),
        "Ausrüstung": record.equipment?.name || "",
        "Kategorie": categories.find(c => c.id === record.equipment?.category_id)?.name || "",
        "Wartungstyp": record.template?.name || "",
        "Person": record.performer ? `${record.performer.first_name} ${record.performer.last_name}` : "",
        "Zeit (Minuten)": record.minutes_spent || 0
      }));
      
      const detailedSheet = XLSX.utils.json_to_sheet(detailedData);
      XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detaillierte Daten');
      
      // Generate filename with date range
      const fileName = `Wartungs-Zeitauswertung-${format(startDate, "yyyy-MM-dd")}_bis_${format(endDate, "yyyy-MM-dd")}.xlsx`;
      
      XLSX.writeFile(workbook, fileName);
      toast.success('Export erfolgreich abgeschlossen');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Fehler beim Exportieren der Daten');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Wartungs-Zeitauswertung</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <FileDown className="h-4 w-4 mr-2" />
            Exportieren
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Drucken
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
          <CardDescription>Wählen Sie den Zeitraum und die gewünschten Filter aus</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Von</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={`w-full justify-start text-left font-normal ${
                              !field.value && "text-muted-foreground"
                            }`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, "P", { locale: de })
                            ) : (
                              <span>Datum auswählen</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          locale={de}
                        />
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Bis</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={`w-full justify-start text-left font-normal ${
                              !field.value && "text-muted-foreground"
                            }`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, "P", { locale: de })
                            ) : (
                              <span>Datum auswählen</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          locale={de}
                        />
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategorie</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Alle Kategorien" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Alle Kategorien</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="personId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Person</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Alle Personen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Alle Personen</SelectItem>
                        {persons.map((person) => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.first_name} {person.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
          </Form>
        </CardContent>
      </Card>
      
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary">
            Zeitraum: {format(startDate, "dd.MM.yyyy", { locale: de })} - {format(endDate, "dd.MM.yyyy", { locale: de })}
          </Badge>
          {categoryId && (
            <Badge variant="secondary">
              Kategorie: {categories.find(c => c.id === categoryId)?.name}
            </Badge>
          )}
          {personId && (
            <Badge variant="secondary">
              Person: {persons.find(p => p.id === personId)?.first_name} {persons.find(p => p.id === personId)?.last_name}
            </Badge>
          )}
        </div>
      </div>
      
      <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="summary">Zusammenfassung</TabsTrigger>
          <TabsTrigger value="categories">Nach Kategorie</TabsTrigger>
          <TabsTrigger value="persons">Nach Person</TabsTrigger>
          <TabsTrigger value="detailed">Detaillierte Daten</TabsTrigger>
        </TabsList>
        
        <div ref={printRef}>
          <TabsContent value="summary" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Zusammenfassung</CardTitle>
                <CardDescription>Übersicht der Wartungszeiten im ausgewählten Zeitraum</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg text-center">
                    <h3 className="text-lg font-medium">Anzahl Wartungen</h3>
                    <p className="text-3xl font-bold">{totalCount}</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <h3 className="text-lg font-medium">Gesamtzeit</h3>
                    <p className="text-3xl font-bold">{totalTime} Min.</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <h3 className="text-lg font-medium">Durchschnitt</h3>
                    <p className="text-3xl font-bold">{averageTime} Min.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top Kategorien nach Zeit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChartData.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Gesamt (Minuten)" fill="#8884d8" />
                      <Bar dataKey="Durchschnitt pro Wartung" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top Personen nach Zeit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={personChartData.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Gesamt (Minuten)" fill="#8884d8" />
                      <Bar dataKey="Durchschnitt pro Wartung" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="categories" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Auswertung nach Kategorie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Kategorie</th>
                        <th className="text-left py-2 px-4">Anzahl</th>
                        <th className="text-left py-2 px-4">Gesamtzeit (Min.)</th>
                        <th className="text-left py-2 px-4">Durchschnitt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categorySummary.map(cat => (
                        <tr key={cat.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4">{cat.name}</td>
                          <td className="py-2 px-4">{cat.count}</td>
                          <td className="py-2 px-4">{cat.time}</td>
                          <td className="py-2 px-4">{cat.average}</td>
                        </tr>
                      ))}
                      {categorySummary.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-muted-foreground">
                            Keine Daten für den ausgewählten Zeitraum und Filter verfügbar
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {categorySummary.length > 0 && (
                  <div className="h-80 mt-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Gesamt (Minuten)" fill="#8884d8" />
                        <Bar dataKey="Durchschnitt pro Wartung" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="persons" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Auswertung nach Person</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Person</th>
                        <th className="text-left py-2 px-4">Anzahl</th>
                        <th className="text-left py-2 px-4">Gesamtzeit (Min.)</th>
                        <th className="text-left py-2 px-4">Durchschnitt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {personSummary.map(p => (
                        <tr key={p.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4">{p.name}</td>
                          <td className="py-2 px-4">{p.count}</td>
                          <td className="py-2 px-4">{p.time}</td>
                          <td className="py-2 px-4">{p.average}</td>
                        </tr>
                      ))}
                      {personSummary.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-muted-foreground">
                            Keine Daten für den ausgewählten Zeitraum und Filter verfügbar
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {personSummary.length > 0 && (
                  <div className="h-80 mt-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={personChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Gesamt (Minuten)" fill="#8884d8" />
                        <Bar dataKey="Durchschnitt pro Wartung" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="detailed" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Detaillierte Daten</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Datum</th>
                        <th className="text-left py-2 px-4">Ausrüstung</th>
                        <th className="text-left py-2 px-4">Kategorie</th>
                        <th className="text-left py-2 px-4">Wartungstyp</th>
                        <th className="text-left py-2 px-4">Person</th>
                        <th className="text-left py-2 px-4">Zeit (Min.)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map(record => (
                        <tr key={record.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4">
                            {record.performed_date ? format(new Date(record.performed_date), "dd.MM.yyyy", { locale: de }) : "-"}
                          </td>
                          <td className="py-2 px-4">{record.equipment?.name}</td>
                          <td className="py-2 px-4">
                            {categories.find(c => c.id === record.equipment?.category_id)?.name || "-"}
                          </td>
                          <td className="py-2 px-4">{record.template?.name || "-"}</td>
                          <td className="py-2 px-4">
                            {record.performer ? `${record.performer.first_name} ${record.performer.last_name}` : "-"}
                          </td>
                          <td className="py-2 px-4">{record.minutes_spent || "-"}</td>
                        </tr>
                      ))}
                      {filteredRecords.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-muted-foreground">
                            Keine Daten für den ausgewählten Zeitraum und Filter verfügbar
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default MaintenanceTime;
