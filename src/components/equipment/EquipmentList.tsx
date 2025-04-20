
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
  Printer,
  Filter,
  MessageCircle
} from "lucide-react";
import { EquipmentStatusBadge } from "./EquipmentStatusBadge";
import { Equipment } from "@/hooks/useEquipment";
import { EditEquipmentForm } from "./EditEquipmentForm";
import { DeleteEquipmentDialog } from "./DeleteEquipmentDialog";
import { BarcodeDialog } from "./BarcodeDialog";
import { DuplicateEquipmentDialog } from "./DuplicateEquipmentDialog";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import { useCategories } from "@/hooks/useCategories";
import { usePersons } from "@/hooks/usePersons";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { SELECT_ALL_VALUE } from "@/lib/constants";
import { format } from "date-fns";
import { CommentsDialog } from "./CommentsDialog";

interface EquipmentListProps {
  equipment: Equipment[];
  statusFilter?: string;
  categoryFilter?: string;
  personFilter?: string;
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
  onFilterChange
}: EquipmentListProps) {
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBarcodeDialogOpen, setIsBarcodeDialogOpen] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(statusFilter || "");
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter || "");
  const [selectedPerson, setSelectedPerson] = useState(personFilter || "");
  
  const { data: categories = [] } = useCategories();
  const { data: persons = [] } = usePersons();
  
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: 'Ausrüstungsliste',
    pageStyle: '@page { size: portrait; margin: 10mm; }',
    onBeforePrint: () => {
      if (!printRef.current) {
        toast("Drucken konnte nicht gestartet werden", {
          description: "Es gab ein Problem beim Vorbereiten der Druckansicht."
        });
      }
    }
  });

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

  const handleFilterChange = (type: string, value: string) => {
    switch (type) {
      case 'status':
        setSelectedStatus(value);
        break;
      case 'category':
        setSelectedCategory(value);
        break;
      case 'person':
        setSelectedPerson(value);
        break;
      case 'search':
        setSearchTerm(value);
        break;
    }

    if (onFilterChange) {
      onFilterChange({
        status: type === 'status' ? value : selectedStatus,
        category: type === 'category' ? value : selectedCategory,
        person: type === 'person' ? value : selectedPerson,
        search: type === 'search' ? value : searchTerm
      });
    }
  };

  const filteredEquipment = equipment.filter(item => {
    if (selectedStatus && selectedStatus !== "status_all" && item.status !== selectedStatus) {
      return false;
    }
    
    if (selectedCategory && selectedCategory !== SELECT_ALL_VALUE && item.category_id !== selectedCategory) {
      return false;
    }
    
    if (selectedPerson && selectedPerson !== SELECT_ALL_VALUE && item.responsible_person_id !== selectedPerson) {
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

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
        <div className="flex flex-1 flex-col sm:flex-row gap-2 w-full">
          <Input
            placeholder="Suchen..."
            value={searchTerm}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full sm:w-60"
          />
          
          <Select 
            value={selectedCategory || SELECT_ALL_VALUE} 
            onValueChange={(value) => handleFilterChange('category', value)}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Kategorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SELECT_ALL_VALUE}>Alle Kategorien</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={selectedPerson || SELECT_ALL_VALUE} 
            onValueChange={(value) => handleFilterChange('person', value)}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Person" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SELECT_ALL_VALUE}>Alle Personen</SelectItem>
              {persons.map((person) => (
                <SelectItem key={person.id} value={person.id}>
                  {person.first_name} {person.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={selectedStatus} 
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="status_all">Alle Status</SelectItem>
              <SelectItem value="einsatzbereit">Einsatzbereit</SelectItem>
              <SelectItem value="prüfung fällig">Prüfung fällig</SelectItem>
              <SelectItem value="wartung">Wartung</SelectItem>
              <SelectItem value="defekt">Defekt</SelectItem>
              <SelectItem value="aussortiert">Aussortiert</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setSearchTerm("");
              setSelectedStatus("");
              setSelectedCategory("");
              setSelectedPerson("");
              if (onFilterChange) {
                onFilterChange({ status: "", category: "", person: "", search: "" });
              }
            }}
            className="min-w-[100px]"
          >
            <Filter className="h-4 w-4 mr-2" />
            Zurücksetzen
          </Button>
          
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Drucken
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border" ref={printRef}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Inventarnummer</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Standort</TableHead>
              <TableHead className="hidden md:table-cell">Kategorie</TableHead>
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead className="hidden md:table-cell">Ersetzt am</TableHead>
              <TableHead className="hidden md:table-cell">Letzte Wartung</TableHead>
              <TableHead className="hidden md:table-cell">Nächste Wartung</TableHead>
              <TableHead className="text-right print:hidden">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEquipment.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  Keine Ausrüstung gefunden
                </TableCell>
              </TableRow>
            ) : (
              filteredEquipment.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.inventory_number || "-"}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {item?.location?.name || "-"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {item?.category?.name || "-"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <EquipmentStatusBadge status={item.status} />
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
        </>
      )}

      <style>{`
        @media print {
          .print-container {
            padding: 20px;
          }
          table {
            font-size: 12px;
          }
          @page {
            size: portrait;
            margin: 10mm;
          }
        }
      `}</style>
    </>
  );
}
