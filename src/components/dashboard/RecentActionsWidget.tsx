import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, User, Calendar, Tag } from "lucide-react";
import { useAllEquipmentComments } from "@/hooks/useEquipmentComments";
import { useEquipment } from "@/hooks/useEquipment";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { SELECT_ALL_VALUE } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { ActionDetailDialog } from "./ActionDetailDialog";
import { useState } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface RecentActionsWidgetProps {
  categoryFilter?: string;
  personFilter?: string;
  locationFilter?: string;
  yearFilter?: string;
}

export const RecentActionsWidget = ({
  categoryFilter,
  personFilter,
  locationFilter,
  yearFilter
}: RecentActionsWidgetProps) => {
  const { data: allComments = [] } = useAllEquipmentComments();
  const { data: equipment = [] } = useEquipment();
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Apply filters
  const filteredComments = allComments.filter(comment => {
    const equipmentItem = equipment.find(item => item.id === comment.equipment_id);
    
    if (categoryFilter && categoryFilter !== SELECT_ALL_VALUE && equipmentItem?.category_id !== categoryFilter) {
      return false;
    }
    
    if (personFilter && personFilter !== SELECT_ALL_VALUE && comment.person_id !== personFilter) {
      return false;
    }
    
    if (locationFilter && locationFilter !== SELECT_ALL_VALUE && equipmentItem?.location_id !== locationFilter) {
      return false;
    }
    
    if (yearFilter && yearFilter !== "all") {
      const commentYear = new Date(comment.created_at).getFullYear().toString();
      if (commentYear !== yearFilter) {
        return false;
      }
    }
    
    return true;
  });

  // Get latest 10 actions
  const recentActions = filteredComments
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  const handleActionClick = (action: any) => {
    setSelectedAction(action);
    setIsDetailDialogOpen(true);
  };

  const exportToExcel = () => {
    const data = filteredComments.map(comment => {
      const equipmentItem = equipment.find(item => item.id === comment.equipment_id);
      return {
        "Datum": format(new Date(comment.created_at), "dd.MM.yyyy HH:mm", { locale: de }),
        "Ausrüstung": equipmentItem?.name || "Unbekannt",
        "Inventarnummer": equipmentItem?.inventory_number || "-",
        "Aktionstyp": comment.action?.name || "-",
        "Person": `${comment.person.first_name} ${comment.person.last_name}`,
        "Kategorie": equipmentItem?.category?.name || "-",
        "Standort": equipmentItem?.location?.name || "-",
        "Beschreibung": comment.comment
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Aktionen");

    const fileName = `Aktionen_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("Excel-Datei erstellt");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("Aktionsbericht", 20, 20);

    doc.setFontSize(10);
    doc.text(`Erstellt am: ${format(new Date(), "dd.MM.yyyy HH:mm", { locale: de })}`, 20, 30);
    doc.text(`Anzahl Aktionen: ${filteredComments.length}`, 20, 36);

    const data = filteredComments.map(comment => {
      const equipmentItem = equipment.find(item => item.id === comment.equipment_id);
      return [
        format(new Date(comment.created_at), "dd.MM.yyyy", { locale: de }),
        equipmentItem?.name || "Unbekannt",
        comment.action?.name || "-",
        `${comment.person.first_name} ${comment.person.last_name}`,
        comment.comment.substring(0, 50) + (comment.comment.length > 50 ? "..." : "")
      ];
    });

    (doc as any).autoTable({
      startY: 45,
      head: [["Datum", "Ausrüstung", "Aktion", "Person", "Beschreibung"]],
      body: data,
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 40 },
        2: { cellWidth: 30 },
        3: { cellWidth: 35 },
        4: { cellWidth: 50 }
      },
      margin: { left: 10, right: 10 }
    });

    const fileName = `Aktionsbericht_${format(new Date(), "yyyy-MM-dd")}.pdf`;
    doc.save(fileName);
    toast.success("PDF-Bericht erstellt");
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Letzte Aktionen</CardTitle>
                <CardDescription>Die 10 zuletzt durchgeführten Aktionen</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportToExcel}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={exportToPDF}>
                <FileDown className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
        {recentActions.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            Keine Aktionen gefunden
          </div>
        ) : (
          <div className="space-y-3">
            {recentActions.map((action) => {
              const equipmentItem = equipment.find(item => item.id === action.equipment_id);
              
              return (
                <div 
                  key={action.id} 
                  className="border-b pb-3 last:border-0 last:pb-0 cursor-pointer hover:bg-muted/50 rounded-md p-2 transition-colors"
                  onClick={() => handleActionClick(action)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm truncate">
                          {equipmentItem?.name || "Unbekannte Ausrüstung"}
                        </p>
                        {action.action && (
                          <Badge variant="outline" className="text-xs">
                            {action.action.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {action.comment}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{action.person.first_name} {action.person.last_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(action.created_at), "dd.MM.yyyy HH:mm", { locale: de })}</span>
                        </div>
                        {equipmentItem?.category && (
                          <div className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            <span>{equipmentItem.category.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>

    <ActionDetailDialog
      open={isDetailDialogOpen}
      onOpenChange={setIsDetailDialogOpen}
      action={selectedAction}
      equipment={selectedAction ? equipment.find(e => e.id === selectedAction.equipment_id) || null : null}
    />
  </>
  );
};
