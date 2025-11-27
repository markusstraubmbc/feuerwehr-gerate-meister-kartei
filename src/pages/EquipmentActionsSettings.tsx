import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useEquipmentActions, useCreateAction, useUpdateAction, useDeleteAction } from "@/hooks/useEquipmentActions";

export default function EquipmentActionsSettings() {
  const { data: actions = [], isLoading } = useEquipmentActions();
  const createAction = useCreateAction();
  const updateAction = useUpdateAction();
  const deleteAction = useDeleteAction();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<any>(null);
  const [deleteActionId, setDeleteActionId] = useState<string | null>(null);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleOpenDialog = (action?: any) => {
    if (action) {
      setEditingAction(action);
      setName(action.name);
      setDescription(action.description || "");
    } else {
      setEditingAction(null);
      setName("");
      setDescription("");
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAction(null);
    setName("");
    setDescription("");
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;

    if (editingAction) {
      await updateAction.mutateAsync({
        id: editingAction.id,
        name: name.trim(),
        description: description.trim() || undefined,
      });
    } else {
      await createAction.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
      });
    }
    handleCloseDialog();
  };

  const handleDeleteClick = (id: string) => {
    setDeleteActionId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteActionId) {
      await deleteAction.mutateAsync(deleteActionId);
      setIsDeleteDialogOpen(false);
      setDeleteActionId(null);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Aktionen</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Aktionen für Ausrüstungen
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Neue Aktion
        </Button>
      </div>

        <div className="grid gap-4">
          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Lädt...</p>
              </CardContent>
            </Card>
          ) : actions.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Keine Aktionen vorhanden. Erstellen Sie Ihre erste Aktion.
                </p>
              </CardContent>
            </Card>
          ) : (
            actions.map((action) => (
              <Card key={action.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{action.name}</CardTitle>
                      {action.description && (
                        <CardDescription>{action.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(action)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(action.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAction ? "Aktion bearbeiten" : "Neue Aktion"}
              </DialogTitle>
              <DialogDescription>
                {editingAction 
                  ? "Bearbeiten Sie die Aktion für Ausrüstungen" 
                  : "Erstellen Sie eine neue Aktion für Ausrüstungen"
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="z.B. Kleidung gewaschen"
                />
              </div>
              <div>
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optionale Beschreibung"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Abbrechen
              </Button>
              <Button onClick={handleSubmit} disabled={!name.trim()}>
                {editingAction ? "Aktualisieren" : "Erstellen"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Aktion löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Diese Aktion wird dauerhaft gelöscht. Bestehende Aktionen behalten ihre Zuordnung.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm}>
                Löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
