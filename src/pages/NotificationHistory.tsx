import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell, Calendar, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/hooks/useCategories";

interface NotificationHistoryRecord {
  id: string;
  equipment_id: string;
  maintenance_record_id: string | null;
  notified_at: string;
  created_at: string;
  equipment: {
    name: string;
    barcode: string | null;
    category_id: string | null;
  };
}

const NotificationHistory = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  const { data: categories = [] } = useCategories();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notification-history", categoryFilter, dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from("maintenance_notification_history")
        .select(`
          *,
          equipment:equipment_id (
            name,
            barcode,
            category_id
          )
        `)
        .order("notified_at", { ascending: false });

      if (dateFrom) {
        query = query.gte("notified_at", new Date(dateFrom).toISOString());
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte("notified_at", endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as NotificationHistoryRecord[];
    },
  });

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch = 
      notification.equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.equipment.barcode?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      categoryFilter === "all" || 
      notification.equipment.category_id === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Group notifications by equipment to show last notification date
  const equipmentNotifications = filteredNotifications.reduce((acc, notification) => {
    if (!acc[notification.equipment_id] || 
        new Date(notification.notified_at) > new Date(acc[notification.equipment_id].notified_at)) {
      acc[notification.equipment_id] = notification;
    }
    return acc;
  }, {} as Record<string, NotificationHistoryRecord>);

  const uniqueNotifications = Object.values(equipmentNotifications);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/settings")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Benachrichtigungshistorie</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Filter
          </CardTitle>
          <CardDescription>
            Filtern Sie die Benachrichtigungshistorie nach verschiedenen Kriterien
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Suche</Label>
              <Input
                id="search"
                placeholder="Ausrüstung oder Barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategorie</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Alle Kategorien" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Kategorien</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-from">Von Datum</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-to">Bis Datum</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Letzte Benachrichtigungen pro Ausrüstung
          </CardTitle>
          <CardDescription>
            Übersicht wann welche Ausrüstung zuletzt per E-Mail benachrichtigt wurde
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Lade Daten...</div>
          ) : uniqueNotifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Keine Benachrichtigungen gefunden
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ausrüstung</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead>Letzte Benachrichtigung</TableHead>
                    <TableHead>Anzahl Benachrichtigungen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uniqueNotifications.map((notification) => {
                    const category = categories.find(c => c.id === notification.equipment.category_id);
                    const notificationCount = filteredNotifications.filter(
                      n => n.equipment_id === notification.equipment_id
                    ).length;

                    return (
                      <TableRow key={notification.id}>
                        <TableCell className="font-medium">
                          {notification.equipment.name}
                        </TableCell>
                        <TableCell>
                          {notification.equipment.barcode || "-"}
                        </TableCell>
                        <TableCell>
                          {category?.name || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(notification.notified_at), "dd. MMMM yyyy, HH:mm", { locale: de })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Bell className="h-4 w-4 text-muted-foreground" />
                            {notificationCount}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alle Benachrichtigungen (chronologisch)</CardTitle>
          <CardDescription>
            Vollständige Historie aller versendeten Wartungsbenachrichtigungen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Keine Benachrichtigungen gefunden
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ausrüstung</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Benachrichtigt am</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotifications.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell className="font-medium">
                        {notification.equipment.name}
                      </TableCell>
                      <TableCell>
                        {notification.equipment.barcode || "-"}
                      </TableCell>
                      <TableCell>
                        {format(new Date(notification.notified_at), "dd. MMMM yyyy, HH:mm 'Uhr'", { locale: de })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationHistory;
