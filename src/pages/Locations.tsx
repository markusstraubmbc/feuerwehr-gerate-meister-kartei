
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search,
  Plus,
  MapPin
} from "lucide-react";
import { useLocations } from "@/hooks/useLocations";
import { LocationList } from "@/components/locations/LocationList";
import { LocationForm } from "@/components/locations/LocationForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Locations = () => {
  const { data: locations, isLoading, error } = useLocations();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<{id: string, name: string, description?: string} | null>(null);
  
  const filteredLocations = locations?.filter(
    (location) => !searchTerm || location.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleEdit = (location: {id: string, name: string, description?: string}) => {
    setEditingLocation(location);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingLocation(null);
  };
  
  if (isLoading) {
    return <div>Lädt...</div>;
  }

  if (error) {
    return <div>Fehler beim Laden der Standorte</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Standorte</h1>
        <Button size="sm" onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neuer Standort
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Standorte verwalten
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative flex-1 mb-6">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Nach Standorten suchen..."
              className="pl-8"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>

          <LocationList 
            locations={filteredLocations || []} 
            onEdit={handleEdit} 
          />
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? "Standort bearbeiten" : "Neuen Standort erstellen"}
            </DialogTitle>
            <DialogDescription>
              Bitte geben Sie die Details für den Standort ein.
            </DialogDescription>
          </DialogHeader>
          <LocationForm 
            initialData={editingLocation}
            onSuccess={handleFormClose} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Locations;
