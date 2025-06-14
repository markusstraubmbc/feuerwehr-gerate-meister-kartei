
import { useState, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  Trash2,
  Barcode,
  Copy,
  MessageCircle,
  FileDown,
  Eye
} from "lucide-react";
import { EquipmentStatusBadge } from "./EquipmentStatusBadge";
import { Equipment } from "@/hooks/useEquipment";
import { EditEquipmentForm } from "./EditEquipmentForm";
import { DeleteEquipmentDialog } from "./DeleteEquipmentDialog";
import { BarcodeDialog } from "./BarcodeDialog";
import { DuplicateEquipmentDialog } from "./DuplicateEquipmentDialog";
import { format } from "date-fns";
import { CommentsDialog } from "./CommentsDialog";
import { EquipmentCommentsInfo } from "./EquipmentCommentsInfo";
import { useEquipmentPrintExport } from "./EquipmentPrintExport";
import { EquipmentOverviewDialog } from "./EquipmentOverviewDialog";
import { useMaintenanceRecords } from "@/hooks/useMaintenanceRecords";
import { generateEquipmentDetailsPdf } from "./EquipmentDetailsPdfExport";
import { supabase } from "@/integrations/supabase/client";

interface EquipmentListProps {
  equipment: Equipment[];
  statusFilter?: string;
  categoryFilter?: string;
  personFilter?: string;
  searchTerm?: string;
  onFilterChange?: (filters: {
    status?: string;
    category?: string;
    person?: string;
    search?: string;
  }) => void;
}

export function EquipmentList({ 
  equipment,
  statusFilter,
  categoryFilter,
  personFilter,
  searchTerm = "",
  onFilterChange
}: EquipmentListProps) {
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBarcodeDialogOpen, setIsBarcodeDialogOpen] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false);
  const [isOverviewDialogOpen, setIsOverviewDialogOpen] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);
  const { data: maintenanceRecords = [] } = useMaintenanceRecords();

  // Apply filters to get filtered equipment
  const filteredEquipment = equipment.filter(item => {
    if (statusFilter && statusFilter !== "status_all" && item.status !== statusFilter) {
      return false;
    }
    
    if (categoryFilter && item.category_id !== categoryFilter) {
      return false;
    }
    
    if (personFilter && item.responsible_person_id !== personFilter) {
      return false;
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        (item.name && item.name.toLowerCase().includes(searchLower)) ||
        (item.inventory_number && item.inventory_number.toLowerCase().includes(searchLower)) ||
        (item.serial_number && item.serial_number.toLowerCase().includes(searchLower)) ||
        (item.barcode && item.barcode.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });

  const { handlePdfDownload } = useEquipmentPrintExport({ 
    equipment: filteredEquipment, 
    printRef 
  });

  // Function to get comment count for an equipment item
  const getCommentCount = async (equipmentId: string): Promise<number> => {
    try {
      const { count } = await supabase
        .from("equipment_comments")
        .select("*", { count: "exact", head: true })
        .eq("equipment_id", equipmentId);
      return count || 0;
    } catch (error) {
      console.error('Error fetching comment count:', error);
      return 0;
    }
  };

  const [commentCounts, setCommentCounts] = useState<{ [key: string]: number }>({});

  // Load comment counts for all equipment
  React.useEffect(() => {
    const loadCommentCounts = async () => {
      const counts: { [key: string]: number } = {};
      for (const item of filteredEquipment) {
        counts[item.id] = await getCommentCount(item.id);
      }
      setCommentCounts(counts);
    };
    
    if (filteredEquipment.length > 0) {
      loadCommentCounts();
    }
  }, [filteredEquipment]);

  const handlePdfExportForEquipment = async (equipmentItem: Equipment) => {
    try {
      // Fetch comments for this equipment using Supabase directly
      const { data: comments = [] } = await supabase
        .from("equipment_comments")
        .select(`
          *,
          person:person_id (
            id,
            first_name,
            last_name
          )
        `)
        .eq("equipment_id", equipmentItem.id)
        .order("created_at", { ascending: false });

      // Fetch missions for this equipment using Supabase directly
      const { data: missionEquipment = [] } = await supabase
        .from("mission_equipment")
        .select(`
          mission:missions (
            id,
            title,
            mission_date,
            mission_type,
            description,
            location
          )
        `)
        .eq("equipment_id", equipmentItem.id);

      // Extract missions from the junction table data
      const missions = missionEquipment
        .map(me => me.mission)
        .filter(Boolean);
      
      // Filter maintenance records for this equipment
      const equipmentMaintenance = maintenanceRecords.filter(
        record => record.equipment_id === equipmentItem.id
      );

      generateEquipmentDetailsPdf({
        equipment: equipmentItem,
        comments: comments || [],
        missions: missions || [],
        maintenanceRecords: equipmentMaintenance
      });
    } catch (error) {
      console.error('Error generating PDF for equipment:', error);
    }
  };

  const handleEdit = (item: Equipment) => {
    setSelectedEquipment(item);
    setIsEditFormOpen(true);
  };

  const handleDelete = (item: Equipment) => {
    setSelectedEquipment(item);
    setIsDeleteDialogOpen(true);
  };

  const handleBarcode = (item: Equipment) => {
    setSelectedEquipment(item);
    setIsBarcodeDialogOpen(true);
  };
  
  const handleDuplicate = (item: Equipment) => {
    setSelectedEquipment(item);
    setIsDuplicateDialogOpen(true);
  };

  const handleComments = (item: Equipment) => {
    setSelectedEquipment(item);
    setIsCommentsDialogOpen(true);
  };

  const handleOverview = (item: Equipment) => {
    setSelectedEquipment(item);
    setIsOverviewDialogOpen(true);
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" onClick={handlePdfDownload}>
          <FileDown className="h-4 w-4 mr-2" />
          PDF
        </Button>
      </div>
      
      <div className="rounded-md border">
        <div ref={printRef}>
          <div className="print-title" style={{ display: 'none' }}>
            Ausrüstungsliste - {new Date().toLocaleDateString('de-DE')}
          </div>
          <div className="print-info" style={{ display: 'none' }}>
            {filteredEquipment.length !== equipment.length && (
              <>Gefilterte Ansicht: {filteredEquipment.length} von {equipment.length} Einträgen</>
            )}
            {filteredEquipment.length === equipment.length && (
              <>Gesamt: {equipment.length} Einträge</>
            )}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Inventarnummer</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Standort</TableHead>
                <TableHead className="hidden md:table-cell">Kategorie</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="hidden lg:table-cell">Anzahl Kommentare</TableHead>
                <TableHead className="hidden md:table-cell">Ersetzt am</TableHead>
                <TableHead className="hidden md:table-cell">Letzte Wartung</TableHead>
                <TableHead className="hidden md:table-cell">Nächste Wartung</TableHead>
                <TableHead className="text-right print:hidden">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEquipment.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center">
                    Keine Ausrüstung gefunden
                  </TableCell>
                </TableRow>
              ) : (
                filteredEquipment.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.inventory_number || "-"}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {item.location?.name || "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {item.category?.name || "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <EquipmentStatusBadge status={item.status} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{commentCounts[item.id] || 0}</span>
                        {(commentCounts[item.id] || 0) > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleComments(item)}
                            className="h-6 px-2 text-xs"
                          >
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Anzeigen
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {item.replacement_date ? format(new Date(item.replacement_date), "dd.MM.yyyy") : "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {item.last_check_date ? format(new Date(item.last_check_date), "dd.MM.yyyy") : "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {item.next_check_date ? format(new Date(item.next_check_date), "dd.MM.yyyy") : "-"}
                    </TableCell>
                    <TableCell className="text-right print:hidden">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePdfExportForEquipment(item)}
                          title="PDF-Detailbericht erstellen"
                        >
                          <FileDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOverview(item)}
                          title="Detailübersicht anzeigen"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleBarcode(item)}
                        >
                          <Barcode className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleComments(item)}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDuplicate(item)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedEquipment && (
        <>
          {isEditFormOpen && (
            <EditEquipmentForm
              equipment={selectedEquipment}
              onSuccess={() => setIsEditFormOpen(false)}
            />
          )}
          <DeleteEquipmentDialog
            equipment={selectedEquipment}
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          />
          <BarcodeDialog
            equipment={selectedEquipment}
            open={isBarcodeDialogOpen}
            onOpenChange={setIsBarcodeDialogOpen}
          />
          <DuplicateEquipmentDialog
            equipment={selectedEquipment}
            open={isDuplicateDialogOpen}
            onOpenChange={setIsDuplicateDialogOpen}
          />
          <CommentsDialog
            equipment={selectedEquipment}
            open={isCommentsDialogOpen}
            onOpenChange={setIsCommentsDialogOpen}
          />
          <EquipmentOverviewDialog
            equipment={selectedEquipment}
            open={isOverviewDialogOpen}
            onOpenChange={setIsOverviewDialogOpen}
          />
        </>
      )}
    </>
  );
}
