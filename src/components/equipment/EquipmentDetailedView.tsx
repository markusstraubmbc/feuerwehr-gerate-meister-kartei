
import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, FileDown } from "lucide-react";
import { Equipment } from "@/hooks/useEquipment";
import { EquipmentStatusBadge } from "./EquipmentStatusBadge";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useEquipmentComments } from "@/hooks/useEquipmentComments";
import { CommentItem } from "./CommentItem";

interface EquipmentDetailedViewProps {
  equipment: Equipment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EquipmentDetailedView({ equipment, open, onOpenChange }: EquipmentDetailedViewProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { data: comments } = useEquipmentComments(equipment.id);

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Ausrüstungsdetails - ${equipment.name}</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  margin: 20px; 
                  line-height: 1.6;
                }
                .header { 
                  text-align: center; 
                  border-bottom: 2px solid #333; 
                  padding-bottom: 10px; 
                  margin-bottom: 20px; 
                }
                .section { 
                  margin-bottom: 20px; 
                  page-break-inside: avoid; 
                }
                .section-title { 
                  font-size: 18px; 
                  font-weight: bold; 
                  color: #333; 
                  border-bottom: 1px solid #ccc; 
                  padding-bottom: 5px; 
                  margin-bottom: 10px; 
                }
                .info-grid { 
                  display: grid; 
                  grid-template-columns: 1fr 1fr; 
                  gap: 10px; 
                }
                .info-item { 
                  margin-bottom: 8px; 
                }
                .label { 
                  font-weight: bold; 
                  color: #555; 
                }
                .value { 
                  margin-left: 10px; 
                }
                .comment-item { 
                  border: 1px solid #ddd; 
                  padding: 10px; 
                  margin-bottom: 10px; 
                  border-radius: 5px; 
                  background-color: #f9f9f9; 
                }
                .comment-header { 
                  font-weight: bold; 
                  margin-bottom: 5px; 
                }
                .comment-date { 
                  font-size: 12px; 
                  color: #666; 
                }
                .status-badge { 
                  padding: 4px 8px; 
                  border-radius: 4px; 
                  font-size: 12px; 
                  font-weight: bold; 
                }
                .status-active { background-color: #dcfce7; color: #166534; }
                .status-maintenance { background-color: #fef3c7; color: #92400e; }
                .status-defective { background-color: #fee2e2; color: #991b1b; }
                .status-retired { background-color: #f3f4f6; color: #374151; }
                @media print {
                  body { margin: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              ${printContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    }
  };

  const handleExportHTML = () => {
    if (printRef.current) {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Ausrüstungsdetails - ${equipment.name}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 20px; 
                line-height: 1.6;
              }
              .header { 
                text-align: center; 
                border-bottom: 2px solid #333; 
                padding-bottom: 10px; 
                margin-bottom: 20px; 
              }
              .section { 
                margin-bottom: 20px; 
              }
              .section-title { 
                font-size: 18px; 
                font-weight: bold; 
                color: #333; 
                border-bottom: 1px solid #ccc; 
                padding-bottom: 5px; 
                margin-bottom: 10px; 
              }
              .info-grid { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 10px; 
              }
              .info-item { 
                margin-bottom: 8px; 
              }
              .label { 
                font-weight: bold; 
                color: #555; 
              }
              .value { 
                margin-left: 10px; 
              }
              .comment-item { 
                border: 1px solid #ddd; 
                padding: 10px; 
                margin-bottom: 10px; 
                border-radius: 5px; 
                background-color: #f9f9f9; 
              }
              .comment-header { 
                font-weight: bold; 
                margin-bottom: 5px; 
              }
              .comment-date { 
                font-size: 12px; 
                color: #666; 
              }
              .status-badge { 
                padding: 4px 8px; 
                border-radius: 4px; 
                font-size: 12px; 
                font-weight: bold; 
              }
              .status-active { background-color: #dcfce7; color: #166534; }
              .status-maintenance { background-color: #fef3c7; color: #92400e; }
              .status-defective { background-color: #fee2e2; color: #991b1b; }
              .status-retired { background-color: #f3f4f6; color: #374151; }
            </style>
          </head>
          <body>
            ${printRef.current.innerHTML}
          </body>
        </html>
      `;
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Ausruestung-${equipment.inventory_number || equipment.name}-${new Date().toISOString().slice(0, 10)}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'maintenance': return 'status-maintenance';
      case 'defective': return 'status-defective';
      case 'retired': return 'status-retired';
      default: return 'status-active';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktiv';
      case 'maintenance': return 'Wartung';
      case 'defective': return 'Defekt';
      case 'retired': return 'Ausgemustert';
      default: return status;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Ausrüstungsdetails - {equipment.name}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Drucken
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportHTML}>
                <FileDown className="h-4 w-4 mr-2" />
                HTML Export
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef}>
          <div className="header">
            <h1>Ausrüstungsdetails</h1>
            <p>Erstellt am: {format(new Date(), "dd.MM.yyyy HH:mm", { locale: de })}</p>
          </div>

          <div className="section">
            <h2 className="section-title">Grundinformationen</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Name:</span>
                <span className="value">{equipment.name}</span>
              </div>
              <div className="info-item">
                <span className="label">Inventarnummer:</span>
                <span className="value">{equipment.inventory_number || "-"}</span>
              </div>
              <div className="info-item">
                <span className="label">Barcode:</span>
                <span className="value">{equipment.barcode || "-"}</span>
              </div>
              <div className="info-item">
                <span className="label">Seriennummer:</span>
                <span className="value">{equipment.serial_number || "-"}</span>
              </div>
              <div className="info-item">
                <span className="label">Hersteller:</span>
                <span className="value">{equipment.manufacturer || "-"}</span>
              </div>
              <div className="info-item">
                <span className="label">Modell:</span>
                <span className="value">{equipment.model || "-"}</span>
              </div>
            </div>
          </div>

          <div className="section">
            <h2 className="section-title">Kategorisierung & Zuordnung</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Kategorie:</span>
                <span className="value">{equipment.category?.name || "-"}</span>
              </div>
              <div className="info-item">
                <span className="label">Standort:</span>
                <span className="value">{equipment.location?.name || "-"}</span>
              </div>
              <div className="info-item">
                <span className="label">Status:</span>
                <span className={`status-badge ${getStatusClass(equipment.status)}`}>
                  {getStatusText(equipment.status)}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Verantwortliche Person:</span>
                <span className="value">
                  {equipment.responsible_person 
                    ? `${equipment.responsible_person.first_name} ${equipment.responsible_person.last_name}`
                    : "-"}
                </span>
              </div>
            </div>
          </div>

          <div className="section">
            <h2 className="section-title">Termine & Wartung</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Kaufdatum:</span>
                <span className="value">
                  {equipment.purchase_date ? format(new Date(equipment.purchase_date), "dd.MM.yyyy", { locale: de }) : "-"}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Ersatzdatum:</span>
                <span className="value">
                  {equipment.replacement_date ? format(new Date(equipment.replacement_date), "dd.MM.yyyy", { locale: de }) : "-"}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Letzte Prüfung:</span>
                <span className="value">
                  {equipment.last_check_date ? format(new Date(equipment.last_check_date), "dd.MM.yyyy", { locale: de }) : "-"}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Nächste Prüfung:</span>
                <span className="value">
                  {equipment.next_check_date ? format(new Date(equipment.next_check_date), "dd.MM.yyyy", { locale: de }) : "-"}
                </span>
              </div>
            </div>
          </div>

          {equipment.notes && (
            <div className="section">
              <h2 className="section-title">Notizen</h2>
              <div style={{ padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '5px', whiteSpace: 'pre-wrap' }}>
                {equipment.notes}
              </div>
            </div>
          )}

          <div className="section">
            <h2 className="section-title">Kommentare ({comments?.length || 0})</h2>
            {comments && comments.length > 0 ? (
              <div>
                {comments.map((comment) => (
                  <div key={comment.id} className="comment-item">
                    <div className="comment-header">
                      {comment.person 
                        ? `${comment.person.first_name} ${comment.person.last_name}`
                        : "Unbekannte Person"}
                      <span className="comment-date" style={{ float: 'right' }}>
                        {format(new Date(comment.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
                      </span>
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{comment.comment}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#666', fontStyle: 'italic' }}>Keine Kommentare vorhanden</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
